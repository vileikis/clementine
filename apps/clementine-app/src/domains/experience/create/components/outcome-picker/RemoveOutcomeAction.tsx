/**
 * RemoveOutcomeAction Component
 *
 * Button with confirmation dialog to remove/clear the output configuration.
 * Sets outcome.type to null without clearing per-type configs (preserves switching).
 *
 * @see specs/072-outcome-schema-redesign — US5
 */
import { useState } from 'react'
import { Trash2 } from 'lucide-react'

import { Button } from '@/ui-kit/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/ui-kit/ui/alert-dialog'

export interface RemoveOutcomeActionProps {
  /** Callback when output is confirmed for removal */
  onRemove: () => void
  /** Whether the action is disabled */
  disabled?: boolean
}

/**
 * RemoveOutcomeAction - Button with confirmation to remove output
 */
export function RemoveOutcomeAction({
  onRemove,
  disabled,
}: RemoveOutcomeActionProps) {
  const [open, setOpen] = useState(false)

  const handleConfirm = () => {
    onRemove()
    setOpen(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Remove Output
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove output configuration?</AlertDialogTitle>
          <AlertDialogDescription>
            This will deselect the current output type. Your configuration
            settings will be preserved if you re-select the same type later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
