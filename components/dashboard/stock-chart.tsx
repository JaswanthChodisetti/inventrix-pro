"use client"

import { motion } from "framer-motion"
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { StockTrend } from "@/lib/types"

interface StockChartProps {
  data: StockTrend[]
}

export function StockChart({ data }: StockChartProps) {
  const formattedData = data.map((item) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="rounded-2xl border border-border bg-card p-6"
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-card-foreground">
            Stock Movement Trends
          </h3>
          <p className="text-sm text-muted-foreground">
            Incoming vs outgoing inventory over the last 14 days
          </p>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData}>
            <defs>
              <linearGradient id="stockInGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="oklch(0.65 0.2 145)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="100%"
                  stopColor="oklch(0.65 0.2 145)"
                  stopOpacity={0}
                />
              </linearGradient>
              <linearGradient id="stockOutGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="oklch(0.6 0.18 240)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="100%"
                  stopColor="oklch(0.6 0.18 240)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
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
                boxShadow: "0 10px 40px -10px rgba(0,0,0,0.1)",
              }}
              labelStyle={{ fontWeight: 600, marginBottom: 4 }}
            />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              formatter={(value) => (
                <span style={{ color: "oklch(0.3 0.02 250)", fontSize: 12 }}>
                  {value === "stockIn" ? "Stock In" : "Stock Out"}
                </span>
              )}
            />
            <Area
              type="monotone"
              dataKey="stockIn"
              stroke="oklch(0.65 0.2 145)"
              strokeWidth={2.5}
              fill="url(#stockInGradient)"
              dot={false}
              activeDot={{
                r: 6,
                fill: "oklch(0.65 0.2 145)",
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
            <Area
              type="monotone"
              dataKey="stockOut"
              stroke="oklch(0.6 0.18 240)"
              strokeWidth={2.5}
              fill="url(#stockOutGradient)"
              dot={false}
              activeDot={{
                r: 6,
                fill: "oklch(0.6 0.18 240)",
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}
