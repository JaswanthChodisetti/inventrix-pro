import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check if user is already logged in
  const user = await getCurrentUser()
  
  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  )
}
