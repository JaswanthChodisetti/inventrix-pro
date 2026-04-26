"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Package,
  Edit,
  Trash2,
  Plus,
  Minus,
  MoreVertical,
  MapPin,
  Tag,
} from "lucide-react"
import { Product } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useCurrency } from "@/lib/currency-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ProductCardProps {
  product: Product
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
  onStockUpdate: (product: Product, type: "IN" | "OUT") => void
  index: number
  canEdit?: boolean
}

const statusConfig = {
  in_stock: {
    label: "In Stock",
    className: "bg-success/10 text-success",
  },
  low_stock: {
    label: "Low Stock",
    className: "bg-warning/10 text-warning pulse-warning",
  },
  out_of_stock: {
    label: "Out of Stock",
    className: "bg-destructive/10 text-destructive pulse-danger",
  },
  overstocked: {
    label: "Overstocked",
    className: "bg-info/10 text-info",
  },
}

export function ProductCard({
  product,
  onEdit,
  onDelete,
  onStockUpdate,
  index,
  canEdit = true,
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const { formatCurrency } = useCurrency()

  const status = statusConfig[product.status] || statusConfig.in_stock

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5"
      style={{
        transform: isHovered
          ? "perspective(1000px) rotateX(2deg) rotateY(-2deg) translateY(-4px)"
          : "perspective(1000px) rotateX(0) rotateY(0) translateY(0)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* Gradient overlay on hover */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300",
          isHovered && "opacity-100"
        )}
      />

      {/* Content */}
      <div className="relative p-5">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted"
              style={{
                backgroundColor: product.category?.color
                  ? `${product.category.color}20`
                  : undefined,
              }}
            >
              <Package
                className="h-6 w-6"
                style={{
                  color: product.category?.color || "currentColor",
                }}
              />
            </div>
            <div>
              <h3 className="font-semibold text-card-foreground line-clamp-1">
                {product.name}
              </h3>
              <p className="text-xs text-muted-foreground font-mono">
                {product.sku}
              </p>
            </div>
          </div>
          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(product)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(product)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Description */}
        <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
          {product.description}
        </p>

        {/* Details */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Price</span>
            <span className="font-semibold text-card-foreground">
              {formatCurrency(product.price)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Category</span>
            <span
              className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: product.category?.color
                  ? `${product.category.color}20`
                  : "rgb(var(--muted))",
                color: product.category?.color || "inherit",
              }}
            >
              <Tag className="h-3 w-3" />
              {product.category?.name || "Uncategorized"}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Location</span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {product.location}
            </span>
          </div>
        </div>

        {/* Stock & Status */}
        <div className="flex items-center justify-between rounded-xl bg-muted/50 p-3">
          <div>
            <p className="text-xs text-muted-foreground">Current Stock</p>
            <p className="text-2xl font-bold text-card-foreground">
              {product.currentStock}
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                {product.unit}
              </span>
            </p>
          </div>
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium",
              status.className
            )}
          >
            {status.label}
          </span>
        </div>

        {/* Stock Actions */}
        {canEdit && (
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1"
              onClick={() => onStockUpdate(product, "IN")}
            >
              <Plus className="h-4 w-4" />
              Stock In
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1"
              onClick={() => onStockUpdate(product, "OUT")}
              disabled={product.currentStock === 0}
            >
              <Minus className="h-4 w-4" />
              Stock Out
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  )
}
