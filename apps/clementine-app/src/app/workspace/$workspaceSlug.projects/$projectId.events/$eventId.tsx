import { createFileRoute, notFound } from '@tanstack/react-router'
import { doc, getDoc } from 'firebase/firestore'
import { FolderOpen, Play, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { projectSchema } from '@clementine/shared'
import { firestore } from '@/integrations/firebase/client'
import { EventDesignerPage, projectEventFullSchema } from '@/domains/event'
import { convertFirestoreDoc } from '@/shared/utils/firestore-utils'
import { NotFound } from '@/shared/components/NotFound'
import { TopNavBar } from '@/domains/navigation'

/**
 * Event layout route
 *
 * Route: /workspace/:workspaceSlug/projects/:projectId/events/:eventId
 * Access: Admin only (enforced by parent route)
 *
 * Layout for event routes (welcome, theme, settings, etc.)
 * Renders tab navigation and child routes.
 */
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/projects/$projectId/events/$eventId',
)({
  loader: async ({ params }) => {
    // Fetch project (needed for breadcrumb)
    const projectPath = `projects/${params.projectId}`
    const projectRef = doc(firestore, projectPath)
    const projectDoc = await getDoc(projectRef)

    if (!projectDoc.exists()) {
      throw notFound()
    }

    const project = convertFirestoreDoc(projectDoc, projectSchema)
    // Fetch event from subcollection
    const eventPath = `projects/${params.projectId}/events/${params.eventId}`
    const eventRef = doc(firestore, eventPath)
    const eventDoc = await getDoc(eventRef)

    if (!eventDoc.exists()) {
      throw notFound()
    }

    // Convert Firestore document (Timestamps → numbers) and validate with schema
    const event = convertFirestoreDoc(eventDoc, projectEventFullSchema)

    // Return 404 for soft-deleted events
    if (event.status === 'deleted') {
      throw notFound()
    }

    // Type assertion to work around z.looseObject() index signature incompatibility
    // z.looseObject() adds [x: string]: unknown which conflicts with TanStack Router's expected {}
    return { event, project } as any
  },
  component: EventLayout,
  notFoundComponent: EventNotFound,
})

function EventLayout() {
  const { workspaceSlug, projectId } = Route.useParams()
  const { event, project } = Route.useLoaderData()

  const projectPath = `/workspace/${workspaceSlug}/projects/${projectId}`
  const projectsListPath = `/workspace/${workspaceSlug}/projects`

  return (
    <>
      {/* TOP NAV BAR */}
      <TopNavBar
        breadcrumbs={[
          {
            label: project.name,
            href: projectPath,
            icon: FolderOpen,
            iconHref: projectsListPath,
          },
          {
            label: event.name,
          },
        ]}
        actions={[
          {
            icon: Play,
            onClick: () => toast.success('Coming soon'),
            variant: 'ghost',
            ariaLabel: 'Preview event',
          },
          {
            label: 'Publish',
            icon: Upload,
            onClick: () => toast.success('Coming soon'),
            variant: 'default',
            ariaLabel: 'Publish event',
          },
        ]}
      />
      {/* BODY */}
      <EventDesignerPage />
    </>
  )
}

function EventNotFound() {
  const { workspaceSlug, projectId } = Route.useParams()

  return (
    <NotFound
      title="Event Not Found"
      message="The event you're looking for doesn't exist or has been deleted."
      actionLabel="View All Events"
      actionHref={`/workspace/${workspaceSlug}/projects/${projectId}/events`}
    />
  )
}
