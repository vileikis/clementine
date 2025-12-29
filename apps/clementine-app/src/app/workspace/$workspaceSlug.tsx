import { Outlet, createFileRoute } from '@tanstack/react-router'
import { useWorkspaceStore, useWorkspace } from '@/domains/workspace'
import { NotFound } from '@/shared/components/NotFound'

/**
 * Workspace layout route
 *
 * Route: /workspace/:workspaceSlug
 * Access: Admin only (enforced by parent route requireAdmin guard)
 *
 * Layout route that renders child routes (projects, settings, etc.)
 * Stores last visited workspace for session persistence
 * Workspace data is fetched via useWorkspace hook (TanStack Query cache)
 */
export const Route = createFileRoute('/workspace/$workspaceSlug')({
  beforeLoad: ({ params }) => {
    const { workspaceSlug } = params

    // Store last visited workspace for session persistence
    // Workspace fetch happens via useWorkspace hook in child components
    useWorkspaceStore.getState().setLastVisitedWorkspaceSlug(workspaceSlug)
  },
  component: WorkspaceLayout,
})

function WorkspaceLayout() {
  const { workspaceSlug } = Route.useParams()
  const { data: workspace, isLoading, isError } = useWorkspace(workspaceSlug)

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
