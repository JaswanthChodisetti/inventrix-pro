"use client"

import { useUser } from "@/lib/user-context"

type Role = "admin" | "manager" | "viewer"

export function usePermissions() {
  const user = useUser()

  const isAdmin = user.role === "admin"
  const isManager = user.role === "manager"
  const isViewer = user.role === "viewer"

  // Permission checkers
  const canEdit = isAdmin || isManager
  const canDelete = isAdmin || isManager
  const canManageUsers = isAdmin
  const canEditStock = isAdmin || isManager
  const canViewReports = true // All authenticated users
  const canExportData = isAdmin || isManager

  // Role-based navigation items
  const getNavItems = () => {
    const items = [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: "layout-dashboard",
        allowedFor: ["admin", "manager", "viewer"] as Role[],
      },
      {
        title: "Products",
        href: "/dashboard/products",
        icon: "package",
        allowedFor: ["admin", "manager", "viewer"] as Role[],
      },
      {
        title: "Categories",
        href: "/dashboard/categories",
        icon: "tags",
        allowedFor: ["admin", "manager"] as Role[],
      },
      {
        title: "Transactions",
        href: "/dashboard/transactions",
        icon: "arrow-left-right",
        allowedFor: ["admin", "manager", "viewer"] as Role[],
      },
      {
        title: "Reports",
        href: "/dashboard/reports",
        icon: "bar-chart-3",
        allowedFor: ["admin", "manager", "viewer"] as Role[],
      },
      {
        title: "Users",
        href: "/dashboard/users",
        icon: "users",
        allowedFor: ["admin"] as Role[],
      },
      {
        title: "Settings",
        href: "/dashboard/settings",
        icon: "settings",
        allowedFor: ["admin", "manager", "viewer"] as Role[],
      },
    ]

    return items.filter((item) => item.allowedFor.includes(user.role))
  }

  return {
    user,
    role: user.role,
    isAdmin,
    isManager,
    isViewer,
    canEdit,
    canDelete,
    canManageUsers,
    canEditStock,
    canViewReports,
    canExportData,
    getNavItems,
  }
}
