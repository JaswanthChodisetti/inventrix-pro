import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDatabase, COLLECTIONS } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { name, email, lowStockThreshold } = await request.json()

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: "Name and email are required" },
        { status: 400 }
      )
    }

    const db = await getDatabase()

    await db.collection(COLLECTIONS.USERS).updateOne(
      { _id: new ObjectId(user._id) },
      {
        $set: {
          name,
          email: email.toLowerCase(),
          "preferences.lowStockThreshold": lowStockThreshold || 10,
          updatedAt: new Date()
        }
      }
    )

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
    })
  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    )
  }
}
