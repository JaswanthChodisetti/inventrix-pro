# Authentication Middleware Implementation

## Overview
Added comprehensive authentication middleware with role-based access control (RBAC) to protect dashboard routes and enforce permission levels.

## Files Created/Modified

### New Files
- `middleware.ts` - Main authentication middleware
- `app/unauthorized/page.tsx` - Unauthorized access error page
- `lib/use-permissions.ts` - React hook for permission checks in components

### Modified Files
- `app/api/auth/login/route.ts` - Sets `user_role` cookie on login
- `app/api/auth/logout/route.ts` - Clears `user_role` cookie on logout
- `app/api/auth/register/route.ts` - Sets `user_role` cookie on registration
- `components/layout/sidebar.tsx` - Updated to use role-based navigation filtering

## How It Works

### Middleware Protection Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Incoming Request                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  middleware.ts                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 1. Check if route is protected (/dashboard/*)         │  │
│  │    - If YES and NO session → Redirect to /sign-in     │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 2. If has session, check role-based access            │  │
│  │    - /dashboard/users → Admin only                    │  │
│  │    - /dashboard/categories, /products → Admin/Manager │  │
│  │    - If role insufficient → Redirect to /dashboard    │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 3. Auth pages (/sign-in, /register)                   │  │
│  │    - If already logged in → Redirect to /dashboard    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Role Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                         ADMIN                                │
│  ✓ Full access to all routes                                │
│  ✓ User management                                          │
│  ✓ Edit/Delete products, categories, transactions           │
│  ✓ System settings                                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       MANAGER                                │
│  ✓ Edit/Delete products, categories, transactions           │
│  ✓ View reports and analytics                               │
│  ✗ Cannot access User Management                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        VIEWER                                │
│  ✓ View dashboard, products, transactions, reports          │
│  ✗ Cannot edit or delete                                    │
│  ✗ Cannot access User Management                            │
└─────────────────────────────────────────────────────────────┘
```

### Route Protection Matrix

| Route | Admin | Manager | Viewer | Unauthenticated |
|-------|-------|---------|--------|-----------------|
| `/dashboard` | ✓ | ✓ | ✓ | → `/sign-in` |
| `/dashboard/products` | ✓ | ✓ | ✓ | → `/sign-in` |
| `/dashboard/categories` | ✓ | ✓ | → Dashboard | → `/sign-in` |
| `/dashboard/transactions` | ✓ | ✓ | ✓ | → `/sign-in` |
| `/dashboard/reports` | ✓ | ✓ | ✓ | → `/sign-in` |
| `/dashboard/users` | ✓ | → Dashboard | → Dashboard | → `/sign-in` |
| `/dashboard/settings` | ✓ | ✓ | ✓ | → `/sign-in` |
| `/sign-in`, `/register` | → Dashboard | → Dashboard | → Dashboard | ✓ |

## Cookies Used

| Cookie Name | HttpOnly | Purpose |
|-------------|----------|---------|
| `inventrix_session` | ✓ | Session token (validated server-side) |
| `user_role` | ✗ | User role for middleware (read by client for UI) |

## Security Considerations

### Current Implementation
- Session tokens are stored in HttpOnly cookies (secure, XSS-resistant)
- Role is stored in non-HttpOnly cookie (needed for middleware)
- Server-side validation in API routes provides additional security layer

### Recommendations for Production
1. **Consider JWT sessions** - Encode role in JWT for tamper-proof role verification
2. **Add CSRF protection** - Use Next.js CSRF middleware or custom tokens
3. **Session invalidation** - Implement session versioning for forced logouts
4. **Rate limiting** - Add rate limiting to auth endpoints

## Testing

### Manual Testing Checklist

1. **Unauthenticated access:**
   - [ ] Navigate to `/dashboard` → redirects to `/sign-in`
   - [ ] Navigate to `/dashboard/users` → redirects to `/sign-in`

2. **Viewer role:**
   - [ ] Can access dashboard, products, transactions, reports
   - [ ] Cannot see Categories in navigation
   - [ ] Cannot see User Management in navigation
   - [ ] Manually navigating to `/dashboard/categories` → redirects to dashboard
   - [ ] Manually navigating to `/dashboard/users` → redirects to dashboard

3. **Manager role:**
   - [ ] Can access all routes except User Management
   - [ ] Manually navigating to `/dashboard/users` → redirects to dashboard

4. **Admin role:**
   - [ ] Can access all routes

5. **Authenticated user on auth pages:**
   - [ ] Navigating to `/sign-in` while logged in → redirects to dashboard

## Usage in Components

```tsx
// In any dashboard component:
import { useUser } from "@/lib/user-context"
import { usePermissions } from "@/lib/use-permissions"

export function MyComponent() {
  const { role, canEdit, canDelete, canManageUsers } = usePermissions()

  return (
    <div>
      {canEdit && <EditButton />}
      {canDelete && <DeleteButton />}
      {canManageUsers && <UserManagementPanel />}
    </div>
  )
}
```

## Future Enhancements

1. **Permission-based button visibility** - Use `usePermissions` hook throughout
2. **Audit logging** - Track who accessed what
3. **Session timeout warning** - Warn users before session expires
4. **Remember device** - Option for extended session duration
5. **2FA support** - Add two-factor authentication
