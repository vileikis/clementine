/**
 * SubjectMediaSection Component
 *
 * Two-state control for the capture step in the Create tab:
 * - Empty state: SourceImageSelector dropdown to pick a capture step
 * - Filled state: Compact card with step name, inline AR picker, and remove button
 *
 * Label is dynamic based on capture step type:
 * - capture.photo → "Subject Photo"
 * - capture.gif   → "Subject Photos"
 * - capture.video  → "Subject Video"
 *
 * @see specs/082-create-tab-ar-clarity
 */
import { Camera, X } from 'lucide-react'

import { ASPECT_RATIOS } from '../../lib/model-options'
import { SourceImageSelector } from './SourceImageSelector'
import type { AspectRatio, ExperienceStep } from '@clementine/shared'
import { Button } from '@/ui-kit/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui-kit/ui/select'

/** Map capture step type to section label */
function getCaptureLabel(stepType: string): string {
  switch (stepType) {
    case 'capture.photo':
      return 'Subject Photo'
    case 'capture.gif':
      return 'Subject Photos'
    case 'capture.video':
      return 'Subject Video'
    default:
      return 'Subject Media'
  }
}

export interface SubjectMediaSectionProps {
  /** Currently selected capture step ID (null = no source image) */
  captureStepId: string | null
  /** All experience steps (will be filtered to capture types) */
  steps: ExperienceStep[]
  /** Callback when capture step selection changes */
  onCaptureStepChange: (id: string | null) => void
  /** Callback when a capture step's aspect ratio is changed inline */
  onCaptureAspectRatioChange?: (
    stepId: string,
    aspectRatio: AspectRatio,
  ) => void
  /** Whether to show "None (prompt only)" option (for text-to-image) */
  showNoneOption?: boolean
  /** Validation error message */
  error?: string
}

/**
 * SubjectMediaSection — empty/filled card for capture step selection + inline AR
 */
export function SubjectMediaSection({
  captureStepId,
  steps,
  onCaptureStepChange,
  onCaptureAspectRatioChange,
  showNoneOption,
  error,
}: SubjectMediaSectionProps) {
  // Currently only capture.photo exists; future: capture.gif, capture.video
  const captureSteps = steps.filter((s) => s.type === 'capture.photo')

  // Derive section label from selected step type (or first capture step type)
  const selectedStep = captureSteps.find((s) => s.id === captureStepId)
  const labelSource = selectedStep ?? captureSteps[0]
  const label = labelSource
    ? getCaptureLabel(labelSource.type)
    : 'Subject Photo'

  // Zero capture steps — show helper text
  if (captureSteps.length === 0 && !showNoneOption) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">{label}</h3>
        <p className="text-muted-foreground text-sm">
          Add a Photo Capture step to use as source image
        </p>
      </div>
    )
  }

  // Empty state — no step selected, show picker dropdown
  if (!selectedStep) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">{label}</h3>
        <SourceImageSelector
          value={captureStepId}
          onChange={onCaptureStepChange}
          steps={steps}
          error={error}
          hideLabel
        />
      </div>
    )
  }

  // Filled state — show compact card
  const captureAR =
    selectedStep.type === 'capture.photo'
      ? selectedStep.config.aspectRatio
      : null

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground">{label}</h3>
      <div className="group flex items-center gap-3 rounded-md border bg-background px-3 py-2">
        {/* Left: step info */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Camera className="text-muted-foreground h-4 w-4 shrink-0" />
          <span className="truncate text-sm font-medium">
            {selectedStep.name}
          </span>
        </div>

        {/* Right: inline AR picker + remove */}
        <div className="flex items-center gap-2">
          {captureAR && onCaptureAspectRatioChange && (
            <Select
              value={captureAR}
              onValueChange={(value) =>
                onCaptureAspectRatioChange(
                  selectedStep.id,
                  value as AspectRatio,
                )
              }
            >
              <SelectTrigger
                size="sm"
                className="h-8 w-auto gap-1 border-0 bg-transparent font-semibold shadow-none"
              >
                <SelectValue>{captureAR}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {ASPECT_RATIOS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-destructive shrink-0"
            onClick={() => onCaptureStepChange(null)}
            aria-label={`Remove ${selectedStep.name}`}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
