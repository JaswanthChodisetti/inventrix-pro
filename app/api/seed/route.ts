import { NextResponse } from "next/server"
import { getDatabase, COLLECTIONS } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { hashPassword } from "@/lib/auth"

const categories = [
  { name: "Electronics", description: "Electronic devices and gadgets", color: "#3B82F6", icon: "Laptop" },
  { name: "Furniture", description: "Office and home furniture", color: "#10B981", icon: "Sofa" },
  { name: "Food & Beverages", description: "Food items and drinks", color: "#F59E0B", icon: "Coffee" },
  { name: "Clothing", description: "Apparel and accessories", color: "#EC4899", icon: "Shirt" },
  { name: "Health & Fitness", description: "Health and sports items", color: "#8B5CF6", icon: "Heart" },
]

export async function POST() {
  try {
    const db = await getDatabase()

    // Clear existing data
    await db.collection(COLLECTIONS.USERS).deleteMany({})
    await db.collection(COLLECTIONS.CATEGORIES).deleteMany({})
    await db.collection(COLLECTIONS.PRODUCTS).deleteMany({})
    await db.collection(COLLECTIONS.TRANSACTIONS).deleteMany({})
    await db.collection(COLLECTIONS.NOTIFICATIONS).deleteMany({})
    await db.collection("sessions").deleteMany({})

    // Create default admin user
    const hashedPassword = await hashPassword("admin123")
    const adminUser = {
      name: "Admin User",
      email: "admin@inventrix.pro",
      password: hashedPassword,
      role: "admin",
      preferences: {
        theme: "system",
        currency: "USD",
        lowStockThreshold: 10,
        notifications: {
          email: true,
          push: true,
          desktop: true,
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await db.collection(COLLECTIONS.USERS).insertOne(adminUser)

    // Insert categories
    const categoryDocs = categories.map((cat) => ({
      ...cat,
      createdAt: new Date(),
    }))
    const insertedCategories = await db.collection(COLLECTIONS.CATEGORIES).insertMany(categoryDocs)
    const categoryIds = Object.values(insertedCategories.insertedIds)

    // Create products
    const products = [
      {
        sku: "ELEC-001",
        name: "MacBook Pro 16\"",
        description: "Apple MacBook Pro with M3 Pro chip, 18GB RAM, 512GB SSD",
        categoryId: categoryIds[0],
        price: 2499,
        cost: 2100,
        currentStock: 15,
        minStockThreshold: 5,
        maxStockThreshold: 50,
        unit: "pcs",
        location: "Warehouse A - Shelf 1",
        supplier: "Apple Inc.",
        images: [],
        barcode: "APL-MBP16-001",
        tags: ["laptop", "apple", "premium"],
        status: "in_stock",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        sku: "ELEC-002",
        name: "Sony WH-1000XM5",
        description: "Premium noise-canceling wireless headphones",
        categoryId: categoryIds[0],
        price: 399,
        cost: 280,
        currentStock: 8,
        minStockThreshold: 10,
        maxStockThreshold: 40,
        unit: "pcs",
        location: "Warehouse A - Shelf 2",
        supplier: "Sony Electronics",
        images: [],
        barcode: "SNY-WH1000-002",
        tags: ["headphones", "audio", "wireless"],
        status: "low_stock",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        sku: "FOOD-001",
        name: "Organic Coffee Beans",
        description: "Premium organic Arabica coffee beans, 1kg bag",
        categoryId: categoryIds[2],
        price: 24.99,
        cost: 12,
        currentStock: 3,
        minStockThreshold: 15,
        maxStockThreshold: 100,
        unit: "bags",
        location: "Warehouse B - Shelf 3",
        supplier: "Mountain Roasters Co.",
        images: [],
        barcode: "ORG-COF-001",
        tags: ["coffee", "organic", "food"],
        status: "low_stock",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        sku: "FURN-001",
        name: "Ergonomic Office Chair",
        description: "Premium ergonomic chair with lumbar support and adjustable armrests",
        categoryId: categoryIds[1],
        price: 499,
        cost: 320,
        currentStock: 12,
        minStockThreshold: 5,
        maxStockThreshold: 30,
        unit: "pcs",
        location: "Warehouse C - Floor 1",
        supplier: "ErgoComfort Ltd.",
        images: [],
        barcode: "ERG-CHR-001",
        tags: ["chair", "office", "ergonomic"],
        status: "in_stock",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        sku: "ELEC-003",
        name: "iPhone 15 Pro",
        description: "Apple iPhone 15 Pro, 256GB, Titanium finish",
        categoryId: categoryIds[0],
        price: 999,
        cost: 800,
        currentStock: 25,
        minStockThreshold: 10,
        maxStockThreshold: 60,
        unit: "pcs",
        location: "Warehouse A - Shelf 1",
        supplier: "Apple Inc.",
        images: [],
        barcode: "APL-IP15P-001",
        tags: ["phone", "apple", "smartphone"],
        status: "in_stock",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        sku: "FURN-002",
        name: "Standing Desk",
        description: "Electric height-adjustable standing desk, 60x30 inches",
        categoryId: categoryIds[1],
        price: 599,
        cost: 380,
        currentStock: 6,
        minStockThreshold: 8,
        maxStockThreshold: 25,
        unit: "pcs",
        location: "Warehouse C - Floor 2",
        supplier: "FlexiDesk Inc.",
        images: [],
        barcode: "FLX-DSK-001",
        tags: ["desk", "office", "standing"],
        status: "low_stock",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        sku: "ELEC-004",
        name: "Wireless Mouse",
        description: "Logitech MX Master 3S wireless mouse",
        categoryId: categoryIds[0],
        price: 99.99,
        cost: 55,
        currentStock: 45,
        minStockThreshold: 20,
        maxStockThreshold: 100,
        unit: "pcs",
        location: "Warehouse A - Shelf 3",
        supplier: "Logitech International",
        images: [],
        barcode: "LOG-MXM-001",
        tags: ["mouse", "wireless", "logitech"],
        status: "in_stock",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        sku: "CLTH-001",
        name: "Premium Hoodie",
        description: "High-quality cotton blend hoodie, various sizes available",
        categoryId: categoryIds[3],
        price: 89.99,
        cost: 35,
        currentStock: 18,
        minStockThreshold: 10,
        maxStockThreshold: 50,
        unit: "pcs",
        location: "Warehouse D - Rack 1",
        supplier: "Urban Threads Co.",
        images: [],
        barcode: "URB-HOD-001",
        tags: ["hoodie", "clothing", "casual"],
        status: "in_stock",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        sku: "HLTH-001",
        name: "Protein Powder",
        description: "Premium whey protein powder, 2lb container, vanilla flavor",
        categoryId: categoryIds[4],
        price: 54.99,
        cost: 28,
        currentStock: 2,
        minStockThreshold: 10,
        maxStockThreshold: 40,
        unit: "containers",
        location: "Warehouse B - Shelf 5",
        supplier: "FitNutrition Labs",
        images: [],
        barcode: "FIT-PRO-001",
        tags: ["protein", "fitness", "supplement"],
        status: "low_stock",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        sku: "HLTH-002",
        name: "Yoga Mat",
        description: "Non-slip yoga mat, 6mm thick, eco-friendly materials",
        categoryId: categoryIds[4],
        price: 34.99,
        cost: 12,
        currentStock: 22,
        minStockThreshold: 15,
        maxStockThreshold: 60,
        unit: "pcs",
        location: "Warehouse D - Rack 2",
        supplier: "ZenFlex Sports",
        images: [],
        barcode: "ZEN-YGM-001",
        tags: ["yoga", "fitness", "mat"],
        status: "in_stock",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    const insertedProducts = await db.collection(COLLECTIONS.PRODUCTS).insertMany(products)
    const productIds = Object.values(insertedProducts.insertedIds)

    // Create transactions over last 30 days
    const transactionReasons = ["Purchase", "Sale", "Return", "Transfer"] as const
    const transactions = []

    for (let i = 0; i < 30; i++) {
      const daysAgo = Math.floor(Math.random() * 30)
      const date = new Date()
      date.setDate(date.getDate() - daysAgo)

      const productIndex = Math.floor(Math.random() * products.length)
      const product = products[productIndex]
      const isStockIn = Math.random() > 0.4
      const quantity = Math.floor(Math.random() * 10) + 1
      const reason = transactionReasons[Math.floor(Math.random() * transactionReasons.length)]

      transactions.push({
        productId: productIds[productIndex],
        sku: product.sku,
        productName: product.name,
        type: isStockIn ? "IN" : "OUT",
        quantity,
        reason,
        reference: `REF-${Date.now()}-${i}`,
        previousStock: product.currentStock,
        newStock: isStockIn ? product.currentStock + quantity : Math.max(0, product.currentStock - quantity),
        userName: "System",
        notes: `${reason} transaction`,
        createdAt: date,
      })
    }

    await db.collection(COLLECTIONS.TRANSACTIONS).insertMany(transactions)

    // Create notifications
    const notifications = [
      {
        title: "Low Stock Alert",
        message: "Organic Coffee Beans is running low on stock (3 remaining)",
        type: "stock_alert",
        read: false,
        createdAt: new Date(),
      },
      {
        title: "Low Stock Alert",
        message: "Protein Powder is critically low (2 remaining)",
        type: "stock_alert",
        read: false,
        createdAt: new Date(Date.now() - 3600000),
      },
      {
        title: "New Transaction",
        message: "10 units of iPhone 15 Pro received from supplier",
        type: "transaction",
        read: true,
        createdAt: new Date(Date.now() - 86400000),
      },
      {
        title: "System Update",
        message: "Inventory system has been updated to version 2.0",
        type: "system",
        read: true,
        createdAt: new Date(Date.now() - 172800000),
      },
    ]

    await db.collection(COLLECTIONS.NOTIFICATIONS).insertMany(notifications)

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully",
      data: {
        users: 1,
        categories: categoryIds.length,
        products: productIds.length,
        transactions: transactions.length,
        notifications: notifications.length,
      },
      credentials: {
        email: "admin@inventrix.pro",
        password: "admin123",
      },
    })
  } catch (error) {
    console.error("Seed error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to seed database" },
      { status: 500 }
    )
  }
}
