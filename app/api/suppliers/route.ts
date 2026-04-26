import { NextRequest, NextResponse } from "next/server"
import { getDatabase, COLLECTIONS } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET() {
  try {
    const db = await getDatabase()
    
    // Get unique suppliers from products
    const suppliers = await db
      .collection(COLLECTIONS.PRODUCTS)
      .aggregate([
        {
          $group: {
            _id: "$supplier",
            productCount: { $sum: 1 },
            totalValue: { $sum: { $multiply: ["$price", "$currentStock"] } },
          },
        },
        { $sort: { productCount: -1 } },
      ])
      .toArray()

    return NextResponse.json({
      success: true,
      data: suppliers.map((s) => ({
        name: s._id,
        productCount: s.productCount,
        totalValue: s.totalValue,
      })),
    })
  } catch (error) {
    console.error("Suppliers fetch error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch suppliers" },
      { status: 500 }
    )
  }
}
