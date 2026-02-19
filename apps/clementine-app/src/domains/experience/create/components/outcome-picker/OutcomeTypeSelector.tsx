/**
 * OutcomeTypeSelector Component
 *
 * Toggle group for switching outcome type within the editor.
 * Shows only enabled types (Photo, AI Image).
 * Does NOT allow deselection - use RemoveOutcomeAction to clear outcome.
 *
 * @see specs/072-outcome-schema-redesign — US1
 */
import { Camera, Sparkles } from 'lucide-react'

import { OUTCOME_TYPE_LABELS } from '../../lib/model-options'
import type { OutcomeType } from '@clementine/shared'
import { ToggleGroup, ToggleGroupItem } from '@/ui-kit/ui/toggle-group'

export interface OutcomeTypeSelectorProps {
  /** Currently selected outcome type */
  value: OutcomeType
  /** Callback when outcome type changes */
  onChange: (value: OutcomeType) => void
  /** Whether the selector is disabled */
  disabled?: boolean
}

/**
 * OutcomeTypeSelector - Toggle group for switching enabled outcome types
 */
export function OutcomeTypeSelector({
  value,
  onChange,
  disabled,
}: OutcomeTypeSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Output Type</label>
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(val) => {
          // Only change if a new value is selected (prevent deselection)
          if (val) {
            onChange(val as OutcomeType)
          }
        }}
        disabled={disabled}
        variant="outline"
      >
        <ToggleGroupItem
          value="photo"
          className="min-h-11 min-w-11 gap-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          aria-label="Photo output"
        >
          <Camera className="h-4 w-4" />
          {OUTCOME_TYPE_LABELS.photo}
        </ToggleGroupItem>
        <ToggleGroupItem
          value="ai.image"
          className="min-h-11 min-w-11 gap-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          aria-label="AI Image output"
        >
          <Sparkles className="h-4 w-4" />
          {OUTCOME_TYPE_LABELS['ai.image']}
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}
