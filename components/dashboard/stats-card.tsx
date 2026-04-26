"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCurrency } from "@/lib/currency-context"

interface StatsCardProps {
  title: string
  value: number
  prefix?: string
  suffix?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  color: "primary" | "success" | "warning" | "destructive" | "info"
  delay?: number
}

const colorClasses = {
  primary: {
    bg: "bg-primary/10",
    icon: "text-primary",
    trend: "text-primary",
  },
  success: {
    bg: "bg-success/10",
    icon: "text-success",
    trend: "text-success",
  },
  warning: {
    bg: "bg-warning/10",
    icon: "text-warning",
    trend: "text-warning",
  },
  destructive: {
    bg: "bg-destructive/10",
    icon: "text-destructive",
    trend: "text-destructive",
  },
  info: {
    bg: "bg-info/10",
    icon: "text-info",
    trend: "text-info",
  },
}

function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
}: {
  value: number
  prefix?: string
  suffix?: string
}) {
  const [displayValue, setDisplayValue] = useState(0)
  const { formatCurrencyValue } = useCurrency()

  useEffect(() => {
    const duration = 1500
    const steps = 60
    const stepDuration = duration / steps
    const increment = value / steps

    let currentStep = 0
    const timer = setInterval(() => {
      currentStep++
      if (currentStep >= steps) {
        setDisplayValue(value)
        clearInterval(timer)
      } else {
        setDisplayValue(Math.floor(increment * currentStep))
      }
    }, stepDuration)

    return () => clearInterval(timer)
  }, [value])

  const formatValue = (val: number) => {
    if (prefix) {
      const { value } = formatCurrencyValue(val)
      return value
    }
    return val.toLocaleString()
  }

  return (
    <span>
      {prefix}
      {formatValue(displayValue)}
      {suffix}
    </span>
  )
}

export function StatsCard({
  title,
  value,
  prefix,
  suffix,
  icon: Icon,
  trend,
  color,
  delay = 0,
}: StatsCardProps) {
  const colors = colorClasses[color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="card-hover group relative overflow-hidden rounded-2xl border border-border bg-card p-6"
    >
      {/* Background gradient */}
      <div
        className={cn(
          "absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-20 blur-2xl transition-all duration-500 group-hover:scale-150",
          colors.bg
        )}
      />

      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight text-card-foreground">
            <AnimatedCounter value={value} prefix={prefix} suffix={suffix} />
          </p>
          {trend && (
            <div
              className={cn(
                "flex items-center gap-1 text-sm font-medium",
                trend.isPositive ? "text-success" : "text-destructive"
              )}
            >
              <span>{trend.isPositive ? "+" : ""}{trend.value}%</span>
              <span className="text-muted-foreground">vs last week</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110",
            colors.bg
          )}
        >
          <Icon className={cn("h-6 w-6", colors.icon)} />
        </div>
      </div>
    </motion.div>
  )
}
