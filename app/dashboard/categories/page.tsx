"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import useSWR from "swr"
import { Plus, Tags, Package, Trash2, Edit, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Category } from "@/lib/types"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useUser } from "@/lib/user-context"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const iconOptions = ["Laptop", "Sofa", "Coffee", "Shirt", "Heart", "Box", "Star"]
const colorOptions = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EC4899",
  "#8B5CF6",
  "#EF4444",
  "#06B6D4",
]

export default function CategoriesPage() {
  const user = useUser()
  const canEdit = user.role === "admin" || user.role === "manager"

  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: colorOptions[0],
    icon: iconOptions[0],
  })

  const { data, mutate } = useSWR("/api/categories", fetcher)
  const categories: Category[] = data?.data || []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingId) {
        const res = await fetch(`/api/categories/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })
        if (res.ok) {
          toast.success("Category updated!")
          mutate()
        } else {
          const result = await res.json()
          toast.error(result.error || "Failed to update category")
          return
        }
      } else {
        const res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })
        if (res.ok) {
          toast.success("Category created!")
          mutate()
        } else {
          const result = await res.json()
          toast.error(result.error || "Failed to create category")
          return
        }
      }
      setFormData({
        name: "",
        description: "",
        color: colorOptions[0],
        icon: iconOptions[0],
      })
      setShowAddForm(false)
      setEditingId(null)
    } catch {
      toast.error("Failed to save category")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Category deleted!")
        mutate()
      } else {
        toast.error(data.error || "Failed to delete category")
      }
    } catch {
      toast.error("Failed to delete category")
    }
  }

  const startEdit = (category: Category) => {
    setEditingId(String(category._id))
    setFormData({
      name: category.name,
      description: category.description,
      color: category.color,
      icon: category.icon,
    })
    setShowAddForm(true)
  }

  const cancelForm = () => {
    setShowAddForm(false)
    setEditingId(null)
    setFormData({
      name: "",
      description: "",
      color: colorOptions[0],
      icon: iconOptions[0],
    })
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
            Categories
          </h1>
          <p className="text-muted-foreground">
            {canEdit
              ? "Organize your products with categories"
              : "Viewing product categories"}
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => setShowAddForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
        )}
      </motion.div>

      {/* Add/Edit Form */}
      {showAddForm && canEdit && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-6"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-card-foreground">
              {editingId ? "Edit Category" : "New Category"}
            </h2>
            <Button variant="ghost" size="icon" onClick={cancelForm}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="h-10 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="Category name"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="h-10 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="Short description"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-card-foreground">
                Color
              </label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl transition-all",
                      formData.color === color
                        ? "ring-2 ring-primary ring-offset-2"
                        : ""
                    )}
                    style={{ backgroundColor: color }}
                  >
                    {formData.color === color && (
                      <Check className="h-5 w-5 text-white" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={cancelForm}>
                Cancel
              </Button>
              <Button type="submit">
                {editingId ? "Update Category" : "Create Category"}
              </Button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Categories Grid */}
      {categories.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16"
        >
          <Tags className="mb-4 h-16 w-16 text-muted-foreground/50" />
          <h3 className="mb-2 text-lg font-semibold text-card-foreground">
            No categories yet
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Create categories to organize your products
          </p>
          {canEdit && (
            <Button onClick={() => setShowAddForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          )}
        </motion.div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category, index) => (
            <motion.div
              key={String(category._id)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card-hover group relative overflow-hidden rounded-2xl border border-border bg-card p-6"
            >
              {/* Colored accent */}
              <div
                className="absolute left-0 top-0 h-1 w-full"
                style={{ backgroundColor: category.color }}
              />

              <div className="mb-4 flex items-start justify-between">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${category.color}20` }}
                >
                  <Tags
                    className="h-6 w-6"
                    style={{ color: category.color }}
                  />
                </div>
                {canEdit && (
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => startEdit(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(String(category._id))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <h3 className="mb-1 font-semibold text-card-foreground">
                {category.name}
              </h3>
              <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
                {category.description || "No description"}
              </p>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Package className="h-4 w-4" />
                <span>{category.productCount || 0} products</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
