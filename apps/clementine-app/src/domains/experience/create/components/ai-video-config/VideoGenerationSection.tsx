/**
 * VideoGenerationSection Component
 *
 * Video generation config fields: prompt, model selector, and duration.
 * A simpler form section for video-specific settings (no mentions or ref media).
 *
 * @see specs/073-ai-video-editor — US2
 */
import { AI_VIDEO_MODELS } from '../../lib/model-options'
import type { VideoGenerationConfig } from '@clementine/shared'
import { Input } from '@/ui-kit/ui/input'
import { Label } from '@/ui-kit/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui-kit/ui/select'
import { Textarea } from '@/ui-kit/ui/textarea'

export interface VideoGenerationSectionProps {
  /** Video generation config */
  config: VideoGenerationConfig
  /** Callback when any field changes */
  onConfigChange: (updates: Partial<VideoGenerationConfig>) => void
  /** Whether the section is disabled */
  disabled?: boolean
}

/**
 * VideoGenerationSection - Prompt, model, and duration for video generation
 */
export function VideoGenerationSection({
  config,
  onConfigChange,
  disabled,
}: VideoGenerationSectionProps) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium">Video Generation</h4>

      {/* Prompt */}
      <div className="space-y-2">
        <Label htmlFor="video-gen-prompt">Prompt</Label>
        <Textarea
          id="video-gen-prompt"
          value={config.prompt}
          onChange={(e) => onConfigChange({ prompt: e.target.value })}
          placeholder="Describe the video animation or motion..."
          disabled={disabled}
          rows={3}
        />
      </div>

      {/* Model + Duration row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="video-gen-model">Model</Label>
          <Select
            value={config.model}
            onValueChange={(model) =>
              onConfigChange({ model: model as VideoGenerationConfig['model'] })
            }
            disabled={disabled}
          >
            <SelectTrigger id="video-gen-model" className="min-h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AI_VIDEO_MODELS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="video-gen-duration">Duration (seconds)</Label>
          <Input
            id="video-gen-duration"
            type="number"
            min={1}
            max={60}
            step={1}
            value={config.duration}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10)
              if (!isNaN(value)) {
                onConfigChange({ duration: Math.min(60, Math.max(1, value)) })
              }
            }}
            disabled={disabled}
            className="min-h-11"
          />
        </div>
      </div>
    </div>
  )
}
