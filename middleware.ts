import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Routes that require authentication
const protectedRoutes = ["/dashboard"]

// Routes that require admin role
const adminRoutes = ["/dashboard/users"]

// Routes that require admin or manager role
const managerRoutes = ["/dashboard/categories"]

// Public routes (auth pages, etc.)
const publicRoutes = ["/sign-in", "/register", "/forgot-password", "/reset-password"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionToken = request.cookies.get("inventrix_session")?.value

  // Check if trying to access protected route without authentication
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  if (isProtectedRoute && !sessionToken) {
    const signInUrl = new URL("/sign-in", request.url)
    signInUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(signInUrl)
  }

  // If user has a session, try to validate it and check role-based access
  if (sessionToken && isProtectedRoute) {
    // We need to verify the session is valid and get the user's role
    // Since middleware can't easily query MongoDB, we'll store user data in the cookie
    // Alternatively, we could use a JWT-based session

    // For now, we'll do a lightweight check - if they have a session cookie,
    // we assume it's valid (the session validation happens server-side in API routes)
    // Role-based checks will be enforced in the UI and API routes

    // Check admin-only routes
    const isAdminRoute = adminRoutes.some((route) =>
      pathname.startsWith(route)
    )

    if (isAdminRoute) {
      const userRole = request.cookies.get("user_role")?.value
      if (userRole !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }
    }

    // Check manager+ routes (admin or manager only)
    const isManagerRoute = managerRoutes.some((route) =>
      pathname.startsWith(route)
    )

    if (isManagerRoute) {
      const userRole = request.cookies.get("user_role")?.value
      if (userRole !== "admin" && userRole !== "manager") {
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }
    }
  }

  // Redirect authenticated users away from auth pages
  const isAuthRoute = publicRoutes.some((route) => pathname === route)
  if (isAuthRoute && sessionToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (robots.txt, sitemap.xml, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|icon-.*\\.png|apple-icon.*\\.png).*)",
  ],
}
