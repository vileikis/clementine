/**
 * SourceImageSelector Component
 *
 * Dropdown for selecting a capture step as the source image for transformation.
 * Shows "None (prompt only)" option for text-to-image generation.
 *
 * @see spec.md - US3 (Configure Source Image)
 */
import { Camera } from 'lucide-react'

import type { ExperienceStep } from '@clementine/shared'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui-kit/ui/select'

/** Special value for "None (prompt only)" option */
const NONE_VALUE = '__none__'

export interface SourceImageSelectorProps {
  /** Currently selected capture step ID (null = None) */
  value: string | null
  /** Callback when selection changes */
  onChange: (value: string | null) => void
  /** All experience steps (will be filtered to capture steps) */
  steps: ExperienceStep[]
  /** Whether the selector is disabled */
  disabled?: boolean
  /** Validation error message */
  error?: string
}

/**
 * SourceImageSelector - Dropdown for source image selection
 */
export function SourceImageSelector({
  value,
  onChange,
  steps,
  disabled,
  error,
}: SourceImageSelectorProps) {
  // Filter to capture steps only
  const captureSteps = steps.filter((s) => s.type === 'capture.photo')

  // Handle value change - convert NONE_VALUE to null
  const handleValueChange = (val: string) => {
    onChange(val === NONE_VALUE ? null : val)
  }

  // Convert null to NONE_VALUE for Select component
  const selectValue = value ?? NONE_VALUE

  // Find the selected step name for display
  const selectedStep = captureSteps.find((s) => s.id === value)

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Source Image</label>
      <Select
        value={selectValue}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger className="min-h-11 w-full">
          <SelectValue placeholder="Select source image">
            {value === null ? (
              'None (prompt only)'
            ) : (
              <span className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                {selectedStep?.name ?? 'Unknown step'}
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE_VALUE}>None (prompt only)</SelectItem>
          {captureSteps.map((step) => (
            <SelectItem key={step.id} value={step.id}>
              <Camera className="h-4 w-4" />
              {step.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {captureSteps.length === 0 && (
        <p className="text-muted-foreground text-xs">
          Add a Photo Capture step to use as source image
        </p>
      )}
      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
