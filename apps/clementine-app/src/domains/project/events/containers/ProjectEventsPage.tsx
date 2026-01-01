// ProjectEventsPage container
// Main page component for project events management

'use client'

import { useProjectEvents } from '../hooks/useProjectEvents'
import { ProjectEventsList } from '../components/ProjectEventsList'
import { CreateProjectEventButton } from '../components/CreateProjectEventButton'
// TODO: Import firestore instance from integrations
// import { firestore } from '@/integrations/firebase/client'

export interface ProjectEventsPageProps {
  /** Project ID */
  projectId: string

  /** Currently active event ID (from project.activeEventId) */
  activeEventId?: string | null
}

/**
 * ProjectEventsPage container component
 * Manages project events list display and real-time updates
 *
 * @example
 * ```tsx
 * <ProjectEventsPage projectId={projectId} activeEventId={project.activeEventId} />
 * ```
 */
export function ProjectEventsPage({ projectId, activeEventId }: ProjectEventsPageProps) {
  // TODO: Replace with actual firestore instance
  const firestore = null as any // Placeholder

  // Real-time events subscription
  const { data: events, isLoading, error } = useProjectEvents(firestore, projectId)

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center max-w-md">
          <h3 className="text-lg font-semibold text-destructive mb-2">
            Failed to load events
          </h3>
          <p className="text-muted-foreground">
            {error instanceof Error ? error.message : 'An unknown error occurred'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Events</h1>
        <CreateProjectEventButton projectId={projectId} />
      </div>

      <ProjectEventsList
        events={events || []}
        projectId={projectId}
        activeEventId={activeEventId}
        isLoading={isLoading}
      />
    </div>
  )
}
