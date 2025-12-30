import { createFileRoute } from '@tanstack/react-router'
import { ProjectsPage } from '@/domains/workspace/projects'
import { useWorkspace } from '@/domains/workspace'

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

  const { data: workspace } = useWorkspace(workspaceSlug)

  return (
    <ProjectsPage
      workspaceId={workspace?.id || ''}
      workspaceSlug={workspaceSlug}
    />
  )
}
