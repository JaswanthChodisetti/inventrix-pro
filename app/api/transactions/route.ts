import { NextRequest, NextResponse } from "next/server"
import { getDatabase, COLLECTIONS } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getCurrentUserFromRequest, requireEditOrAbove } from "@/lib/api-auth"

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase()
    const { searchParams } = new URL(request.url)

    const type = searchParams.get("type") || ""
    const productId = searchParams.get("productId") || ""
    const startDate = searchParams.get("startDate") || ""
    const endDate = searchParams.get("endDate") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    const query: Record<string, unknown> = {}

    if (type && type !== "all") {
      query.type = type
    }

    if (productId) {
      query.productId = new ObjectId(productId)
    }

    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) {
        (query.createdAt as Record<string, Date>).$gte = new Date(startDate)
      }
      if (endDate) {
        (query.createdAt as Record<string, Date>).$lte = new Date(endDate)
      }
    }

    const skip = (page - 1) * limit

    const transactions = await db
      .collection(COLLECTIONS.TRANSACTIONS)
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    const total = await db
      .collection(COLLECTIONS.TRANSACTIONS)
      .countDocuments(query)

    return NextResponse.json({
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Transactions fetch error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch transactions" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest()

    // Require edit permissions to create transactions
    const authError = requireEditOrAbove(user)
    if (authError) return authError

    const db = await getDatabase()
    const body = await request.json()

    // Get product
    const product = await db
      .collection(COLLECTIONS.PRODUCTS)
      .findOne({ _id: new ObjectId(body.productId) })

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      )
    }

    const previousStock = product.currentStock
    const newStock =
      body.type === "IN"
        ? previousStock + body.quantity
        : Math.max(0, previousStock - body.quantity)

    // Create transaction
    const transaction = {
      productId: new ObjectId(body.productId),
      sku: product.sku,
      productName: product.name,
      type: body.type,
      quantity: body.quantity,
      reason: body.reason,
      reference: body.reference || `TXN-${Date.now()}`,
      previousStock,
      newStock,
      userName: body.userName || "System",
      notes: body.notes || "",
      createdAt: new Date(),
    }

    await db.collection(COLLECTIONS.TRANSACTIONS).insertOne(transaction)

    // Update product stock
    const status = calculateStatus(
      newStock,
      product.minStockThreshold,
      product.maxStockThreshold
    )

    await db.collection(COLLECTIONS.PRODUCTS).updateOne(
      { _id: new ObjectId(body.productId) },
      {
        $set: {
          currentStock: newStock,
          status,
          updatedAt: new Date(),
        },
      }
    )

    // Create notification if low stock
    if (status === "low_stock" || status === "out_of_stock") {
      await db.collection(COLLECTIONS.NOTIFICATIONS).insertOne({
        title: status === "out_of_stock" ? "Out of Stock Alert" : "Low Stock Alert",
        message: `${product.name} is ${status === "out_of_stock" ? "out of stock" : `running low (${newStock} remaining)`}`,
        type: "stock_alert",
        read: false,
        data: { productId: product._id, sku: product.sku },
        createdAt: new Date(),
      })
    }

    return NextResponse.json({
      success: true,
      data: transaction,
    })
  } catch (error) {
    console.error("Transaction create error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create transaction" },
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
