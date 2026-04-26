"use client"

import { motion } from "framer-motion"
import useSWR from "swr"
import {
  Bell,
  Check,
  Trash2,
  AlertTriangle,
  Package,
  Info,
  CheckCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Notification } from "@/lib/types"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function NotificationsPage() {
  const { data, mutate, isLoading } = useSWR("/api/notifications", fetcher)
  const notifications: Notification[] = data?.data || []
  const unreadCount = data?.unreadCount || 0

  const markAsRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      mutate()
    } catch {
      toast.error("Failed to mark as read")
    }
  }

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      })
      toast.success("All notifications marked as read")
      mutate()
    } catch {
      toast.error("Failed to mark all as read")
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      await fetch(`/api/notifications?id=${id}`, {
        method: "DELETE",
      })
      toast.success("Notification deleted")
      mutate()
    } catch {
      toast.error("Failed to delete notification")
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "stock_alert":
        return <AlertTriangle className="h-5 w-5 text-warning" />
      case "transaction":
        return <Package className="h-5 w-5 text-success" />
      default:
        return <Info className="h-5 w-5 text-info" />
    }
  }

  const formatTimeAgo = (date: string | Date) => {
    const now = new Date()
    const then = new Date(date)
    const diff = now.getTime() - then.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`
    return "Just now"
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="shimmer h-10 w-48 rounded-lg" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="shimmer h-24 rounded-xl" />
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
            Notifications
          </h1>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllRead} variant="outline" className="gap-2">
            <CheckCheck className="h-4 w-4" />
            Mark All Read
          </Button>
        )}
      </motion.div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16"
        >
          <Bell className="mb-4 h-16 w-16 text-muted-foreground/50" />
          <h3 className="mb-2 text-lg font-semibold text-card-foreground">
            No notifications
          </h3>
          <p className="text-sm text-muted-foreground">
            You&apos;re all caught up! Notifications will appear here.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification, index) => (
            <motion.div
              key={String(notification._id)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className={cn(
                "group flex items-start justify-between rounded-xl border border-border bg-card p-4 transition-all hover:shadow-sm",
                !notification.read && "border-primary/30 bg-primary/5"
              )}
            >
              <div className="flex gap-4">
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                    notification.type === "stock_alert" && "bg-warning/10",
                    notification.type === "transaction" && "bg-success/10",
                    notification.type === "system" && "bg-info/10"
                  )}
                >
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3
                      className={cn(
                        "font-semibold text-card-foreground",
                        !notification.read && "text-primary"
                      )}
                    >
                      {notification.title}
                    </h3>
                    {!notification.read && (
                      <span className="flex h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {notification.message}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground/70">
                    {formatTimeAgo(notification.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                {!notification.read && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => markAsRead(String(notification._id))}
                    title="Mark as read"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => deleteNotification(String(notification._id))}
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
