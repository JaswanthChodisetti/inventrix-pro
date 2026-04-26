import { cookies } from "next/headers"
import { getDatabase, COLLECTIONS } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { User } from "@/lib/types"

const SESSION_COOKIE_NAME = "inventrix_session"
const SESSION_EXPIRY_DAYS = 7

export interface SessionUser {
  _id: string
  name: string
  email: string
  role: "admin" | "manager" | "viewer"
  avatar?: string
}

// Permission check helpers
export function canEdit(user: SessionUser | null): boolean {
  return user?.role === "admin" || user?.role === "manager"
}

export function canDelete(user: SessionUser | null): boolean {
  return user?.role === "admin" || user?.role === "manager"
}

export function canManageUsers(user: SessionUser | null): boolean {
  return user?.role === "admin"
}

export function canEditStock(user: SessionUser | null): boolean {
  return user?.role === "admin" || user?.role === "manager"
}

export interface Session {
  _id?: ObjectId
  userId: ObjectId
  token: string
  expiresAt: Date
  createdAt: Date
}

// Generate a random session token
function generateSessionToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let token = ""
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// Create a new session for user
export async function createSession(userId: ObjectId): Promise<string> {
  const db = await getDatabase()
  const token = generateSessionToken()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS)

  // Remove any existing sessions for this user
  await db.collection("sessions").deleteMany({ userId })

  // Create new session
  await db.collection("sessions").insertOne({
    userId,
    token,
    expiresAt,
    createdAt: new Date(),
  })

  return token
}

// Get session from token
export async function getSessionFromToken(token: string): Promise<Session | null> {
  const db = await getDatabase()
  const session = await db.collection("sessions").findOne({
    token,
    expiresAt: { $gt: new Date() },
  })
  return session as Session | null
}

// Get current user from session cookie
export async function getCurrentUser(): Promise<SessionUser | null> {
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
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

// Delete session (logout)
export async function deleteSession(token: string): Promise<void> {
  const db = await getDatabase()
  await db.collection("sessions").deleteOne({ token })
}

// Generate password reset token
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

// Hash reset token
function hashResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex")
}

// Create password reset request
export async function createPasswordReset(
  email: string
): Promise<{ success: boolean; error?: string; token?: string; userName?: string }> {
  try {
    const db = await getDatabase()

    // Find user by email
    const user = await db.collection(COLLECTIONS.USERS).findOne({ email: email.toLowerCase() })
    if (!user) {
      // Don't reveal if email exists
      return { success: true }
    }

    // Delete any existing reset tokens for this user
    await db.collection("passwordResets").deleteMany({ userId: user._id })

    // Generate and hash token
    const token = generateResetToken()
    const hashedToken = hashResetToken(token)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1) // 1 hour expiry

    // Save reset request
    await db.collection("passwordResets").insertOne({
      userId: user._id,
      token: hashedToken,
      expiresAt,
      createdAt: new Date(),
    })

    return { success: true, token, userName: user.name }
  } catch (error) {
    console.error("Password reset error:", error)
    return { success: false, error: "Failed to create reset request" }
  }
}

// Validate reset token and reset password
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDatabase()

    // Hash the provided token
    const hashedToken = hashResetToken(token)

    // Find valid reset request
    const resetRequest = await db.collection("passwordResets").findOne({
      token: hashedToken,
      expiresAt: { $gt: new Date() },
    })

    if (!resetRequest) {
      return { success: false, error: "Invalid or expired reset token" }
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword)

    // Update user password
    await db.collection(COLLECTIONS.USERS).updateOne(
      { _id: resetRequest.userId },
      { $set: { password: hashedPassword, updatedAt: new Date() } }
    )

    // Delete all reset tokens for this user
    await db.collection("passwordResets").deleteMany({ userId: resetRequest.userId })

    return { success: true }
  } catch (error) {
    console.error("Reset password error:", error)
    return { success: false, error: "Failed to reset password" }
  }
}

// Validate reset token (for checking if token is valid before showing form)
export async function validateResetToken(token: string): Promise<boolean> {
  try {
    const db = await getDatabase()
    const hashedToken = hashResetToken(token)

    const resetRequest = await db.collection("passwordResets").findOne({
      token: hashedToken,
      expiresAt: { $gt: new Date() },
    })

    return !!resetRequest
  } catch (error) {
    return false
  }
}

// Register new user
export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: SessionUser }> {
  try {
    const db = await getDatabase()

    // Check if user already exists
    const existingUser = await db.collection(COLLECTIONS.USERS).findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return { success: false, error: "Email already registered" }
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const newUser: Omit<User, "_id"> = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "viewer", // Default role for new users
      preferences: {
        theme: "system",
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

    return {
      success: true,
      user: {
        _id: result.insertedId.toString(),
        name,
        email: email.toLowerCase(),
        role: "viewer",
      },
    }
  } catch (error) {
    console.error("Registration error:", error)
    return { success: false, error: "Registration failed" }
  }
}

// Login user
export async function loginUser(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: SessionUser; token?: string }> {
  try {
    const db = await getDatabase()

    // Find user
    const user = await db.collection(COLLECTIONS.USERS).findOne({ email: email.toLowerCase() })
    if (!user) {
      return { success: false, error: "Invalid email or password" }
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      return { success: false, error: "Invalid email or password" }
    }

    // Create session
    const token = await createSession(user._id)

    return {
      success: true,
      token,
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    }
  } catch (error) {
    console.error("Login error:", error)
    return { success: false, error: "Login failed" }
  }
}

export { SESSION_COOKIE_NAME }
