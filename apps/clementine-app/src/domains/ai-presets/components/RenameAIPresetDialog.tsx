/**
 * RenameAIPresetDialog Component
 *
 * Dialog for renaming AI presets.
 */
'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useRenameAIPreset } from '../hooks/useRenameAIPreset'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui-kit/ui/dialog'
import { Button } from '@/ui-kit/ui/button'
import { Input } from '@/ui-kit/ui/input'
import { Label } from '@/ui-kit/ui/label'

export interface RenameAIPresetDialogProps {
  /** Preset ID to rename */
  presetId: string

  /** Workspace ID */
  workspaceId: string

  /** Initial preset name */
  initialName: string

  /** Dialog open state */
  open: boolean

  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void
}

/**
 * RenameAIPresetDialog component
 *
 * Modal dialog for renaming AI presets.
 *
 * Features:
 * - Input validation (min 1 char, max 100 chars)
 * - Loading state during mutation
 * - Auto-close on successful rename
 * - Keyboard shortcuts (Enter to submit, Escape to cancel)
 *
 * @example
 * ```tsx
 * <RenameAIPresetDialog
 *   presetId={preset.id}
 *   workspaceId={workspaceId}
 *   initialName={preset.name}
 *   open={open}
 *   onOpenChange={setOpen}
 * />
 * ```
 */
export function RenameAIPresetDialog({
  presetId,
  workspaceId,
  initialName,
  open,
  onOpenChange,
}: RenameAIPresetDialogProps) {
  const [name, setName] = useState(initialName)
  const renamePreset = useRenameAIPreset(workspaceId)

  // Sync input state when dialog opens or initialName changes
  useEffect(() => {
    if (open) {
      setName(initialName)
    }
  }, [open, initialName])

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault()

    if (name.trim() === '') {
      return
    }

    try {
      await renamePreset.mutateAsync({ presetId, name: name.trim() })
      toast.success('Preset renamed', {
        description: 'Your preset name has been updated successfully.',
      })
      onOpenChange(false)
    } catch (error) {
      toast.error('Failed to rename preset', {
        description:
          error instanceof Error ? error.message : 'An unknown error occurred',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleRename}>
          <DialogHeader>
            <DialogTitle>Rename Preset</DialogTitle>
            <DialogDescription>
              Enter a new name for this AI preset. The name will be updated
              across all views.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="preset-name">Preset name</Label>
              <Input
                id="preset-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter preset name"
                maxLength={100}
                disabled={renamePreset.isPending}
                autoFocus
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={renamePreset.isPending}
              className="min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={renamePreset.isPending || name.trim() === ''}
              className="min-h-[44px]"
            >
              {renamePreset.isPending ? 'Saving...' : 'Rename'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
