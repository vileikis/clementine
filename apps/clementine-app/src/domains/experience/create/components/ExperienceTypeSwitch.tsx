/**
 * ExperienceTypeSwitch Component
 *
 * Toggle group for switching experience type within the editor.
 * Shows only enabled types (Photo, AI Image, AI Video).
 * Does NOT allow deselection - use ClearTypeConfigAction to clear config.
 *
 * Value comes from experience.draft.type (passed by parent).
 * onChange calls switchExperienceType() which sets draftType + draft.
 *
 * @see specs/083-config-discriminated-union — US3
 */
import { Camera, Sparkles, Video } from 'lucide-react'

import { OUTCOME_TYPE_LABELS } from '../lib/model-options'
import type { OutcomeType } from '@clementine/shared'
import { ToggleGroup, ToggleGroupItem } from '@/ui-kit/ui/toggle-group'

export interface ExperienceTypeSwitchProps {
  /** Currently selected experience type (non-survey) */
  value: OutcomeType
  /** Callback when experience type changes */
  onChange: (value: OutcomeType) => void
  /** Whether the selector is disabled */
  disabled?: boolean
}

/**
 * ExperienceTypeSwitch - Toggle group for switching enabled experience types
 */
export function ExperienceTypeSwitch({
  value,
  onChange,
  disabled,
}: ExperienceTypeSwitchProps) {
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
        <ToggleGroupItem
          value="ai.video"
          className="min-h-11 min-w-11 gap-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          aria-label="AI Video output"
        >
          <Video className="h-4 w-4" />
          {OUTCOME_TYPE_LABELS['ai.video']}
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}
