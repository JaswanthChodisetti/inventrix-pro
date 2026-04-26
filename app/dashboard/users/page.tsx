"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import useSWR from "swr"
import { Users, UserPlus, Shield, Edit2, Save, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

type Role = "admin" | "manager" | "viewer"

const roleColors: Record<Role, string> = {
  admin: "bg-red-100 text-red-800 border-red-200",
  manager: "bg-blue-100 text-blue-800 border-blue-200",
  viewer: "bg-gray-100 text-gray-800 border-gray-200",
}

const roleDescriptions: Record<Role, string> = {
  admin: "Full access to all features including user management",
  manager: "Can manage products, categories, and transactions",
  viewer: "Read-only access to view inventory and reports",
}

interface User {
  _id: string
  name: string
  email: string
  role: Role
  createdAt: string
}

export default function UsersPage() {
  const { data, mutate, isLoading } = useSWR("/api/users", fetcher)
  const users: User[] = data?.data || []

  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<Role>("viewer")
  const [isSaving, setIsSaving] = useState(false)

  // New user form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "viewer" as Role,
  })

  const handleRoleChange = async (userId: string, newRole: Role) => {
    setIsSaving(true)
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      })

      const result = await res.json()

      if (res.ok) {
        toast.success("User role updated successfully!")
        mutate()
        setEditingId(null)
      } else {
        toast.error(result.error || "Failed to update role")
      }
    } catch {
      toast.error("Failed to update role")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      })

      const result = await res.json()

      if (res.ok) {
        toast.success("User created successfully!")
        mutate()
        setShowAddForm(false)
        setNewUser({ name: "", email: "", password: "", role: "viewer" })
      } else {
        toast.error(result.error || "Failed to create user")
      }
    } catch {
      toast.error("Failed to create user")
    } finally {
      setIsSaving(false)
    }
  }

  const startEditing = (user: User) => {
    setEditingId(user._id)
    setSelectedRole(user.role)
  }

  const cancelEditing = () => {
    setEditingId(null)
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
            User Management
          </h1>
          <p className="text-muted-foreground">
            Manage user roles and permissions ({users.length} users)
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add User
        </Button>
      </motion.div>

      {/* Add User Form */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-6"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-card-foreground">
              Create New User
            </h2>
            <Button variant="ghost" size="icon" onClick={() => setShowAddForm(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">
                  Name
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="h-10 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">
                  Email
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="h-10 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-card-foreground">
                Password
              </label>
              <input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="h-10 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Create a password"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-card-foreground">
                Role
              </label>
              <div className="flex gap-2">
                {(["viewer", "manager", "admin"] as Role[]).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setNewUser({ ...newUser, role })}
                    className={cn(
                      "flex-1 rounded-xl border px-4 py-2 text-sm font-medium transition-all",
                      newUser.role === role
                        ? roleColors[role] + " border-current"
                        : "border-input bg-background hover:bg-muted"
                    )}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create User"
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Users List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : users.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16"
        >
          <Users className="mb-4 h-16 w-16 text-muted-foreground/50" />
          <h3 className="mb-2 text-lg font-semibold text-card-foreground">
            No users found
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Create users to manage access to the system
          </p>
          <Button onClick={() => setShowAddForm(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add User
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {users.map((user, index) => (
            <motion.div
              key={user._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Shield className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{user.name}</CardTitle>
                        <CardDescription>{user.email}</CardDescription>
                      </div>
                    </div>
                    {editingId === user._id ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value as Role)}
                          className="h-10 rounded-xl border border-input bg-background px-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                        </select>
                        <Button
                          size="sm"
                          onClick={() => handleRoleChange(user._id, selectedRole)}
                          disabled={isSaving}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={cancelEditing}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Badge className={cn("border", roleColors[user.role])}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startEditing(user)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {roleDescriptions[user.role]}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Created: {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
