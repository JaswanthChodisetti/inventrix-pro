import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getSessionFromToken, SESSION_COOKIE_NAME, SessionUser } from "@/lib/auth"
import { getDatabase, COLLECTIONS } from "@/lib/mongodb"

export interface AuthenticatedRequest {
  user: SessionUser
}

export async function getCurrentUserFromRequest(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value

    if (!sessionToken) {
      return null
    }

    const session = await getSessionFromToken(sessionToken)
    if (!session) {
      return null
    }

    const db = await getDatabase()
    const user = await db.collection(COLLECTIONS.USERS).findOne({
      _id: session.userId,
    })

    if (!user) {
      return null
    }

    return {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    }
  } catch {
    return null
  }
}

export function requireAuth(user: SessionUser | null) {
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized - Please sign in" },
      { status: 401 }
    )
  }
  return null
}

export function requireRole(
  user: SessionUser | null,
  allowedRoles: ("admin" | "manager" | "viewer")[]
) {
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized - Please sign in" },
      { status: 401 }
    )
  }

  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json(
      { success: false, error: "Forbidden - Insufficient permissions" },
      { status: 403 }
    )
  }

  return null
}

export function requireAdmin(user: SessionUser | null) {
  return requireRole(user, ["admin"])
}

export function requireEditOrAbove(user: SessionUser | null) {
  return requireRole(user, ["admin", "manager"])
}
