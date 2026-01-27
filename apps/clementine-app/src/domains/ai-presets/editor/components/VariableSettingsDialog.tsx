/**
 * VariableSettingsDialog Component
 *
 * Dialog for configuring variable settings (value mappings with default).
 * Triggered by the settings button in VariableCard.
 */
import { useCallback, useEffect, useState } from 'react'

import { ValueMappingsEditor } from './ValueMappingsEditor'
import type { PresetVariable, ValueMappingEntry } from '@clementine/shared'
import { Button } from '@/ui-kit/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui-kit/ui/dialog'

interface VariableSettingsDialogProps {
  /** The variable being edited (null when dialog is closed) */
  variable: PresetVariable | null
  /** Callback to close the dialog */
  onClose: () => void
  /** Callback when settings are saved */
  onSave: (variableId: string, updates: VariableSettingsUpdate) => void
}

/** Settings update payload */
export interface VariableSettingsUpdate {
  defaultValue?: string | null
  valueMap?: ValueMappingEntry[] | null
}

/**
 * Dialog for configuring text variable settings
 *
 * Features a unified value mappings grid with:
 * - Customizable value→text mappings
 * - Default value as fallback (always visible at bottom)
 * - Auto-growing textareas for prompt text
 * - Info tooltips for guidance
 *
 * @example
 * ```tsx
 * <VariableSettingsDialog
 *   variable={selectedVariable}
 *   onClose={() => setSelectedVariable(null)}
 *   onSave={(id, updates) => updateVariableSettings(id, updates)}
 * />
 * ```
 */
export function VariableSettingsDialog({
  variable,
  onClose,
  onSave,
}: VariableSettingsDialogProps) {
  const [defaultValue, setDefaultValue] = useState('')
  const [mappings, setMappings] = useState<ValueMappingEntry[]>([])

  // Reset state when variable changes
  useEffect(() => {
    if (variable && variable.type === 'text') {
      setDefaultValue(variable.defaultValue || '')
      setMappings(variable.valueMap || [])
    }
  }, [variable])

  // Handle save
  const handleSave = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault()
      if (!variable || variable.type !== 'text') return

      // Filter out empty mappings (no value entered)
      const validMappings = mappings.filter((m) => m.value.trim() !== '')

      const updates: VariableSettingsUpdate = {
        defaultValue: defaultValue || null,
        valueMap: validMappings.length > 0 ? validMappings : null,
      }

      onSave(variable.id, updates)
      onClose()
    },
    [variable, defaultValue, mappings, onSave, onClose],
  )

  // Handle cancel/close
  const handleClose = useCallback(() => {
    setDefaultValue('')
    setMappings([])
    onClose()
  }, [onClose])

  const isOpen = variable !== null
  const isTextVariable = variable?.type === 'text'

  // Check if there are any changes
  const hasChanges =
    isTextVariable &&
    (defaultValue !== (variable.defaultValue || '') ||
      JSON.stringify(mappings) !== JSON.stringify(variable.valueMap || []))

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <form onSubmit={handleSave}>
          <DialogHeader>
            <DialogTitle>
              {variable && <>Variable Settings: @{variable.name}</>}
            </DialogTitle>
            <DialogDescription>
              {isTextVariable
                ? 'Configure value mappings for this text variable.'
                : 'No configurable settings for image variables yet.'}
            </DialogDescription>
          </DialogHeader>

          {isTextVariable && variable && (
            <div className="py-4">
              <ValueMappingsEditor
                mappings={mappings}
                defaultValue={defaultValue}
                onMappingsChange={setMappings}
                onDefaultValueChange={setDefaultValue}
              />
            </div>
          )}

          {!isTextVariable && variable && (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                Image variables don't have configurable settings yet.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isTextVariable || !hasChanges}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
