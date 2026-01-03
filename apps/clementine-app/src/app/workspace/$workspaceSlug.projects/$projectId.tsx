import { Outlet, createFileRoute, notFound } from '@tanstack/react-router'
import { doc, getDoc } from 'firebase/firestore'
import { FolderOpen, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { firestore } from '@/integrations/firebase/client'
import { NotFound } from '@/shared/components/NotFound'
import { TopNavBar } from '@/domains/navigation'

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

    // Get project data
    const project = { id: projectDoc.id, ...projectDoc.data() } as {
      id: string
      name: string
      status: string
    }

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
  const { project } = Route.useLoaderData()

  return (
    <>
      <TopNavBar
        breadcrumbs={[
          {
            label: project.name,
            icon: FolderOpen,
          },
        ]}
        actions={[
          {
            label: 'Share',
            icon: Share2,
            onClick: () => toast.success('Coming soon'),
            variant: 'ghost',
          },
        ]}
      />
      <Outlet />
    </>
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
