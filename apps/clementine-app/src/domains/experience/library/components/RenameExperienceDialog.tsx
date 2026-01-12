/**
 * RenameExperienceDialog Component
 *
 * Dialog for renaming an existing experience.
 * Uses controlled open state with reset on close.
 */
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { FormEvent } from 'react'

import { useUpdateExperience } from '@/domains/experience/shared'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui-kit/ui/dialog'
import { Button } from '@/ui-kit/ui/button'
import { Input } from '@/ui-kit/ui/input'
import { Label } from '@/ui-kit/ui/label'

export interface RenameExperienceDialogProps {
  /** Experience ID to rename */
  experienceId: string
  /** Workspace ID containing the experience */
  workspaceId: string
  /** Current experience name (pre-fills input) */
  initialName: string
  /** Dialog open state */
  open: boolean
  /** Dialog state change handler */
  onOpenChange: (open: boolean) => void
}

/**
 * Dialog component for renaming an experience
 *
 * @example
 * ```tsx
 * <RenameExperienceDialog
 *   experienceId={experience.id}
 *   workspaceId={workspaceId}
 *   initialName={experience.name}
 *   open={renameOpen}
 *   onOpenChange={setRenameOpen}
 * />
 * ```
 */
export function RenameExperienceDialog({
  experienceId,
  workspaceId,
  initialName,
  open,
  onOpenChange,
}: RenameExperienceDialogProps) {
  const [name, setName] = useState(initialName)
  const updateExperience = useUpdateExperience()

  // Reset name when dialog closes or initialName changes
  useEffect(() => {
    if (!open) {
      setName(initialName)
    }
  }, [open, initialName])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    try {
      await updateExperience.mutateAsync({
        workspaceId,
        experienceId,
        name,
      })
      toast.success('Experience renamed')
      onOpenChange(false)
    } catch {
      toast.error('Failed to rename experience. Please try again.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Rename Experience</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="experience-name">Experience Name</Label>
              <Input
                id="experience-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={updateExperience.isPending}
                autoFocus
                placeholder="Enter experience name"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateExperience.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateExperience.isPending}>
              {updateExperience.isPending ? 'Renaming...' : 'Rename'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
