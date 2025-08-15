import { connectdb } from "../../../../lib/mongoose"
import Stream from "../../../../models/Stream"

export async function GET(request) {
  try {
    await connectdb()

    const url = new URL(request.url)
    const query = url.searchParams.get("q") || ""
    const category = url.searchParams.get("category")
    const limit = Number.parseInt(url.searchParams.get("limit")) || 20
    const offset = Number.parseInt(url.searchParams.get("offset")) || 0

    const searchFilter = { isLive: true }

    // Add text search if query provided
    if (query.trim()) {
      searchFilter.$or = [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { streamerName: { $regex: query, $options: "i" } },
      ]
    }

    // Add category filter
    if (category && category !== "all") {
      searchFilter.category = category
    }

    const streams = await Stream.find(searchFilter)
      .sort({ viewerCount: -1, createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean()

    const totalCount = await Stream.countDocuments(searchFilter)

    return Response.json({
      streams,
      totalCount,
      hasMore: offset + streams.length < totalCount,
    })
  } catch (error) {
    console.error("Error searching streams:", error)
    return Response.json({ error: "Failed to search streams" }, { status: 500 })
  }
}
