/**
 * RemoveOutcomeAction Component
 *
 * Button with confirmation dialog to remove/clear the outcome configuration.
 * Placed at the bottom of the Create tab form.
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
  /** Callback when outcome is confirmed for removal */
  onRemove: () => void
  /** Whether the action is disabled */
  disabled?: boolean
}

/**
 * RemoveOutcomeAction - Button with confirmation to remove outcome
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
          Remove Outcome
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove outcome configuration?</AlertDialogTitle>
          <AlertDialogDescription>
            This will clear all outcome settings including the prompt, model
            selection, and reference images. You can configure a new outcome at
            any time.
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
