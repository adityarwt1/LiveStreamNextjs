import { connectdb } from "../../../lib/mongoose";
import Stream from "../../../models/Stream";

export async function GET() {
  try {
    await connectdb();

    const streams = await Stream.find({ isLive: true })
      .sort({ createdAt: -1 })
      .lean();

    return Response.json({ streams });
  } catch (error) {
    console.error("Error fetching streams:", error);
    return Response.json({ error: "Failed to fetch streams" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectdb();

    const streamData = await request.json();

    // Generate a unique stream key
    const streamKey = `sk_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 16)}`;

    // Map frontend categories to model enum values
    const categoryMap = {
      general: "Other",
      gaming: "Gaming",
      music: "Music",
      talk: "Talk Shows",
      education: "Education",
      art: "Art",
      technology: "Technology",
      sports: "Sports",
    };

    const mappedCategory = categoryMap[streamData.category] || "Other";

    const newStream = new Stream({
      ...streamData,
      category: mappedCategory,
      streamKey: streamKey,
      createdAt: new Date(),
      isLive: true,
      viewerCount: 0,
      streamId: `stream_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
    });

    const savedStream = await newStream.save();

    return Response.json({
      success: true,
      streamId: savedStream._id,
      stream: savedStream,
    });
  } catch (error) {
    console.error("Error creating stream:", error);
    return Response.json({ error: "Failed to create stream" }, { status: 500 });
  }
}
