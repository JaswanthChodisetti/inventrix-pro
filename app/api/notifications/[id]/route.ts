import { NextRequest, NextResponse } from "next/server"
import { getDatabase, COLLECTIONS } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// Mark notification as read
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await getDatabase()
    const { id } = await params

    const result = await db.collection(COLLECTIONS.NOTIFICATIONS).updateOne(
      { _id: new ObjectId(id) },
      { $set: { read: true } }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Notification not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, message: "Notification marked as read" })
  } catch (error) {
    console.error("Notification update error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update notification" },
      { status: 500 }
    )
  }
}

// Delete notification
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await getDatabase()
    const { id } = await params

    const result = await db
      .collection(COLLECTIONS.NOTIFICATIONS)
      .deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Notification not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, message: "Notification deleted" })
  } catch (error) {
    console.error("Notification delete error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete notification" },
      { status: 500 }
    )
  }
}
