import { NextRequest, NextResponse } from "next/server"
import { connectdb } from "../../../../lib/mongoose"
import ChatMessage from "../../../../models/ChatMessage"

export async function GET(request:NextRequest) {
  try {
    await connectdb()
    const id =  request.nextUrl.searchParams.get("id")
    const messages = await ChatMessage.find({ streamId: id })
      .sort({ timestamp: -1 })

    return NextResponse.json({
      messages: messages.reverse(), // Show oldest first
      hasMore: messages.length ,
    })
  } catch (error) {
    console.error("Error fetching chat messages:", error)
    return NextResponse.json({ error: "Failed to fetch chat messages" }, { status: 500 })
  }
}

export async function POST(request:NextRequest, ) {
  try {
    await connectdb()
    const id = request.nextUrl.searchParams.get('id')
    const { message, username } = await request.json()

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 })
    }

    const chatMessage = new ChatMessage({
      streamId: id,
      username: username || "Anonymous",
      message: message.trim(),
      timestamp: new Date(),
    })

    const savedMessage = await chatMessage.save()

    return NextResponse.json({ success: true, message: savedMessage })
  } catch (error) {
    console.error("Error posting chat message:", error)
    return NextResponse.json({ error: "Failed to post message" }, { status: 500 })
  }
}
