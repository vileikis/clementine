import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useRenameProject } from '../hooks/useRenameProject'
import type { FormEvent } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui-kit/components/dialog'
import { Button } from '@/ui-kit/components/button'
import { Input } from '@/ui-kit/components/input'
import { Label } from '@/ui-kit/components/label'

export interface RenameProjectDialogProps {
  /** Project ID to rename */
  projectId: string

  /** Workspace ID (for hook context) */
  workspaceId: string

  /** Current project name (pre-fills input) */
  initialName: string

  /** Dialog open state */
  open: boolean

  /** Dialog state change handler */
  onOpenChange: (open: boolean) => void
}

/**
 * Dialog component for renaming a project
 * Follows established pattern from RenameProjectEventDialog
 *
 * @example
 * ```tsx
 * const [renameOpen, setRenameOpen] = useState(false)
 *
 * <RenameProjectDialog
 *   projectId={project.id}
 *   workspaceId={workspaceId}
 *   initialName={project.name}
 *   open={renameOpen}
 *   onOpenChange={setRenameOpen}
 * />
 * ```
 */
export function RenameProjectDialog({
  projectId,
  workspaceId,
  initialName,
  open,
  onOpenChange,
}: RenameProjectDialogProps) {
  const [name, setName] = useState(initialName)
  const renameProject = useRenameProject(workspaceId)

  // Reset name when dialog closes or initialName changes
  useEffect(() => {
    if (!open) {
      setName(initialName)
    }
  }, [open, initialName])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    try {
      await renameProject.mutateAsync({ projectId, name })
      toast.success('Project renamed')
      onOpenChange(false)
    } catch (error) {
      toast.error('Failed to rename project. Please try again.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Rename Project</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={renameProject.isPending}
                autoFocus
                placeholder="Enter project name"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={renameProject.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={renameProject.isPending}>
              {renameProject.isPending ? 'Renaming...' : 'Rename'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
