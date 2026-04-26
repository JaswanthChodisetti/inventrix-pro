import { redirect } from "next/navigation"
import { getCurrentUser, SessionUser } from "@/lib/auth"
import { Sidebar } from "@/components/layout/sidebar"
import { Topbar } from "@/components/layout/topbar"
import { UserProvider } from "@/lib/user-context"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check if user is authenticated
  const user = await getCurrentUser()

  if (!user) {
    redirect("/sign-in")
  }

  return (
    <UserProvider user={user}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar userRole={user.role} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar user={user} />
          <main className="flex-1 overflow-y-auto bg-background p-6">
            {children}
          </main>
        </div>
      </div>
    </UserProvider>
  )
}
