"use client"
import { useState, useEffect } from "react"

export default function MyStreamsPage() {
  const [streams, setStreams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMyStreams()
  }, [])

  const fetchMyStreams = async () => {
    try {
      // In a real app, this would filter by authenticated user
      const response = await fetch("/api/streams")
      const data = await response.json()
      setStreams(data.streams || [])
    } catch (error) {
      console.error("Error fetching streams:", error)
    } finally {
      setLoading(false)
    }
  }

  const deleteStream = async (streamId) => {
    if (!confirm("Are you sure you want to delete this stream?")) return

    try {
      await fetch(`/api/streams/${streamId}`, {
        method: "DELETE",
      })
      setStreams(streams.filter((s) => s.streamId !== streamId))
    } catch (error) {
      console.error("Error deleting stream:", error)
    }
  }

  return (
    <div className="container" style={{ padding: "40px 20px" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <h1 className="h1" style={{ color: "var(--primary-red)" }}>
            My Streams
          </h1>
          <a href="/start-stream" className="btn btn-primary">
            Start New Stream
          </a>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div className="loading"></div>
            <p style={{ marginTop: "16px", color: "var(--text-light)" }}>Loading your streams...</p>
          </div>
        ) : streams.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <h3 className="h3" style={{ marginBottom: "16px", color: "var(--text-light)" }}>
              No Streams Yet
            </h3>
            <p style={{ color: "var(--text-light)", marginBottom: "24px" }}>
              Start your first stream and build your audience!
            </p>
            <a href="/start-stream" className="btn btn-primary">
              Create Your First Stream
            </a>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "20px" }}>
            {streams.map((stream) => (
              <div key={stream._id} className="card">
                <div
                  style={{ display: "grid", gridTemplateColumns: "200px 1fr auto", gap: "20px", alignItems: "center" }}
                >
                  <div
                    style={{
                      width: "200px",
                      height: "120px",
                      background: "#f3f4f6",
                      borderRadius: "8px",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src="/placeholder.svg?height=120&width=200"
                      alt={stream.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    {stream.isLive && <div className="live-indicator">LIVE</div>}
                  </div>

                  <div>
                    <h3 className="h3" style={{ marginBottom: "8px" }}>
                      {stream.title}
                    </h3>
                    <p style={{ color: "var(--text-light)", marginBottom: "8px" }}>
                      Category: {stream.category} • Created: {new Date(stream.createdAt).toLocaleDateString()}
                    </p>
                    <p style={{ color: "var(--text-light)", fontSize: "0.875rem" }}>
                      {stream.description || "No description"}
                    </p>
                    <div style={{ marginTop: "12px", display: "flex", gap: "16px" }}>
                      <span style={{ color: "var(--primary-red)", fontSize: "0.875rem" }}>
                        👁 {stream.viewerCount || 0} viewers
                      </span>
                      <span style={{ color: "var(--text-light)", fontSize: "0.875rem" }}>
                        Status: {stream.isLive ? "Live" : "Ended"}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {stream.isLive ? (
                      <a href={`/stream/${stream.streamId}`} className="btn btn-primary">
                        Watch
                      </a>
                    ) : (
                      <button className="btn btn-outline" disabled>
                        Ended
                      </button>
                    )}
                    <button
                      onClick={() => deleteStream(stream.streamId)}
                      className="btn"
                      style={{ background: "#fee2e2", color: "#dc2626" }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
