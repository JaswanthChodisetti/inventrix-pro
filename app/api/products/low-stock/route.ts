import { NextResponse } from "next/server"
import { getDatabase, COLLECTIONS } from "@/lib/mongodb"

export async function GET() {
  try {
    const db = await getDatabase()

    const lowStockProducts = await db
      .collection(COLLECTIONS.PRODUCTS)
      .aggregate([
        {
          $match: {
            $or: [{ status: "low_stock" }, { status: "out_of_stock" }],
          },
        },
        {
          $lookup: {
            from: COLLECTIONS.CATEGORIES,
            localField: "categoryId",
            foreignField: "_id",
            as: "category",
          },
        },
        { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            sku: 1,
            name: 1,
            currentStock: 1,
            minStockThreshold: 1,
            status: 1,
            price: 1,
            supplier: 1,
            category: {
              name: "$category.name",
              color: "$category.color",
            },
          },
        },
        { $sort: { currentStock: 1 } },
      ])
      .toArray()

    return NextResponse.json({
      success: true,
      data: lowStockProducts,
      count: lowStockProducts.length,
    })
  } catch (error) {
    console.error("Low stock fetch error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch low stock products" },
      { status: 500 }
    )
  }
}
