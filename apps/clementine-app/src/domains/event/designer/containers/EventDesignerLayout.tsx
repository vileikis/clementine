/**
 * EventDesignerLayout Container
 *
 * Domain-owned layout for event designer. Handles publish workflow,
 * change detection, and integrates EventDesignerTopBar + EventDesignerPage.
 */
import { useMemo } from 'react'
import { toast } from 'sonner'
import { EventDesignerTopBar } from '../components/EventDesignerTopBar'
import { usePublishEvent } from '../hooks/usePublishEvent'
import { EventDesignerPage } from './EventDesignerPage'
import type { ProjectEventFull } from '@/domains/event/shared/schemas'
import type { Project } from '@/domains/workspace/projects/types/project.types'

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
      <EventDesignerTopBar
        projectName={project.name}
        projectPath={projectPath}
        projectsListPath={projectsListPath}
        eventName={event.name}
        hasUnpublishedChanges={hasUnpublishedChanges}
        isPublishing={publishEvent.isPending}
        onPublish={handlePublish}
      />
      <EventDesignerPage />
    </div>
  )
}
