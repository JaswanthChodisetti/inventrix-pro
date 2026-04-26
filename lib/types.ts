import { ObjectId } from "mongodb"

export interface User {
  _id?: ObjectId
  name: string
  email: string
  password: string
  avatar?: string
  role: "admin" | "manager" | "viewer"
  preferences: {
    theme: "light" | "dark" | "system"
    currency: string
    lowStockThreshold: number
    notifications: {
      email: boolean
      push: boolean
      desktop: boolean
    }
  }
  createdAt: Date
  updatedAt: Date
}

export interface Category {
  _id?: ObjectId
  name: string
  description: string
  color: string
  icon: string
  productCount?: number
  createdAt: Date
}

export interface Product {
  _id?: ObjectId
  sku: string
  name: string
  description: string
  categoryId: ObjectId | string
  category?: Category
  price: number
  cost: number
  currentStock: number
  minStockThreshold: number
  maxStockThreshold: number
  unit: string
  location: string
  supplier: string
  images: string[]
  barcode: string
  tags: string[]
  status: "in_stock" | "low_stock" | "out_of_stock" | "overstocked"
  createdAt: Date
  updatedAt: Date
}

export interface Transaction {
  _id?: ObjectId
  productId: ObjectId | string
  sku: string
  productName: string
  type: "IN" | "OUT"
  quantity: number
  reason: "Purchase" | "Sale" | "Return" | "Damaged" | "Expired" | "Transfer" | "Inventory Correction"
  reference: string
  previousStock: number
  newStock: number
  userId?: ObjectId | string
  userName?: string
  notes: string
  createdAt: Date
}

export interface Notification {
  _id?: ObjectId
  userId?: ObjectId | string
  title: string
  message: string
  type: "stock_alert" | "transaction" | "system"
  read: boolean
  data?: Record<string, unknown>
  createdAt: Date
}

export interface DashboardStats {
  totalProducts: number
  totalValue: number
  lowStockCount: number
  outOfStockCount: number
  totalCategories: number
  recentTransactions: number
  inventoryHealth: number
}

export interface ChartData {
  name: string
  value: number
  color?: string
}

export interface StockTrend {
  date: string
  stockIn: number
  stockOut: number
}
