"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import useSWR from "swr"
import {
  Plus,
  Search,
  Grid3X3,
  List,
  Filter,
  X,
  Package,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProductCard } from "@/components/products/product-card"
import { AddProductModal } from "@/components/products/add-product-modal"
import { StockUpdateModal } from "@/components/products/stock-update-modal"
import { Product, Category } from "@/lib/types"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useUser } from "@/lib/user-context"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const statusFilters = [
  { value: "all", label: "All Status" },
  { value: "in_stock", label: "In Stock" },
  { value: "low_stock", label: "Low Stock" },
  { value: "out_of_stock", label: "Out of Stock" },
  { value: "overstocked", label: "Overstocked" },
]

export default function ProductsPage() {
  const user = useUser()
  const canEdit = user.role === "admin" || user.role === "manager"

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [showFilters, setShowFilters] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [stockUpdateProduct, setStockUpdateProduct] = useState<Product | null>(
    null
  )
  const [stockUpdateType, setStockUpdateType] = useState<"IN" | "OUT">("IN")

  const { data: productsData, mutate: mutateProducts } = useSWR(
    "/api/products",
    fetcher
  )
  const { data: categoriesData } = useSWR("/api/categories", fetcher)

  const products: Product[] = productsData?.data || []
  const categories: Category[] = categoriesData?.data || []

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory =
        selectedCategory === "all" ||
        String(product.categoryId) === selectedCategory

      const matchesStatus =
        selectedStatus === "all" || product.status === selectedStatus

      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [products, searchQuery, selectedCategory, selectedStatus])

  const handleAddProduct = async (data: Record<string, unknown>) => {
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          images: [],
          tags: [],
        }),
      })
      const result = await res.json()
      if (res.ok) {
        toast.success("Product created successfully!")
        mutateProducts()
        setShowAddModal(false)
      } else {
        console.error("Create product error:", result)
        toast.error(result.error || "Failed to create product")
      }
    } catch (error) {
      console.error("Create product error:", error)
      toast.error("Failed to create product")
    }
  }

  const handleEditProduct = async (data: Record<string, unknown>) => {
    if (!editProduct) return
    try {
      const res = await fetch(`/api/products/${editProduct._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        toast.success("Product updated successfully!")
        mutateProducts()
        setEditProduct(null)
      } else {
        toast.error("Failed to update product")
      }
    } catch {
      toast.error("Failed to update product")
    }
  }

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) return
    try {
      const res = await fetch(`/api/products/${product._id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        toast.success("Product deleted successfully!")
        mutateProducts()
      } else {
        toast.error("Failed to delete product")
      }
    } catch {
      toast.error("Failed to delete product")
    }
  }

  const handleStockUpdate = async (data: {
    productId: string
    type: "IN" | "OUT"
    quantity: number
    reason: string
    notes: string
  }) => {
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        toast.success(
          `Stock ${data.type === "IN" ? "added" : "removed"} successfully!`
        )
        mutateProducts()
      } else {
        toast.error("Failed to update stock")
      }
    } catch {
      toast.error("Failed to update stock")
    }
  }

  const openStockUpdate = (product: Product, type: "IN" | "OUT") => {
    setStockUpdateProduct(product)
    setStockUpdateType(type)
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategory("all")
    setSelectedStatus("all")
  }

  const hasActiveFilters =
    searchQuery || selectedCategory !== "all" || selectedStatus !== "all"

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
            Products
          </h1>
          <p className="text-muted-foreground">
            {canEdit
              ? `Manage your inventory products (${filteredProducts.length} items)`
              : `Viewing ${filteredProducts.length} products`}
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => setShowAddModal(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        )}
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
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 rounded-xl border border-input p-1">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "rounded-lg p-2 transition-all",
              viewMode === "grid"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "rounded-lg p-2 transition-all",
              viewMode === "list"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="h-4 w-4" />
          </button>
        </div>

        {/* Filter Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className={cn("gap-2", showFilters && "border-primary text-primary")}
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              !
            </span>
          )}
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

      {/* Filter Panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="rounded-2xl border border-border bg-card p-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Category Filter */}
            <div>
              <label className="mb-2 block text-sm font-medium text-card-foreground">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-10 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={String(cat._id)} value={String(cat._id)}>
                    {cat.name} ({cat.productCount || 0})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="mb-2 block text-sm font-medium text-card-foreground">
                Status
              </label>
              <div className="flex flex-wrap gap-2">
                {statusFilters.map((status) => (
                  <button
                    key={status.value}
                    onClick={() => setSelectedStatus(status.value)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-sm font-medium transition-all",
                      selectedStatus === status.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Products Grid/List */}
      {filteredProducts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16"
        >
          <Package className="mb-4 h-16 w-16 text-muted-foreground/50" />
          <h3 className="mb-2 text-lg font-semibold text-card-foreground">
            No products found
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            {hasActiveFilters
              ? "Try adjusting your filters"
              : "Add your first product to get started"}
          </p>
          {hasActiveFilters ? (
            <Button variant="outline" onClick={clearFilters} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Clear Filters
            </Button>
          ) : canEdit ? (
            <Button onClick={() => setShowAddModal(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          ) : null}
        </motion.div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product, index) => (
            <ProductCard
              key={String(product._id)}
              product={product}
              index={index}
              onEdit={setEditProduct}
              onDelete={handleDeleteProduct}
              onStockUpdate={openStockUpdate}
              canEdit={canEdit}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((product, index) => (
            <motion.div
              key={String(product._id)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted"
                  style={{
                    backgroundColor: product.category?.color
                      ? `${product.category.color}20`
                      : undefined,
                  }}
                >
                  <Package
                    className="h-6 w-6"
                    style={{ color: product.category?.color }}
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">
                    {product.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {product.sku} • {product.category?.name || "Uncategorized"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="font-semibold text-card-foreground">
                    ${product.price.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Stock: {product.currentStock}
                  </p>
                </div>
                {canEdit && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openStockUpdate(product, "IN")}
                    >
                      +
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openStockUpdate(product, "OUT")}
                      disabled={product.currentStock === 0}
                    >
                      -
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditProduct(product)}
                    >
                      Edit
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modals */}
      <AddProductModal
        isOpen={showAddModal || !!editProduct}
        onClose={() => {
          setShowAddModal(false)
          setEditProduct(null)
        }}
        onSubmit={editProduct ? handleEditProduct : handleAddProduct}
        editProduct={editProduct}
      />

      <StockUpdateModal
        isOpen={!!stockUpdateProduct}
        onClose={() => setStockUpdateProduct(null)}
        product={stockUpdateProduct}
        type={stockUpdateType}
        onSubmit={handleStockUpdate}
      />
    </div>
  )
}
