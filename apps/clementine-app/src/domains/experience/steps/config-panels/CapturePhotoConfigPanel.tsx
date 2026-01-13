/**
 * Capture Photo Config Panel
 *
 * Configuration panel for photo capture steps.
 * Fields: instructions, countdown.
 */
import type { StepConfigPanelProps } from '../registry/step-registry'
import type { CapturePhotoStepConfig } from '../schemas/capture-photo.schema'
import { Input } from '@/ui-kit/ui/input'
import { Label } from '@/ui-kit/ui/label'
import { Slider } from '@/ui-kit/ui/slider'
import { Switch } from '@/ui-kit/ui/switch'

export function CapturePhotoConfigPanel({
  config,
  onConfigChange,
  disabled,
}: StepConfigPanelProps) {
  const { instructions, countdown } = config as CapturePhotoStepConfig

  const countdownEnabled = countdown > 0

  return (
    <div className="flex flex-col gap-6">
      {/* Instructions */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="instructions">Instructions</Label>
        <Input
          id="instructions"
          value={instructions}
          onChange={(e) => onConfigChange({ instructions: e.target.value })}
          placeholder="e.g., Strike a pose!"
          maxLength={200}
          disabled={disabled}
        />
        <span className="text-xs text-muted-foreground">
          {instructions.length}/200 characters
        </span>
      </div>

      {/* Countdown toggle */}
      <div className="flex items-center justify-between">
        <Label htmlFor="countdown-enabled">Enable countdown</Label>
        <Switch
          id="countdown-enabled"
          checked={countdownEnabled}
          onCheckedChange={(checked) =>
            onConfigChange({ countdown: checked ? 3 : 0 })
          }
          disabled={disabled}
        />
      </div>

      {/* Countdown value */}
      {countdownEnabled && (
        <div className="flex flex-col gap-2">
          <Label>Countdown: {countdown} seconds</Label>
          <Slider
            value={[countdown]}
            onValueChange={([value]) => onConfigChange({ countdown: value })}
            min={1}
            max={10}
            step={1}
            disabled={disabled}
          />
        </div>
      )}

      {/* Overlay - placeholder for future */}
      <div className="flex flex-col gap-2">
        <Label>Overlay</Label>
        <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
          Overlay picker coming soon
        </div>
      </div>
    </div>
  )
}
