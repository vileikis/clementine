/**
 * EventDesignerLayout Container
 *
 * Domain-owned layout for event designer. Handles publish workflow,
 * change detection, and integrates TopNavBar + EventDesignerPage.
 */
import { useMemo } from 'react'
import { FolderOpen, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { usePublishEvent } from '../hooks/usePublishEvent'
import { EventDesignerPage } from './EventDesignerPage'
import type { ProjectEventFull } from '@/domains/event/shared/schemas'
import type { Project } from '@/domains/workspace/projects/types/project.types'
import { Button } from '@/ui-kit/components/button'
import { TopNavBar } from '@/domains/navigation'

interface EventDesignerLayoutProps {
  event: ProjectEventFull
  project: Project
  workspaceSlug: string
}

/**
 * Event designer layout with domain-owned UI
 *
 * Features:
 * - Version-based change detection (draftVersion > publishedVersion)
 * - Publish workflow with loading states
 * - Toast notifications for success/error
 * - Self-contained (no route file dependencies)
 *
 * @example
 * ```tsx
 * function EventRoute() {
 *   const { event, project, workspaceSlug } = Route.useLoaderData()
 *   return <EventDesignerLayout event={event} project={project} workspaceSlug={workspaceSlug} />
 * }
 * ```
 */
export function EventDesignerLayout({
  event,
  project,
  workspaceSlug,
}: EventDesignerLayoutProps) {
  const publishEvent = usePublishEvent(project.id, event.id)

  // Compute paths for breadcrumb navigation
  const projectPath = `/workspace/${workspaceSlug}/projects/${project.id}`
  const projectsListPath = `/workspace/${workspaceSlug}/projects`

  // Detect unpublished changes
  const hasUnpublishedChanges = useMemo(() => {
    if (event.publishedVersion === null) return true // Never published
    return (
      event.draftVersion !== null && event.draftVersion > event.publishedVersion
    )
  }, [event.draftVersion, event.publishedVersion])

  // Publish handler
  const handlePublish = async () => {
    try {
      await publishEvent.mutateAsync()
      toast.success('Event published', {
        description: 'Your changes are now live for guests.',
      })
    } catch (error) {
      toast.error('Publish failed', {
        description:
          error instanceof Error ? error.message : 'An error occurred',
      })
    }
  }

  return (
    <div className="flex h-screen flex-col">
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
        left={
          hasUnpublishedChanges && (
            <div className="flex items-center gap-1.5 rounded-full bg-yellow-50 dark:bg-yellow-950 px-2.5 py-1 text-xs font-medium text-yellow-700 dark:text-yellow-400">
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
              New changes
            </div>
          )
        }
        right={
          <>
            <Button variant="outline" disabled>
              Preview
            </Button>
            <Button
              onClick={handlePublish}
              disabled={!hasUnpublishedChanges || publishEvent.isPending}
            >
              {publishEvent.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Publish
            </Button>
          </>
        }
      />
      <EventDesignerPage />
    </div>
  )
}
