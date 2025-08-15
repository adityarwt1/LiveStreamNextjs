"use client"
import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { useWebRTCViewer } from "../../../hooks/useWebRTCViewer"
import { io } from "socket.io-client"

export default function StreamViewerPage() {
  const params = useParams()
  
  const streamId = params.id

  const [streamData, setStreamData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [chatMessages, setChatMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [username, setUsername] = useState("")
  const [showUsernameModal, setShowUsernameModal] = useState(true)
  const [viewerCount, setViewerCount] = useState(0)

  const videoRef = useRef(null)
  const chatContainerRef = useRef(null)
  const socketRef = useRef(null)

  const { isConnected, isConnecting, remoteStream, connectionState, error, connect, disconnect } =
    useWebRTCViewer(streamId)

  useEffect(() => {
    if (streamId) {
      fetchStreamData()
      initializeChat()
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
      disconnect()
    }
  }, [streamId])

  useEffect(() => {
    if (remoteStream && videoRef.current) {
      videoRef.current.srcObject = remoteStream
      console.log("[Viewer] Set remote stream to video element")
    }
  }, [remoteStream])

  useEffect(() => {
    // Auto-scroll chat to bottom
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatMessages])

  const fetchStreamData = async () => {
    try {
      const response = await fetch(`/api/streams/lives?id=${streamId}`)
      const data = await response.json()

      if (data.stream) {
        setStreamData(data.stream)
        setViewerCount(data.stream.viewerCount || 0)
      } else {
        console.error("Stream not found")
      }
    } catch (error) {
      console.error("Error fetching stream data:", error)
    } finally {
      setLoading(false)
    }
  }

  const initializeChat = () => {
    socketRef.current = io()

    socketRef.current.on("connect", () => {
      console.log("[Chat] Connected to chat server")
    })

    socketRef.current.on("chat-message", (message) => {
      setChatMessages((prev) => [...prev, message])
    })

    socketRef.current.on("viewer-joined", (data) => {
      setViewerCount(data.viewerCount)
    })

    socketRef.current.on("viewer-left", (data) => {
      setViewerCount(data.viewerCount)
    })

    socketRef.current.on("stream-ended", () => {
      alert("This stream has ended")
      window.location.href = "/"
    })

    // Load recent chat messages
    loadChatHistory()
  }

  const loadChatHistory = async () => {
    try {
      const response = await fetch(`/api/streams/chat?id=${streamId}`)
      const data = await response.json()
      if (data.messages) {
        setChatMessages(data.messages)
      }
    } catch (error) {
      console.error("Error loading chat history:", error)
    }
  }

  const handleJoinStream = async () => {
    if (!username.trim()) {
      alert("Please enter a username")
      return
    }

    setShowUsernameModal(false)

    // Connect to WebRTC stream
    const success = await connect()
    if (success) {
      console.log("[Viewer] Successfully connected to stream")
    }
  }

  const sendChatMessage = (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !socketRef.current) return

    const message = {
      streamId,
      message: newMessage.trim(),
      username: username || "Anonymous",
    }

    socketRef.current.emit("chat-message", message)
    setNewMessage("")
  }

  const getConnectionStatusColor = () => {
    switch (connectionState) {
      case "connected":
        return "var(--accent-gold)"
      case "connecting":
        return "var(--primary-red)"
      case "failed":
      case "disconnected":
        return "#dc2626"
      default:
        return "var(--text-light)"
    }
  }

  const getConnectionStatusText = () => {
    switch (connectionState) {
      case "connected":
        return "Connected"
      case "connecting":
        return "Connecting..."
      case "failed":
        return "Connection Failed"
      case "disconnected":
        return "Disconnected"
      default:
        return "Not Connected"
    }
  }

  if (loading) {
    return (
      <div className="container" style={{ padding: "60px 20px", textAlign: "center" }}>
        <div className="loading"></div>
        <p style={{ marginTop: "16px", color: "var(--text-light)" }}>Loading stream...</p>
      </div>
    )
  }

  if (!streamData) {
    return (
      <div className="container" style={{ padding: "60px 20px", textAlign: "center" }}>
        <h1 className="h2" style={{ marginBottom: "16px", color: "var(--text-light)" }}>
          Stream Not Found
        </h1>
        <p style={{ color: "var(--text-light)", marginBottom: "24px" }}>This stream may have ended or doesn't exist.</p>
        <a href="/" className="btn btn-primary">
          Browse Other Streams
        </a>
      </div>
    )
  }

  return (
    <div className="container" style={{ padding: "20px" }}>
      {/* Username Modal */}
      {showUsernameModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div className="card" style={{ maxWidth: "400px", width: "90%" }}>
            <h2 className="h3" style={{ marginBottom: "16px", textAlign: "center" }}>
              Join Stream
            </h2>
            <p style={{ color: "var(--text-light)", marginBottom: "20px", textAlign: "center" }}>
              Enter a username to join the chat and watch the stream
            </p>
            <div className="form-group">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="form-input"
                onKeyPress={(e) => e.key === "Enter" && handleJoinStream()}
                autoFocus
              />
            </div>
            <button onClick={handleJoinStream} className="btn btn-primary" style={{ width: "100%" }}>
              Join Stream
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px", alignItems: "start" }}>
        {/* Video Player Section */}
        <div>
          <div className="video-container" style={{ marginBottom: "20px" }}>
            <video
              ref={videoRef}
              className="video-player"
              autoPlay
              playsInline
              controls={false}
              style={{ background: "#000" }}
            />

            {/* Video Overlay */}
            <div
              style={{
                position: "absolute",
                top: "12px",
                left: "12px",
                display: "flex",
                gap: "8px",
                alignItems: "center",
              }}
            >
              <div className="live-indicator">LIVE</div>
              <div
                style={{
                  background: "rgba(0, 0, 0, 0.7)",
                  color: "white",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "0.75rem",
                }}
              >
                {viewerCount} viewers
              </div>
            </div>

            {/* Connection Status */}
            <div
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                background: "rgba(0, 0, 0, 0.7)",
                color: getConnectionStatusColor(),
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "0.75rem",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: getConnectionStatusColor(),
                }}
              ></div>
              {getConnectionStatusText()}
            </div>

            {/* Loading/Error States */}
            {!remoteStream && !error && (
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  textAlign: "center",
                  color: "white",
                }}
              >
                {isConnecting ? (
                  <>
                    <div className="loading" style={{ marginBottom: "16px" }}></div>
                    <p>Connecting to stream...</p>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: "3rem", marginBottom: "16px" }}>📺</div>
                    <p>Waiting for stream...</p>
                  </>
                )}
              </div>
            )}

            {error && (
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  textAlign: "center",
                  color: "white",
                }}
              >
                <div style={{ fontSize: "3rem", marginBottom: "16px" }}>⚠️</div>
                <p>Connection Error</p>
                <p style={{ fontSize: "0.875rem", opacity: 0.8 }}>{error}</p>
                <button
                  onClick={connect}
                  className="btn btn-primary"
                  style={{ marginTop: "16px" }}
                  disabled={isConnecting}
                >
                  Retry Connection
                </button>
              </div>
            )}
          </div>

          {/* Stream Info */}
          <div className="card">
            <h1 className="h2" style={{ marginBottom: "12px" }}>
              {streamData.title}
            </h1>
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}
            >
              <div>
                <p style={{ color: "var(--text-light)", marginBottom: "4px" }}>
                  Streamed by <strong>{streamData.streamerName}</strong>
                </p>
                <p style={{ color: "var(--text-light)", fontSize: "0.875rem" }}>Category: {streamData.category}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="stream-viewers">
                  <span>👁</span>
                  <span>{viewerCount} watching</span>
                </div>
              </div>
            </div>
            {streamData.description && (
              <p style={{ color: "var(--text-dark)", lineHeight: "1.5" }}>{streamData.description}</p>
            )}
          </div>
        </div>

        {/* Chat Section */}
        <div className="card" style={{ height: "600px", display: "flex", flexDirection: "column" }}>
          <h3 className="h4" style={{ marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #e5e7eb" }}>
            Live Chat
          </h3>

          {/* Chat Messages */}
          <div
            ref={chatContainerRef}
            style={{
              flex: 1,
              overflowY: "auto",
              marginBottom: "16px",
              padding: "8px",
              background: "#f9fafb",
              borderRadius: "8px",
            }}
          >
            {chatMessages.length === 0 ? (
              <p style={{ color: "var(--text-light)", textAlign: "center", padding: "20px" }}>
                No messages yet. Be the first to say hello!
              </p>
            ) : (
              chatMessages.map((msg, index) => (
                <div key={index} style={{ marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <strong style={{ color: "var(--primary-red)", fontSize: "0.875rem" }}>{msg.username}</strong>
                    <span style={{ color: "var(--text-light)", fontSize: "0.75rem" }}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.875rem", lineHeight: "1.4" }}>{msg.message}</p>
                </div>
              ))
            )}
          </div>

          {/* Chat Input */}
          <form onSubmit={sendChatMessage} style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="form-input"
              style={{ flex: 1 }}
              disabled={!isConnected}
            />
            <button type="submit" className="btn btn-primary" disabled={!newMessage.trim() || !isConnected}>
              Send
            </button>
          </form>

          {!isConnected && (
            <p style={{ color: "var(--text-light)", fontSize: "0.75rem", marginTop: "8px", textAlign: "center" }}>
              Connect to stream to chat
            </p>
          )}
        </div>
      </div>

      {/* Related Streams */}
      <section style={{ marginTop: "60px" }}>
        <h2 className="h3" style={{ marginBottom: "24px" }}>
          Other Live Streams
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
          {/* This would be populated with other live streams */}
          <div className="card" style={{ textAlign: "center", padding: "40px" }}>
            <p style={{ color: "var(--text-light)" }}>Loading other streams...</p>
          </div>
        </div>
      </section>
    </div>
  )
}
