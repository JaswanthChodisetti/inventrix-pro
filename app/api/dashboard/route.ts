import { NextResponse } from "next/server"
import { getDatabase, COLLECTIONS } from "@/lib/mongodb"

export async function GET() {
  try {
    const db = await getDatabase()

    // Get products stats
    const products = await db.collection(COLLECTIONS.PRODUCTS).find().toArray()
    const totalProducts = products.length
    const totalValue = products.reduce(
      (acc, p) => acc + p.price * p.currentStock,
      0
    )
    const lowStockCount = products.filter((p) => p.status === "low_stock").length
    const outOfStockCount = products.filter(
      (p) => p.status === "out_of_stock"
    ).length

    // Get categories count
    const totalCategories = await db
      .collection(COLLECTIONS.CATEGORIES)
      .countDocuments()

    // Get recent transactions (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recentTransactions = await db
      .collection(COLLECTIONS.TRANSACTIONS)
      .countDocuments({ createdAt: { $gte: sevenDaysAgo } })

    // Calculate inventory health (0-100)
    const healthyProducts = products.filter(
      (p) => p.status === "in_stock"
    ).length
    const inventoryHealth =
      totalProducts > 0 ? Math.round((healthyProducts / totalProducts) * 100) : 100

    // Get category breakdown
    const categoryBreakdown = await db
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
        {
          $group: {
            _id: "$category.name",
            count: { $sum: 1 },
            value: { $sum: { $multiply: ["$price", "$currentStock"] } },
            color: { $first: "$category.color" },
          },
        },
        { $sort: { value: -1 } },
      ])
      .toArray()

    // Get stock trends (last 14 days)
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    const stockTrends = await db
      .collection(COLLECTIONS.TRANSACTIONS)
      .aggregate([
        { $match: { createdAt: { $gte: fourteenDaysAgo } } },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              type: "$type",
            },
            total: { $sum: "$quantity" },
          },
        },
        { $sort: { "_id.date": 1 } },
      ])
      .toArray()

    // Format stock trends
    const trendMap: Record<string, { stockIn: number; stockOut: number }> = {}
    stockTrends.forEach((t) => {
      const date = t._id.date
      if (!trendMap[date]) {
        trendMap[date] = { stockIn: 0, stockOut: 0 }
      }
      if (t._id.type === "IN") {
        trendMap[date].stockIn = t.total
      } else {
        trendMap[date].stockOut = t.total
      }
    })

    const formattedTrends = Object.entries(trendMap)
      .map(([date, data]) => ({
        date,
        stockIn: data.stockIn,
        stockOut: data.stockOut,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Get low stock products
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
        { $sort: { currentStock: 1 } },
        { $limit: 10 },
      ])
      .toArray()

    // Get recent activity
    const recentActivity = await db
      .collection(COLLECTIONS.TRANSACTIONS)
      .find()
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray()

    // Get top moving products
    const topProducts = await db
      .collection(COLLECTIONS.TRANSACTIONS)
      .aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: "$productId",
            productName: { $first: "$productName" },
            sku: { $first: "$sku" },
            totalMovement: { $sum: "$quantity" },
            transactions: { $sum: 1 },
          },
        },
        { $sort: { totalMovement: -1 } },
        { $limit: 5 },
      ])
      .toArray()

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalProducts,
          totalValue,
          lowStockCount,
          outOfStockCount,
          totalCategories,
          recentTransactions,
          inventoryHealth,
        },
        categoryBreakdown: categoryBreakdown.map((c) => ({
          name: c._id || "Uncategorized",
          value: c.count,
          totalValue: c.value,
          color: c.color || "#6B7280",
        })),
        stockTrends: formattedTrends,
        lowStockProducts,
        recentActivity,
        topProducts,
      },
    })
  } catch (error) {
    console.error("Dashboard fetch error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard data" },
      { status: 500 }
    )
  }
}
