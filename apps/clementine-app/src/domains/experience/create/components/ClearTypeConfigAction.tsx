/**
 * ClearTypeConfigAction Component
 *
 * Button with confirmation dialog to clear the active type's configuration.
 * Clears per-type config without changing the experience type.
 *
 * @see specs/081-experience-type-flattening — US3
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

export interface ClearTypeConfigActionProps {
  /** Callback when config is confirmed for clearing */
  onClear: () => void
  /** Whether the action is disabled */
  disabled?: boolean
}

/**
 * ClearTypeConfigAction - Button with confirmation to clear type config
 */
export function ClearTypeConfigAction({
  onClear,
  disabled,
}: ClearTypeConfigActionProps) {
  const [open, setOpen] = useState(false)

  const handleConfirm = () => {
    onClear()
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
            This will clear the current output configuration. Your settings will
            be reset to defaults if you configure it again.
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
