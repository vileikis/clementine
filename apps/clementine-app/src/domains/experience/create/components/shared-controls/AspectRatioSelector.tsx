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
import { ASPECT_RATIOS } from '@/domains/experience/create/lib/model-options'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui-kit/ui/select'

export interface AspectRatioSelectorProps<T extends string = AspectRatio> {
  /** Currently selected aspect ratio */
  value: T
  /** Callback when aspect ratio changes */
  onChange: (value: T) => void
  /** Custom options to override the default image aspect ratios */
  options?: readonly { value: T; label: string }[]
  /** Whether the selector is disabled */
  disabled?: boolean
}

/**
 * AspectRatioSelector - Dropdown for output aspect ratio selection
 */
export function AspectRatioSelector<T extends string = AspectRatio>({
  value,
  onChange,
  options,
  disabled,
}: AspectRatioSelectorProps<T>) {
  const items = options ?? ASPECT_RATIOS
  const handleValueChange = (val: string) => {
    onChange(val as T)
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Aspect Ratio</label>
      <Select
        value={value}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger className="min-h-11 w-full">
          <SelectValue placeholder="Select aspect ratio">{value}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {items.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
