import { redirect } from "next/navigation"
import { isValidAdminSecret } from "@/lib/auth"
import { cookies } from "next/headers"

/**
 * Dashboard Root Layout - Authentication Boundary
 *
 * Responsibilities:
 * - Authentication verification (redirect to /login if not authenticated)
 * - Root layout for all authenticated routes
 * - No visual UI (child layouts handle navigation/headers)
 *
 * Note: Primary auth is handled by proxy.ts middleware, this is a backup check
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const adminSecret = cookieStore.get("ADMIN_SECRET")?.value

  // Backup auth check (primary check is in proxy.ts middleware)
  if (!isValidAdminSecret(adminSecret)) {
    redirect("/login")
  }

  return <>{children}</>
}
