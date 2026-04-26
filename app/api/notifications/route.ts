import { NextRequest, NextResponse } from "next/server"
import { getDatabase, COLLECTIONS } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET() {
  try {
    const db = await getDatabase()

    const notifications = await db
      .collection(COLLECTIONS.NOTIFICATIONS)
      .find()
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray()

    const unreadCount = await db
      .collection(COLLECTIONS.NOTIFICATIONS)
      .countDocuments({ read: false })

    return NextResponse.json({
      success: true,
      data: notifications,
      unreadCount,
    })
  } catch (error) {
    console.error("Notifications fetch error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch notifications" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const db = await getDatabase()
    const body = await request.json()

    if (body.markAllRead) {
      await db
        .collection(COLLECTIONS.NOTIFICATIONS)
        .updateMany({}, { $set: { read: true } })
    } else if (body.id) {
      await db
        .collection(COLLECTIONS.NOTIFICATIONS)
        .updateOne({ _id: new ObjectId(body.id) }, { $set: { read: true } })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Notification update error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update notification" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const db = await getDatabase()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (id) {
      await db
        .collection(COLLECTIONS.NOTIFICATIONS)
        .deleteOne({ _id: new ObjectId(id) })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Notification delete error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete notification" },
      { status: 500 }
    )
  }
}
