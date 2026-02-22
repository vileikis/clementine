import { createFileRoute } from '@tanstack/react-router'
import { NotFound } from '@/shared/components/NotFound'
import { ProjectLayout, useProject } from '@/domains/project'

/**
 * Project layout route
 *
 * Route: /workspace/:workspaceSlug/projects/:projectId
 * Access: Admin only (enforced by parent route)
 *
 * Layout for project routes (designer, distribute, connect, analytics).
 * Project data is fetched client-side via useProject hook (real-time updates).
 */
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/projects/$projectId',
)({
  component: ProjectLayoutRoute,
  notFoundComponent: ProjectNotFound,
})

function ProjectLayoutRoute() {
  const { workspaceSlug, projectId } = Route.useParams()
  const { data: project, isLoading } = useProject(projectId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading project...</div>
      </div>
    )
  }

  if (!project || project.status === 'deleted') {
    return <ProjectNotFound />
  }

  return <ProjectLayout project={project} workspaceSlug={workspaceSlug} />
}

function ProjectNotFound() {
  const { workspaceSlug } = Route.useParams()

  return (
    <NotFound
      title="Project Not Found"
      message="The project you're looking for doesn't exist or has been deleted."
      actionLabel="View All Projects"
      actionHref={`/workspace/${workspaceSlug}/projects`}
    />
  )
}
