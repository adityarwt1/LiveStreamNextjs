"use client"
import { useState, useRef, useEffect, useCallback } from "react"
import { useWebRTCStreamer } from "../../hooks/useWebRTCStreamer"

export default function StartStreamPage() {
  const [streamData, setStreamData] = useState({
    title: "",
    description: "",
    category: "Other",
  })
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
      videoRef.current.play().catch(console.error)
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
          streamerName: "Anonymous Streamer",
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

      if (streamId) {
        await fetch(`/api/streams/lives?id=${streamId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isLive: false }),
        })
      }

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {isStreaming ? "🔴 You're Live!" : "Start Your Stream"}
          </h1>
          <p className="text-lg text-gray-600">
            {isStreaming ? "Your stream is now broadcasting to viewers" : "Set up your stream and go live"}
          </p>
        </div>

        {error && (
          <div className="max-w-2xl mx-auto mb-6">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Stream Setup Form */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
              <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Stream Details
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stream Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={streamData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Enter your stream title"
                  disabled={isStreaming}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={streamData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                  placeholder="Tell viewers what your stream is about"
                  disabled={isStreaming}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  name="category"
                  value={streamData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center"
                >
                  {isConnecting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Setting up...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                      </svg>
                      Go Live
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-center mb-2">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
                        <span className="font-semibold text-green-800">LIVE</span>
                      </div>
                    </div>
                    <p className="text-center text-green-700 font-medium">
                      {viewerCount} viewer{viewerCount !== 1 ? "s" : ""} watching
                    </p>
                    {connectionStats && (
                      <p className="text-center text-green-600 text-sm mt-1">
                        {connectionStats.totalViewers} active connections
                      </p>
                    )}
                  </div>

                  <button
                    onClick={handleStopStream}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                    </svg>
                    End Stream
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Video Preview */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
              <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {isStreaming ? "Live Preview" : "Camera Preview"}
            </h2>

            <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                muted
                playsInline
              />
              {!getLocalStream() && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                  <div className="text-center text-white">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <p className="text-lg">Camera will appear here</p>
                    <p className="text-sm text-gray-400 mt-1">Click "Go Live" to start streaming</p>
                  </div>
                </div>
              )}
            </div>

            {isStreaming && streamUrl && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-2">Share your stream:</p>
                <div
                  className="bg-white p-3 rounded border text-sm text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors break-all"
                  onClick={() => navigator.clipboard.writeText(streamUrl)}
                  title="Click to copy"
                >
                  {streamUrl}
                </div>
                <p className="text-xs text-blue-600 mt-2">Click to copy link</p>
              </div>
            )}
          </div>
        </div>

        {/* Streaming Tips */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            Streaming Tips for Success
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Good Lighting</h4>
              <p className="text-gray-600">Face a window or use a ring light for better video quality</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Stable Internet</h4>
              <p className="text-gray-600">Use a wired connection for the most reliable streaming</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Engage Viewers</h4>
              <p className="text-gray-600">Interact with your audience and respond to comments</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}