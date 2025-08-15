"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { io } from "socket.io-client"
import { WebRTCViewer } from "../lib/webrtc"

export function useWebRTCViewer(streamId) {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [remoteStream, setRemoteStream] = useState(null)
  const [connectionState, setConnectionState] = useState("new")
  const [error, setError] = useState(null)

  const socketRef = useRef(null)
  const viewerRef = useRef(null)

  useEffect(() => {
    if (!streamId) return

    // Initialize socket connection
    socketRef.current = io()

    socketRef.current.on("connect", () => {
      console.log("[Viewer Hook] Socket connected")
    })

    socketRef.current.on("disconnect", () => {
      console.log("[Viewer Hook] Socket disconnected")
      setIsConnected(false)
      setConnectionState("disconnected")
    })

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
      disconnect()
    }
  }, [streamId])

  const connect = useCallback(async () => {
    if (!streamId) {
      setError("Stream ID is required")
      return false
    }

    setIsConnecting(true)
    setError(null)

    try {
      // Initialize WebRTC viewer
      viewerRef.current = new WebRTCViewer(socketRef.current, streamId)

      // Set up event handlers
      viewerRef.current.onRemoteStream = (stream) => {
        console.log("[Viewer Hook] Received remote stream")
        setRemoteStream(stream)
      }

      viewerRef.current.onConnectionStateChange = (state) => {
        console.log("[Viewer Hook] Connection state changed:", state)
        setConnectionState(state)
        setIsConnected(state === "connected")
      }

      viewerRef.current.onDisconnect = () => {
        console.log("[Viewer Hook] Disconnected from stream")
        setIsConnected(false)
        setRemoteStream(null)
        setConnectionState("disconnected")
      }

      // Join the stream
      const success = await viewerRef.current.joinStream()

      if (!success) {
        throw new Error("Failed to join stream")
      }

      return success
    } catch (err) {
      console.error("[Viewer Hook] Error connecting to stream:", err)
      setError(err.message)
      return false
    } finally {
      setIsConnecting(false)
    }
  }, [streamId])

  const disconnect = useCallback(() => {
    if (viewerRef.current) {
      viewerRef.current.disconnect()
      viewerRef.current = null
    }

    setIsConnected(false)
    setRemoteStream(null)
    setConnectionState("disconnected")
  }, [])

  const getConnectionStats = useCallback(() => {
    return viewerRef.current?.getConnectionStats() || null
  }, [])

  return {
    isConnected,
    isConnecting,
    remoteStream,
    connectionState,
    error,
    connect,
    disconnect,
    getConnectionStats,
  }
}
