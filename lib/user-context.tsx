"use client"

import { createContext, useContext } from "react"
import { SessionUser } from "@/lib/auth"

interface UserContextType {
  user: SessionUser
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({
  user,
  children,
}: {
  user: SessionUser
  children: React.ReactNode
}) {
  return (
    <UserContext.Provider value={{ user }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context.user
}
