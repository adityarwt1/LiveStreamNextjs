"use client"
import { useState, useEffect } from "react"
import StreamCard from "../components/StreamCard"

export default function ExplorePage() {
  const [streams, setStreams] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchStreams()
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchStreams()
  }, [selectedCategory, searchQuery])

  const fetchStreams = async () => {
    try {
      setLoading(true)
      let url = "/api/streams"

      if (searchQuery || selectedCategory !== "all") {
        url = `/api/streams/search?q=${encodeURIComponent(searchQuery)}&category=${selectedCategory}&limit=20`
      }

      const response = await fetch(url)
      const data = await response.json()
      setStreams(data.streams || [])
    } catch (error) {
      console.error("Error fetching streams:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/streams/categories")
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    fetchStreams()
  }

  return (
    <div className="container">
      {/* Hero Section */}
      <section style={{ padding: "80px 0", textAlign: "center" }}>
        <h1 className="h1" style={{ marginBottom: "24px", color: "var(--primary-red)" }}>
          Discover Live Streams
        </h1>
        <p
          className="body"
          style={{ marginBottom: "32px", color: "var(--text-light)", maxWidth: "600px", margin: "0 auto 32px" }}
        >
          Watch amazing live content from creators around the world. Start your own stream and build your audience.
        </p>
        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/start-stream" className="btn btn-primary">
            Start Streaming
          </a>
          <a href="#streams" className="btn btn-outline">
            Browse Streams
          </a>
        </div>
      </section>

      {/* Search and Filters */}
      <section style={{ padding: "20px 0", borderBottom: "1px solid #e5e7eb", marginBottom: "40px" }}>
        <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
          <form onSubmit={handleSearch} style={{ display: "flex", gap: "8px", flex: "1", minWidth: "300px" }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search streams..."
              className="form-input"
              style={{ flex: "1" }}
            />
            <button type="submit" className="btn btn-secondary">
              Search
            </button>
          </form>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              onClick={() => setSelectedCategory("all")}
              className={`btn ${selectedCategory === "all" ? "btn-primary" : "btn-outline"}`}
            >
              All ({streams.length})
            </button>
            {categories.map((category) => (
              <button
                key={category.name}
                onClick={() => setSelectedCategory(category.name)}
                className={`btn ${selectedCategory === category.name ? "btn-primary" : "btn-outline"}`}
              >
                {category.name} ({category.streamCount})
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Live Streams Section */}
      <section id="streams" style={{ padding: "40px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <h2 className="h2">
            {selectedCategory === "all" ? "Live Now" : `${selectedCategory} Streams`}
            {searchQuery && ` - "${searchQuery}"`}
          </h2>
          <div style={{ color: "var(--text-light)" }}>
            {streams.length} stream{streams.length !== 1 ? "s" : ""} found
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div className="loading"></div>
            <p style={{ marginTop: "16px", color: "var(--text-light)" }}>Loading streams...</p>
          </div>
        ) : streams.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <h3 className="h3" style={{ marginBottom: "16px", color: "var(--text-light)" }}>
              {searchQuery || selectedCategory !== "all" ? "No Streams Found" : "No Live Streams"}
            </h3>
            <p style={{ color: "var(--text-light)", marginBottom: "24px" }}>
              {searchQuery || selectedCategory !== "all"
                ? "Try adjusting your search or category filter"
                : "Be the first to start streaming!"}
            </p>
            <a href="/start-stream" className="btn btn-primary">
              Start Your Stream
            </a>
          </div>
        ) : (
          <div className="stream-grid">
            {streams.map((stream) => (
              <StreamCard key={stream._id || stream.streamId} stream={stream} />
            ))}
          </div>
        )}
      </section>

      {/* Features Section */}
      <section style={{ padding: "80px 0", background: "var(--light-gold)", borderRadius: "20px", margin: "60px 0" }}>
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <h2 className="h2" style={{ marginBottom: "16px" }}>
            Why Choose LiveStream?
          </h2>
          <p className="body" style={{ color: "var(--text-light)" }}>
            Professional streaming made simple
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "32px" }}>
          <div className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🎥</div>
            <h3 className="h3" style={{ marginBottom: "12px" }}>
              HD Quality
            </h3>
            <p style={{ color: "var(--text-light)" }}>Stream in high definition with low latency</p>
          </div>

          <div className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🌐</div>
            <h3 className="h3" style={{ marginBottom: "12px" }}>
              Global Reach
            </h3>
            <p style={{ color: "var(--text-light)" }}>Reach viewers worldwide instantly</p>
          </div>

          <div className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>⚡</div>
            <h3 className="h3" style={{ marginBottom: "12px" }}>
              Easy Setup
            </h3>
            <p style={{ color: "var(--text-light)" }}>Start streaming in just a few clicks</p>
          </div>
        </div>
      </section>
    </div>
  )
}
