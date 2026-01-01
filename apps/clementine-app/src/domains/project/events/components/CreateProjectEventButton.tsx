// CreateProjectEventButton component
// Button to create new project events

'use client'

import { useCreateProjectEvent } from '../hooks/useCreateProjectEvent'

export interface CreateProjectEventButtonProps {
  /** Project ID */
  projectId: string

  /** Optional callback after event creation */
  onEventCreated?: (eventId: string) => void
}

/**
 * CreateProjectEventButton component
 * Button to create a new project event with default name "Untitled event"
 *
 * @example
 * ```tsx
 * <CreateProjectEventButton
 *   projectId={projectId}
 *   onEventCreated={(eventId) => navigate(`/events/${eventId}`)}
 * />
 * ```
 */
export function CreateProjectEventButton({
  projectId,
  onEventCreated,
}: CreateProjectEventButtonProps) {
  const createEvent = useCreateProjectEvent(projectId)

  const handleCreate = async () => {
    try {
      const result = await createEvent.mutateAsync({})

      // Call optional callback with new event ID
      if (onEventCreated) {
        onEventCreated(result.eventId)
      }
    } catch (error) {
      console.error('Failed to create event:', error)
      // Error handling will be improved in polish phase
    }
  }

  return (
    <button
      onClick={handleCreate}
      disabled={createEvent.isPending}
      className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      aria-label="Create new event"
    >
      {createEvent.isPending ? 'Creating...' : 'Create Event'}
    </button>
  )
}
