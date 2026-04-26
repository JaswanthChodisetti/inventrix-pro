import { NextResponse } from "next/server"
import { checkConnection } from "@/lib/mongodb"

export async function GET() {
  const status = await checkConnection()

  return NextResponse.json({
    success: status.connected,
    database: status.connected ? "connected" : "disconnected",
    error: status.error,
    timestamp: new Date().toISOString(),
  })
}
