"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ArrowDownCircle, ArrowUpCircle, Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Product } from "@/lib/types"
import { cn } from "@/lib/utils"

interface StockUpdateModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  type: "IN" | "OUT"
  onSubmit: (data: {
    productId: string
    type: "IN" | "OUT"
    quantity: number
    reason: string
    notes: string
  }) => Promise<void>
}

const reasons = {
  IN: ["Purchase", "Return", "Transfer", "Inventory Correction"],
  OUT: ["Sale", "Damaged", "Expired", "Transfer", "Inventory Correction"],
}

export function StockUpdateModal({
  isOpen,
  onClose,
  product,
  type,
  onSubmit,
}: StockUpdateModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [reason, setReason] = useState(reasons[type][0])
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return

    setIsSubmitting(true)
    try {
      await onSubmit({
        productId: String(product._id),
        type,
        quantity,
        reason,
        notes,
      })
      setQuantity(1)
      setNotes("")
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  const newStock =
    type === "IN"
      ? (product?.currentStock || 0) + quantity
      : Math.max(0, (product?.currentStock || 0) - quantity)

  if (!isOpen || !product) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        >
          {/* Header */}
          <div
            className={cn(
              "flex items-center justify-between p-6",
              type === "IN" ? "bg-success/10" : "bg-info/10"
            )}
          >
            <div className="flex items-center gap-3">
              {type === "IN" ? (
                <ArrowDownCircle className="h-8 w-8 text-success" />
              ) : (
                <ArrowUpCircle className="h-8 w-8 text-info" />
              )}
              <div>
                <h2 className="text-xl font-semibold text-card-foreground">
                  Stock {type === "IN" ? "In" : "Out"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {product.name}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {/* Quantity */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-card-foreground">
                Quantity
              </label>
              <div className="flex items-center justify-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-xl"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="h-5 w-5" />
                </Button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  className="h-14 w-24 rounded-xl border border-input bg-background text-center text-2xl font-bold outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  min="1"
                  max={
                    type === "OUT" ? product.currentStock : undefined
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-xl"
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={
                    type === "OUT" && quantity >= product.currentStock
                  }
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Stock Preview */}
            <div className="mb-6 rounded-xl bg-muted/50 p-4">
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Current</p>
                  <p className="text-2xl font-bold text-card-foreground">
                    {product.currentStock}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-xl font-bold",
                      type === "IN" ? "text-success" : "text-info"
                    )}
                  >
                    {type === "IN" ? "+" : "-"}{quantity}
                  </span>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">New</p>
                  <p
                    className={cn(
                      "text-2xl font-bold",
                      newStock <= product.minStockThreshold
                        ? "text-warning"
                        : "text-success"
                    )}
                  >
                    {newStock}
                  </p>
                </div>
              </div>
            </div>

            {/* Reason */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-card-foreground">
                Reason
              </label>
              <div className="flex flex-wrap gap-2">
                {reasons[type].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReason(r)}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-medium transition-all",
                      reason === r
                        ? type === "IN"
                          ? "bg-success text-success-foreground"
                          : "bg-info text-info-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-card-foreground">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Add any additional notes..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || (type === "OUT" && quantity > product.currentStock)}
                className={cn(
                  "flex-1",
                  type === "IN"
                    ? "bg-success hover:bg-success/90"
                    : "bg-info hover:bg-info/90"
                )}
              >
                {isSubmitting ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Processing...
                  </>
                ) : (
                  <>Confirm {type === "IN" ? "Stock In" : "Stock Out"}</>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
