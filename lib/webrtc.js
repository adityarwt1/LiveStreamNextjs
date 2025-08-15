// WebRTC utility functions for streaming platform

export class WebRTCStreamer {
  constructor(socket, streamId) {
    this.socket = socket
    this.streamId = streamId
    this.peerConnections = new Map()
    this.localStream = null
    this.isStreaming = false

    this.rtcConfiguration = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
      ],
    }

    this.setupSocketListeners()
  }

  setupSocketListeners() {
    this.socket.on("new-viewer", (data) => {
      console.log("[WebRTC] New viewer joined:", data.viewerId)
      this.handleNewViewer(data.viewerId)
    })

    this.socket.on("viewer-left", (data) => {
      console.log("[WebRTC] Viewer left:", data.viewerId)
      this.removeViewer(data.viewerId)
    })

    this.socket.on("answer", async (data) => {
      console.log("[WebRTC] Received answer from:", data.viewerId)
      await this.handleAnswer(data.viewerId, data.answer)
    })

    this.socket.on("ice-candidate", async (data) => {
      console.log("[WebRTC] Received ICE candidate from:", data.viewerId)
      await this.handleIceCandidate(data.viewerId, data.candidate)
    })
  }

  async startStreaming(mediaStream) {
    try {
      this.localStream = mediaStream
      this.isStreaming = true

      console.log("[WebRTC] Started streaming with", mediaStream.getTracks().length, "tracks")

      // Join the stream room
      this.socket.emit("create-stream", {
        streamId: this.streamId,
        timestamp: new Date(),
      })

      return true
    } catch (error) {
      console.error("[WebRTC] Error starting stream:", error)
      return false
    }
  }

  async handleNewViewer(viewerId) {
    if (!this.localStream) {
      console.warn("[WebRTC] No local stream available for new viewer")
      return
    }

    try {
      const peerConnection = new RTCPeerConnection(this.rtcConfiguration)
      this.peerConnections.set(viewerId, peerConnection)

      // Add local stream tracks to peer connection
      this.localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, this.localStream)
        console.log("[WebRTC] Added track to peer connection:", track.kind)
      })

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("[WebRTC] Sending ICE candidate to viewer:", viewerId)
          this.socket.emit("ice-candidate", {
            streamId: this.streamId,
            viewerId,
            candidate: event.candidate,
          })
        }
      }

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log(`[WebRTC] Connection state with ${viewerId}:`, peerConnection.connectionState)
        if (peerConnection.connectionState === "failed" || peerConnection.connectionState === "disconnected") {
          this.removeViewer(viewerId)
        }
      }

      // Create and send offer
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: false,
      })

      await peerConnection.setLocalDescription(offer)

      console.log("[WebRTC] Sending offer to viewer:", viewerId)
      this.socket.emit("offer", {
        streamId: this.streamId,
        viewerId,
        offer,
      })
    } catch (error) {
      console.error("[WebRTC] Error handling new viewer:", error)
      this.removeViewer(viewerId)
    }
  }

  async handleAnswer(viewerId, answer) {
    const peerConnection = this.peerConnections.get(viewerId)
    if (!peerConnection) {
      console.warn("[WebRTC] No peer connection found for viewer:", viewerId)
      return
    }

    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
      console.log("[WebRTC] Set remote description for viewer:", viewerId)
    } catch (error) {
      console.error("[WebRTC] Error setting remote description:", error)
      this.removeViewer(viewerId)
    }
  }

  async handleIceCandidate(viewerId, candidate) {
    const peerConnection = this.peerConnections.get(viewerId)
    if (!peerConnection) {
      console.warn("[WebRTC] No peer connection found for ICE candidate:", viewerId)
      return
    }

    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
      console.log("[WebRTC] Added ICE candidate for viewer:", viewerId)
    } catch (error) {
      console.error("[WebRTC] Error adding ICE candidate:", error)
    }
  }

  removeViewer(viewerId) {
    const peerConnection = this.peerConnections.get(viewerId)
    if (peerConnection) {
      peerConnection.close()
      this.peerConnections.delete(viewerId)
      console.log("[WebRTC] Removed viewer:", viewerId)
    }
  }

  stopStreaming() {
    console.log("[WebRTC] Stopping stream")

    // Close all peer connections
    this.peerConnections.forEach((pc, viewerId) => {
      pc.close()
      console.log("[WebRTC] Closed connection to viewer:", viewerId)
    })
    this.peerConnections.clear()

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        track.stop()
        console.log("[WebRTC] Stopped track:", track.kind)
      })
      this.localStream = null
    }

    this.isStreaming = false

    // Notify server
    this.socket.emit("end-stream", this.streamId)
  }

  getConnectionStats() {
    const stats = {
      totalViewers: this.peerConnections.size,
      connections: [],
    }

    this.peerConnections.forEach((pc, viewerId) => {
      stats.connections.push({
        viewerId,
        connectionState: pc.connectionState,
        iceConnectionState: pc.iceConnectionState,
      })
    })

    return stats
  }
}

export class WebRTCViewer {
  constructor(socket, streamId) {
    this.socket = socket
    this.streamId = streamId
    this.peerConnection = null
    this.remoteStream = null
    this.isConnected = false

    this.rtcConfiguration = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
      ],
    }

    this.setupSocketListeners()
  }

  setupSocketListeners() {
    this.socket.on("offer", async (data) => {
      console.log("[WebRTC Viewer] Received offer from streamer")
      await this.handleOffer(data.offer)
    })

    this.socket.on("ice-candidate", async (data) => {
      console.log("[WebRTC Viewer] Received ICE candidate from streamer")
      await this.handleIceCandidate(data.candidate)
    })

    this.socket.on("stream-ended", () => {
      console.log("[WebRTC Viewer] Stream ended")
      this.disconnect()
      if (this.onStreamEnded) {
        this.onStreamEnded()
      }
    })
  }

  async joinStream() {
    try {
      console.log("[WebRTC Viewer] Joining stream:", this.streamId)

      this.peerConnection = new RTCPeerConnection(this.rtcConfiguration)

      // Handle incoming stream
      this.peerConnection.ontrack = (event) => {
        console.log("[WebRTC Viewer] Received remote track:", event.track.kind)
        if (event.streams && event.streams[0]) {
          this.remoteStream = event.streams[0]
          if (this.onRemoteStream) {
            this.onRemoteStream(this.remoteStream)
          }
        }
      }

      // Handle ICE candidates
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("[WebRTC Viewer] Sending ICE candidate to streamer")
          this.socket.emit("ice-candidate", {
            streamId: this.streamId,
            candidate: event.candidate,
          })
        }
      }

      // Handle connection state changes
      this.peerConnection.onconnectionstatechange = () => {
        console.log("[WebRTC Viewer] Connection state:", this.peerConnection.connectionState)
        this.isConnected = this.peerConnection.connectionState === "connected"

        if (this.onConnectionStateChange) {
          this.onConnectionStateChange(this.peerConnection.connectionState)
        }

        if (this.peerConnection.connectionState === "failed") {
          this.disconnect()
        }
      }

      // Join stream room
      this.socket.emit("join-stream", {
        streamId: this.streamId,
        viewerId: this.socket.id,
      })

      return true
    } catch (error) {
      console.error("[WebRTC Viewer] Error joining stream:", error)
      return false
    }
  }

  async handleOffer(offer) {
    if (!this.peerConnection) {
      console.warn("[WebRTC Viewer] No peer connection available for offer")
      return
    }

    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer))

      const answer = await this.peerConnection.createAnswer()
      await this.peerConnection.setLocalDescription(answer)

      console.log("[WebRTC Viewer] Sending answer to streamer")
      this.socket.emit("answer", {
        streamId: this.streamId,
        viewerId: this.socket.id,
        answer,
      })
    } catch (error) {
      console.error("[WebRTC Viewer] Error handling offer:", error)
    }
  }

  async handleIceCandidate(candidate) {
    if (!this.peerConnection) {
      console.warn("[WebRTC Viewer] No peer connection available for ICE candidate")
      return
    }

    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
      console.log("[WebRTC Viewer] Added ICE candidate")
    } catch (error) {
      console.error("[WebRTC Viewer] Error adding ICE candidate:", error)
    }
  }

  disconnect() {
    console.log("[WebRTC Viewer] Disconnecting from stream")

    if (this.peerConnection) {
      this.peerConnection.close()
      this.peerConnection = null
    }

    this.remoteStream = null
    this.isConnected = false

    if (this.onDisconnect) {
      this.onDisconnect()
    }
  }

  getConnectionStats() {
    if (!this.peerConnection) {
      return null
    }

    return {
      connectionState: this.peerConnection.connectionState,
      iceConnectionState: this.peerConnection.iceConnectionState,
      isConnected: this.isConnected,
    }
  }
}

// Utility functions
export const getMediaConstraints = (quality = "hd") => {
  const constraints = {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 44100,
    },
  }

  switch (quality) {
    case "4k":
      constraints.video = {
        width: { ideal: 3840 },
        height: { ideal: 2160 },
        frameRate: { ideal: 30 },
      }
      break
    case "hd":
      constraints.video = {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30 },
      }
      break
    case "sd":
      constraints.video = {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 },
      }
      break
    case "low":
      constraints.video = {
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 24 },
      }
      break
    default:
      constraints.video = true
  }

  return constraints
}

export const checkWebRTCSupport = () => {
  const hasWebRTC = !!(window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection)

  const hasGetUserMedia = !!(
    navigator.mediaDevices?.getUserMedia ||
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia
  )

  return {
    supported: hasWebRTC && hasGetUserMedia,
    webrtc: hasWebRTC,
    getUserMedia: hasGetUserMedia,
  }
}