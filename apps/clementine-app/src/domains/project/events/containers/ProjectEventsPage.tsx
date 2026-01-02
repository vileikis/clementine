// ProjectEventsPage container
// Main page component for project events management

'use client'

import { useProjectEvents } from '../hooks/useProjectEvents'
import { ProjectEventsList } from '../components/ProjectEventsList'
import { CreateProjectEventButton } from '../components/CreateProjectEventButton'
import { useProject } from '@/domains/project/shared/hooks/useProject'

export interface ProjectEventsPageProps {
  /** Project ID */
  projectId: string
}

/**
 * ProjectEventsPage container component
 * Manages project events list display and real-time updates
 *
 * @example
 * ```tsx
 * <ProjectEventsPage projectId={projectId} />
 * ```
 */
export function ProjectEventsPage({ projectId }: ProjectEventsPageProps) {
  // Real-time subscriptions
  const { data: events, isLoading, error } = useProjectEvents(projectId)
  const { data: project } = useProject(projectId)

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center max-w-md">
          <h3 className="text-lg font-semibold text-destructive mb-2">
            Failed to load events
          </h3>
          <p className="text-muted-foreground">
            {error instanceof Error
              ? error.message
              : 'An unknown error occurred'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Events</h1>
        <CreateProjectEventButton projectId={projectId} />
      </div>

      <ProjectEventsList
        events={events || []}
        projectId={projectId}
        activeEventId={project?.activeEventId}
        isLoading={isLoading}
      />
    </div>
  )
}
