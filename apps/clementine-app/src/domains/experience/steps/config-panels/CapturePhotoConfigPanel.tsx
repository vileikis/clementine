/**
 * Capture Photo Config Panel
 *
 * Configuration panel for photo capture steps.
 * Allows setting the aspect ratio for photo capture.
 */
import type { StepConfigPanelProps } from '../registry/step-registry'
import type {
  ExperienceCapturePhotoStepConfig,
  ImageAspectRatio,
} from '@clementine/shared'
import { imageAspectRatioSchema } from '@clementine/shared'
import { EditorSection } from '@/shared/editor-controls'
import { ASPECT_RATIOS } from '@/domains/experience/create/lib/model-options'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui-kit/ui/select'

// Aspect ratio descriptions
const ASPECT_RATIO_DESCRIPTIONS: Record<ImageAspectRatio, string> = {
  '1:1': 'Best for profile photos and social media posts',
  '9:16': 'Best for stories and full-screen mobile displays',
  '3:2': 'Best for landscape photos and traditional DSLR-style shots',
  '2:3': 'Best for portrait photos with more vertical space',
}

export function CapturePhotoConfigPanel({
  step,
  onConfigChange,
  disabled,
}: StepConfigPanelProps) {
  const config = step.config as ExperienceCapturePhotoStepConfig
  const aspectRatio = config.aspectRatio ?? '1:1'

  const handleAspectRatioChange = (value: string) => {
    const parsed = imageAspectRatioSchema.safeParse(value)
    if (!parsed.success) return
    onConfigChange({ aspectRatio: parsed.data })
  }

  return (
    <div className="space-y-0">
      <EditorSection title="Camera">
        <div className="space-y-2">
          <label className="text-sm font-medium">Aspect Ratio</label>
          <Select
            value={aspectRatio}
            onValueChange={handleAspectRatioChange}
            disabled={disabled}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select aspect ratio" />
            </SelectTrigger>
            <SelectContent>
              {ASPECT_RATIOS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {ASPECT_RATIO_DESCRIPTIONS[aspectRatio]}
          </p>
        </div>
      </EditorSection>
    </div>
  )
}
