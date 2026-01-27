/**
 * DeleteAIPresetDialog Component
 *
 * Confirmation dialog for soft-deleting AI presets.
 */
'use client'

import { toast } from 'sonner'
import { useDeleteAIPreset } from '../hooks/useDeleteAIPreset'
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

export interface DeleteAIPresetDialogProps {
  /** Preset ID to delete */
  presetId: string

  /** Workspace ID */
  workspaceId: string

  /** Preset name (for confirmation message) */
  presetName: string

  /** Dialog open state */
  open: boolean

  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void
}

/**
 * DeleteAIPresetDialog component
 *
 * Confirmation dialog for soft-deleting AI presets.
 *
 * Features:
 * - Clear warning message about deletion
 * - Loading state during mutation
 * - Auto-close on successful deletion
 * - Keyboard shortcuts (Enter to confirm, Escape to cancel)
 *
 * @example
 * ```tsx
 * <DeleteAIPresetDialog
 *   presetId={preset.id}
 *   workspaceId={workspaceId}
 *   presetName={preset.name}
 *   open={open}
 *   onOpenChange={setOpen}
 * />
 * ```
 */
export function DeleteAIPresetDialog({
  presetId,
  workspaceId,
  presetName,
  open,
  onOpenChange,
}: DeleteAIPresetDialogProps) {
  const deletePreset = useDeleteAIPreset(workspaceId)

  const handleDelete = async () => {
    try {
      await deletePreset.mutateAsync({ presetId })
      toast.success('Preset deleted', {
        description: 'The AI preset has been deleted.',
      })
      onOpenChange(false)
    } catch (error) {
      toast.error('Failed to delete preset', {
        description:
          error instanceof Error ? error.message : 'An unknown error occurred',
      })
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete AI Preset?</AlertDialogTitle>
          <AlertDialogDescription>
            The preset "{presetName}" will be deleted and will no longer be
            available for use.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel
            disabled={deletePreset.isPending}
            className="min-h-[44px]"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deletePreset.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 min-h-[44px]"
          >
            {deletePreset.isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
