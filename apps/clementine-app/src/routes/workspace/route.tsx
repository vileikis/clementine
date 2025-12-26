import { Outlet, createFileRoute } from '@tanstack/react-router'
import { Sidebar } from '@/domains/navigation'

export const Route = createFileRoute('/workspace')({
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
