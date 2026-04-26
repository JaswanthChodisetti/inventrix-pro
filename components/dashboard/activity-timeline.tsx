"use client"

import { motion } from "framer-motion"
import { ArrowDownCircle, ArrowUpCircle, Clock } from "lucide-react"
import { Transaction } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ActivityTimelineProps {
  transactions: Transaction[]
}

export function ActivityTimeline({ transactions }: ActivityTimelineProps) {
  const formatTimeAgo = (date: string | Date) => {
    const now = new Date()
    const then = new Date(date)
    const diff = now.getTime() - then.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return "Just now"
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="rounded-2xl border border-border bg-card p-6"
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/10">
          <Clock className="h-5 w-5 text-info" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-card-foreground">
            Recent Activity
          </h3>
          <p className="text-sm text-muted-foreground">
            Latest inventory movements
          </p>
        </div>
      </div>

      <div className="relative space-y-4">
        {/* Timeline line */}
        <div className="absolute left-5 top-0 h-full w-px bg-border" />

        {transactions.slice(0, 8).map((transaction, index) => (
          <motion.div
            key={String(transaction._id)}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="relative flex items-start gap-4 pl-12"
          >
            {/* Timeline dot */}
            <div
              className={cn(
                "absolute left-3 flex h-4 w-4 items-center justify-center rounded-full border-2 bg-card",
                transaction.type === "IN"
                  ? "border-success"
                  : "border-info"
              )}
            >
              <div
                className={cn(
                  "h-2 w-2 rounded-full",
                  transaction.type === "IN" ? "bg-success" : "bg-info"
                )}
              />
            </div>

            <div className="flex-1 rounded-lg border border-border bg-background p-3 transition-colors hover:bg-accent/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {transaction.type === "IN" ? (
                    <ArrowDownCircle className="h-4 w-4 text-success" />
                  ) : (
                    <ArrowUpCircle className="h-4 w-4 text-info" />
                  )}
                  <span className="font-medium text-card-foreground">
                    {transaction.productName}
                  </span>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    transaction.type === "IN"
                      ? "bg-success/10 text-success"
                      : "bg-info/10 text-info"
                  )}
                >
                  {transaction.type === "IN" ? "+" : "-"}
                  {transaction.quantity}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>{transaction.reason}</span>
                <span>{formatTimeAgo(transaction.createdAt)}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
