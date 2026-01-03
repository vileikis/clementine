// RenameProjectEventDialog component
// Dialog for renaming project events

'use client'

import { useState } from 'react'
import { useRenameProjectEvent } from '../hooks/useRenameProjectEvent'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui-kit/components/dialog'
import { Button } from '@/ui-kit/components/button'
import { Input } from '@/ui-kit/components/input'
import { Label } from '@/ui-kit/components/label'

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
      onOpenChange(false)
      // Reset to initial name for next open
      setName(initialName)
    } catch (error) {
      // Error is handled by mutation hook (Sentry)
      console.error('Failed to rename event:', error)
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={renameProjectEvent.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={renameProjectEvent.isPending || name.trim() === ''}
            >
              {renameProjectEvent.isPending ? 'Saving...' : 'Rename'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
