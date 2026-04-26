import { NextRequest, NextResponse } from "next/server"
import { getDatabase, COLLECTIONS } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// Bulk create/update products
export async function POST(request: NextRequest) {
  try {
    const db = await getDatabase()
    const body = await request.json()
    const { products } = body

    if (!products || !Array.isArray(products)) {
      return NextResponse.json(
        { success: false, error: "Products array is required" },
        { status: 400 }
      )
    }

    const operations = products.map((product: Record<string, unknown>) => {
      const status = calculateStatus(
        product.currentStock as number,
        product.minStockThreshold as number,
        product.maxStockThreshold as number
      )

      return {
        updateOne: {
          filter: { sku: product.sku },
          update: {
            $set: {
              ...product,
              categoryId: product.categoryId ? new ObjectId(product.categoryId as string) : undefined,
              status,
              updatedAt: new Date(),
            },
            $setOnInsert: {
              createdAt: new Date(),
            },
          },
          upsert: true,
        },
      }
    })

    const result = await db.collection(COLLECTIONS.PRODUCTS).bulkWrite(operations)

    return NextResponse.json({
      success: true,
      data: {
        inserted: result.upsertedCount,
        modified: result.modifiedCount,
        matched: result.matchedCount,
      },
    })
  } catch (error) {
    console.error("Bulk products error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to bulk update products" },
      { status: 500 }
    )
  }
}

// Bulk delete products
export async function DELETE(request: NextRequest) {
  try {
    const db = await getDatabase()
    const body = await request.json()
    const { productIds } = body

    if (!productIds || !Array.isArray(productIds)) {
      return NextResponse.json(
        { success: false, error: "Product IDs array is required" },
        { status: 400 }
      )
    }

    const objectIds = productIds.map((id: string) => new ObjectId(id))

    const result = await db
      .collection(COLLECTIONS.PRODUCTS)
      .deleteMany({ _id: { $in: objectIds } })

    return NextResponse.json({
      success: true,
      data: {
        deleted: result.deletedCount,
      },
    })
  } catch (error) {
    console.error("Bulk delete error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to bulk delete products" },
      { status: 500 }
    )
  }
}

function calculateStatus(
  currentStock: number,
  minThreshold: number,
  maxThreshold: number
): string {
  if (currentStock <= 0) return "out_of_stock"
  if (currentStock <= minThreshold) return "low_stock"
  if (currentStock >= maxThreshold) return "overstocked"
  return "in_stock"
}
