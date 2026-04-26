import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { deleteSession, SESSION_COOKIE_NAME } from "@/lib/auth"

export async function POST() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value

    if (sessionToken) {
      // Delete session from database
      await deleteSession(sessionToken)
    }

    // Clear the session cookie
    cookieStore.delete(SESSION_COOKIE_NAME)
    // Clear the user role cookie
    cookieStore.delete("user_role")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Logout error:", error)
    // Even if there's an error, clear the cookie
    const cookieStore = await cookies()
    cookieStore.delete(SESSION_COOKIE_NAME)
    
    return NextResponse.json({ success: true })
  }
}
