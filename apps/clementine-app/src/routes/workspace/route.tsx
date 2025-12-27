import { Outlet, createFileRoute } from '@tanstack/react-router'
import { Sidebar } from '@/domains/navigation'
import { requireAdmin } from '@/domains/auth/lib/guards'

// T025: Implement workspace route guard (beforeLoad) checking isAdmin
// Updated for server-side auth validation (T123)
export const Route = createFileRoute('/workspace')({
  beforeLoad: async () => {
    // Server-side auth validation (works on both server and client)
    await requireAdmin()
  },
  component: WorkspaceLayout,
})

function WorkspaceLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar area="workspace" />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
