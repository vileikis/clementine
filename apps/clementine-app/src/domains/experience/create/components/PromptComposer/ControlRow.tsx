/**
 * ControlRow Component
 *
 * Bottom row of PromptComposer containing model select,
 * aspect ratio select, duration select, and add media button.
 * Reads all state from PromptComposerContext — zero props.
 *
 * Controls auto-render based on modality.supports.*
 */

import { Volume2, Wand2 } from 'lucide-react'

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

export type { SelectOption }

/**
 * ControlRow - Model, aspect ratio, duration, and add media controls
 */
export function ControlRow() {
  const { modality, model, onModelChange, controls, disabled } =
    usePromptComposerContext()

  return (
    <div className="flex items-start gap-2 px-3 py-2">
      {/* Controls — wraps to next row when space is limited */}
      <div className="flex flex-1 flex-wrap items-center gap-1.5">
        {/* Model Select */}
        <Select value={model} onValueChange={onModelChange} disabled={disabled}>
          <SelectTrigger
            className="h-9 w-auto  cursor-pointer border-0 bg-transparent font-semibold shadow-none hover:bg-muted focus-visible:ring-0"
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

        {/* Aspect Ratio Select */}
        {modality.supports.aspectRatio &&
          controls?.aspectRatio !== undefined && (
            <Select
              value={controls.aspectRatio}
              onValueChange={controls.onAspectRatioChange}
              disabled={disabled}
            >
              <SelectTrigger
                className="h-9 w-auto cursor-pointer border-0 bg-transparent font-semibold shadow-none hover:bg-muted focus-visible:ring-0"
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

        {/* Duration Select */}
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
                className="h-9 w-auto cursor-pointer border-0 bg-transparent font-semibold shadow-none hover:bg-muted focus-visible:ring-0"
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

        {/* Resolution Select */}
        {modality.supports.resolution &&
          controls?.resolution !== undefined &&
          controls?.onResolutionChange && (
            <Select
              value={controls.resolution}
              onValueChange={controls.onResolutionChange}
              disabled={disabled}
            >
              <SelectTrigger
                className="h-9 w-auto cursor-pointer border-0 bg-transparent font-semibold shadow-none hover:bg-muted focus-visible:ring-0"
                aria-label="Select resolution"
              >
                <SelectValue placeholder="Resolution" />
              </SelectTrigger>
              <SelectContent>
                {RESOLUTION_OPTIONS.filter((option) => {
                  const allowedResolutions =
                    MODEL_RESOLUTION_MAP[model as AIVideoModel]
                  return allowedResolutions
                    ? allowedResolutions.includes(option.value)
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

        {/* Sound Chip */}
        {modality.supports.sound &&
          controls?.sound !== undefined &&
          controls?.onSoundChange && (
            <button
              type="button"
              onClick={() => controls.onSoundChange?.(!controls.sound)}
              disabled={disabled}
              aria-label="Toggle sound"
              aria-pressed={controls.sound}
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Volume2 className="size-3.5" />
              {controls.sound ? 'ON' : 'OFF'}
            </button>
          )}

        {/* Enhance Chip */}
        {modality.supports.enhance &&
          controls?.enhance !== undefined &&
          controls?.onEnhanceChange && (
            <button
              type="button"
              onClick={() => controls.onEnhanceChange?.(!controls.enhance)}
              disabled={disabled}
              aria-label="Toggle prompt enhancement"
              aria-pressed={controls.enhance}
              title="Improves prompt for better results"
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Wand2 className="size-3.5" />
              Enhance
              <span className="text-muted-foreground">
                {controls.enhance ? 'ON' : 'OFF'}
              </span>
            </button>
          )}
      </div>

      {/* Add Media Button — stays pinned right */}
      <AddMediaButton />
    </div>
  )
}
