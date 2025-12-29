import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
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
 *
 * Note: Redirect happens client-side (useEffect) because localStorage
 * is not available during SSR (beforeLoad runs on server).
 */
export const Route = createFileRoute('/workspace/')({
  component: WorkspaceRedirect,
})

function WorkspaceRedirect() {
  const navigate = useNavigate()
  const { lastVisitedWorkspaceSlug } = useWorkspaceStore()

  useEffect(() => {
    // Client-side redirect after mount (when localStorage is available)
    if (lastVisitedWorkspaceSlug) {
      // Redirect to last visited workspace
      navigate({
        to: '/workspace/$workspaceSlug',
        params: { workspaceSlug: lastVisitedWorkspaceSlug },
        replace: true, // Replace history entry (don't add /workspace to history)
      })
    } else {
      // No workspace history - redirect to admin workspaces list
      navigate({
        to: '/admin/workspaces',
        replace: true,
      })
    }
  }, [lastVisitedWorkspaceSlug, navigate])

  // Show loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-muted-foreground">Loading...</div>
    </div>
  )
}
