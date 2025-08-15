import { connectdb } from "../../../../../lib/mongoose"
import Stream from "../../../../../models/Stream"
import ChatMessage from "../../../../../models/ChatMessage"

export async function GET(request, { params }) {
  try {
    await connectdb()

    // Get stream analytics
    const stream = await Stream.findOne({ streamId: params.id }).lean()

    if (!stream) {
      return Response.json({ error: "Stream not found" }, { status: 404 })
    }

    // Get chat messages count
    const chatCount = await ChatMessage.countDocuments({ streamId: params.id })

    // Calculate stream duration
    const duration = stream.endTime
      ? new Date(stream.endTime) - new Date(stream.actualStartTime || stream.createdAt)
      : new Date() - new Date(stream.actualStartTime || stream.createdAt)

    const analytics = {
      streamId: params.id,
      title: stream.title,
      streamerName: stream.streamerName,
      startTime: stream.actualStartTime || stream.createdAt,
      endTime: stream.endTime,
      duration: Math.floor(duration / 1000), // in seconds
      peakViewers: stream.peakViewerCount || stream.viewerCount || 0,
      currentViewers: stream.isLive ? stream.viewerCount || 0 : 0,
      totalChatMessages: chatCount,
      isLive: stream.isLive,
      category: stream.category,
    }

    return Response.json({ analytics })
  } catch (error) {
    console.error("Error fetching stream analytics:", error)
    return Response.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
