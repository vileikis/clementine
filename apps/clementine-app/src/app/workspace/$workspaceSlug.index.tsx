import { Navigate, createFileRoute } from '@tanstack/react-router'

/**
 * Workspace index route
 *
 * Route: /workspace/:workspaceSlug (exact match)
 * Access: Admin only (enforced by parent route requireAdmin guard)
 *
 * Redirects to the projects page for the workspace.
 */
export const Route = createFileRoute('/workspace/$workspaceSlug/')({
  component: WorkspaceIndexRedirect,
})

function WorkspaceIndexRedirect() {
  const { workspaceSlug } = Route.useParams()
  return (
    <Navigate
      to="/workspace/$workspaceSlug/projects"
      params={{ workspaceSlug }}
    />
  )
}
