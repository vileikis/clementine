import { Outlet, createFileRoute, notFound } from '@tanstack/react-router'
import { doc, getDoc } from 'firebase/firestore'
import { projectSchema } from '@clementine/shared'
import { firestore } from '@/integrations/firebase/client'
import { convertFirestoreDoc } from '@/shared/utils/firestore-utils'
import { NotFound } from '@/shared/components/NotFound'

/**
 * Project layout route
 *
 * Route: /workspace/:workspaceSlug/projects/:projectId
 * Access: Admin only (enforced by parent route)
 *
 * Layout for project routes (details, events, etc.)
 * Loads project data and makes it available to child routes.
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
  component: Outlet, // Render child routes
  notFoundComponent: ProjectNotFound,
})

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
