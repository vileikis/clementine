import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import type { MyRouterContext } from '../__root'
import { Sidebar } from '@/domains/navigation'

// T025: Implement workspace route guard (beforeLoad) checking isAdmin
export const Route = createFileRoute('/workspace')({
  beforeLoad: ({ context }: { context: MyRouterContext }) => {
    const { auth } = context

    if (!auth) {
      throw new Error('Auth not available in context')
    }

    // Wait for auth to initialize
    if (auth.isLoading) {
      // This shouldn't happen due to root route wait, but defensive check
      throw new Error('Auth not initialized')
    }

    // Check if user is authenticated
    if (!auth.user) {
      throw redirect({ to: '/' as const })
    }

    // Check if user is not anonymous
    if (auth.isAnonymous) {
      throw redirect({ to: '/' as const })
    }

    // Check if user has admin claim
    if (!auth.isAdmin) {
      throw redirect({ to: '/' as const })
    }

    // User is authenticated, non-anonymous, and has admin claim
    return
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
