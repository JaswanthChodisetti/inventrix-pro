"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Activity, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface InventoryHealthProps {
  score: number
}

export function InventoryHealth({ score }: InventoryHealthProps) {
  const [animatedScore, setAnimatedScore] = useState(0)

  useEffect(() => {
    const duration = 1500
    const steps = 60
    const stepDuration = duration / steps
    const increment = score / steps

    let currentStep = 0
    const timer = setInterval(() => {
      currentStep++
      if (currentStep >= steps) {
        setAnimatedScore(score)
        clearInterval(timer)
      } else {
        setAnimatedScore(Math.floor(increment * currentStep))
      }
    }, stepDuration)

    return () => clearInterval(timer)
  }, [score])

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success"
    if (score >= 60) return "text-warning"
    return "text-destructive"
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent"
    if (score >= 60) return "Good"
    if (score >= 40) return "Fair"
    return "Critical"
  }

  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-2xl border border-border bg-card p-6"
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Activity className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-card-foreground">
            Inventory Health
          </h3>
          <p className="text-sm text-muted-foreground">
            Overall stock status
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center py-4">
        <div className="relative">
          <svg width="140" height="140" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted/30"
            />
            {/* Progress circle */}
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              className={getScoreColor(score)}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 50 50)"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("text-3xl font-bold", getScoreColor(score))}>
              {animatedScore}%
            </span>
            <span className="text-xs text-muted-foreground">
              {getScoreLabel(score)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">In Stock</span>
          <span className="font-medium text-success">
            {score}%
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Low Stock</span>
          <span className="font-medium text-warning">
            {Math.max(0, 100 - score - 5)}%
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Out of Stock</span>
          <span className="font-medium text-destructive">
            {Math.min(5, 100 - score)}%
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-lg bg-accent/50 p-3">
        <TrendingUp className="h-4 w-4 text-success" />
        <span className="text-sm text-muted-foreground">
          <span className="font-medium text-success">+3.2%</span> improvement
          this week
        </span>
      </div>
    </motion.div>
  )
}
