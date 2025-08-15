"use client"
import { useState, useRef, useEffect } from "react"
import { useWebRTCStreamer } from "../../hooks/useWebRTCStreamer"

export default function StartStreamPage() {
const [streamData, setStreamData] = useState({
  title: "",
  description: "",
  category: "Other", // Changed from "general" to "Other"
});
  const [streamId, setStreamId] = useState(null)
  const [error, setError] = useState("")
  const [streamUrl, setStreamUrl] = useState("")

  const videoRef = useRef(null)

  const {
    isStreaming,
    isConnecting,
    viewerCount,
    connectionStats,
    error: webrtcError,
    startStreaming,
    stopStreaming,
    getLocalStream,
  } = useWebRTCStreamer(streamId)

  useEffect(() => {
    // Display local stream in video element
    const localStream = getLocalStream()
    if (localStream && videoRef.current) {
      videoRef.current.srcObject = localStream
    }
  }, [isStreaming, getLocalStream])

  useEffect(() => {
    if (webrtcError) {
      setError(webrtcError)
    }
  }, [webrtcError])

  const handleInputChange = (e) => {
    setStreamData({
      ...streamData,
      [e.target.name]: e.target.value,
    })
  }

  const handleStartStream = async () => {
    if (!streamData.title.trim()) {
      setError("Please enter a stream title")
      return
    }

    setError("")

    try {
      const response = await fetch("/api/streams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...streamData,
          streamerName: "Anonymous Streamer", // In real app, get from auth
        }),
      })

      const result = await response.json()

      if (result.success) {
        const newStreamId = result.stream.streamId
        setStreamId(newStreamId)
        setStreamUrl(`${window.location.origin}/stream/${newStreamId}`)

        const success = await startStreaming("hd")

        if (!success) {
          throw new Error("Failed to start WebRTC streaming")
        }
      } else {
        throw new Error(result.error || "Failed to create stream")
      }
    } catch (err) {
      console.error("Error starting stream:", err)
      setError("Failed to start stream. Please try again.")
    }
  }

  const handleStopStream = async () => {
    try {
      stopStreaming()

      // Update stream status in database
      if (streamId) {
        await fetch(`/api/streams/lives?id=${streamId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isLive: false }),
        })
      }

      // Reset state
      setStreamId(null)
      setStreamUrl("")

      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    } catch (error) {
      console.error("Error stopping stream:", error)
      setError("Error stopping stream")
    }
  }

  return (
    <div className="container" style={{ padding: "40px 20px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h1
          className="h1"
          style={{
            textAlign: "center",
            marginBottom: "32px",
            color: "var(--primary-red)",
          }}
        >
          {isStreaming ? "You're Live!" : "Start Your Stream"}
        </h1>

        {error && (
          <div
            style={{
              background: "#fee2e2",
              border: "1px solid #fecaca",
              color: "#dc2626",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "24px",
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "32px",
            alignItems: "start",
          }}
        >
          {/* Stream Setup Form */}
          <div className="card">
            <h2 className="h3" style={{ marginBottom: "24px" }}>
              Stream Details
            </h2>

            <div className="form-group">
              <label className="form-label">Stream Title *</label>
              <input
                type="text"
                name="title"
                value={streamData.title}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter your stream title"
                disabled={isStreaming}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                name="description"
                value={streamData.description}
                onChange={handleInputChange}
                className="form-textarea"
                placeholder="Tell viewers what your stream is about"
                disabled={isStreaming}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                name="category"
                value={streamData.category}
                onChange={handleInputChange}
                className="form-input"
                disabled={isStreaming}
              >
                <option value="Other">General</option>
                <option value="Gaming">Gaming</option>
                <option value="Music">Music</option>
                <option value="Talk Shows">Talk Shows</option>
                <option value="Education">Education</option>
                <option value="Art">Art & Creative</option>
                <option value="Technology">Technology</option>
                <option value="Sports">Sports</option>
              </select>
            </div>

            {!isStreaming ? (
              <button
                onClick={handleStartStream}
                disabled={isConnecting}
                className="btn btn-primary"
                style={{ width: "100%" }}
              >
                {isConnecting ? (
                  <>
                    <span
                      className="loading"
                      style={{ marginRight: "8px" }}
                    ></span>
                    Setting up...
                  </>
                ) : (
                  "Go Live"
                )}
              </button>
            ) : (
              <div>
                <div
                  style={{
                    background: "var(--light-gold)",
                    padding: "16px",
                    borderRadius: "8px",
                    marginBottom: "16px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        background: "var(--primary-red)",
                        borderRadius: "50%",
                        animation: "pulse 2s infinite",
                      }}
                    ></div>
                    <span style={{ fontWeight: "600" }}>LIVE</span>
                  </div>
                  <p style={{ margin: "8px 0 0", color: "var(--text-light)" }}>
                    {viewerCount} viewer{viewerCount !== 1 ? "s" : ""} watching
                  </p>
                  {connectionStats && (
                    <p
                      style={{
                        margin: "4px 0 0",
                        color: "var(--text-light)",
                        fontSize: "0.875rem",
                      }}
                    >
                      {connectionStats.totalViewers} active connections
                    </p>
                  )}
                </div>

                <button
                  onClick={handleStopStream}
                  className="btn btn-primary"
                  style={{ width: "100%" }}
                >
                  End Stream
                </button>
              </div>
            )}
          </div>

          {/* Video Preview */}
          <div className="card">
            <h2 className="h3" style={{ marginBottom: "16px" }}>
              {isStreaming ? "Live Preview" : "Camera Preview"}
            </h2>

            <div className="video-container">
              <video
                ref={videoRef}
                className="video-player"
                autoPlay
                muted
                playsInline
                style={{ background: "#000" }}
              />
              {!getLocalStream() && (
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
                  <div style={{ fontSize: "3rem", marginBottom: "16px" }}>
                    📹
                  </div>
                  <p>Camera will appear here</p>
                </div>
              )}
            </div>

            {isStreaming && streamUrl && (
              <div style={{ marginTop: "16px", textAlign: "center" }}>
                <p style={{ color: "var(--text-light)", marginBottom: "8px" }}>
                  Share your stream:
                </p>
                <div
                  style={{
                    background: "#f9fafb",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    fontSize: "0.875rem",
                    wordBreak: "break-all",
                    cursor: "pointer",
                  }}
                  onClick={() => navigator.clipboard.writeText(streamUrl)}
                  title="Click to copy"
                >
                  {streamUrl}
                </div>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-light)",
                    marginTop: "4px",
                  }}
                >
                  Click to copy link
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Stream Tips */}
        <div className="card" style={{ marginTop: "32px" }}>
          <h3 className="h3" style={{ marginBottom: "16px" }}>
            Streaming Tips
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "16px",
            }}
          >
            <div>
              <h4
                className="h4"
                style={{ color: "var(--primary-red)", marginBottom: "8px" }}
              >
                Good Lighting
              </h4>
              <p style={{ color: "var(--text-light)", fontSize: "0.875rem" }}>
                Face a window or use a ring light for better video quality
              </p>
            </div>
            <div>
              <h4
                className="h4"
                style={{ color: "var(--primary-red)", marginBottom: "8px" }}
              >
                Stable Internet
              </h4>
              <p style={{ color: "var(--text-light)", fontSize: "0.875rem" }}>
                Use a wired connection for the most reliable streaming
              </p>
            </div>
            <div>
              <h4
                className="h4"
                style={{ color: "var(--primary-red)", marginBottom: "8px" }}
              >
                Engage Viewers
              </h4>
              <p style={{ color: "var(--text-light)", fontSize: "0.875rem" }}>
                Interact with your audience and respond to comments
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}
