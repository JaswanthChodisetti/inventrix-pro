import { NextRequest, NextResponse } from "next/server"
import { getDatabase, COLLECTIONS } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getCurrentUserFromRequest, requireEditOrAbove } from "@/lib/api-auth"

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase()
    const { searchParams } = new URL(request.url)
    
    const search = searchParams.get("search") || ""
    const category = searchParams.get("category") || ""
    const status = searchParams.get("status") || ""
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")

    const query: Record<string, unknown> = {}

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ]
    }

    if (category && category !== "all") {
      query.categoryId = new ObjectId(category)
    }

    if (status && status !== "all") {
      query.status = status
    }

    const skip = (page - 1) * limit

    const products = await db
      .collection(COLLECTIONS.PRODUCTS)
      .aggregate([
        { $match: query },
        {
          $lookup: {
            from: COLLECTIONS.CATEGORIES,
            localField: "categoryId",
            foreignField: "_id",
            as: "category",
          },
        },
        { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
        { $sort: { [sortBy]: sortOrder } },
        { $skip: skip },
        { $limit: limit },
      ])
      .toArray()

    const total = await db.collection(COLLECTIONS.PRODUCTS).countDocuments(query)

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Products fetch error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest()

    // Require edit permissions to create products
    const authError = requireEditOrAbove(user)
    if (authError) return authError

    const db = await getDatabase()
    const body = await request.json()

    // Convert string values to numbers
    const currentStock = Number(body.currentStock) || 0
    const minStockThreshold = Number(body.minStockThreshold) || 0
    const maxStockThreshold = Number(body.maxStockThreshold) || 0
    const price = Number(body.price) || 0
    const cost = Number(body.cost) || 0

    // Validate categoryId
    if (!body.categoryId) {
      return NextResponse.json(
        { success: false, error: "Category is required" },
        { status: 400 }
      )
    }

    const product = {
      name: body.name,
      sku: body.sku,
      description: body.description,
      categoryId: new ObjectId(body.categoryId),
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
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection(COLLECTIONS.PRODUCTS).insertOne(product)

    return NextResponse.json({
      success: true,
      data: { ...product, _id: result.insertedId },
    })
  } catch (error) {
    console.error("Product create error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create product" },
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
