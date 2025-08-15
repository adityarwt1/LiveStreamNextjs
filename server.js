import { createServer } from "http"
import next from "next"
import { Server } from "socket.io"
import { connectdb } from "./lib/mongoose.js"
import Stream from "./models/Stream.js"
import ChatMessage from "./models/ChatMessage.js"

const dev = process.env.NODE_ENV !== "production"
const hostname = "localhost"
const port = process.env.PORT || 3000

const app = next({ dev, hostname, port })
const handler = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer(handler)

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  })

  // Store active streams and viewers
  const activeStreams = new Map()
  const streamViewers = new Map()

  io.on("connection", (socket) => {
    console.log(`[Socket] User connected: ${socket.id}`)

    // Handle stream creation
    socket.on("create-stream", async (streamData) => {
      try {
        console.log(`[Socket] Stream created: ${streamData.streamId}`)

        socket.join(streamData.streamId)
        activeStreams.set(streamData.streamId, {
          ...streamData,
          streamerId: socket.id,
          startTime: new Date(),
          viewers: new Set(),
        })

        streamViewers.set(streamData.streamId, new Set())

        // Broadcast new stream to all users
        socket.broadcast.emit("new-stream", streamData)

        // Update database
        await connectdb()
        await Stream.updateOne(
          { streamId: streamData.streamId },
          {
            socketId: socket.id,
            actualStartTime: new Date(),
            isLive: true,
          }
        )
      } catch (error) {
        console.error("[Socket] Error creating stream:", error)
        socket.emit("stream-error", { message: "Failed to create stream" })
      }
    })

    // Handle viewer joining stream
    socket.on("join-stream", async (data) => {
      const { streamId, viewerId } = data
      console.log(`[Socket] Viewer ${viewerId || socket.id} joining stream ${streamId}`)

      socket.join(streamId)

      const stream = activeStreams.get(streamId)
      if (stream) {
        stream.viewers.add(socket.id)
        const viewers = streamViewers.get(streamId)
        if (viewers) {
          viewers.add(socket.id)
        }

        const viewerCount = stream.viewers.size

        // Notify streamer about new viewer
        if (stream.streamerId !== socket.id) {
          io.to(stream.streamerId).emit("new-viewer", {
            viewerId: socket.id,
            streamId: streamId,
          })
        }

        // Notify all about viewer count
        io.to(streamId).emit("viewer-joined", {
          viewerId: socket.id,
          viewerCount,
        })

        // Update database viewer count
        try {
          await connectdb()
          await Stream.updateOne({ streamId }, { viewerCount })
        } catch (error) {
          console.error("[Socket] Error updating viewer count:", error)
        }
      }
    })

    // Handle WebRTC signaling
    socket.on("offer", (data) => {
      console.log(`[Socket] Offer from ${socket.id} to ${data.viewerId}`)
      socket.to(data.viewerId).emit("offer", {
        ...data,
        streamerId: socket.id,
      })
    })

    socket.on("answer", (data) => {
      console.log(`[Socket] Answer from ${socket.id}`)
      const stream = activeStreams.get(data.streamId)
      if (stream && stream.streamerId) {
        socket.to(stream.streamerId).emit("answer", {
          ...data,
          viewerId: socket.id,
        })
      }
    })

    socket.on("ice-candidate", (data) => {
      if (data.viewerId) {
        // From streamer to viewer
        socket.to(data.viewerId).emit("ice-candidate", data)
      } else {
        // From viewer to streamer
        const stream = activeStreams.get(data.streamId)
        if (stream && stream.streamerId) {
          socket.to(stream.streamerId).emit("ice-candidate", {
            ...data,
            viewerId: socket.id,
          })
        }
      }
    })

    // Handle chat messages
    socket.on("chat-message", async (data) => {
      const { streamId, message, username } = data

      const chatMessage = {
        id: Date.now(),
        username: username || "Anonymous",
        message,
        timestamp: new Date(),
      }

      io.to(streamId).emit("chat-message", chatMessage)

      // Store chat message in database
      try {
        await connectdb()
        const newChatMessage = new ChatMessage({
          streamId,
          username: chatMessage.username,
          message: chatMessage.message,
          timestamp: chatMessage.timestamp,
        })
        await newChatMessage.save()
      } catch (error) {
        console.error("[Socket] Error storing chat message:", error)
      }
    })

    // Handle stream end
    socket.on("end-stream", async (streamId) => {
      console.log(`[Socket] Stream ended: ${streamId}`)

      const stream = activeStreams.get(streamId)
      if (stream && stream.streamerId === socket.id) {
        // Notify all viewers
        io.to(streamId).emit("stream-ended")

        // Clean up
        activeStreams.delete(streamId)
        streamViewers.delete(streamId)

        // Update database
        try {
          await connectdb()
          await Stream.updateOne(
            { streamId },
            {
              isLive: false,
              endTime: new Date(),
            }
          )
        } catch (error) {
          console.error("[Socket] Error ending stream:", error)
        }
      }
    })

    // Handle disconnection
    socket.on("disconnect", async () => {
      console.log(`[Socket] User disconnected: ${socket.id}`)

      // Check if disconnected user was a streamer
      for (const [streamId, stream] of activeStreams.entries()) {
        if (stream.streamerId === socket.id) {
          console.log(`[Socket] Streamer disconnected, ending stream: ${streamId}`)
          io.to(streamId).emit("stream-ended")
          activeStreams.delete(streamId)
          streamViewers.delete(streamId)

          // Update database
          try {
            await connectdb()
            await Stream.updateOne(
              { streamId },
              {
                isLive: false,
                endTime: new Date(),
              }
            )
          } catch (error) {
            console.error("[Socket] Error ending stream on disconnect:", error)
          }
          break
        }

        // Check if disconnected user was a viewer
        if (stream.viewers.has(socket.id)) {
          stream.viewers.delete(socket.id)
          const viewers = streamViewers.get(streamId)
          if (viewers) {
            viewers.delete(socket.id)
          }

          const viewerCount = stream.viewers.size
          io.to(streamId).emit("viewer-left", {
            viewerId: socket.id,
            viewerCount,
          })

          // Update database viewer count
          try {
            await connectdb()
            await Stream.updateOne({ streamId }, { viewerCount })
          } catch (error) {
            console.error("[Socket] Error updating viewer count on disconnect:", error)
          }
        }
      }
    })
  })

  httpServer
    .once("error", (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
    })
})