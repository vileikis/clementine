/**
 * CreateTabForm Component
 *
 * Thin orchestrator for the Create tab. Routes to the correct config form
 * based on experience.draft.type (discriminated union):
 * - 'survey' → hidden (survey has no create tab)
 * - 'photo' → ExperienceTypeSwitch + PhotoConfigForm + ClearTypeConfigAction
 * - 'ai.image' → ExperienceTypeSwitch + AIImageConfigForm + ClearTypeConfigAction
 * - 'ai.video' → ExperienceTypeSwitch + AIVideoConfigForm + ClearTypeConfigAction
 *
 * Reads type from experience.draft.type (discriminated union config).
 * Reads config from the type-specific field on the draft variant.
 *
 * @see specs/083-config-discriminated-union
 */
import { useCallback, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { useUpdateExperienceConfig } from '../hooks'
import { useExperienceConfigValidation } from '../hooks/useExperienceConfigValidation'
import { getConfigKey } from '../lib/experience-config-operations'
import { AIImageConfigForm } from './ai-image-config/AIImageConfigForm'
import { AIVideoConfigForm } from './ai-video-config'
import { ExperienceTypeSwitch } from './ExperienceTypeSwitch'
import { ClearTypeConfigAction } from './ClearTypeConfigAction'
import { PhotoConfigForm } from './photo-config/PhotoConfigForm'
import type {
  AIImageConfig,
  AIVideoConfig,
  AspectRatio,
  Experience,
  ExperienceConfig,
  ExperienceStep,
  GifConfig,
  OutcomeType,
  PhotoConfig,
  VideoConfig,
} from '@clementine/shared'
import { useAuth } from '@/domains/auth'
import { useAutoSave } from '@/shared/forms'
import { useExperienceDesignerStore } from '@/domains/experience/designer'
import { useTrackedMutation } from '@/shared/editor-status'
import { switchExperienceType } from '@/domains/experience/shared/lib'

/** Debounce delay for all changes (ms) */
const AUTOSAVE_DEBOUNCE_MS = 2000

/**
 * Config form state — per-type config fields.
 * Only the active type's field is populated; others are undefined.
 */
interface ConfigFormState {
  photo?: PhotoConfig | null
  gif?: GifConfig | null
  video?: VideoConfig | null
  aiImage?: AIImageConfig | null
  aiVideo?: AIVideoConfig | null
}

/** Extract config form state from discriminated union draft */
function extractConfigState(draft: ExperienceConfig): ConfigFormState {
  switch (draft.type) {
    case 'photo':
      return { photo: draft.photo }
    case 'gif':
      return { gif: draft.gif }
    case 'video':
      return { video: draft.video }
    case 'ai.image':
      return { aiImage: draft.aiImage }
    case 'ai.video':
      return { aiVideo: draft.aiVideo }
    default:
      return {}
  }
}

export interface CreateTabFormProps {
  /** Experience data */
  experience: Experience
  /** Workspace ID for media uploads */
  workspaceId: string
}

/**
 * CreateTabForm - Thin orchestrator for Create tab configuration
 */
export function CreateTabForm({ experience, workspaceId }: CreateTabFormProps) {
  const { user } = useAuth()
  const store = useExperienceDesignerStore()
  const experienceType = experience.draft.type

  // Survey type has no create tab
  if (experienceType === 'survey') {
    return null
  }

  // Server config state (source of truth for resets)
  const serverConfig = extractConfigState(experience.draft)
  const steps = experience.draft.steps
  const configKey = getConfigKey(experienceType)

  // Mutation for saving config changes (tracked for save status indicator)
  const baseMutation = useUpdateExperienceConfig(workspaceId, experience.id)
  const updateConfigMutation = useTrackedMutation(baseMutation, store)

  // Form setup - manages per-type config state locally
  const form = useForm<ConfigFormState>({
    defaultValues: serverConfig,
    resetOptions: {
      keepDirtyValues: true,
      keepErrors: true,
    },
  })

  // Reset form when experience or type changes
  useEffect(() => {
    form.reset(serverConfig)
  }, [experience.id, experienceType])

  // Auto-save with debounce (2 seconds) — writes only the active type's config
  const { triggerSave } = useAutoSave({
    form,
    originalValues: serverConfig,
    onUpdate: async () => {
      try {
        if (!configKey) return
        const values = form.getValues()
        const activeConfig = values[configKey]
        await updateConfigMutation.mutateAsync({
          updates: { [configKey]: activeConfig },
        })
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to save output'
        toast.error(message)
      }
    },
    debounceMs: AUTOSAVE_DEBOUNCE_MS,
  })

  // Watch form values for reactive rendering
  const formValues = form.watch()

  // Validation - computes errors based on current experience type and config
  const validationErrors = useExperienceConfigValidation(
    experienceType,
    { ...experience.draft, ...formValues } as ExperienceConfig,
    steps,
  )

  // ── Type Selection ────────────────────────────────────────

  const handleTypeSwitch = useCallback(
    async (newType: OutcomeType) => {
      try {
        await switchExperienceType(workspaceId, experience.id, newType)
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to switch type'
        toast.error(message)
      }
    },
    [workspaceId, experience.id],
  )

  // ── Clear Config ──────────────────────────────────────────

  const handleClearConfig = useCallback(() => {
    if (!configKey) return
    form.setValue(configKey, null, { shouldDirty: true })
    triggerSave()
  }, [form, configKey, triggerSave])

  // ── Per-Type Config Change Handlers ───────────────────────

  const handlePhotoConfigChange = useCallback(
    (updates: Partial<PhotoConfig>) => {
      const currentConfig = form.getValues('photo')
      form.setValue('photo', { ...currentConfig, ...updates } as PhotoConfig, {
        shouldDirty: true,
      })
      triggerSave()
    },
    [form, triggerSave],
  )

  const handleAIImageConfigChange = useCallback(
    (updates: Partial<AIImageConfig>) => {
      const currentConfig = form.getValues('aiImage')
      form.setValue(
        'aiImage',
        { ...currentConfig, ...updates } as AIImageConfig,
        { shouldDirty: true },
      )
      triggerSave()
    },
    [form, triggerSave],
  )

  const handleAIVideoConfigChange = useCallback(
    (updates: Partial<AIVideoConfig>) => {
      const currentConfig = form.getValues('aiVideo')
      form.setValue(
        'aiVideo',
        { ...currentConfig, ...updates } as AIVideoConfig,
        { shouldDirty: true },
      )
      triggerSave()
    },
    [form, triggerSave],
  )

  // ── Capture Step AR Change (inline from Subject Media section) ──

  const handleCaptureAspectRatioChange = useCallback(
    async (stepId: string, aspectRatio: AspectRatio) => {
      const updatedSteps = steps.map((s: ExperienceStep) =>
        s.id === stepId && s.type === 'capture.photo'
          ? { ...s, config: { ...s.config, aspectRatio } }
          : s,
      )
      try {
        await updateConfigMutation.mutateAsync({
          updates: { steps: updatedSteps },
        })
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to update capture aspect ratio'
        toast.error(message)
      }
    },
    [steps, updateConfigMutation],
  )

  // ── Render ────────────────────────────────────────────────

  const activeConfig = configKey ? formValues[configKey] : null

  // No config initialized — show type switch only (fallback for pre-migration)
  if (!activeConfig) {
    return (
      <ExperienceTypeSwitch
        value={experienceType}
        onChange={handleTypeSwitch}
      />
    )
  }

  // Photo type
  if (experienceType === 'photo' && formValues.photo) {
    return (
      <div className="space-y-6">
        <ExperienceTypeSwitch
          value={experienceType as OutcomeType}
          onChange={handleTypeSwitch}
        />
        <PhotoConfigForm
          config={formValues.photo}
          onConfigChange={handlePhotoConfigChange}
          steps={steps}
          errors={validationErrors}
          onCaptureAspectRatioChange={handleCaptureAspectRatioChange}
        />
        <div className="border-t pt-4">
          <ClearTypeConfigAction onClear={handleClearConfig} />
        </div>
      </div>
    )
  }

  // AI Image type
  if (experienceType === 'ai.image' && formValues.aiImage) {
    return (
      <div className="space-y-6">
        <ExperienceTypeSwitch
          value={experienceType as OutcomeType}
          onChange={handleTypeSwitch}
        />
        <AIImageConfigForm
          config={formValues.aiImage}
          onConfigChange={handleAIImageConfigChange}
          steps={steps}
          errors={validationErrors}
          workspaceId={workspaceId}
          userId={user?.uid}
          onCaptureAspectRatioChange={handleCaptureAspectRatioChange}
        />
        <div className="border-t pt-4">
          <ClearTypeConfigAction onClear={handleClearConfig} />
        </div>
      </div>
    )
  }

  // AI Video type
  if (experienceType === 'ai.video' && formValues.aiVideo) {
    return (
      <div className="space-y-6">
        <ExperienceTypeSwitch
          value={experienceType as OutcomeType}
          onChange={handleTypeSwitch}
        />
        <AIVideoConfigForm
          config={formValues.aiVideo}
          onConfigChange={handleAIVideoConfigChange}
          steps={steps}
          errors={validationErrors}
          workspaceId={workspaceId}
          userId={user?.uid}
          onCaptureAspectRatioChange={handleCaptureAspectRatioChange}
        />
        <div className="border-t pt-4">
          <ClearTypeConfigAction onClear={handleClearConfig} />
        </div>
      </div>
    )
  }

  // Fallback — type set but config not initialized
  return (
    <ExperienceTypeSwitch value={experienceType} onChange={handleTypeSwitch} />
  )
}
