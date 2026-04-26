"use client"

import { useEffect } from "react"
import { motion } from "framer-motion"
import useSWR from "swr"
import {
  Package,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
} from "lucide-react"
import { StatsCard } from "@/components/dashboard/stats-card"
import { StockChart } from "@/components/dashboard/stock-chart"
import { useCurrency } from "@/lib/currency-context"
import { CategoryChart } from "@/components/dashboard/category-chart"
import { LowStockAlert } from "@/components/dashboard/low-stock-alert"
import { ActivityTimeline } from "@/components/dashboard/activity-timeline"
import { InventoryHealth } from "@/components/dashboard/inventory-health"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useUser } from "@/lib/user-context"

const fetcher = (url: string) =>
  fetch(url).then(async (res) => {
    const contentType = res.headers.get("content-type")
    if (!contentType?.includes("application/json")) {
      const text = await res.text()
      console.error("Expected JSON but got:", text.substring(0, 200))
      throw new Error(`API returned HTML instead of JSON (${res.status})`)
    }
    return res.json()
  })

export default function DashboardPage() {
  const user = useUser()
  const canEdit = user.role === "admin" || user.role === "manager"
  const { data, error, isLoading, mutate } = useSWR("/api/dashboard", fetcher, {
    refreshInterval: 30000,
  })
  const { getCurrencySymbol } = useCurrency()

  useEffect(() => {
    // Seed database on first load if empty
    const seedIfEmpty = async () => {
      if (data && data.data?.stats?.totalProducts === 0) {
        toast.info("Seeding database with sample data...")
        const res = await fetch("/api/seed", { method: "POST" })
        if (res.ok) {
          toast.success("Sample data loaded successfully!")
          mutate()
        }
      }
    }
    seedIfEmpty()
  }, [data, mutate])

  const handleRefresh = async () => {
    toast.info("Refreshing dashboard...")
    await mutate()
    toast.success("Dashboard refreshed!")
  }

  const handleSeedData = async () => {
    toast.info("Seeding database with sample data...")
    const res = await fetch("/api/seed", { method: "POST" })
    if (res.ok) {
      toast.success("Sample data loaded successfully!")
      mutate()
    } else {
      toast.error("Failed to seed database")
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="shimmer mb-2 h-8 w-48 rounded-lg" />
            <div className="shimmer h-4 w-64 rounded-lg" />
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="shimmer h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="shimmer lg:col-span-2 h-96 rounded-2xl" />
          <div className="shimmer h-96 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <p className="text-destructive">Failed to load dashboard data</p>
        <Button onClick={() => mutate()}>Retry</Button>
      </div>
    )
  }

  const stats = data?.data?.stats || {
    totalProducts: 0,
    totalValue: 0,
    lowStockCount: 0,
    recentTransactions: 0,
    inventoryHealth: 100,
  }

  const categoryBreakdown = data?.data?.categoryBreakdown || []
  const stockTrends = data?.data?.stockTrends || []
  const lowStockProducts = data?.data?.lowStockProducts || []
  const recentActivity = data?.data?.recentActivity || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s your inventory overview.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeedData}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reset Demo Data
            </Button>
          )}
          <Button size="sm" onClick={handleRefresh} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Products"
          value={stats.totalProducts}
          icon={Package}
          color="primary"
          trend={{ value: 12, isPositive: true }}
          delay={0}
        />
        <StatsCard
          title="Inventory Value"
          value={stats.totalValue}
          prefix={getCurrencySymbol()}
          icon={DollarSign}
          color="success"
          trend={{ value: 8, isPositive: true }}
          delay={0.1}
        />
        <StatsCard
          title="Low Stock Items"
          value={stats.lowStockCount}
          icon={AlertTriangle}
          color="warning"
          trend={{ value: 5, isPositive: false }}
          delay={0.15}
        />
        <StatsCard
          title="Weekly Transactions"
          value={stats.recentTransactions}
          icon={TrendingUp}
          color="info"
          trend={{ value: 23, isPositive: true }}
          delay={0.2}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <StockChart data={stockTrends} />
        </div>
        <InventoryHealth score={stats.inventoryHealth} />
      </div>

      {/* Category & Activity Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="relative">
          <CategoryChart data={categoryBreakdown} />
        </div>
        <LowStockAlert products={lowStockProducts} />
        <ActivityTimeline transactions={recentActivity} />
      </div>
    </div>
  )
}
