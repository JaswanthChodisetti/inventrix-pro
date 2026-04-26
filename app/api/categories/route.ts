import { NextRequest, NextResponse } from "next/server"
import { getDatabase, COLLECTIONS } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getCurrentUserFromRequest, requireEditOrAbove } from "@/lib/api-auth"

export async function GET() {
  try {
    const db = await getDatabase()

    const categories = await db
      .collection(COLLECTIONS.CATEGORIES)
      .aggregate([
        {
          $lookup: {
            from: COLLECTIONS.PRODUCTS,
            localField: "_id",
            foreignField: "categoryId",
            as: "products",
          },
        },
        {
          $addFields: {
            productCount: { $size: "$products" },
          },
        },
        {
          $project: {
            products: 0,
          },
        },
        { $sort: { name: 1 } },
      ])
      .toArray()

    return NextResponse.json({ success: true, data: categories })
  } catch (error) {
    console.error("Categories fetch error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch categories" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest()

    // Require edit permissions to create categories
    const authError = requireEditOrAbove(user)
    if (authError) return authError

    const db = await getDatabase()
    const body = await request.json()

    const category = {
      ...body,
      createdAt: new Date(),
    }

    const result = await db.collection(COLLECTIONS.CATEGORIES).insertOne(category)

    return NextResponse.json({
      success: true,
      data: { ...category, _id: result.insertedId },
    })
  } catch (error) {
    console.error("Category create error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create category" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest()

    // Require edit permissions to delete categories
    const authError = requireEditOrAbove(user)
    if (authError) return authError

    const db = await getDatabase()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Category ID required" },
        { status: 400 }
      )
    }

    // Check if category has products
    const productCount = await db
      .collection(COLLECTIONS.PRODUCTS)
      .countDocuments({ categoryId: new ObjectId(id) })

    if (productCount > 0) {
      return NextResponse.json(
        { success: false, error: "Cannot delete category with products" },
        { status: 400 }
      )
    }

    await db.collection(COLLECTIONS.CATEGORIES).deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({ success: true, message: "Category deleted" })
  } catch (error) {
    console.error("Category delete error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete category" },
      { status: 500 }
    )
  }
}
