/**
 * DeleteNodeDialog Component
 *
 * Confirmation dialog for deleting transform nodes.
 * Matches the style of DeleteProjectDialog for consistency.
 */
import { Button } from '@/ui-kit/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui-kit/ui/dialog'

export interface DeleteNodeDialogProps {
  /** Whether dialog is open */
  open: boolean
  /** Open state change handler */
  onOpenChange: (open: boolean) => void
  /** Confirm delete handler */
  onConfirm: () => void
  /** Whether deletion is pending */
  isPending?: boolean
}

/**
 * Delete Node Dialog
 *
 * Features:
 * - Clear confirmation message
 * - Disabled buttons during deletion
 * - Destructive variant for delete button
 * - Cancel and confirm actions
 */
export function DeleteNodeDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
}: DeleteNodeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Node</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this transform node? This action
            cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
