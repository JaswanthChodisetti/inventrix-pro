import { NextResponse } from "next/server"
import { getCurrentUser, hashPassword, verifyPassword } from "@/lib/auth"
import { getDatabase, COLLECTIONS } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function PUT(request: Request) {
  try {
    // Get current user
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { currentPassword, newPassword } = await request.json()

    // Validation
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Current and new password are required" },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters" },
        { status: 400 }
      )
    }

    const db = await getDatabase()

    // Get user with password - convert string _id to ObjectId
    let userId: ObjectId;
    try {
      userId = new ObjectId(user._id)
    } catch (e) {
      console.error("Invalid ObjectId:", user._id, e)
      return NextResponse.json(
        { success: false, error: "Invalid user ID" },
        { status: 500 }
      )
    }

    const userDoc = await db.collection(COLLECTIONS.USERS).findOne({
      _id: userId,
    })

    if (!userDoc) {
      console.error("User document not found for ID:", user._id, "userId:", userId.toString())
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    // Verify current password
    const isValid = await verifyPassword(currentPassword, userDoc.password)
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Current password is incorrect" },
        { status: 401 }
      )
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword)

    // Update password
    await db.collection(COLLECTIONS.USERS).updateOne(
      { _id: userId },
      { $set: { password: hashedPassword, updatedAt: new Date() } }
    )

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    })
  } catch (error) {
    console.error("Change password error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to change password" },
      { status: 500 }
    )
  }
}
