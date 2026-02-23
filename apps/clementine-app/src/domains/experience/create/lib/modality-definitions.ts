/**
 * Modality Definitions
 *
 * Static configuration objects that declare each generation modality's
 * capabilities and constraints. Used by PromptComposer to auto-render
 * the correct controls for each modality.
 *
 * Consumers can create task-specific variants via spread:
 *   const remix = { ...VIDEO_MODALITY, durationOptions: REMIX_ONLY }
 *
 * @see specs/080-prompt-composer-refactor
 */
import {
  AI_IMAGE_MODELS,
  AI_VIDEO_MODELS,
  DURATION_OPTIONS,
} from './model-options'
import type { SelectOption } from '../components/PromptComposer/ControlRow'

export interface ModalitySupports {
  negativePrompt: boolean
  referenceMedia: boolean
  sound: boolean
  enhance: boolean
  duration: boolean
  aspectRatio: boolean
}

export interface ModalityLimits {
  maxRefImages: number
  maxPromptLength: number
}

export interface ModalityDefinition {
  type: string
  supports: ModalitySupports
  limits: ModalityLimits
  modelOptions: readonly SelectOption[]
  durationOptions?: readonly SelectOption[]
}

export const IMAGE_MODALITY: ModalityDefinition = {
  type: 'image',
  supports: {
    negativePrompt: false,
    referenceMedia: true,
    sound: false,
    enhance: false,
    duration: false,
    aspectRatio: true,
  },
  limits: {
    maxRefImages: 5,
    maxPromptLength: 2000,
  },
  modelOptions: AI_IMAGE_MODELS,
}

export const VIDEO_MODALITY: ModalityDefinition = {
  type: 'video',
  supports: {
    negativePrompt: false,
    referenceMedia: true,
    sound: false,
    enhance: false,
    duration: true,
    aspectRatio: false,
  },
  limits: {
    maxRefImages: 2,
    maxPromptLength: 2000,
  },
  modelOptions: AI_VIDEO_MODELS,
  durationOptions: DURATION_OPTIONS,
}
