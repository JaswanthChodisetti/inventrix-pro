"use client"

import { motion } from "framer-motion"
import { AlertTriangle, ArrowRight, Package } from "lucide-react"
import Link from "next/link"
import { Product } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface LowStockAlertProps {
  products: Product[]
}

export function LowStockAlert({ products }: LowStockAlertProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="rounded-2xl border border-border bg-card p-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
            <AlertTriangle className="h-5 w-5 text-warning" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-card-foreground">
              Low Stock Alerts
            </h3>
            <p className="text-sm text-muted-foreground">
              {products.length} items need attention
            </p>
          </div>
        </div>
        <Link href="/dashboard/products?status=low_stock">
          <Button variant="ghost" size="sm" className="gap-1">
            View All
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Package className="mb-3 h-12 w-12 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              All products are well stocked
            </p>
          </div>
        ) : (
          products.slice(0, 5).map((product, index) => (
            <motion.div
              key={String(product._id)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="group flex items-center justify-between rounded-xl border border-border bg-background p-4 transition-all hover:border-warning/50 hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold",
                    product.status === "out_of_stock"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-warning/10 text-warning"
                  )}
                >
                  {product.currentStock}
                </div>
                <div>
                  <p className="font-medium text-card-foreground group-hover:text-primary">
                    {product.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    SKU: {product.sku} • Min: {product.minStockThreshold}
                  </p>
                </div>
              </div>
              <div
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium",
                  product.status === "out_of_stock"
                    ? "bg-destructive/10 text-destructive pulse-danger"
                    : "bg-warning/10 text-warning pulse-warning"
                )}
              >
                {product.status === "out_of_stock" ? "Out of Stock" : "Low Stock"}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  )
}
