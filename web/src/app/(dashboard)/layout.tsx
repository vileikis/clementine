/**
 * Dashboard Root Layout - Authentication Boundary
 *
 * All routes under (dashboard) are protected by proxy.ts middleware.
 * This layout serves as a logical grouping for authenticated routes.
 * Child layouts handle their own navigation/headers.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
