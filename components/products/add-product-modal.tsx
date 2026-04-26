"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  X,
  Package,
  DollarSign,
  MapPin,
  Tag,
  Hash,
  FileText,
  Boxes,
  ChevronRight,
  ChevronLeft,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Category, Product } from "@/lib/types"
import { cn } from "@/lib/utils"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  description: z.string().min(1, "Description is required"),
  categoryId: z.string().min(1, "Category is required"),
  price: z.coerce.number().min(0, "Price must be positive"),
  cost: z.coerce.number().min(0, "Cost must be positive"),
  currentStock: z.coerce.number().min(0, "Stock must be non-negative"),
  minStockThreshold: z.coerce.number().min(0, "Threshold must be positive"),
  maxStockThreshold: z.coerce.number().min(0, "Threshold must be positive"),
  unit: z.string().min(1, "Unit is required"),
  location: z.string().min(1, "Location is required"),
  supplier: z.string().optional(),
  barcode: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

type ProductFormData = z.infer<typeof productSchema>

interface AddProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ProductFormData) => Promise<void>
  editProduct?: Product | null
}

const steps = [
  { id: 1, title: "Basic Info", icon: Package },
  { id: 2, title: "Pricing", icon: DollarSign },
  { id: 3, title: "Inventory", icon: Boxes },
  { id: 4, title: "Details", icon: FileText },
]

export function AddProductModal({
  isOpen,
  onClose,
  onSubmit,
  editProduct,
}: AddProductModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: categoriesData } = useSWR("/api/categories", fetcher)
  const categories: Category[] = categoriesData?.data || []

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      sku: "",
      description: "",
      categoryId: "",
      price: 0,
      cost: 0,
      currentStock: 0,
      minStockThreshold: 5,
      maxStockThreshold: 100,
      unit: "pcs",
      location: "",
      supplier: "",
      barcode: "",
      tags: [],
    },
  })

  useEffect(() => {
    if (editProduct) {
      setValue("name", editProduct.name)
      setValue("sku", editProduct.sku)
      setValue("description", editProduct.description)
      setValue("categoryId", String(editProduct.categoryId))
      setValue("price", editProduct.price)
      setValue("cost", editProduct.cost)
      setValue("currentStock", editProduct.currentStock)
      setValue("minStockThreshold", editProduct.minStockThreshold)
      setValue("maxStockThreshold", editProduct.maxStockThreshold)
      setValue("unit", editProduct.unit)
      setValue("location", editProduct.location)
      setValue("supplier", editProduct.supplier || "")
      setValue("barcode", editProduct.barcode || "")
      setValue("tags", editProduct.tags || [])
    } else {
      reset()
    }
    setCurrentStep(1)
  }, [editProduct, setValue, reset, isOpen])

  const handleFormSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
      reset()
      setCurrentStep(1)
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  if (!isOpen) return null

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
          className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border p-6">
            <div>
              <h2 className="text-xl font-semibold text-card-foreground">
                {editProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <p className="text-sm text-muted-foreground">
                Step {currentStep} of {steps.length}
              </p>
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

          {/* Progress Steps */}
          <div className="border-b border-border px-6 py-4">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon
                const isCompleted = currentStep > step.id
                const isCurrent = currentStep === step.id

                return (
                  <div key={step.id} className="flex items-center">
                    <button
                      onClick={() => setCurrentStep(step.id)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-3 py-2 transition-all",
                        isCurrent && "bg-primary text-primary-foreground",
                        isCompleted && "text-primary",
                        !isCurrent && !isCompleted && "text-muted-foreground"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all",
                          isCurrent && "border-primary-foreground bg-primary-foreground/20",
                          isCompleted && "border-primary bg-primary text-primary-foreground",
                          !isCurrent && !isCompleted && "border-muted-foreground/50"
                        )}
                      >
                        {isCompleted ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Icon className="h-4 w-4" />
                        )}
                      </div>
                      <span className="hidden text-sm font-medium sm:block">
                        {step.title}
                      </span>
                    </button>
                    {index < steps.length - 1 && (
                      <ChevronRight className="mx-2 h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(handleFormSubmit)}>
            <div className="max-h-[400px] overflow-y-auto p-6">
              <AnimatePresence mode="wait">
                {/* Step 1: Basic Info */}
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="mb-2 block text-sm font-medium text-card-foreground">
                        Product Name
                      </label>
                      <input
                        {...register("name")}
                        className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                        placeholder="Enter product name"
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-destructive">
                          {errors.name.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-card-foreground">
                        SKU
                      </label>
                      <input
                        {...register("sku")}
                        className="h-11 w-full rounded-xl border border-input bg-background px-4 font-mono text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                        placeholder="PROD-001"
                      />
                      {errors.sku && (
                        <p className="mt-1 text-sm text-destructive">
                          {errors.sku.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-card-foreground">
                        Description
                      </label>
                      <textarea
                        {...register("description")}
                        rows={3}
                        className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                        placeholder="Enter product description"
                      />
                      {errors.description && (
                        <p className="mt-1 text-sm text-destructive">
                          {errors.description.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-card-foreground">
                        Category
                      </label>
                      <select
                        {...register("categoryId")}
                        className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">Select a category</option>
                        {categories.map((cat) => (
                          <option key={String(cat._id)} value={String(cat._id)}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      {errors.categoryId && (
                        <p className="mt-1 text-sm text-destructive">
                          {errors.categoryId.message}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Pricing */}
                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-card-foreground">
                          Selling Price
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <input
                            type="number"
                            step="0.01"
                            {...register("price", { valueAsNumber: true })}
                            className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                            placeholder="0.00"
                          />
                        </div>
                        {errors.price && (
                          <p className="mt-1 text-sm text-destructive">
                            {errors.price.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-card-foreground">
                          Cost Price
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <input
                            type="number"
                            step="0.01"
                            {...register("cost", { valueAsNumber: true })}
                            className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                            placeholder="0.00"
                          />
                        </div>
                        {errors.cost && (
                          <p className="mt-1 text-sm text-destructive">
                            {errors.cost.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="rounded-xl bg-accent/50 p-4">
                      <p className="text-sm text-muted-foreground">
                        Profit Margin:{" "}
                        <span className="font-semibold text-success">
                          {watch("price") && watch("cost")
                            ? (
                                ((watch("price") - watch("cost")) /
                                  watch("price")) *
                                100
                              ).toFixed(1)
                            : 0}
                          %
                        </span>
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Inventory */}
                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-card-foreground">
                          Current Stock
                        </label>
                        <input
                          type="number"
                          {...register("currentStock", { valueAsNumber: true })}
                          className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                          placeholder="0"
                        />
                        {errors.currentStock && (
                          <p className="mt-1 text-sm text-destructive">
                            {errors.currentStock.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-card-foreground">
                          Unit
                        </label>
                        <select
                          {...register("unit")}
                          className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                        >
                          <option value="pcs">Pieces</option>
                          <option value="kg">Kilograms</option>
                          <option value="lbs">Pounds</option>
                          <option value="boxes">Boxes</option>
                          <option value="bags">Bags</option>
                          <option value="containers">Containers</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-card-foreground">
                          Min Stock Threshold
                        </label>
                        <input
                          type="number"
                          {...register("minStockThreshold", {
                            valueAsNumber: true,
                          })}
                          className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                          placeholder="5"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-card-foreground">
                          Max Stock Threshold
                        </label>
                        <input
                          type="number"
                          {...register("maxStockThreshold", {
                            valueAsNumber: true,
                          })}
                          className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                          placeholder="100"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 4: Details */}
                {currentStep === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="mb-2 block text-sm font-medium text-card-foreground">
                        Location
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                          {...register("location")}
                          className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                          placeholder="Warehouse A - Shelf 1"
                        />
                      </div>
                      {errors.location && (
                        <p className="mt-1 text-sm text-destructive">
                          {errors.location.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-card-foreground">
                        Supplier
                      </label>
                      <input
                        {...register("supplier")}
                        className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                        placeholder="Supplier name"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-card-foreground">
                        Barcode
                      </label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                          {...register("barcode")}
                          className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-4 font-mono text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                          placeholder="123456789012"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border p-6">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              {currentStep < steps.length ? (
                <Button type="button" onClick={nextStep} className="gap-2">
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting} className="gap-2">
                  {isSubmitting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      {editProduct ? "Update Product" : "Create Product"}
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
