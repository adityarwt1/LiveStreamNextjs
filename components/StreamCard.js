"use client"

export default function StreamCard({ stream }) {
  const handleWatchStream = () => {
    window.location.href = `/stream/${stream.streamId || stream._id}`
  }

  return (
    <div className="stream-card">
      <div className="stream-thumbnail">
        <div className="live-indicator">LIVE</div>
        <img
          src="/placeholder.svg?height=180&width=320"
          alt={stream.title}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
      <div className="stream-info">
        <h3 className="stream-title">{stream.title}</h3>
        <p className="stream-streamer">by {stream.streamerName}</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
          <div className="stream-viewers">
            <span>👁</span>
            <span>{stream.viewerCount || 0} viewers</span>
          </div>
          <span
            style={{
              background: "var(--light-gold)",
              color: "var(--text-dark)",
              padding: "2px 6px",
              borderRadius: "4px",
              fontSize: "0.75rem",
            }}
          >
            {stream.category}
          </span>
        </div>
        <button onClick={handleWatchStream} className="btn btn-primary" style={{ width: "100%", marginTop: "12px" }}>
          Watch Stream
        </button>
      </div>
    </div>
  )
}
