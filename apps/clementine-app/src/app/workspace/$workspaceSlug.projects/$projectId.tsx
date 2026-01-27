import { createFileRoute, notFound } from '@tanstack/react-router'
import { doc, getDoc } from 'firebase/firestore'
import { projectSchema } from '@clementine/shared'
import { firestore } from '@/integrations/firebase/client'
import { convertFirestoreDoc } from '@/shared/utils/firestore-utils'
import { NotFound } from '@/shared/components/NotFound'
import { ProjectConfigDesignerLayout } from '@/domains/project-config'
import { useProject } from '@/domains/project'

/**
 * Project layout route
 *
 * Route: /workspace/:workspaceSlug/projects/:projectId
 * Access: Admin only (enforced by parent route)
 *
 * Layout for project routes (welcome, theme, share, settings).
 * Loads project data and renders the designer layout.
 */
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/projects/$projectId',
)({
  loader: async ({ params }) => {
    // Fetch project
    const projectRef = doc(firestore, 'projects', params.projectId)
    const projectDoc = await getDoc(projectRef)

    if (!projectDoc.exists()) {
      throw notFound()
    }

    // Convert Firestore document (Timestamps → numbers) and validate with schema
    const project = convertFirestoreDoc(projectDoc, projectSchema)

    // Return 404 for soft-deleted projects
    if (project.status === 'deleted') {
      throw notFound()
    }

    // TODO: Validate project belongs to workspace (prevent cross-workspace access)
    // For now, skipping this check to simplify

    return { project }
  },
  component: ProjectLayout,
  notFoundComponent: ProjectNotFound,
})

function ProjectLayout() {
  const { workspaceSlug, projectId } = Route.useParams()

  // Get data from hooks (real-time updates enabled)
  const { data: project } = useProject(projectId)

  // Data should be immediately available from loader cache
  // This check is a safety guard only
  if (!project) {
    return null
  }

  return (
    <ProjectConfigDesignerLayout
      project={project}
      workspaceSlug={workspaceSlug}
    />
  )
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
