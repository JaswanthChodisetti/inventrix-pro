import { NextRequest, NextResponse } from "next/server"
import { getDatabase, COLLECTIONS } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getCurrentUserFromRequest, requireEditOrAbove } from "@/lib/api-auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = await getDatabase()

    const product = await db
      .collection(COLLECTIONS.PRODUCTS)
      .aggregate([
        { $match: { _id: new ObjectId(id) } },
        {
          $lookup: {
            from: COLLECTIONS.CATEGORIES,
            localField: "categoryId",
            foreignField: "_id",
            as: "category",
          },
        },
        { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      ])
      .toArray()

    if (!product.length) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: product[0] })
  } catch (error) {
    console.error("Product fetch error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch product" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserFromRequest()

    // Require edit permissions to update products
    const authError = requireEditOrAbove(user)
    if (authError) return authError

    const { id } = await params
    const db = await getDatabase()
    const body = await request.json()

    // Convert string values to numbers
    const currentStock = Number(body.currentStock) || 0
    const minStockThreshold = Number(body.minStockThreshold) || 0
    const maxStockThreshold = Number(body.maxStockThreshold) || 0
    const price = Number(body.price) || 0
    const cost = Number(body.cost) || 0

    const updateData = {
      name: body.name,
      sku: body.sku,
      description: body.description,
      categoryId: body.categoryId ? new ObjectId(body.categoryId) : undefined,
      price,
      cost,
      currentStock,
      minStockThreshold,
      maxStockThreshold,
      unit: body.unit,
      location: body.location,
      supplier: body.supplier || "",
      barcode: body.barcode || "",
      images: body.images || [],
      tags: body.tags || [],
      status: calculateStatus(currentStock, minStockThreshold, maxStockThreshold),
      updatedAt: new Date(),
    }

    // Remove undefined values
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    )

    const result = await db
      .collection(COLLECTIONS.PRODUCTS)
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: "after" }
      )

    if (!result) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("Product update error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update product" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserFromRequest()

    // Require edit permissions to delete products
    const authError = requireEditOrAbove(user)
    if (authError) return authError

    const { id } = await params
    const db = await getDatabase()

    const result = await db
      .collection(COLLECTIONS.PRODUCTS)
      .deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, message: "Product deleted" })
  } catch (error) {
    console.error("Product delete error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete product" },
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
