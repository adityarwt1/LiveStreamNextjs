"use client"

export default function StreamCard({ stream }) {
  const handleWatchStream = () => {
    window.location.href = `/stream/${stream.streamId || stream._id}`
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 group">
      <div className="relative aspect-video bg-gray-900 overflow-hidden">
        <img
          src="https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=400"
          alt={stream.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 left-3">
          <div className="bg-red-600 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-1"></div>
            LIVE
          </div>
        </div>
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
          <button
            onClick={handleWatchStream}
            className="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-900 p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {stream.title}
        </h3>
        <p className="text-gray-600 text-sm mb-3">by {stream.streamerName}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center text-red-600 text-sm font-medium">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            {stream.viewerCount || 0} viewers
          </div>
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
            {stream.category}
          </span>
        </div>
        
        <button
          onClick={handleWatchStream}
          className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Watch Stream
        </button>
      </div>
    </div>
  )
}