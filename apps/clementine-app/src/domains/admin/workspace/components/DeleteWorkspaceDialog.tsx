import { CircleAlert } from 'lucide-react'
import { useDeleteWorkspace } from '../hooks/useDeleteWorkspace'
import type { Workspace } from '@clementine/shared'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/ui-kit/components/alert-dialog'
import { Button } from '@/ui-kit/components/button'

interface DeleteWorkspaceDialogProps {
  workspace: Workspace
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

/**
 * Confirmation dialog for soft deleting a workspace
 *
 * Features:
 * - Confirms deletion action with workspace name
 * - Explains consequences (permanent, slug unavailable)
 * - Shows error if deletion fails
 * - Mobile-friendly (44x44px touch targets)
 */
export function DeleteWorkspaceDialog({
  workspace,
  trigger,
  open,
  onOpenChange,
}: DeleteWorkspaceDialogProps) {
  const deleteMutation = useDeleteWorkspace()

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(workspace.id)
      // Close dialog only on success
      onOpenChange?.(false)
    } catch (error) {
      // Error is displayed via deleteMutation.error in the UI
      // Keep dialog open so user can see the error message
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Workspace</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{' '}
            <strong className="text-foreground">"{workspace.name}"</strong>?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 py-4">
          <p className="text-sm text-muted-foreground">This action will:</p>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Remove the workspace from the list</li>
            <li>Make the workspace inaccessible via its URL</li>
            <li>Prevent the slug from being reused</li>
          </ul>
          <p className="text-sm text-destructive font-medium">
            This action cannot be undone.
          </p>

          {/* Error Message */}
          {deleteMutation.error && (
            <div className="rounded-md bg-destructive/10 p-4">
              <div className="flex gap-3">
                <div className="shrink-0">
                  <CircleAlert className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-destructive font-medium">
                    Failed to delete workspace
                  </p>
                  <p className="text-sm text-destructive mt-1">
                    {deleteMutation.error instanceof Error
                      ? deleteMutation.error.message
                      : 'An unexpected error occurred'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={deleteMutation.isPending}
            className="min-h-[44px]"
          >
            Cancel
          </AlertDialogCancel>
          <Button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="min-h-[44px] bg-destructive text-white hover:bg-destructive/90"
          >
            {deleteMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Delete Workspace</span>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
