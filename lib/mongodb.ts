import { MongoClient, Db } from "mongodb"

const uri = process.env.MONGODB_URI

if (!uri) {
  console.warn("MONGODB_URI not found - database features will be unavailable")
}

const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  retryReads: true,
}

let client: MongoClient | null = null
let clientPromise: Promise<MongoClient> | null = null

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

function getClientPromise(): Promise<MongoClient> {
  if (!uri) {
    return Promise.reject(new Error("MONGODB_URI environment variable is not set"))
  }

  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options)
      global._mongoClientPromise = client.connect()
    }
    return global._mongoClientPromise
  }

  if (!clientPromise) {
    client = new MongoClient(uri, options)
    clientPromise = client.connect()
  }
  return clientPromise
}

export default getClientPromise

export async function getDatabase(): Promise<Db> {
  try {
    const mongoClient = await getClientPromise()
    return mongoClient.db("inventrix_pro")
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error)
    throw new Error("Database connection failed. Is MongoDB running?")
  }
}

export async function checkConnection(): Promise<{ connected: boolean; error?: string }> {
  try {
    if (!uri) {
      return { connected: false, error: "MONGODB_URI is not configured" }
    }
    const mongoClient = await getClientPromise()
    await mongoClient.db("admin").command({ ping: 1 })
    return { connected: true }
  } catch (error) {
    return { 
      connected: false, 
      error: error instanceof Error ? error.message : "Unknown connection error" 
    }
  }
}

// Collection names
export const COLLECTIONS = {
  USERS: "users",
  PRODUCTS: "products",
  TRANSACTIONS: "transactions",
  CATEGORIES: "categories",
  NOTIFICATIONS: "notifications",
} as const

// Additional collections for auth features
export const ADDITIONAL_COLLECTIONS = {
  PASSWORD_RESETS: "passwordResets",
  SESSIONS: "sessions",
} as const
