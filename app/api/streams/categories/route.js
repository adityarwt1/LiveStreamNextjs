import { connectdb } from "../../../../lib/mongoose"
import Stream from "../../../../models/Stream"

export async function GET() {
  try {
    await connectdb()

    // Get stream counts by category
    const categories = await Stream.aggregate([
      { $match: { isLive: true } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          totalViewers: { $sum: "$viewerCount" },
        },
      },
      { $sort: { count: -1 } },
    ])

    const formattedCategories = categories.map((cat) => ({
      name: cat._id,
      streamCount: cat.count,
      viewerCount: cat.totalViewers || 0,
    }))

    return Response.json({ categories: formattedCategories })
  } catch (error) {
    console.error("Error fetching categories:", error)
    return Response.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}
