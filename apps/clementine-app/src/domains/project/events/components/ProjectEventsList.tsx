// ProjectEventsList component
// Displays list of project events with empty state

import { ProjectEventItem } from './ProjectEventItem'
import type { ProjectEvent } from '../types/project-event.types'

export interface ProjectEventsListProps {
  /** List of project events to display */
  events: ProjectEvent[]

  /** Project ID (for mutations) */
  projectId: string

  /** Currently active event ID (optional) */
  activeEventId?: string | null

  /** Loading state */
  isLoading?: boolean
}

/**
 * ProjectEventsList component
 * Displays all non-deleted project events in a list with empty state
 *
 * @example
 * ```tsx
 * <ProjectEventsList
 *   events={events}
 *   projectId={projectId}
 *   activeEventId={project.activeEventId}
 * />
 * ```
 */
export function ProjectEventsList({
  events,
  projectId,
  activeEventId,
  isLoading = false,
}: ProjectEventsListProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading events...</p>
      </div>
    )
  }

  // Empty state
  if (!events || events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="text-center max-w-md">
          <h3 className="text-lg font-semibold mb-2">No events yet</h3>
          <p className="text-muted-foreground">
            Create your first event to start setting up your photo booth experience.
          </p>
        </div>
      </div>
    )
  }

  // Events list
  return (
    <div className="space-y-2">
      {events.map((event) => (
        <ProjectEventItem
          key={event.id}
          event={event}
          projectId={projectId}
          isActive={activeEventId === event.id}
        />
      ))}
    </div>
  )
}
