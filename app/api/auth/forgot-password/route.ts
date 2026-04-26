import { NextResponse } from "next/server"
import { createPasswordReset } from "@/lib/auth"
import { sendPasswordResetEmail } from "@/lib/email"
import { getDatabase, COLLECTIONS } from "@/lib/mongodb"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    // Validation
    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      )
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      )
    }

    // Check if email exists in database
    const db = await getDatabase()
    const existingUser = await db.collection(COLLECTIONS.USERS).findOne({ email: email.toLowerCase() })

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: "No account found with this email address" },
        { status: 404 }
      )
    }

    // Create password reset request
    const result = await createPasswordReset(email)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    // Send password reset email
    if (result.token && result.userName) {
      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${result.token}`
      await sendPasswordResetEmail(email, resetUrl, result.userName)
      console.log("Password reset email sent to:", email)
    }

    return NextResponse.json({
      success: true,
      message: "Password reset link has been sent to your email.",
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to process request. Please try again." },
      { status: 500 }
    )
  }
}
