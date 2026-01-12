/**
 * DeleteExperienceDialog Component
 *
 * Confirmation dialog for soft-deleting an experience.
 * Shows experience name and warns about the action.
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

interface DeleteExperienceDialogProps {
  /** Dialog open state */
  open: boolean
  /** Name of experience being deleted */
  experienceName: string
  /** Whether deletion is in progress */
  isDeleting: boolean
  /** Dialog state change handler */
  onOpenChange: (open: boolean) => void
  /** Callback when delete is confirmed */
  onConfirm: () => void
}

/**
 * Confirmation dialog for deleting an experience
 *
 * @example
 * ```tsx
 * <DeleteExperienceDialog
 *   open={showDelete}
 *   experienceName={experience.name}
 *   isDeleting={deleteExperience.isPending}
 *   onOpenChange={setShowDelete}
 *   onConfirm={() => handleDelete(experience.id)}
 * />
 * ```
 */
export function DeleteExperienceDialog({
  open,
  experienceName,
  isDeleting,
  onOpenChange,
  onConfirm,
}: DeleteExperienceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Experience</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{experienceName}"? This action
            cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
