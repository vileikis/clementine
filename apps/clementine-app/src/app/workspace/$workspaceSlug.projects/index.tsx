import { createFileRoute } from '@tanstack/react-router'
import { ProjectsPage } from '@/domains/workspace/projects'

/**
 * Projects list page route (index)
 *
 * Route: /workspace/:workspaceSlug/projects (exact match)
 * Access: Admin only (enforced by parent route requireAdmin guard)
 *
 * Lists all active projects in the workspace with create/delete actions.
 * Workspace context is maintained via parent route.
 */
export const Route = createFileRoute('/workspace/$workspaceSlug/projects/')({
  component: ProjectsPageRoute,
})

function ProjectsPageRoute() {
  const { workspaceSlug } = Route.useParams()

  // TODO: Get actual workspaceId from workspace context/loader
  // For now, using workspaceSlug as workspaceId (temporary)
  const workspaceId = workspaceSlug

  return (
    <ProjectsPage workspaceId={workspaceId} workspaceSlug={workspaceSlug} />
  )
}
