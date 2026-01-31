/**
 * DeleteNodeDialog Component
 *
 * Confirmation dialog for deleting transform nodes.
 * Uses AlertDialog with 44px buttons and isPending state.
 */
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/ui-kit/ui/alert-dialog'

export interface DeleteNodeDialogProps {
  /** Whether dialog is open */
  open: boolean
  /** Open state change handler */
  onOpenChange: (open: boolean) => void
  /** Confirm delete handler */
  onConfirm: () => void | Promise<void>
  /** Whether deletion is pending */
  isPending?: boolean
}

/**
 * Delete Node Dialog
 *
 * Features:
 * - Clear confirmation message
 * - 44px minimum button height for touch targets
 * - Disabled buttons during deletion
 * - Stays open on error for retry
 * - Cancel and confirm actions
 */
export function DeleteNodeDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
}: DeleteNodeDialogProps) {
  const handleConfirm = async () => {
    await onConfirm()
    if (!isPending) {
      onOpenChange(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Node?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove the transform node from the pipeline. This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            className="min-h-[44px]"
          >
            {isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
