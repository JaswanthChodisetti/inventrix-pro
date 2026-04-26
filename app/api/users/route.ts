import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getDatabase, COLLECTIONS } from "@/lib/mongodb"
import { getSessionFromToken, SESSION_COOKIE_NAME, canManageUsers } from "@/lib/auth"
import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"

// GET - List all users (admin only)
export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const session = await getSessionFromToken(sessionToken)
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Invalid session" },
        { status: 401 }
      )
    }

    const db = await getDatabase()
    const user = await db.collection(COLLECTIONS.USERS).findOne({
      _id: session.userId,
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    // Check if user has admin role
    if (!canManageUsers({ role: user.role })) {
      return NextResponse.json(
        { success: false, error: "Forbidden - Admin access required" },
        { status: 403 }
      )
    }

    // Get all users (without password)
    const users = await db
      .collection(COLLECTIONS.USERS)
      .find({}, { projection: { password: 0 } })
      .toArray()

    return NextResponse.json({
      success: true,
      data: users.map((u) => ({
        ...u,
        _id: u._id.toString(),
      })),
    })
  } catch (error) {
    console.error("Get users error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch users" },
      { status: 500 }
    )
  }
}

// PUT - Update user role (admin only)
export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const session = await getSessionFromToken(sessionToken)
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Invalid session" },
        { status: 401 }
      )
    }

    const db = await getDatabase()
    const currentUser = await db.collection(COLLECTIONS.USERS).findOne({
      _id: session.userId,
    })

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    // Check if user has admin role
    if (!canManageUsers({ role: currentUser.role })) {
      return NextResponse.json(
        { success: false, error: "Forbidden - Admin access required" },
        { status: 403 }
      )
    }

    const { userId, role } = await request.json()

    // Validate role
    if (!role || !["admin", "manager", "viewer"].includes(role)) {
      return NextResponse.json(
        { success: false, error: "Invalid role" },
        { status: 400 }
      )
    }

    // Prevent self-demotion from admin
    if (String(session.userId) === userId && role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Cannot change your own admin role" },
        { status: 400 }
      )
    }

    // Update user role
    const result = await db.collection(COLLECTIONS.USERS).updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          role,
          updatedAt: new Date(),
        },
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `User role updated to ${role}`,
    })
  } catch (error) {
    console.error("Update user error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update user" },
      { status: 500 }
    )
  }
}

// POST - Create a new user with specified role (admin only)
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const session = await getSessionFromToken(sessionToken)
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Invalid session" },
        { status: 401 }
      )
    }

    const db = await getDatabase()
    const currentUser = await db.collection(COLLECTIONS.USERS).findOne({
      _id: session.userId,
    })

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    // Check if user has admin role
    if (!canManageUsers({ role: currentUser.role })) {
      return NextResponse.json(
        { success: false, error: "Forbidden - Admin access required" },
        { status: 403 }
      )
    }

    const { name, email, password, role = "viewer" } = await request.json()

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Name, email, and password are required" },
        { status: 400 }
      )
    }

    // Validate role
    if (!["admin", "manager", "viewer"].includes(role)) {
      return NextResponse.json(
        { success: false, error: "Invalid role" },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await db
      .collection(COLLECTIONS.USERS)
      .findOne({ email: email.toLowerCase() })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Email already registered" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const newUser = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      preferences: {
        theme: "system" as const,
        currency: "USD",
        lowStockThreshold: 10,
        notifications: {
          email: true,
          push: true,
          desktop: true,
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection(COLLECTIONS.USERS).insertOne(newUser)

    return NextResponse.json(
      {
        success: true,
        message: "User created successfully",
        user: {
          _id: result.insertedId.toString(),
          name,
          email: email.toLowerCase(),
          role,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Create user error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create user" },
      { status: 500 }
    )
  }
}
