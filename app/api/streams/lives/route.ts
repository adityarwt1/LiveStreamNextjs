import { NextRequest, NextResponse } from "next/server"
import { connectdb } from "../../../../lib/mongoose"
import Stream from "../../../../models/Stream"
import mongoose from "mongoose"

export async function GET(request:NextRequest,) {
  try {
    await connectdb()
    const id = String( request.nextUrl.searchParams.get("id"))
    const stream = await Stream.findOne({
      $or: [{ _id: mongoose.Types.ObjectId.isValid(id) ? id : null }, { streamId: id }],
    }).lean()

    if (!stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 })
    }

    return NextResponse.json({ stream })
  } catch (error) {
    console.error("Error fetching stream:", error)
    return NextResponse.json({ error: "Failed to fetch stream" }, { status: 500 })
  }
}

export async function PATCH(request, { params }) {
  try {
    await connectdb()

    const updateData = await request.json()

    const result = await Stream.updateOne(
      {
        $or: [{ _id: mongoose.Types.ObjectId.isValid(params.id) ? params.id : null }, { streamId: params.id }],
      },
      {
        ...updateData,
        updatedAt: new Date(),
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating stream:", error)
    return NextResponse.json({ error: "Failed to update stream" }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectdb()

    const result = await Stream.deleteOne({
      $or: [{ _id: mongoose.Types.ObjectId.isValid(params.id) ? params.id : null }, { streamId: params.id }],
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting stream:", error)
    return NextResponse.json({ error: "Failed to delete stream" }, { status: 500 })
  }
}
