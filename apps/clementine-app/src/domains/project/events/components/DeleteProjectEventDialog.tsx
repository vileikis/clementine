// DeleteProjectEventDialog component
// Confirmation dialog for soft-deleting project events

'use client'

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
import { useDeleteProjectEvent } from '../hooks/useDeleteProjectEvent'

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
      onOpenChange(false)
    } catch (error) {
      // Error is handled by mutation hook (Sentry)
      console.error('Failed to delete event:', error)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Event?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. The event "{eventName}" will be permanently deleted
            and will no longer be accessible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteProjectEvent.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteProjectEvent.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteProjectEvent.isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
