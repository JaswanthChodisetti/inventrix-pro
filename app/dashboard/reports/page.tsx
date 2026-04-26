"use client"

import { motion } from "framer-motion"
import useSWR from "swr"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts"
import {
  Download,
  TrendingUp,
  Package,
  DollarSign,
  BarChart3,
  PieChartIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCurrency } from "@/lib/currency-context"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const COLORS = [
  "oklch(0.55 0.18 175)",
  "oklch(0.6 0.18 240)",
  "oklch(0.75 0.18 85)",
  "oklch(0.65 0.2 145)",
  "oklch(0.6 0.2 320)",
]

export default function ReportsPage() {
  const { data, isLoading } = useSWR("/api/dashboard", fetcher)
  const { formatCurrency } = useCurrency()

  const stats = data?.data?.stats || {}
  const categoryBreakdown = data?.data?.categoryBreakdown || []
  const stockTrends = data?.data?.stockTrends || []
  const topProducts = data?.data?.topProducts || []

  const exportReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      stats,
      categoryBreakdown,
      stockTrends,
      topProducts,
    }
    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `inventory-report-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="shimmer h-10 w-48 rounded-lg" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="shimmer h-80 rounded-2xl" />
          <div className="shimmer h-80 rounded-2xl" />
        </div>
      </div>
    )
  }

  // Format stock trends for chart
  const formattedTrends = stockTrends.map((item: { date: string; stockIn: number; stockOut: number }) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }))

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
            Reports
          </h1>
          <p className="text-muted-foreground">
            Detailed analytics and insights for your inventory
          </p>
        </div>
        <Button onClick={exportReport} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-border bg-card p-6"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total SKUs</p>
              <p className="text-2xl font-bold text-card-foreground">
                {stats.totalProducts || 0}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-border bg-card p-6"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
              <DollarSign className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-2xl font-bold text-card-foreground">
                {formatCurrency(stats.totalValue || 0)}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-border bg-card p-6"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/10">
              <TrendingUp className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Weekly Transactions</p>
              <p className="text-2xl font-bold text-card-foreground">
                {stats.recentTransactions || 0}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-2xl border border-border bg-card p-6"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
              <BarChart3 className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Health Score</p>
              <p className="text-2xl font-bold text-card-foreground">
                {stats.inventoryHealth || 0}%
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Stock Movement Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-border bg-card p-6"
        >
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-card-foreground">
              Stock Movement (14 Days)
            </h3>
            <p className="text-sm text-muted-foreground">
              Daily stock in/out comparison
            </p>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formattedTrends}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.8 0.01 250)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: "oklch(0.5 0.02 250)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "oklch(0.5 0.02 250)" }}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "oklch(0.98 0.002 240)",
                    border: "1px solid oklch(0.92 0.01 250)",
                    borderRadius: "12px",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="stockIn"
                  name="Stock In"
                  fill="oklch(0.65 0.2 145)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="stockOut"
                  name="Stock Out"
                  fill="oklch(0.6 0.18 240)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Category Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl border border-border bg-card p-6"
        >
          <div className="mb-4 flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-primary" />
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">
                Inventory by Category
              </h3>
              <p className="text-sm text-muted-foreground">
                Value distribution across categories
              </p>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="totalValue"
                  nameKey="name"
                  strokeWidth={0}
                >
                  {categoryBreakdown.map((entry: { color?: string }, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color || COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [
                    formatCurrency(value),
                    "Value",
                  ]}
                  contentStyle={{
                    backgroundColor: "oklch(0.98 0.002 240)",
                    border: "1px solid oklch(0.92 0.01 250)",
                    borderRadius: "12px",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Top Products */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl border border-border bg-card p-6"
      >
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-card-foreground">
            Top Moving Products (This Week)
          </h3>
          <p className="text-sm text-muted-foreground">
            Products with the most stock movement
          </p>
        </div>
        {topProducts.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            No data available
          </div>
        ) : (
          <div className="space-y-3">
            {topProducts.map((product: {
              _id: string
              productName: string
              sku: string
              totalMovement: number
              transactions: number
            }, index: number) => (
              <div
                key={String(product._id)}
                className="flex items-center justify-between rounded-xl border border-border bg-background p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-lg font-bold text-primary">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-card-foreground">
                      {product.productName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {product.sku}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">
                    {product.totalMovement} units
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {product.transactions} transactions
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Trend Line Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="rounded-2xl border border-border bg-card p-6"
      >
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-card-foreground">
            Inventory Flow Trend
          </h3>
          <p className="text-sm text-muted-foreground">
            Cumulative stock movement over time
          </p>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedTrends}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(0.8 0.01 250)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: "oklch(0.5 0.02 250)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "oklch(0.5 0.02 250)" }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(0.98 0.002 240)",
                  border: "1px solid oklch(0.92 0.01 250)",
                  borderRadius: "12px",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="stockIn"
                name="Stock In"
                stroke="oklch(0.65 0.2 145)"
                strokeWidth={3}
                dot={{ fill: "oklch(0.65 0.2 145)", strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="stockOut"
                name="Stock Out"
                stroke="oklch(0.6 0.18 240)"
                strokeWidth={3}
                dot={{ fill: "oklch(0.6 0.18 240)", strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  )
}
