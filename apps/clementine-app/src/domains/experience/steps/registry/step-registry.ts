/**
 * Step Registry
 *
 * Central registry of all step types with their definitions.
 * Provides step metadata, schemas, and lazy-loaded components.
 */
import { lazy } from 'react'
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
import type { ComponentType, LazyExoticComponent } from 'react'
import type { z } from 'zod'
import type { LucideIcon } from 'lucide-react'

import type { CapturePhotoStepConfig } from '../schemas/capture-photo.schema'
import type { InfoStepConfig } from '../schemas/info.schema'
import type { InputLongTextStepConfig } from '../schemas/input-long-text.schema'
import type { InputMultiSelectStepConfig } from '../schemas/input-multi-select.schema'
import type { InputScaleStepConfig } from '../schemas/input-scale.schema'
import type { InputShortTextStepConfig } from '../schemas/input-short-text.schema'
import type { InputYesNoStepConfig } from '../schemas/input-yes-no.schema'
import type { TransformPipelineStepConfig } from '../schemas/transform-pipeline.schema'

/**
 * Step type enumeration
 */
export type StepType =
  | 'info'
  | 'input.scale'
  | 'input.yesNo'
  | 'input.multiSelect'
  | 'input.shortText'
  | 'input.longText'
  | 'capture.photo'
  | 'transform.pipeline'

/**
 * Step category enumeration
 */
export type StepCategory = 'info' | 'input' | 'capture' | 'transform'

/**
 * Union of all step configs
 */
export type StepConfig =
  | InfoStepConfig
  | InputScaleStepConfig
  | InputYesNoStepConfig
  | InputMultiSelectStepConfig
  | InputShortTextStepConfig
  | InputLongTextStepConfig
  | CapturePhotoStepConfig
  | TransformPipelineStepConfig

/**
 * Props for step renderers (edit-mode preview)
 */
export interface StepRendererProps {
  mode: 'edit' | 'run'
  step: Step
  config: StepConfig
}

/**
 * Props for step configuration panels
 */
export interface StepConfigPanelProps {
  step: Step
  config: StepConfig
  onConfigChange: (updates: Partial<StepConfig>) => void
  disabled?: boolean
}

/**
 * Step entity
 */
export interface Step {
  /** Unique identifier within the experience */
  id: string
  /** Step type from registry */
  type: StepType
  /** Type-specific configuration */
  config: StepConfig
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
  /** Lazy-loaded edit-mode renderer */
  EditRenderer: LazyExoticComponent<ComponentType<StepRendererProps>>
  /** Lazy-loaded config panel */
  ConfigPanel: LazyExoticComponent<ComponentType<StepConfigPanelProps>>
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
    EditRenderer: lazy(() =>
      import('../renderers/InfoStepRenderer').then((m) => ({
        default: m.InfoStepRenderer,
      })),
    ),
    ConfigPanel: lazy(() =>
      import('../config-panels/InfoStepConfigPanel').then((m) => ({
        default: m.InfoStepConfigPanel,
      })),
    ),
  },
  'input.scale': {
    type: 'input.scale',
    category: 'input',
    label: 'Opinion Scale',
    description: 'Collect ratings on a numeric scale',
    icon: SlidersHorizontal,
    configSchema: inputScaleStepConfigSchema,
    defaultConfig: createDefaultInputScaleConfig,
    EditRenderer: lazy(() =>
      import('../renderers/InputScaleRenderer').then((m) => ({
        default: m.InputScaleRenderer,
      })),
    ),
    ConfigPanel: lazy(() =>
      import('../config-panels/InputScaleConfigPanel').then((m) => ({
        default: m.InputScaleConfigPanel,
      })),
    ),
  },
  'input.yesNo': {
    type: 'input.yesNo',
    category: 'input',
    label: 'Yes/No',
    description: 'Simple binary choice question',
    icon: CircleDot,
    configSchema: inputYesNoStepConfigSchema,
    defaultConfig: createDefaultInputYesNoConfig,
    EditRenderer: lazy(() =>
      import('../renderers/InputYesNoRenderer').then((m) => ({
        default: m.InputYesNoRenderer,
      })),
    ),
    ConfigPanel: lazy(() =>
      import('../config-panels/InputYesNoConfigPanel').then((m) => ({
        default: m.InputYesNoConfigPanel,
      })),
    ),
  },
  'input.multiSelect': {
    type: 'input.multiSelect',
    category: 'input',
    label: 'Multiple Choice',
    description: 'Select from multiple options',
    icon: ListChecks,
    configSchema: inputMultiSelectStepConfigSchema,
    defaultConfig: createDefaultInputMultiSelectConfig,
    EditRenderer: lazy(() =>
      import('../renderers/InputMultiSelectRenderer').then((m) => ({
        default: m.InputMultiSelectRenderer,
      })),
    ),
    ConfigPanel: lazy(() =>
      import('../config-panels/InputMultiSelectConfigPanel').then((m) => ({
        default: m.InputMultiSelectConfigPanel,
      })),
    ),
  },
  'input.shortText': {
    type: 'input.shortText',
    category: 'input',
    label: 'Short Answer',
    description: 'Single-line text response',
    icon: Type,
    configSchema: inputShortTextStepConfigSchema,
    defaultConfig: createDefaultInputShortTextConfig,
    EditRenderer: lazy(() =>
      import('../renderers/InputShortTextRenderer').then((m) => ({
        default: m.InputShortTextRenderer,
      })),
    ),
    ConfigPanel: lazy(() =>
      import('../config-panels/InputShortTextConfigPanel').then((m) => ({
        default: m.InputShortTextConfigPanel,
      })),
    ),
  },
  'input.longText': {
    type: 'input.longText',
    category: 'input',
    label: 'Long Answer',
    description: 'Multi-line text response',
    icon: AlignLeft,
    configSchema: inputLongTextStepConfigSchema,
    defaultConfig: createDefaultInputLongTextConfig,
    EditRenderer: lazy(() =>
      import('../renderers/InputLongTextRenderer').then((m) => ({
        default: m.InputLongTextRenderer,
      })),
    ),
    ConfigPanel: lazy(() =>
      import('../config-panels/InputLongTextConfigPanel').then((m) => ({
        default: m.InputLongTextConfigPanel,
      })),
    ),
  },
  'capture.photo': {
    type: 'capture.photo',
    category: 'capture',
    label: 'Photo Capture',
    description: 'Take a photo with the camera',
    icon: Camera,
    configSchema: capturePhotoStepConfigSchema,
    defaultConfig: createDefaultCapturePhotoConfig,
    EditRenderer: lazy(() =>
      import('../renderers/CapturePhotoRenderer').then((m) => ({
        default: m.CapturePhotoRenderer,
      })),
    ),
    ConfigPanel: lazy(() =>
      import('../config-panels/CapturePhotoConfigPanel').then((m) => ({
        default: m.CapturePhotoConfigPanel,
      })),
    ),
  },
  'transform.pipeline': {
    type: 'transform.pipeline',
    category: 'transform',
    label: 'AI Transform',
    description: 'Process with AI pipeline',
    icon: Sparkles,
    configSchema: transformPipelineStepConfigSchema,
    defaultConfig: createDefaultTransformPipelineConfig,
    EditRenderer: lazy(() =>
      import('../renderers/TransformPipelineRenderer').then((m) => ({
        default: m.TransformPipelineRenderer,
      })),
    ),
    ConfigPanel: lazy(() =>
      import('../config-panels/TransformPipelineConfigPanel').then((m) => ({
        default: m.TransformPipelineConfigPanel,
      })),
    ),
  },
}

/**
 * All available step types
 */
export const STEP_TYPES = Object.keys(stepRegistry) as StepType[]
