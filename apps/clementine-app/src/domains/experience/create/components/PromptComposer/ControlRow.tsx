/**
 * ControlRow Component
 *
 * Bottom row of PromptComposer containing model select,
 * aspect ratio select, duration select, and add media button.
 * Reads all state from PromptComposerContext — zero props.
 *
 * Controls auto-render based on modality.supports.*
 */

import {
  ASPECT_RATIOS,
  MODEL_RESOLUTION_MAP,
  RESOLUTION_OPTIONS,
} from '../../lib/model-options'
import { usePromptComposerContext } from './PromptComposerContext'
import { AddMediaButton } from './AddMediaButton'
import type { SelectOption } from '../../lib/modality-definitions'
import type { AIVideoModel } from '@clementine/shared'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui-kit/ui/select'
import { Switch } from '@/ui-kit/ui/switch'
import { Label } from '@/ui-kit/ui/label'

export type { SelectOption }

/**
 * ControlRow - Model, aspect ratio, duration, and add media controls
 */
export function ControlRow() {
  const { modality, model, onModelChange, controls, disabled } =
    usePromptComposerContext()

  return (
    <div className="flex items-center gap-2 px-3 py-2">
      {/* Model Select */}
      <Select value={model} onValueChange={onModelChange} disabled={disabled}>
        <SelectTrigger
          className="h-11 w-auto min-w-32 cursor-pointer border-0 bg-transparent font-semibold shadow-none focus-visible:ring-0"
          aria-label="Select AI model"
        >
          <SelectValue placeholder="Model" />
        </SelectTrigger>
        <SelectContent>
          {modality.modelOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Aspect Ratio Select — shown when modality supports it and values are provided */}
      {modality.supports.aspectRatio && controls?.aspectRatio !== undefined && (
        <Select
          value={controls.aspectRatio}
          onValueChange={controls.onAspectRatioChange}
          disabled={disabled}
        >
          <SelectTrigger
            className="h-11 w-auto min-w-20 cursor-pointer border-0 bg-transparent font-semibold shadow-none focus-visible:ring-0"
            aria-label="Select aspect ratio"
          >
            <SelectValue placeholder="Ratio" />
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

      {/* Duration Select — shown when modality supports it and values are provided */}
      {modality.supports.duration &&
        modality.durationOptions &&
        controls?.duration !== undefined &&
        controls?.onDurationChange && (
          <Select
            value={controls.duration}
            onValueChange={controls.onDurationChange}
            disabled={disabled}
          >
            <SelectTrigger
              className="h-11 w-auto min-w-20 cursor-pointer border-0 bg-transparent font-semibold shadow-none focus-visible:ring-0"
              aria-label="Select duration"
            >
              <SelectValue placeholder="Duration" />
            </SelectTrigger>
            <SelectContent>
              {modality.durationOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

      {/* Resolution Select — shown when modality supports it */}
      {modality.supports.resolution &&
        controls?.resolution !== undefined &&
        controls?.onResolutionChange && (
          <Select
            value={controls.resolution}
            onValueChange={controls.onResolutionChange}
            disabled={disabled}
          >
            <SelectTrigger
              className="h-11 w-auto min-w-20 cursor-pointer border-0 bg-transparent font-semibold shadow-none focus-visible:ring-0"
              aria-label="Select resolution"
            >
              <SelectValue placeholder="Resolution" />
            </SelectTrigger>
            <SelectContent>
              {RESOLUTION_OPTIONS.filter((option) => {
                const allowedResolutions =
                  MODEL_RESOLUTION_MAP[model as AIVideoModel]
                return allowedResolutions
                  ? allowedResolutions.includes(
                      option.value,
                    )
                  : true
              }).map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                  {option.value === '4k' && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      $$
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

      {/* Sound Toggle — shown when modality supports it */}
      {modality.supports.sound &&
        controls?.sound !== undefined &&
        controls?.onSoundChange && (
          <div className="flex items-center gap-1.5">
            <Switch
              id="sound-toggle"
              checked={controls.sound}
              onCheckedChange={controls.onSoundChange}
              disabled={disabled}
              aria-label="Toggle sound"
            />
            <Label
              htmlFor="sound-toggle"
              className="cursor-pointer text-xs font-semibold"
            >
              Sound
            </Label>
          </div>
        )}

      {/* Enhance Toggle — shown when modality supports it */}
      {modality.supports.enhance &&
        controls?.enhance !== undefined &&
        controls?.onEnhanceChange && (
          <div className="flex items-center gap-1.5">
            <Switch
              id="enhance-toggle"
              checked={controls.enhance}
              onCheckedChange={controls.onEnhanceChange}
              disabled={disabled}
              aria-label="Toggle prompt enhancement"
            />
            <Label
              htmlFor="enhance-toggle"
              className="cursor-pointer text-xs font-semibold"
              title="Improves prompt for better results"
            >
              Enhance
            </Label>
          </div>
        )}

      {/* Spacer to push add button to right */}
      <div className="flex-1" />

      {/* Add Media Button */}
      <AddMediaButton />
    </div>
  )
}
