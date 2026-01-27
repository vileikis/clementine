/**
 * ModelSettingsSection Component
 *
 * Configuration section for AI model and aspect ratio selection.
 * Uses SelectField components for dropdown selections.
 */
import type { AIModel, AspectRatio } from '@clementine/shared'
import { SelectField } from '@/shared/editor-controls'

/** Model options for the dropdown */
const MODEL_OPTIONS: { value: AIModel; label: string }[] = [
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  { value: 'gemini-3.0', label: 'Gemini 3.0' },
]

/** Aspect ratio options for the dropdown */
const ASPECT_RATIO_OPTIONS: { value: AspectRatio; label: string }[] = [
  { value: '1:1', label: '1:1 (Square)' },
  { value: '3:2', label: '3:2 (Landscape)' },
  { value: '2:3', label: '2:3 (Portrait)' },
  { value: '16:9', label: '16:9 (Widescreen)' },
  { value: '9:16', label: '9:16 (Vertical)' },
]

interface ModelSettingsSectionProps {
  /** Current model selection */
  model: AIModel
  /** Current aspect ratio selection */
  aspectRatio: AspectRatio
  /** Callback when model changes */
  onModelChange: (model: AIModel) => void
  /** Callback when aspect ratio changes */
  onAspectRatioChange: (aspectRatio: AspectRatio) => void
  /** Whether the section is disabled (e.g., during save) */
  disabled?: boolean
}

/**
 * Model settings section with model and aspect ratio dropdowns
 *
 * @example
 * ```tsx
 * <ModelSettingsSection
 *   model={preset.model}
 *   aspectRatio={preset.aspectRatio}
 *   onModelChange={(model) => updatePreset({ model })}
 *   onAspectRatioChange={(aspectRatio) => updatePreset({ aspectRatio })}
 *   disabled={isUpdating}
 * />
 * ```
 */
export function ModelSettingsSection({
  model,
  aspectRatio,
  onModelChange,
  onAspectRatioChange,
  disabled = false,
}: ModelSettingsSectionProps) {
  return (
    <div className="space-y-4">
      <SelectField<AIModel>
        label="Model"
        value={model}
        onChange={onModelChange}
        options={MODEL_OPTIONS}
        disabled={disabled}
      />
      <SelectField<AspectRatio>
        label="Aspect Ratio"
        value={aspectRatio}
        onChange={onAspectRatioChange}
        options={ASPECT_RATIO_OPTIONS}
        disabled={disabled}
      />
    </div>
  )
}
