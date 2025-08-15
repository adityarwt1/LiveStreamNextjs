"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { io } from "socket.io-client"
import { WebRTCStreamer, getMediaConstraints } from "../lib/webrtc"

export function useWebRTCStreamer(streamId) {
  const [isStreaming, setIsStreaming] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [viewerCount, setViewerCount] = useState(0)
  const [connectionStats, setConnectionStats] = useState(null)
  const [error, setError] = useState(null)

  const socketRef = useRef(null)
  const streamerRef = useRef(null)
  const localStreamRef = useRef(null)

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io()

    socketRef.current.on("connect", () => {
      console.log("[Hook] Socket connected")
    })

    socketRef.current.on("viewer-joined", (data) => {
      setViewerCount(data.viewerCount)
    })

    socketRef.current.on("viewer-left", (data) => {
      setViewerCount(data.viewerCount)
    })

    socketRef.current.on("disconnect", () => {
      console.log("[Hook] Socket disconnected")
      setIsStreaming(false)
    })

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
      stopStreaming()
    }
  }, [])

  const startStreaming = useCallback(
    async (quality = "hd") => {
      if (!streamId) {
        setError("Stream ID is required")
        return false
      }

      setIsConnecting(true)
      setError(null)

      try {
        // Get user media
        const constraints = getMediaConstraints(quality)
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)

        localStreamRef.current = mediaStream

        // Initialize WebRTC streamer
        streamerRef.current = new WebRTCStreamer(socketRef.current, streamId)

        // Start streaming
        const success = await streamerRef.current.startStreaming(mediaStream)

        if (success) {
          setIsStreaming(true)

          // Update connection stats periodically
          const statsInterval = setInterval(() => {
            if (streamerRef.current) {
              setConnectionStats(streamerRef.current.getConnectionStats())
            }
          }, 5000)

          // Store interval for cleanup
          streamerRef.current.statsInterval = statsInterval
        } else {
          throw new Error("Failed to start streaming")
        }

        return success
      } catch (err) {
        console.error("[Hook] Error starting stream:", err)
        setError(err.message)
        return false
      } finally {
        setIsConnecting(false)
      }
    },
    [streamId],
  )

  const stopStreaming = useCallback(() => {
    if (streamerRef.current) {
      // Clear stats interval
      if (streamerRef.current.statsInterval) {
        clearInterval(streamerRef.current.statsInterval)
      }

      streamerRef.current.stopStreaming()
      streamerRef.current = null
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
      localStreamRef.current = null
    }

    setIsStreaming(false)
    setViewerCount(0)
    setConnectionStats(null)
  }, [])

  const getLocalStream = useCallback(() => {
    return localStreamRef.current
  }, [])

  return {
    isStreaming,
    isConnecting,
    viewerCount,
    connectionStats,
    error,
    startStreaming,
    stopStreaming,
    getLocalStream,
  }
}
