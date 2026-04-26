import { NextRequest, NextResponse } from "next/server"
import { getDatabase, COLLECTIONS } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getCurrentUserFromRequest, requireEditOrAbove } from "@/lib/api-auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await getDatabase()
    const { id } = await params

    const category = await db
      .collection(COLLECTIONS.CATEGORIES)
      .aggregate([
        { $match: { _id: new ObjectId(id) } },
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
      ])
      .toArray()

    if (!category.length) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: category[0] })
  } catch (error) {
    console.error("Category fetch error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch category" },
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

    // Require edit permissions to update categories
    const authError = requireEditOrAbove(user)
    if (authError) return authError

    const db = await getDatabase()
    const { id } = await params
    const body = await request.json()

    const result = await db.collection(COLLECTIONS.CATEGORIES).updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...body,
          updatedAt: new Date(),
        },
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, message: "Category updated" })
  } catch (error) {
    console.error("Category update error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update category" },
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

    // Require edit permissions to delete categories
    const authError = requireEditOrAbove(user)
    if (authError) return authError

    const db = await getDatabase()
    const { id } = await params

    // Check if category has products
    const productCount = await db
      .collection(COLLECTIONS.PRODUCTS)
      .countDocuments({ categoryId: new ObjectId(id) })

    if (productCount > 0) {
      return NextResponse.json(
        { success: false, error: "Cannot delete category with products. Move or delete products first." },
        { status: 400 }
      )
    }

    const result = await db
      .collection(COLLECTIONS.CATEGORIES)
      .deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, message: "Category deleted" })
  } catch (error) {
    console.error("Category delete error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete category" },
      { status: 500 }
    )
  }
}
