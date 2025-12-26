import { Outlet, createFileRoute } from '@tanstack/react-router'
import { Sidebar } from '@/domains/navigation'

export const Route = createFileRoute('/admin')({
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
