/**
 * Rename Step Dialog Component
 *
 * Modal dialog for renaming a step with validation.
 * Opened from StepList context menu.
 */
import { useState, useEffect } from 'react'

import { useValidateStepName } from '../hooks/useValidateStepName'
import type { Step } from '../../steps/registry/step-registry'
import { Button } from '@/ui-kit/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui-kit/ui/dialog'
import { Input } from '@/ui-kit/ui/input'
import { Label } from '@/ui-kit/ui/label'

interface RenameStepDialogProps {
  /** Step being renamed */
  step: Step
  /** All steps in the experience (for uniqueness check) */
  allSteps: Step[]
  /** Whether dialog is open */
  open: boolean
  /** Callback to change open state */
  onOpenChange: (open: boolean) => void
  /** Callback when rename is confirmed with valid name */
  onRename: (stepId: string, newName: string) => void
}

/**
 * Rename step dialog with inline validation
 *
 * Features:
 * - Cursor positioned at end (not fully selected)
 * - Real-time validation (format + uniqueness)
 * - Enter to save, Escape to cancel
 * - Auto-focus on input
 *
 * @example
 * ```tsx
 * <RenameStepDialog
 *   step={selectedStep}
 *   allSteps={steps}
 *   open={showRenameDialog}
 *   onOpenChange={setShowRenameDialog}
 *   onRename={(stepId, newName) => handleRenameStep(stepId, newName)}
 * />
 * ```
 */
export function RenameStepDialog({
  step,
  allSteps,
  open,
  onOpenChange,
  onRename,
}: RenameStepDialogProps) {
  const [name, setName] = useState(step.name || '')
  const [error, setError] = useState<string>()
  const validate = useValidateStepName(step.id, allSteps)

  // Reset name when dialog opens
  useEffect(() => {
    if (open) {
      setName(step.name || '')
      setError(undefined)
    }
  }, [open, step.name])

  const handleRename = () => {
    const result = validate(name)
    if (!result.valid) {
      setError(result.error)
      return
    }

    onRename(step.id, name)
    onOpenChange(false)
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Step</DialogTitle>
          <DialogDescription>
            Enter a new name for this step. Names must be unique within the
            experience.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="step-name">Step Name</Label>
            <Input
              id="step-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError(undefined)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename()
                if (e.key === 'Escape') handleCancel()
              }}
              className={error ? 'border-destructive' : ''}
              placeholder="Enter step name"
              autoFocus
              // Cursor at end (not fully selected)
              onFocus={(e) => {
                const length = e.target.value.length
                e.target.setSelectionRange(length, length)
              }}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleRename}>Rename</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
