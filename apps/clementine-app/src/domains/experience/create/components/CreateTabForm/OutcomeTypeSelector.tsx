/**
 * OutcomeTypeSelector Component
 *
 * Toggle group for selecting outcome type (Image, GIF, Video).
 * GIF and Video are disabled with "coming soon" labels.
 *
 * @see spec.md - US1 (Select Outcome Type)
 */
import { Film, Image as ImageIcon, Video } from 'lucide-react'

import type { OutcomeType } from '@clementine/shared'
import { ToggleGroup, ToggleGroupItem } from '@/ui-kit/ui/toggle-group'

export interface OutcomeTypeSelectorProps {
  /** Currently selected outcome type (null = not selected) */
  value: OutcomeType | null
  /** Callback when outcome type changes */
  onChange: (value: OutcomeType) => void
  /** Whether the selector is disabled */
  disabled?: boolean
  /** Validation error message */
  error?: string
}

/**
 * OutcomeTypeSelector - Toggle group for outcome type selection
 */
export function OutcomeTypeSelector({
  value,
  onChange,
  disabled,
  error,
}: OutcomeTypeSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Outcome Type</label>
      <ToggleGroup
        type="single"
        value={value ?? ''}
        onValueChange={(val) => {
          // ToggleGroup returns empty string when deselecting
          if (val) {
            onChange(val as OutcomeType)
          }
        }}
        disabled={disabled}
        variant="outline"
      >
        <ToggleGroupItem
          value="image"
          className="min-h-11 min-w-11 gap-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          aria-label="Image output"
        >
          <ImageIcon className="h-4 w-4" />
          Image
        </ToggleGroupItem>
        <ToggleGroupItem
          value="gif"
          disabled
          className="min-h-11 min-w-11 gap-2 opacity-50"
          aria-label="GIF output (coming soon)"
        >
          <Film className="h-4 w-4" />
          GIF
          <span className="text-muted-foreground text-xs">(soon)</span>
        </ToggleGroupItem>
        <ToggleGroupItem
          value="video"
          disabled
          className="min-h-11 min-w-11 gap-2 opacity-50"
          aria-label="Video output (coming soon)"
        >
          <Video className="h-4 w-4" />
          Video
          <span className="text-muted-foreground text-xs">(soon)</span>
        </ToggleGroupItem>
      </ToggleGroup>
      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
