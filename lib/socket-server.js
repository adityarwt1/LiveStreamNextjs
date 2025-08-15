import { Server } from "socket.io"

let io

export const initSocket = (server) => {
  if (!io) {
    io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    })

    io.on("connection", (socket) => {
      console.log("User connected:", socket.id)

      // Handle stream creation
      socket.on("create-stream", (streamData) => {
        socket.join(streamData.streamId)
        socket.broadcast.emit("new-stream", streamData)
      })

      // Handle WebRTC signaling
      socket.on("offer", (data) => {
        socket.to(data.streamId).emit("offer", data)
      })

      socket.on("answer", (data) => {
        socket.to(data.streamId).emit("answer", data)
      })

      socket.on("ice-candidate", (data) => {
        socket.to(data.streamId).emit("ice-candidate", data)
      })

      socket.on("join-stream", (streamId) => {
        socket.join(streamId)
      })

      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id)
      })
    })
  }
  return io
}

export const getSocket = () => io
