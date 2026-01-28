/**
 * ModelSettingsSection Component
 *
 * Self-contained configuration section for AI model and aspect ratio selection.
 * Owns its own update logic using useUpdateModelSettings hook.
 */
import { useCallback } from 'react'
import { toast } from 'sonner'

import { useUpdateModelSettings } from '../hooks/useUpdateModelSettings'
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
  /** Workspace ID for updates */
  workspaceId: string
  /** Preset ID for updates */
  presetId: string
  /** Whether the section is disabled (e.g., during publish) */
  disabled?: boolean
}

/**
 * Model settings section with model and aspect ratio dropdowns
 *
 * Self-contained component that handles its own updates via useUpdateModelSettings.
 *
 * @example
 * ```tsx
 * <ModelSettingsSection
 *   model={preset.draft.model}
 *   aspectRatio={preset.draft.aspectRatio}
 *   workspaceId={workspaceId}
 *   presetId={preset.id}
 *   disabled={isPublishing}
 * />
 * ```
 */
export function ModelSettingsSection({
  model,
  aspectRatio,
  workspaceId,
  presetId,
  disabled = false,
}: ModelSettingsSectionProps) {
  const updateModelSettings = useUpdateModelSettings(workspaceId, presetId)

  const handleModelChange = useCallback(
    async (newModel: AIModel) => {
      try {
        await updateModelSettings.mutateAsync({ model: newModel })
      } catch (error) {
        toast.error('Failed to update model', {
          description:
            error instanceof Error ? error.message : 'An error occurred',
        })
      }
    },
    [updateModelSettings],
  )

  const handleAspectRatioChange = useCallback(
    async (newAspectRatio: AspectRatio) => {
      try {
        await updateModelSettings.mutateAsync({ aspectRatio: newAspectRatio })
      } catch (error) {
        toast.error('Failed to update aspect ratio', {
          description:
            error instanceof Error ? error.message : 'An error occurred',
        })
      }
    },
    [updateModelSettings],
  )

  const isDisabled = disabled || updateModelSettings.isPending

  return (
    <div className="space-y-4">
      <SelectField<AIModel>
        label="Model"
        value={model}
        onChange={handleModelChange}
        options={MODEL_OPTIONS}
        disabled={isDisabled}
      />
      <SelectField<AspectRatio>
        label="Aspect Ratio"
        value={aspectRatio}
        onChange={handleAspectRatioChange}
        options={ASPECT_RATIO_OPTIONS}
        disabled={isDisabled}
      />
    </div>
  )
}
