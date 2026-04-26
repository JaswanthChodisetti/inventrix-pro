import { NextRequest, NextResponse } from "next/server"
import { getDatabase, COLLECTIONS } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase()
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get("type") || "overview"
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const dateFilter: Record<string, Date> = {}
    if (startDate) {
      dateFilter.$gte = new Date(startDate)
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate)
    }

    switch (type) {
      case "stock-summary": {
        const products = await db.collection(COLLECTIONS.PRODUCTS).find().toArray()
        
        const totalProducts = products.length
        const totalStock = products.reduce((acc, p) => acc + p.currentStock, 0)
        const totalValue = products.reduce((acc, p) => acc + (p.price * p.currentStock), 0)
        const totalCost = products.reduce((acc, p) => acc + (p.cost * p.currentStock), 0)
        const potentialProfit = totalValue - totalCost
        
        const statusBreakdown = {
          inStock: products.filter(p => p.status === "in_stock").length,
          lowStock: products.filter(p => p.status === "low_stock").length,
          outOfStock: products.filter(p => p.status === "out_of_stock").length,
        }

        return NextResponse.json({
          success: true,
          data: {
            totalProducts,
            totalStock,
            totalValue,
            totalCost,
            potentialProfit,
            profitMargin: totalValue > 0 ? ((potentialProfit / totalValue) * 100).toFixed(2) : 0,
            statusBreakdown,
          },
        })
      }

      case "category-breakdown": {
        const breakdown = await db
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
                productCount: { $sum: 1 },
                totalStock: { $sum: "$currentStock" },
                totalValue: { $sum: { $multiply: ["$price", "$currentStock"] } },
                avgPrice: { $avg: "$price" },
                color: { $first: "$category.color" },
              },
            },
            { $sort: { totalValue: -1 } },
          ])
          .toArray()

        return NextResponse.json({
          success: true,
          data: breakdown.map((b) => ({
            category: b._id || "Uncategorized",
            productCount: b.productCount,
            totalStock: b.totalStock,
            totalValue: b.totalValue,
            avgPrice: b.avgPrice,
            color: b.color || "#6B7280",
          })),
        })
      }

      case "movement-trends": {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const trends = await db
          .collection(COLLECTIONS.TRANSACTIONS)
          .aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            {
              $group: {
                _id: {
                  date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                  type: "$type",
                },
                total: { $sum: "$quantity" },
                count: { $sum: 1 },
              },
            },
            { $sort: { "_id.date": 1 } },
          ])
          .toArray()

        const trendMap: Record<string, { date: string; stockIn: number; stockOut: number; inCount: number; outCount: number }> = {}
        
        trends.forEach((t) => {
          const date = t._id.date
          if (!trendMap[date]) {
            trendMap[date] = { date, stockIn: 0, stockOut: 0, inCount: 0, outCount: 0 }
          }
          if (t._id.type === "IN") {
            trendMap[date].stockIn = t.total
            trendMap[date].inCount = t.count
          } else {
            trendMap[date].stockOut = t.total
            trendMap[date].outCount = t.count
          }
        })

        return NextResponse.json({
          success: true,
          data: Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date)),
        })
      }

      case "top-products": {
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const topProducts = await db
          .collection(COLLECTIONS.TRANSACTIONS)
          .aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            {
              $group: {
                _id: "$productId",
                productName: { $first: "$productName" },
                sku: { $first: "$sku" },
                totalIn: {
                  $sum: { $cond: [{ $eq: ["$type", "IN"] }, "$quantity", 0] },
                },
                totalOut: {
                  $sum: { $cond: [{ $eq: ["$type", "OUT"] }, "$quantity", 0] },
                },
                transactions: { $sum: 1 },
              },
            },
            { $sort: { transactions: -1 } },
            { $limit: 10 },
          ])
          .toArray()

        return NextResponse.json({
          success: true,
          data: topProducts.map((p) => ({
            productId: p._id,
            productName: p.productName,
            sku: p.sku,
            totalIn: p.totalIn,
            totalOut: p.totalOut,
            netMovement: p.totalIn - p.totalOut,
            transactions: p.transactions,
          })),
        })
      }

      case "inventory-health": {
        const products = await db.collection(COLLECTIONS.PRODUCTS).find().toArray()
        
        const totalProducts = products.length
        const healthyCount = products.filter(p => p.status === "in_stock").length
        const lowStockCount = products.filter(p => p.status === "low_stock").length
        const outOfStockCount = products.filter(p => p.status === "out_of_stock").length
        
        const healthScore = totalProducts > 0 
          ? Math.round((healthyCount / totalProducts) * 100)
          : 100

        const turnoverRate = products.reduce((acc, p) => {
          const ratio = p.currentStock / p.maxStockThreshold
          return acc + ratio
        }, 0) / (totalProducts || 1)

        return NextResponse.json({
          success: true,
          data: {
            healthScore,
            totalProducts,
            healthyCount,
            lowStockCount,
            outOfStockCount,
            turnoverRate: (turnoverRate * 100).toFixed(1),
            recommendation: healthScore >= 80 
              ? "Inventory is healthy" 
              : healthScore >= 60 
                ? "Consider restocking low items" 
                : "Urgent restocking needed",
          },
        })
      }

      default: {
        // Overview - combine multiple reports
        const products = await db.collection(COLLECTIONS.PRODUCTS).find().toArray()
        const categories = await db.collection(COLLECTIONS.CATEGORIES).find().toArray()
        
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        
        const recentTransactions = await db
          .collection(COLLECTIONS.TRANSACTIONS)
          .countDocuments({ createdAt: { $gte: sevenDaysAgo } })

        return NextResponse.json({
          success: true,
          data: {
            totalProducts: products.length,
            totalCategories: categories.length,
            totalValue: products.reduce((acc, p) => acc + (p.price * p.currentStock), 0),
            recentTransactions,
            lowStockItems: products.filter(p => p.status === "low_stock").length,
            outOfStockItems: products.filter(p => p.status === "out_of_stock").length,
          },
        })
      }
    }
  } catch (error) {
    console.error("Reports fetch error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch report data" },
      { status: 500 }
    )
  }
}
