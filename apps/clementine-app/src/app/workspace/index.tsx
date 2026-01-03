import { createFileRoute, redirect } from '@tanstack/react-router'
import { getCurrentUserFn } from '@/domains/auth/server'
import { isAdmin } from '@/domains/auth/utils/authChecks'

/**
 * Workspace index route
 *
 * Route: /workspace
 * Access: Admin only (enforced by parent route requireAdmin guard)
 *
 * Server-side redirect based on session data:
 * - Redirects to last visited workspace (if exists in session)
 * - Falls back to /admin/workspaces (if no workspace history)
 *
 * Uses beforeLoad for instant server-side redirect (no loading flash).
 */
export const Route = createFileRoute('/workspace/')({
  beforeLoad: async () => {
    const user = await getCurrentUserFn()

    // Parent route already enforces admin, but double-check for safety
    if (!user || !isAdmin(user)) {
      throw redirect({ to: '/login' })
    }

    // Redirect to last visited workspace if exists
    if (user.lastVisitedWorkspaceSlug) {
      throw redirect({
        to: '/workspace/$workspaceSlug',
        params: { workspaceSlug: user.lastVisitedWorkspaceSlug },
      })
    }

    // No workspace history - redirect to workspaces list
    throw redirect({
      to: '/admin/workspaces',
    })
  },
})
