import { createFileRoute, notFound } from '@tanstack/react-router'
import { doc, getDoc } from 'firebase/firestore'
import { ProjectDetailsPage } from '@/domains/workspace/projects'
import { projectSchema } from '@/domains/workspace/projects/schemas'
import { firestore } from '@/integrations/firebase/client'
import { convertFirestoreDoc } from '@/shared/utils/firestore-utils'

/**
 * Project details page route
 *
 * Route: /workspace/:workspaceSlug/projects/:projectId
 * Access: Admin only (enforced by parent route)
 *
 * Displays project details (placeholder for now).
 * Returns 404 for non-existent or soft-deleted projects.
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
  component: ProjectDetailsPage,
})
