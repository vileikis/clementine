// CreateProjectEventButton component
// Button to create new project events

'use client'

import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useCreateProjectEvent } from '../hooks/useCreateProjectEvent'
import { Button } from '@/ui-kit/ui/button'

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
 * Mobile-optimized with 44x44px minimum touch target
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

      toast.success('Event created', {
        description: 'Your new event is ready to configure.',
      })

      // Call optional callback with new event ID
      if (onEventCreated) {
        onEventCreated(result.eventId)
      }
    } catch (error) {
      toast.error('Failed to create event', {
        description:
          error instanceof Error ? error.message : 'An unknown error occurred',
      })
    }
  }

  return (
    <Button
      onClick={handleCreate}
      disabled={createEvent.isPending}
      className="min-h-[44px] min-w-[44px]"
      aria-label="Create new event"
    >
      <Plus className="mr-2 h-4 w-4" />
      {createEvent.isPending ? 'Creating...' : 'Create Event'}
    </Button>
  )
}
