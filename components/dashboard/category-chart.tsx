"use client"

import { motion } from "framer-motion"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts"
import { ChartData } from "@/lib/types"

interface CategoryChartProps {
  data: ChartData[]
}

const COLORS = [
  "oklch(0.55 0.18 175)",
  "oklch(0.6 0.18 240)",
  "oklch(0.75 0.18 85)",
  "oklch(0.65 0.2 145)",
  "oklch(0.6 0.2 320)",
]

export function CategoryChart({ data }: CategoryChartProps) {
  const total = data.reduce((acc, item) => acc + item.value, 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="relative rounded-2xl border border-border bg-card p-6"
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-card-foreground">
          Category Distribution
        </h3>
        <p className="text-sm text-muted-foreground">
          Products by category
        </p>
      </div>

      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={4}
              dataKey="value"
              nameKey="name"
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || COLORS[index % COLORS.length]}
                  className="transition-all duration-300 hover:opacity-80"
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "oklch(0.98 0.002 240)",
                border: "1px solid oklch(0.92 0.01 250)",
                borderRadius: "12px",
                boxShadow: "0 10px 40px -10px rgba(0,0,0,0.1)",
              }}
              formatter={(value: number) => [
                `${value} products (${((value / total) * 100).toFixed(1)}%)`,
                "",
              ]}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              formatter={(value) => (
                <span
                  style={{
                    color: "oklch(0.3 0.02 250)",
                    fontSize: 12,
                  }}
                >
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Center text */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-3xl font-bold text-card-foreground">{total}</p>
          <p className="text-sm text-muted-foreground">Products</p>
        </div>
      </div>
    </motion.div>
  )
}
