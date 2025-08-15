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
      videoRef.current.play().catch(console.error)
      console.log("[Viewer] Set remote stream to video element")
    }
  }, [remoteStream])

  useEffect(() => {
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
        return "text-green-500"
      case "connecting":
        return "text-yellow-500"
      case "failed":
      case "disconnected":
        return "text-red-500"
      default:
        return "text-gray-500"
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading stream...</p>
        </div>
      </div>
    )
  }

  if (!streamData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Stream Not Found</h1>
          <p className="text-gray-600 mb-6">This stream may have ended or doesn't exist.</p>
          <a
            href="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Other Streams
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Username Modal */}
      {showUsernameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <svg className="w-16 h-16 text-blue-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Join Stream</h2>
              <p className="text-gray-600">Enter a username to join the chat and watch the stream</p>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === "Enter" && handleJoinStream()}
                autoFocus
              />
              <button
                onClick={handleJoinStream}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Join Stream
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Video Player Section */}
          <div className="lg:col-span-3">
            <div className="bg-black rounded-xl overflow-hidden shadow-lg relative aspect-video">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                controls={false}
              />

              {/* Video Overlay */}
              <div className="absolute top-4 left-4 flex items-center space-x-2">
                <div className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2"></div>
                  LIVE
                </div>
                <div className="bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm">
                  {viewerCount} viewers
                </div>
              </div>

              {/* Connection Status */}
              <div className="absolute top-4 right-4">
                <div className="bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${connectionState === 'connected' ? 'bg-green-500' : connectionState === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                  <span className={getConnectionStatusColor()}>{getConnectionStatusText()}</span>
                </div>
              </div>

              {/* Loading/Error States */}
              {!remoteStream && !error && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                  <div className="text-center text-white">
                    {isConnecting ? (
                      <>
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                        <p className="text-lg">Connecting to stream...</p>
                      </>
                    ) : (
                      <>
                        <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <p className="text-lg">Waiting for stream...</p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                  <div className="text-center text-white">
                    <svg className="w-16 h-16 mx-auto mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-lg mb-2">Connection Error</p>
                    <p className="text-sm text-gray-400 mb-4">{error}</p>
                    <button
                      onClick={connect}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                      disabled={isConnecting}
                    >
                      Retry Connection
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Stream Info */}
            <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{streamData.title}</h1>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-gray-600 mb-1">
                    Streamed by <span className="font-semibold text-gray-900">{streamData.streamerName}</span>
                  </p>
                  <p className="text-sm text-gray-500">Category: {streamData.category}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center text-red-600 font-semibold">
                    <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                    {viewerCount} watching
                  </div>
                </div>
              </div>
              {streamData.description && (
                <p className="text-gray-700 leading-relaxed">{streamData.description}</p>
              )}
            </div>
          </div>

          {/* Chat Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg h-[600px] flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Live Chat
                </h3>
              </div>

              {/* Chat Messages */}
              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-3"
              >
                {chatMessages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p>No messages yet</p>
                    <p className="text-sm">Be the first to say hello!</p>
                  </div>
                ) : (
                  chatMessages.map((msg, index) => (
                    <div key={index} className="break-words">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-semibold text-blue-600 text-sm">{msg.username}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800 leading-relaxed">{msg.message}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-gray-200">
                <form onSubmit={sendChatMessage} className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    disabled={!isConnected}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || !isConnected}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </form>
                {!isConnected && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Connect to stream to chat
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}