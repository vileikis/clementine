/**
 * AspectRatioSelector Component
 *
 * Dropdown for selecting the output aspect ratio at the experience level.
 * This is the canonical aspect ratio that affects:
 * - Camera capture constraints
 * - Overlay resolution
 * - AI generation dimensions
 *
 * @see Feature 065 - Experience-Level Aspect Ratio & Overlay System
 */
import type { AspectRatio } from '@clementine/shared'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui-kit/ui/select'

import { ASPECT_RATIOS } from '../../lib/model-options'

export interface AspectRatioSelectorProps {
  /** Currently selected aspect ratio */
  value: AspectRatio
  /** Callback when aspect ratio changes */
  onChange: (value: AspectRatio) => void
  /** Whether the selector is disabled */
  disabled?: boolean
}

/**
 * AspectRatioSelector - Dropdown for output aspect ratio selection
 */
export function AspectRatioSelector({
  value,
  onChange,
  disabled,
}: AspectRatioSelectorProps) {
  const handleValueChange = (val: string) => {
    onChange(val as AspectRatio)
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Aspect Ratio</label>
      <Select value={value} onValueChange={handleValueChange} disabled={disabled}>
        <SelectTrigger className="min-h-11 w-full">
          <SelectValue placeholder="Select aspect ratio">{value}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {ASPECT_RATIOS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
