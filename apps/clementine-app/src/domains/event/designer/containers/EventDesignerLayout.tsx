/**
 * EventDesignerLayout Container
 *
 * Domain-owned layout for event designer. Handles publish workflow,
 * change detection, and integrates TopNavBar + EventDesignerPage.
 */
import { useEffect, useMemo } from 'react'
import { FolderOpen, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { usePublishEvent } from '../hooks'
import { useEventDesignerStore } from '../stores'
import { EventDesignerPage } from './EventDesignerPage'
import type { ProjectEventFull } from '@/domains/event/shared'
import type { Project } from '@/domains/workspace/projects'
import type { TabItem } from '@/domains/navigation'
import { TopNavBar } from '@/domains/navigation'
import { EditorChangesBadge, EditorSaveStatus } from '@/shared/editor-status'
import { Button } from '@/ui-kit/ui/button'

// Event designer tabs configuration
const eventDesignerTabs: TabItem[] = [
  {
    id: 'welcome',
    label: 'Welcome',
    to: '/workspace/$workspaceSlug/projects/$projectId/events/$eventId/welcome',
  },
  {
    id: 'theme',
    label: 'Theme',
    to: '/workspace/$workspaceSlug/projects/$projectId/events/$eventId/theme',
  },
  {
    id: 'share',
    label: 'Share',
    to: '/workspace/$workspaceSlug/projects/$projectId/events/$eventId/share',
  },
  {
    id: 'settings',
    label: 'Settings',
    to: '/workspace/$workspaceSlug/projects/$projectId/events/$eventId/settings',
  },
]

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
  const { pendingSaves, lastCompletedAt, resetSaveState } =
    useEventDesignerStore()

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

  // Cleanup: reset save state on unmount
  useEffect(() => {
    return () => resetSaveState()
  }, [resetSaveState])

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
        className="shrink-0"
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
        tabs={eventDesignerTabs}
        right={
          <>
            <EditorSaveStatus
              pendingSaves={pendingSaves}
              lastCompletedAt={lastCompletedAt}
            />
            <EditorChangesBadge
              draftVersion={event.draftVersion}
              publishedVersion={event.publishedVersion}
            />
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
