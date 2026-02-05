/**
 * CreateTabForm Component
 *
 * Main form container for configuring AI image generation outcome.
 * Composes OutcomeTypeSelector and PromptComposer for complete configuration.
 *
 * Implements autosave pattern:
 * - 2-second debounce for prompt changes
 * - Immediate saves for discrete selections (type, model, aspect ratio)
 *
 * @see spec.md - US1 (Configure AI Image Generation) + US2 (Select Outcome Type)
 */
import { useCallback, useEffect, useState } from 'react'

import { PromptComposer } from '../PromptComposer'
import { useUpdateOutcome } from '../../hooks'
import { useRefMediaUpload } from '../../hooks/useRefMediaUpload'
import {
  addOutcomeRefMedia,
  createDefaultOutcome,
  removeOutcomeRefMedia,
  sanitizeDisplayName,
  updateOutcomeAiEnabled,
  updateOutcomeAspectRatio,
  updateOutcomeCaptureStepId,
  updateOutcomeModel,
  updateOutcomePrompt,
  updateOutcomeType,
} from '../../lib/outcome-operations'
import { AIGenerationToggle } from './AIGenerationToggle'
import { OutcomeTypeSelector } from './OutcomeTypeSelector'
import { SourceImageSelector } from './SourceImageSelector'
import type {
  AIImageAspectRatio,
  AIImageModel,
  Experience,
  ExperienceStep,
  MediaReference,
  Outcome,
  OutcomeType,
} from '@clementine/shared'
import { useAuth } from '@/domains/auth'
import { useDebounce } from '@/shared/utils/useDebounce'

/** Debounce delay for prompt changes (ms) */
const PROMPT_DEBOUNCE_DELAY = 2000

export interface CreateTabFormProps {
  /** Experience data */
  experience: Experience
  /** Workspace ID for media uploads */
  workspaceId: string
}

/**
 * CreateTabForm - Main form for Create tab configuration
 */
export function CreateTabForm({ experience, workspaceId }: CreateTabFormProps) {
  const { user } = useAuth()

  // Get current outcome or use defaults
  const currentOutcome = experience.draft.outcome ?? createDefaultOutcome()
  const steps = experience.draft.steps

  // Mutation for saving outcome changes
  const updateOutcomeMutation = useUpdateOutcome(workspaceId, experience.id)

  // Local state for prompt with debouncing
  const [localPrompt, setLocalPrompt] = useState(
    currentOutcome.imageGeneration.prompt,
  )

  // Debounce the local prompt value
  const debouncedPrompt = useDebounce(localPrompt, PROMPT_DEBOUNCE_DELAY)

  // Save outcome with mutation
  const saveOutcome = useCallback(
    (outcome: Outcome) => {
      updateOutcomeMutation.mutate({ outcome })
    },
    [updateOutcomeMutation],
  )

  // Update outcome when debounced prompt changes
  useEffect(() => {
    if (debouncedPrompt !== currentOutcome.imageGeneration.prompt) {
      const newOutcome = updateOutcomePrompt(currentOutcome, debouncedPrompt)
      saveOutcome(newOutcome)
    }
  }, [debouncedPrompt])

  // Sync local prompt with current outcome when it changes externally
  useEffect(() => {
    if (currentOutcome.imageGeneration.prompt !== localPrompt) {
      setLocalPrompt(currentOutcome.imageGeneration.prompt)
    }
  }, [currentOutcome.imageGeneration.prompt])

  // Handle outcome type change - immediate save
  const handleOutcomeTypeChange = useCallback(
    (type: OutcomeType) => {
      const newOutcome = updateOutcomeType(currentOutcome, type)
      saveOutcome(newOutcome)
    },
    [currentOutcome, saveOutcome],
  )

  // Handle model change - immediate save
  const handleModelChange = useCallback(
    (model: string) => {
      const newOutcome = updateOutcomeModel(
        currentOutcome,
        model as AIImageModel,
      )
      saveOutcome(newOutcome)
    },
    [currentOutcome, saveOutcome],
  )

  // Handle aspect ratio change - immediate save
  const handleAspectRatioChange = useCallback(
    (aspectRatio: string) => {
      const newOutcome = updateOutcomeAspectRatio(
        currentOutcome,
        aspectRatio as AIImageAspectRatio,
      )
      saveOutcome(newOutcome)
    },
    [currentOutcome, saveOutcome],
  )

  // Handle capture step ID change - immediate save
  const handleCaptureStepIdChange = useCallback(
    (captureStepId: string | null) => {
      const newOutcome = updateOutcomeCaptureStepId(
        currentOutcome,
        captureStepId,
      )
      saveOutcome(newOutcome)
    },
    [currentOutcome, saveOutcome],
  )

  // Handle AI enabled toggle change - immediate save
  const handleAiEnabledChange = useCallback(
    (aiEnabled: boolean) => {
      const newOutcome = updateOutcomeAiEnabled(currentOutcome, aiEnabled)
      saveOutcome(newOutcome)
    },
    [currentOutcome, saveOutcome],
  )

  // Handle reference media removal - immediate save
  const handleRemoveRefMedia = useCallback(
    (mediaAssetId: string) => {
      const newOutcome = removeOutcomeRefMedia(currentOutcome, mediaAssetId)
      saveOutcome(newOutcome)
    },
    [currentOutcome, saveOutcome],
  )

  // Handle media upload complete - immediate save
  // Sanitize displayName to remove invalid characters (}, {, :)
  const handleMediaUploaded = useCallback(
    (mediaRef: MediaReference) => {
      const sanitizedMediaRef = {
        ...mediaRef,
        displayName: sanitizeDisplayName(mediaRef.displayName),
      }
      const newOutcome = addOutcomeRefMedia(currentOutcome, [sanitizedMediaRef])
      saveOutcome(newOutcome)
    },
    [currentOutcome, saveOutcome],
  )

  // Reference media upload hook
  const { uploadingFiles, uploadFiles, canAddMore, isUploading } =
    useRefMediaUpload({
      workspaceId,
      userId: user?.uid,
      outcome: currentOutcome,
      onMediaUploaded: handleMediaUploaded,
    })

  // Filter steps for @mention (exclude info steps)
  const mentionableSteps = steps.filter(
    (s: ExperienceStep) => s.type !== 'info',
  )

  return (
    <div className="space-y-6">
      {/* Outcome Type Selection */}
      <OutcomeTypeSelector
        value={currentOutcome.type}
        onChange={handleOutcomeTypeChange}
      />

      {/* Source Image Selection - only show when Image is selected */}
      {currentOutcome.type === 'image' && (
        <SourceImageSelector
          value={currentOutcome.captureStepId}
          onChange={handleCaptureStepIdChange}
          steps={steps}
        />
      )}

      {/* AI Generation Toggle - only show when Image is selected */}
      {currentOutcome.type === 'image' && (
        <AIGenerationToggle
          value={currentOutcome.aiEnabled}
          onChange={handleAiEnabledChange}
        />
      )}

      {/* AI Generation Configuration - only show when Image is selected AND AI is enabled */}
      {currentOutcome.type === 'image' && currentOutcome.aiEnabled && (
        <PromptComposer
          prompt={localPrompt}
          onPromptChange={setLocalPrompt}
          model={currentOutcome.imageGeneration.model}
          onModelChange={handleModelChange}
          aspectRatio={currentOutcome.imageGeneration.aspectRatio}
          onAspectRatioChange={handleAspectRatioChange}
          refMedia={currentOutcome.imageGeneration.refMedia}
          onRefMediaRemove={handleRemoveRefMedia}
          uploadingFiles={uploadingFiles}
          onFilesSelected={uploadFiles}
          canAddMore={canAddMore}
          isUploading={isUploading}
          steps={mentionableSteps}
        />
      )}
    </div>
  )
}
