import { NextRequest, NextResponse } from "next/server"
import { getDatabase, COLLECTIONS } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase()
    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "json"

    const products = await db
      .collection(COLLECTIONS.PRODUCTS)
      .aggregate([
        {
          $lookup: {
            from: COLLECTIONS.CATEGORIES,
            localField: "categoryId",
            foreignField: "_id",
            as: "category",
          },
        },
        { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
        { $sort: { createdAt: -1 } },
      ])
      .toArray()

    if (format === "csv") {
      const headers = [
        "SKU",
        "Name",
        "Category",
        "Price",
        "Cost",
        "Current Stock",
        "Status",
        "Location",
        "Supplier",
      ]

      const rows = products.map((p) => [
        p.sku,
        `"${p.name.replace(/"/g, '""')}"`,
        p.category?.name || "Uncategorized",
        p.price,
        p.cost,
        p.currentStock,
        p.status,
        `"${(p.location || "").replace(/"/g, '""')}"`,
        `"${(p.supplier || "").replace(/"/g, '""')}"`,
      ])

      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="products-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: products,
      exportedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Products export error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to export products" },
      { status: 500 }
    )
  }
}
