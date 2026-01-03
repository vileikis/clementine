// DeleteProjectEventDialog component
// Confirmation dialog for soft-deleting project events

'use client'

import { toast } from 'sonner'
import { useDeleteProjectEvent } from '../hooks/useDeleteProjectEvent'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/ui-kit/components/alert-dialog'

export interface DeleteProjectEventDialogProps {
  /** Event ID to delete */
  eventId: string

  /** Project ID */
  projectId: string

  /** Event name (for confirmation message) */
  eventName: string

  /** Dialog open state */
  open: boolean

  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void
}

/**
 * DeleteProjectEventDialog component
 * Confirmation dialog for soft-deleting project events
 *
 * Features:
 * - Clear warning message about permanent deletion
 * - Loading state during mutation
 * - Auto-close on successful deletion
 * - Keyboard shortcuts (Enter to confirm, Escape to cancel)
 *
 * @example
 * ```tsx
 * <DeleteProjectEventDialog
 *   eventId={event.id}
 *   projectId={projectId}
 *   eventName={event.name}
 *   open={open}
 *   onOpenChange={setOpen}
 * />
 * ```
 */
export function DeleteProjectEventDialog({
  eventId,
  projectId,
  eventName,
  open,
  onOpenChange,
}: DeleteProjectEventDialogProps) {
  const deleteProjectEvent = useDeleteProjectEvent(projectId)

  const handleDelete = async () => {
    try {
      await deleteProjectEvent.mutateAsync({ eventId, projectId })
      toast.success('Event deleted', {
        description: 'The event has been permanently deleted.',
      })
      onOpenChange(false)
    } catch (error) {
      toast.error('Failed to delete event', {
        description:
          error instanceof Error ? error.message : 'An unknown error occurred',
      })
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Event?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. The event "{eventName}" will be
            permanently deleted and will no longer be accessible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel
            disabled={deleteProjectEvent.isPending}
            className="min-h-[44px]"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteProjectEvent.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 min-h-[44px]"
          >
            {deleteProjectEvent.isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
