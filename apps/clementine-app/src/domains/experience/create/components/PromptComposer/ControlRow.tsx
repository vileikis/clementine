/**
 * ControlRow Component
 *
 * Bottom row of PromptComposer containing model select,
 * aspect ratio select, duration select, and add media button.
 * Reads all state from PromptComposerContext — zero props.
 *
 * Controls auto-render based on modality.supports.*
 */

import { ASPECT_RATIOS } from '../../lib/model-options'
import { usePromptComposerContext } from './PromptComposerContext'
import { AddMediaButton } from './AddMediaButton'
import type { SelectOption } from '../../lib/modality-definitions'
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

      {/* Spacer to push add button to right */}
      <div className="flex-1" />

      {/* Add Media Button */}
      <AddMediaButton />
    </div>
  )
}
