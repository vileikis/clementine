/**
 * Info Step Config Panel
 *
 * Configuration panel for info/display steps.
 * Fields: title, description, media.
 */
import type { StepConfigPanelProps } from '../registry/step-registry'
import type { InfoStepConfig } from '../schemas/info.schema'
import { Input } from '@/ui-kit/ui/input'
import { Label } from '@/ui-kit/ui/label'
import { Textarea } from '@/ui-kit/ui/textarea'

export function InfoStepConfigPanel({
  config,
  onConfigChange,
  disabled,
}: StepConfigPanelProps) {
  const { title, description } = config as InfoStepConfig

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => onConfigChange({ title: e.target.value })}
          placeholder="Enter title..."
          maxLength={200}
          disabled={disabled}
        />
        <span className="text-xs text-muted-foreground">
          {title.length}/200 characters
        </span>
      </div>

      {/* Description */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => onConfigChange({ description: e.target.value })}
          placeholder="Enter description..."
          maxLength={1000}
          disabled={disabled}
          rows={4}
        />
        <span className="text-xs text-muted-foreground">
          {description.length}/1000 characters
        </span>
      </div>

      {/* Media - placeholder for future */}
      <div className="flex flex-col gap-2">
        <Label>Media</Label>
        <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
          Media picker coming soon
        </div>
      </div>
    </div>
  )
}
