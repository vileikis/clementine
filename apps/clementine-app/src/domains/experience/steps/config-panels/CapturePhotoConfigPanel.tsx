/**
 * Capture Photo Config Panel
 *
 * Configuration panel for photo capture steps.
 * Fields: aspectRatio.
 */
import type { StepConfigPanelProps } from '../registry/step-registry'
import type {
  AspectRatio,
  CapturePhotoStepConfig,
} from '../schemas/capture-photo.schema'
import { Label } from '@/ui-kit/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui-kit/ui/select'

export function CapturePhotoConfigPanel({
  step,
  onConfigChange,
  disabled,
}: StepConfigPanelProps) {
  const config = step.config as CapturePhotoStepConfig
  const { aspectRatio } = config

  return (
    <div className="flex flex-col gap-6">
      {/* Aspect Ratio */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="aspectRatio">Aspect Ratio</Label>
        <Select
          value={aspectRatio}
          onValueChange={(value: AspectRatio) =>
            onConfigChange({ aspectRatio: value })
          }
          disabled={disabled}
        >
          <SelectTrigger id="aspectRatio">
            <SelectValue placeholder="Select aspect ratio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1:1">Square (1:1)</SelectItem>
            <SelectItem value="9:16">Portrait (9:16)</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">
          {aspectRatio === '1:1'
            ? 'Best for profile photos and social media posts'
            : 'Best for stories and full-screen mobile displays'}
        </span>
      </div>
    </div>
  )
}
