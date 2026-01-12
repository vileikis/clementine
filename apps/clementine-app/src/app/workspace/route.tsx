import { Outlet, createFileRoute, useParams } from '@tanstack/react-router'
import { WorkspaceSidebar } from '@/domains/navigation'
import { requireAdmin } from '@/domains/auth/guards'

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
  const params = useParams({ strict: false })
  const workspaceSlug =
    'workspaceSlug' in params ? params.workspaceSlug : undefined

  // Show nothing if no workspace slug (shouldn't happen in normal flow)
  if (!workspaceSlug) {
    return (
      <main className="flex-1 min-h-screen bg-background">
        <Outlet />
      </main>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <WorkspaceSidebar workspaceSlug={workspaceSlug} />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
