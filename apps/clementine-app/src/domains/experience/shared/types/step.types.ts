/**
 * Step Types
 *
 * TypeScript interfaces and types for experience steps.
 * Steps are individual units within an experience, categorized by their purpose.
 *
 * Categories:
 * - info: Informational display (welcome, instructions)
 * - input: User input collection (forms, questions)
 * - capture: Media capture (photo, video, gif)
 * - transform: AI processing pipeline
 */
import type {
  CaptureStepConfig,
  InfoStepConfig,
  InputStepConfig,
  TransformStepConfig,
} from '../schemas/step-registry.schema'

/**
 * Step category type
 * Defines the high-level purpose of a step
 */
export type StepCategory = 'info' | 'input' | 'capture' | 'transform'

/**
 * Base step interface for app-level step variants
 * Common properties shared by all step types in the category-based system
 *
 * Note: For Firestore schema step type, use BaseStep from ../schemas
 */
export interface BaseStepDefinition {
  /** Unique step identifier within the experience */
  id: string

  /** Step category for grouping and validation */
  category: StepCategory

  /** Specific step type within the category */
  type: string

  /** Admin-facing label for the step */
  label: string
}

/**
 * Info Step
 * Displays informational content (welcome, instructions, etc.)
 */
export interface InfoStep extends BaseStepDefinition {
  category: 'info'
  type: 'info'
  config: InfoStepConfig
}

/**
 * Input Step
 * Collects user input through various form types
 */
export interface InputStep extends BaseStepDefinition {
  category: 'input'
  type: 'yesNo' | 'scale' | 'shortText' | 'longText' | 'multiSelect'
  config: InputStepConfig
}

/**
 * Capture Step
 * Captures media from the user (photo, video, gif)
 */
export interface CaptureStep extends BaseStepDefinition {
  category: 'capture'
  type: 'photo' | 'video' | 'gif'
  config: CaptureStepConfig
}

/**
 * Transform Step
 * Processes captured media through AI pipeline
 */
export interface TransformStep extends BaseStepDefinition {
  category: 'transform'
  type: 'pipeline'
  config: TransformStepConfig
}

/**
 * Step discriminated union
 * Use this type when working with any step to get proper type narrowing
 *
 * @example
 * ```typescript
 * function processStep(step: Step) {
 *   switch (step.category) {
 *     case 'info':
 *       // TypeScript knows this is InfoStep
 *       break
 *     case 'capture':
 *       // TypeScript knows this is CaptureStep
 *       break
 *   }
 * }
 * ```
 */
export type Step = InfoStep | InputStep | CaptureStep | TransformStep
