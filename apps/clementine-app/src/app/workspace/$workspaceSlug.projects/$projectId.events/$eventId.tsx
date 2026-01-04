import { Link, Outlet, createFileRoute, notFound } from '@tanstack/react-router'
import { doc, getDoc } from 'firebase/firestore'
import { FolderOpen, Play, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { projectSchema } from '@clementine/shared'
import { firestore } from '@/integrations/firebase/client'
import { projectEventSchema } from '@/domains/project/events/schemas'
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
    const event = convertFirestoreDoc(eventDoc, projectEventSchema)

    // Return 404 for soft-deleted events
    if (event.status === 'deleted') {
      throw notFound()
    }

    return { event, project }
  },
  component: EventLayout,
  notFoundComponent: EventNotFound,
})

function EventLayout() {
  const { workspaceSlug, projectId, eventId } = Route.useParams()
  const { event, project } = Route.useLoaderData()

  const projectPath = `/workspace/${workspaceSlug}/projects/${projectId}`
  const projectsListPath = `/workspace/${workspaceSlug}/projects`

  return (
    <>
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
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Event: {eventId}</h1>
          <div className="flex gap-4 mt-4 border-b">
            {/* TODO: Replace with proper tab navigation component */}
            <Link
              to="/workspace/$workspaceSlug/projects/$projectId/events/$eventId/welcome"
              params={{ workspaceSlug, projectId, eventId }}
              className="px-4 py-2"
              activeProps={{
                className: 'border-b-2 border-primary',
              }}
            >
              Welcome
            </Link>
            <Link
              to="/workspace/$workspaceSlug/projects/$projectId/events/$eventId/theme"
              params={{ workspaceSlug, projectId, eventId }}
              className="px-4 py-2"
              activeProps={{
                className: 'border-b-2 border-primary',
              }}
            >
              Theme
            </Link>
          </div>
        </div>
        <Outlet /> {/* Child route renders here */}
      </div>
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
