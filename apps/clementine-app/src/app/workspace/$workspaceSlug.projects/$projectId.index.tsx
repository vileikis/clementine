import { createFileRoute } from '@tanstack/react-router'
import { FolderOpen, Share2 } from 'lucide-react'
import { useState } from 'react'
import { ProjectEventsPage } from '@/domains/project/events'
import { TopNavBar } from '@/domains/navigation'
import { useProject } from '@/domains/project/shared'
import { ShareDialog } from '@/domains/project/share'

/**
 * Project details page route (index)
 *
 * Route: /workspace/:workspaceSlug/projects/:projectId (exact match)
 * Access: Admin only (enforced by parent route)
 *
 * Displays project events management interface with top navigation bar.
 * ProjectEventsPage now fetches activeEventId automatically via useProjectEvents hook.
 */
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/projects/$projectId/',
)({
  component: function ProjectDetailsRoute() {
    const { workspaceSlug, projectId } = Route.useParams()
    const { data: project } = useProject(projectId)
    const projectsListPath = `/workspace/${workspaceSlug}/projects`
    const [shareDialogOpen, setShareDialogOpen] = useState(false)

    // Show loading state while project loads
    if (!project) {
      return null
    }

    return (
      <>
        <TopNavBar
          breadcrumbs={[
            {
              label: project.name,
              icon: FolderOpen,
              iconHref: projectsListPath,
            },
          ]}
          actions={[
            {
              label: 'Share',
              icon: Share2,
              onClick: () => setShareDialogOpen(true),
              variant: 'default',
              ariaLabel: 'Share project with guests',
            },
          ]}
        />
        <ProjectEventsPage projectId={projectId} />
        <ShareDialog
          projectId={projectId}
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
        />
      </>
    )
  },
})
