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
  Type,
} from 'lucide-react'

import {
  experienceCapturePhotoStepConfigSchema,
  experienceInfoStepConfigSchema,
  experienceInputLongTextStepConfigSchema,
  experienceInputMultiSelectStepConfigSchema,
  experienceInputScaleStepConfigSchema,
  experienceInputShortTextStepConfigSchema,
  experienceInputYesNoStepConfigSchema,
} from '@clementine/shared'
import {
  createDefaultCapturePhotoConfig,
  createDefaultInfoConfig,
  createDefaultInputLongTextConfig,
  createDefaultInputMultiSelectConfig,
  createDefaultInputScaleConfig,
  createDefaultInputShortTextConfig,
  createDefaultInputYesNoConfig,
} from '../defaults'
import type {
  AnswerValue,
  ExperienceStep,
  ExperienceStepCategory,
  ExperienceStepConfig,
  ExperienceStepType,
} from '@clementine/shared'

import type { LucideIcon } from 'lucide-react'
import type { z } from 'zod'

// Re-export types for convenience (using new names)
export type {
  ExperienceStep as Step,
  ExperienceStepCategory as StepCategory,
  ExperienceStepConfig as StepConfig,
  ExperienceStepType as StepType,
  AnswerValue,
}

/**
 * Props for step renderers (edit-mode preview and guest-mode run)
 */
export interface StepRendererProps {
  /** Rendering mode - edit shows disabled controls, run allows interaction */
  mode: 'edit' | 'run'
  /** The step being rendered */
  step: ExperienceStep
  /** Optional submit handler - when provided, the Next button is enabled */
  onSubmit?: () => void

  // Run mode props (only used when mode === 'run')
  /** Current answer value (run mode only) */
  answer?: AnswerValue
  /** Current answer context - step-specific AI generation data (run mode only) */
  answerContext?: unknown
  /** Callback when user provides/updates answer (run mode only) */
  onAnswer?: (value: AnswerValue, context?: unknown) => void
  /** Callback to go back (run mode only) */
  onBack?: () => void
  /** Whether back navigation is available (run mode only) */
  canGoBack?: boolean
  /** Whether proceeding is allowed (run mode only) */
  canProceed?: boolean
}

/**
 * Props for step configuration panels
 */
export interface StepConfigPanelProps {
  step: ExperienceStep
  onConfigChange: (updates: Partial<ExperienceStepConfig>) => void
  disabled?: boolean
}

/**
 * Step definition in the registry
 */
export interface StepDefinition {
  /** Step type identifier */
  type: ExperienceStepType
  /** Category for grouping */
  category: ExperienceStepCategory
  /** Display label */
  label: string
  /** Description for add step dialog */
  description: string
  /** Icon component */
  icon: LucideIcon
  /** Zod schema for validation */
  configSchema: z.ZodSchema
  /** Factory for default config */
  defaultConfig: () => ExperienceStepConfig
}

/**
 * Step registry with all step type definitions
 */
export const stepRegistry: Record<ExperienceStepType, StepDefinition> = {
  info: {
    type: 'info',
    category: 'info',
    label: 'Information',
    description: 'Display text, images, or instructions',
    icon: Info,
    configSchema: experienceInfoStepConfigSchema,
    defaultConfig: createDefaultInfoConfig,
  },
  'input.scale': {
    type: 'input.scale',
    category: 'input',
    label: 'Opinion Scale',
    description: 'Collect ratings on a numeric scale',
    icon: SlidersHorizontal,
    configSchema: experienceInputScaleStepConfigSchema,
    defaultConfig: createDefaultInputScaleConfig,
  },
  'input.yesNo': {
    type: 'input.yesNo',
    category: 'input',
    label: 'Yes/No',
    description: 'Simple binary choice question',
    icon: CircleDot,
    configSchema: experienceInputYesNoStepConfigSchema,
    defaultConfig: createDefaultInputYesNoConfig,
  },
  'input.multiSelect': {
    type: 'input.multiSelect',
    category: 'input',
    label: 'Multiple Choice',
    description: 'Select from multiple options',
    icon: ListChecks,
    configSchema: experienceInputMultiSelectStepConfigSchema,
    defaultConfig: createDefaultInputMultiSelectConfig,
  },
  'input.shortText': {
    type: 'input.shortText',
    category: 'input',
    label: 'Short Answer',
    description: 'Single-line text response',
    icon: Type,
    configSchema: experienceInputShortTextStepConfigSchema,
    defaultConfig: createDefaultInputShortTextConfig,
  },
  'input.longText': {
    type: 'input.longText',
    category: 'input',
    label: 'Long Answer',
    description: 'Multi-line text response',
    icon: AlignLeft,
    configSchema: experienceInputLongTextStepConfigSchema,
    defaultConfig: createDefaultInputLongTextConfig,
  },
  'capture.photo': {
    type: 'capture.photo',
    category: 'capture',
    label: 'Photo Capture',
    description: 'Take a photo with the camera',
    icon: Camera,
    configSchema: experienceCapturePhotoStepConfigSchema,
    defaultConfig: createDefaultCapturePhotoConfig,
  },
}

/**
 * All available step types
 */
export const STEP_TYPES = Object.keys(stepRegistry) as ExperienceStepType[]
