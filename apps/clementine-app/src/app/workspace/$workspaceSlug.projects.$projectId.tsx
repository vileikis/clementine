import { createFileRoute, notFound } from '@tanstack/react-router'
import { doc, getDoc } from 'firebase/firestore'
import type { Project } from '@/domains/workspace/projects/types'
import { ProjectDetailsPage } from '@/domains/workspace/projects'
import { firestore } from '@/integrations/firebase/client'

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
    const projectRef = doc(firestore, 'projects', params.projectId)
    const projectDoc = await getDoc(projectRef)

    if (!projectDoc.exists()) {
      throw notFound()
    }

    const project = { id: projectDoc.id, ...projectDoc.data() } as Project

    // Return 404 for soft-deleted projects
    if (project.status === 'deleted') {
      throw notFound()
    }

    // Validate project belongs to workspace (prevent cross-workspace access)
    if (project.workspaceId !== params.workspaceSlug) {
      throw notFound()
    }

    return { project }
  },
  component: ProjectDetailsPage,
})
