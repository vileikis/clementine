import { createFileRoute, redirect } from '@tanstack/react-router'
import { useWorkspaceStore } from '@/domains/workspace'

/**
 * Workspace index route
 *
 * Route: /workspace
 * Access: Admin only (enforced by parent route requireAdmin guard)
 *
 * Redirects admin to:
 * - Last visited workspace (if exists in localStorage)
 * - /admin/workspaces (if no workspace history)
 *
 * This provides seamless continuity - admins return to where they left off.
 */
export const Route = createFileRoute('/workspace/')({
  beforeLoad: () => {
    // Get last visited workspace slug from Zustand store (localStorage)
    const { lastVisitedWorkspaceSlug } = useWorkspaceStore.getState()

    if (lastVisitedWorkspaceSlug) {
      // Redirect to last visited workspace
      throw redirect({
        to: '/workspace/$workspaceSlug',
        params: { workspaceSlug: lastVisitedWorkspaceSlug },
      })
    }

    // No workspace history - redirect to admin workspaces list
    throw redirect({ to: '/admin/workspaces' })
  },
})
