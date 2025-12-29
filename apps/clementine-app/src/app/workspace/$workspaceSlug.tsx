import { Outlet, createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useWorkspace, useWorkspaceStore } from '@/domains/workspace'
import { NotFound } from '@/shared/components/NotFound'

/**
 * Workspace layout route
 *
 * Route: /workspace/:workspaceSlug
 * Access: Admin only (enforced by parent route requireAdmin guard)
 *
 * Layout route that renders child routes (projects, settings, etc.)
 * Stores last visited workspace in localStorage for session persistence (client-side only)
 * Workspace data is fetched via useWorkspace hook (TanStack Query cache)
 */
export const Route = createFileRoute('/workspace/$workspaceSlug')({
  component: WorkspaceLayout,
})

function WorkspaceLayout() {
  const { workspaceSlug } = Route.useParams()
  const { data: workspace, isLoading, isError } = useWorkspace(workspaceSlug)
  const setLastVisitedWorkspaceSlug = useWorkspaceStore(
    (state) => state.setLastVisitedWorkspaceSlug,
  )

  // Store last visited workspace (client-side only, runs after hydration)
  useEffect(() => {
    if (workspaceSlug) {
      setLastVisitedWorkspaceSlug(workspaceSlug)
    }
  }, [workspaceSlug, setLastVisitedWorkspaceSlug])

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading workspace...</div>
      </div>
    )
  }

  // Error or not found
  if (isError || !workspace) {
    return <WorkspaceNotFound />
  }

  // Workspace loaded successfully
  return <Outlet />
}

function WorkspaceNotFound() {
  return (
    <NotFound
      title="Workspace Not Found"
      message="The workspace you're looking for doesn't exist or has been deleted."
      actionLabel="View All Workspaces"
      actionHref="/admin/workspaces"
    />
  )
}
