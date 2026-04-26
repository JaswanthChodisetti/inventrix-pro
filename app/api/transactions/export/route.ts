import { NextRequest, NextResponse } from "next/server"
import { getDatabase, COLLECTIONS } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase()
    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "json"
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const query: Record<string, unknown> = {}
    
    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) {
        (query.createdAt as Record<string, Date>).$gte = new Date(startDate)
      }
      if (endDate) {
        (query.createdAt as Record<string, Date>).$lte = new Date(endDate)
      }
    }

    const transactions = await db
      .collection(COLLECTIONS.TRANSACTIONS)
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()

    if (format === "csv") {
      const headers = [
        "Date",
        "SKU",
        "Product",
        "Type",
        "Quantity",
        "Previous Stock",
        "New Stock",
        "Reason",
        "Reference",
        "User",
        "Notes",
      ]

      const rows = transactions.map((t) => [
        new Date(t.createdAt).toISOString(),
        t.sku,
        `"${t.productName.replace(/"/g, '""')}"`,
        t.type,
        t.quantity,
        t.previousStock,
        t.newStock,
        t.reason,
        t.reference || "",
        t.userName || "",
        `"${(t.notes || "").replace(/"/g, '""')}"`,
      ])

      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="transactions-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: transactions,
      exportedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Transactions export error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to export transactions" },
      { status: 500 }
    )
  }
}
