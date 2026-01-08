// RenameProjectEventDialog component
// Dialog for renaming project events

'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useRenameProjectEvent } from '../hooks/useRenameProjectEvent'
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

export interface RenameProjectEventDialogProps {
  /** Event ID to rename */
  eventId: string

  /** Project ID */
  projectId: string

  /** Initial event name */
  initialName: string

  /** Dialog open state */
  open: boolean

  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void
}

/**
 * RenameProjectEventDialog component
 * Modal dialog for renaming project events
 *
 * Features:
 * - Input validation (min 1 char, max 100 chars)
 * - Loading state during mutation
 * - Auto-close on successful rename
 * - Keyboard shortcuts (Enter to submit, Escape to cancel)
 *
 * @example
 * ```tsx
 * <RenameProjectEventDialog
 *   eventId={event.id}
 *   projectId={projectId}
 *   initialName={event.name}
 *   open={open}
 *   onOpenChange={setOpen}
 * />
 * ```
 */
export function RenameProjectEventDialog({
  eventId,
  projectId,
  initialName,
  open,
  onOpenChange,
}: RenameProjectEventDialogProps) {
  const [name, setName] = useState(initialName)
  const renameProjectEvent = useRenameProjectEvent(projectId)

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault()

    if (name.trim() === '') {
      return
    }

    try {
      await renameProjectEvent.mutateAsync({ eventId, name: name.trim() })
      toast.success('Event renamed', {
        description: 'Your event name has been updated successfully.',
      })
      onOpenChange(false)
      // Reset to initial name for next open
      setName(initialName)
    } catch (error) {
      toast.error('Failed to rename event', {
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
            <DialogTitle>Rename Event</DialogTitle>
            <DialogDescription>
              Enter a new name for this event. The name will be updated across
              all views.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="event-name">Event name</Label>
              <Input
                id="event-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter event name"
                maxLength={100}
                disabled={renameProjectEvent.isPending}
                autoFocus
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={renameProjectEvent.isPending}
              className="min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={renameProjectEvent.isPending || name.trim() === ''}
              className="min-h-[44px]"
            >
              {renameProjectEvent.isPending ? 'Saving...' : 'Rename'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
