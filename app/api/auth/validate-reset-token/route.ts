import { NextResponse } from "next/server"
import { validateResetToken } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json(
        { valid: false },
        { status: 400 }
      )
    }

    const isValid = await validateResetToken(token)

    return NextResponse.json({ valid: isValid })
  } catch (error) {
    console.error("Validate token error:", error)
    return NextResponse.json(
      { valid: false },
      { status: 500 }
    )
  }
}
