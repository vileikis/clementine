import { Outlet, createFileRoute } from '@tanstack/react-router'
import { Sidebar } from '@/domains/navigation'
import { requireAdmin } from '@/domains/auth/guards'

// T022: Implement admin route guard (beforeLoad) checking isAdmin
// Updated for server-side auth validation (T122)
export const Route = createFileRoute('/admin')({
  beforeLoad: async () => {
    // Server-side auth validation (works on both server and client)
    await requireAdmin()
  },
  component: AdminLayout,
})

function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar area="admin" />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
