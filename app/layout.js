import "./globals.css"

export const metadata = {
  title: "LiveStream Platform",
  description: "Professional live streaming platform",
    generator: 'v0.app'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <nav className="navbar">
          <div className="container">
            <div className="nav-content">
              <a href="/" className="logo">
                LiveStream
              </a>
              <ul className="nav-links">
                <li>
                  <a href="/">Explore</a>
                </li>
                <li>
                  <a href="/start-stream">Start Stream</a>
                </li>
                <li>
                  <a href="/my-streams">My Streams</a>
                </li>
              </ul>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}
