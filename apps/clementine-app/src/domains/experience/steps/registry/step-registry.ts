/**
 * Step Registry
 *
 * Central registry of all step types with their definitions.
 * Provides step metadata and schemas for validation.
 *
 * Note: Renderers and config panels are NOT stored here.
 * Use switch statements in consuming components for better control.
 */
import {
  AlignLeft,
  Camera,
  CircleDot,
  Info,
  ListChecks,
  SlidersHorizontal,
  Sparkles,
  Type,
} from 'lucide-react'

import {
  capturePhotoStepConfigSchema,
  createDefaultCapturePhotoConfig,
} from '../schemas/capture-photo.schema'
import {
  createDefaultInfoConfig,
  infoStepConfigSchema,
} from '../schemas/info.schema'
import {
  createDefaultInputLongTextConfig,
  inputLongTextStepConfigSchema,
} from '../schemas/input-long-text.schema'
import {
  createDefaultInputMultiSelectConfig,
  inputMultiSelectStepConfigSchema,
} from '../schemas/input-multi-select.schema'
import {
  createDefaultInputScaleConfig,
  inputScaleStepConfigSchema,
} from '../schemas/input-scale.schema'
import {
  createDefaultInputShortTextConfig,
  inputShortTextStepConfigSchema,
} from '../schemas/input-short-text.schema'
import {
  createDefaultInputYesNoConfig,
  inputYesNoStepConfigSchema,
} from '../schemas/input-yes-no.schema'
import {
  createDefaultTransformPipelineConfig,
  transformPipelineStepConfigSchema,
} from '../schemas/transform-pipeline.schema'
import type { LucideIcon } from 'lucide-react'
import type { z } from 'zod'
import type {
  Step,
  StepCategory,
  StepConfig,
  StepType,
} from '../schemas/step.schema'

// Re-export types from step.schema for convenience
export type { Step, StepCategory, StepConfig, StepType }

/**
 * Props for step renderers (edit-mode preview and guest-mode run)
 */
export interface StepRendererProps {
  /** Rendering mode - edit shows disabled controls, run allows interaction */
  mode: 'edit' | 'run'
  /** The step being rendered */
  step: Step
  /** Optional submit handler - when provided, the Next button is enabled */
  onSubmit?: () => void
}

/**
 * Props for step configuration panels
 */
export interface StepConfigPanelProps {
  step: Step
  onConfigChange: (updates: Partial<StepConfig>) => void
  disabled?: boolean
}

/**
 * Step definition in the registry
 */
export interface StepDefinition {
  /** Step type identifier */
  type: StepType
  /** Category for grouping */
  category: StepCategory
  /** Display label */
  label: string
  /** Description for add step dialog */
  description: string
  /** Icon component */
  icon: LucideIcon
  /** Zod schema for validation */
  configSchema: z.ZodSchema
  /** Factory for default config */
  defaultConfig: () => StepConfig
}

/**
 * Step registry with all step type definitions
 */
export const stepRegistry: Record<StepType, StepDefinition> = {
  info: {
    type: 'info',
    category: 'info',
    label: 'Information',
    description: 'Display text, images, or instructions',
    icon: Info,
    configSchema: infoStepConfigSchema,
    defaultConfig: createDefaultInfoConfig,
  },
  'input.scale': {
    type: 'input.scale',
    category: 'input',
    label: 'Opinion Scale',
    description: 'Collect ratings on a numeric scale',
    icon: SlidersHorizontal,
    configSchema: inputScaleStepConfigSchema,
    defaultConfig: createDefaultInputScaleConfig,
  },
  'input.yesNo': {
    type: 'input.yesNo',
    category: 'input',
    label: 'Yes/No',
    description: 'Simple binary choice question',
    icon: CircleDot,
    configSchema: inputYesNoStepConfigSchema,
    defaultConfig: createDefaultInputYesNoConfig,
  },
  'input.multiSelect': {
    type: 'input.multiSelect',
    category: 'input',
    label: 'Multiple Choice',
    description: 'Select from multiple options',
    icon: ListChecks,
    configSchema: inputMultiSelectStepConfigSchema,
    defaultConfig: createDefaultInputMultiSelectConfig,
  },
  'input.shortText': {
    type: 'input.shortText',
    category: 'input',
    label: 'Short Answer',
    description: 'Single-line text response',
    icon: Type,
    configSchema: inputShortTextStepConfigSchema,
    defaultConfig: createDefaultInputShortTextConfig,
  },
  'input.longText': {
    type: 'input.longText',
    category: 'input',
    label: 'Long Answer',
    description: 'Multi-line text response',
    icon: AlignLeft,
    configSchema: inputLongTextStepConfigSchema,
    defaultConfig: createDefaultInputLongTextConfig,
  },
  'capture.photo': {
    type: 'capture.photo',
    category: 'capture',
    label: 'Photo Capture',
    description: 'Take a photo with the camera',
    icon: Camera,
    configSchema: capturePhotoStepConfigSchema,
    defaultConfig: createDefaultCapturePhotoConfig,
  },
  'transform.pipeline': {
    type: 'transform.pipeline',
    category: 'transform',
    label: 'AI Transform',
    description: 'Process with AI pipeline',
    icon: Sparkles,
    configSchema: transformPipelineStepConfigSchema,
    defaultConfig: createDefaultTransformPipelineConfig,
  },
}

/**
 * All available step types
 */
export const STEP_TYPES = Object.keys(stepRegistry) as StepType[]
