"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import useSWR from "swr"
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Search,
  Filter,
  Download,
  Calendar,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Transaction } from "@/lib/types"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const typeFilters = [
  { value: "all", label: "All Types" },
  { value: "IN", label: "Stock In" },
  { value: "OUT", label: "Stock Out" },
]

const reasonFilters = [
  "All Reasons",
  "Purchase",
  "Sale",
  "Return",
  "Damaged",
  "Expired",
  "Transfer",
  "Inventory Correction",
]

export default function TransactionsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedReason, setSelectedReason] = useState("All Reasons")
  const [showFilters, setShowFilters] = useState(false)

  const { data, isLoading } = useSWR("/api/transactions?limit=100", fetcher)
  const transactions: Transaction[] = data?.data || []

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesSearch =
        tx.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.sku.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesType = selectedType === "all" || tx.type === selectedType

      const matchesReason =
        selectedReason === "All Reasons" || tx.reason === selectedReason

      return matchesSearch && matchesType && matchesReason
    })
  }, [transactions, searchQuery, selectedType, selectedReason])

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const hasActiveFilters =
    searchQuery || selectedType !== "all" || selectedReason !== "All Reasons"

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedType("all")
    setSelectedReason("All Reasons")
  }

  const exportToCSV = () => {
    const headers = [
      "Date",
      "Product",
      "SKU",
      "Type",
      "Quantity",
      "Reason",
      "Previous Stock",
      "New Stock",
      "Notes",
    ]
    const rows = filteredTransactions.map((tx) => [
      formatDate(tx.createdAt),
      tx.productName,
      tx.sku,
      tx.type,
      tx.quantity,
      tx.reason,
      tx.previousStock,
      tx.newStock,
      tx.notes,
    ])

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {}
    filteredTransactions.forEach((tx) => {
      const date = new Date(tx.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(tx)
    })
    return groups
  }, [filteredTransactions])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="shimmer mb-2 h-8 w-48 rounded-lg" />
            <div className="shimmer h-4 w-64 rounded-lg" />
          </div>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="shimmer h-20 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

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
            Transactions
          </h1>
          <p className="text-muted-foreground">
            Track all inventory movements ({filteredTransactions.length}{" "}
            transactions)
          </p>
        </div>
        <Button onClick={exportToCSV} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </motion.div>

      {/* Filters Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center"
      >
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2 rounded-xl border border-input p-1">
          {typeFilters.map((type) => (
            <button
              key={type.value}
              onClick={() => setSelectedType(type.value)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
                selectedType === type.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Filter Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className={cn("gap-2", showFilters && "border-primary text-primary")}
        >
          <Filter className="h-4 w-4" />
          More
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-1 text-muted-foreground"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </motion.div>

      {/* Extended Filters */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="rounded-2xl border border-border bg-card p-4"
        >
          <label className="mb-2 block text-sm font-medium text-card-foreground">
            Reason
          </label>
          <div className="flex flex-wrap gap-2">
            {reasonFilters.map((reason) => (
              <button
                key={reason}
                onClick={() => setSelectedReason(reason)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition-all",
                  selectedReason === reason
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {reason}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16"
        >
          <Calendar className="mb-4 h-16 w-16 text-muted-foreground/50" />
          <h3 className="mb-2 text-lg font-semibold text-card-foreground">
            No transactions found
          </h3>
          <p className="text-sm text-muted-foreground">
            {hasActiveFilters
              ? "Try adjusting your filters"
              : "Transactions will appear here when you update stock"}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTransactions).map(([date, txs]) => (
            <div key={date}>
              <div className="mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  {date}
                </span>
                <span className="text-xs text-muted-foreground/70">
                  ({txs.length} transactions)
                </span>
              </div>
              <div className="space-y-2">
                {txs.map((tx, index) => (
                  <motion.div
                    key={String(tx._id)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-xl",
                          tx.type === "IN"
                            ? "bg-success/10"
                            : "bg-info/10"
                        )}
                      >
                        {tx.type === "IN" ? (
                          <ArrowDownCircle className="h-5 w-5 text-success" />
                        ) : (
                          <ArrowUpCircle className="h-5 w-5 text-info" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-card-foreground">
                          {tx.productName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {tx.sku} • {tx.reason}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p
                          className={cn(
                            "text-lg font-bold",
                            tx.type === "IN" ? "text-success" : "text-info"
                          )}
                        >
                          {tx.type === "IN" ? "+" : "-"}
                          {tx.quantity}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tx.previousStock} → {tx.newStock}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground/70">
                          by {tx.userName || "System"}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
