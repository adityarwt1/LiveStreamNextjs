import "./globals.css"

export const metadata = {
  title: "LiveStream Platform",
  description: "Professional live streaming platform",
  generator: 'v0.app'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <nav className="bg-white shadow-lg sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex justify-between items-center h-16">
              <a href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-gray-900">LiveStream</span>
              </a>
              
              <div className="hidden md:flex items-center space-x-8">
                <a href="/" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                  Explore
                </a>
                <a href="/start-stream" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                  Start Stream
                </a>
                <a href="/my-streams" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                  My Streams
                </a>
              </div>

              <div className="flex items-center space-x-4">
                <a
                  href="/start-stream"
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Go Live
                </a>
              </div>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}