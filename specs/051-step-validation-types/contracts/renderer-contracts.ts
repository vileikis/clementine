/**
 * Renderer Component Contracts
 *
 * Type definitions for step renderer components after refactor.
 * Defines how renderers should save answer values in consistent string format.
 */

import type { AnswerValue } from '@clementine/shared'

/**
 * Answer value type
 *
 * IMPORTANT: Now imported from shared package instead of defined locally.
 *
 * Before (local definition in app):
 *   export type AnswerValue = string | number | boolean | string[]
 *
 * After (imported from shared):
 *   import type { AnswerValue } from '@clementine/shared'
 *   // Type is: string | string[]
 *
 * Benefits:
 * - Single source of truth (defined in packages/shared/src/schemas/session/session.schema.ts)
 * - Guaranteed consistency with Zod schema (inferred via z.infer<typeof answerValueSchema>)
 * - Shared between session schema and app renderers
 */

/**
 * Renderer Props Contract
 *
 * Standard props interface for all step renderers
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
 * InputYesNoRenderer Contract
 *
 * Renders yes/no question with two buttons
 * CHANGE: Saves "yes"/"no" strings instead of boolean true/false
 */
export interface InputYesNoRendererContract {
  /**
   * Internal state: boolean (natural for button selection)
   * Save format: string "yes" or "no"
   *
   * Conversion happens at save boundary:
   *
   * const handleSelect = (value: boolean) => {
   *   if (mode === 'run' && onAnswer) {
   *     onAnswer(value ? 'yes' : 'no') // boolean → string
   *   }
   * }
   */
  internalState: boolean | undefined
  savedValue: 'yes' | 'no' | undefined
}

/**
 * Example implementation:
 *
 * export function InputYesNoRenderer({ answer, onAnswer, ... }: StepRendererProps) {
 *   // Parse saved value back to boolean for UI state
 *   const selectedValue = answer === 'yes' ? true : answer === 'no' ? false : undefined
 *
 *   const handleSelect = (value: boolean) => {
 *     if (mode === 'run' && onAnswer) {
 *       onAnswer(value ? 'yes' : 'no') // Convert at boundary
 *     }
 *   }
 *
 *   return (
 *     <div>
 *       <Button onClick={() => handleSelect(true)} selected={selectedValue === true}>
 *         Yes
 *       </Button>
 *       <Button onClick={() => handleSelect(false)} selected={selectedValue === false}>
 *         No
 *       </Button>
 *     </div>
 *   )
 * }
 */

/**
 * InputScaleRenderer Contract
 *
 * Renders numeric scale (e.g., 1-5 rating) with number buttons
 * CHANGE: Saves string representation instead of number
 */
export interface InputScaleRendererContract {
  /**
   * Internal state: number (natural for scale value)
   * Save format: string representation (e.g., "3")
   *
   * Conversion happens at save boundary:
   *
   * const handleSelect = (value: number) => {
   *   if (mode === 'run' && onAnswer) {
   *     onAnswer(String(value)) // number → string
   *   }
   * }
   */
  internalState: number | undefined
  savedValue: string | undefined // "1", "2", "3", etc.
}

/**
 * Example implementation:
 *
 * export function InputScaleRenderer({ answer, onAnswer, ... }: StepRendererProps) {
 *   // Parse saved value back to number for UI state
 *   const selectedValue = typeof answer === 'string' ? Number(answer) : undefined
 *
 *   const handleSelect = (value: number) => {
 *     if (mode === 'run' && onAnswer) {
 *       onAnswer(String(value)) // Convert at boundary
 *     }
 *   }
 *
 *   return (
 *     <div>
 *       {scaleValues.map((value) => (
 *         <ScaleButton
 *           key={value}
 *           value={value}
 *           selected={selectedValue === value}
 *           onClick={() => handleSelect(value)}
 *         />
 *       ))}
 *     </div>
 *   )
 * }
 */

/**
 * InputTextRenderer Contract
 *
 * Renders text input (short or long)
 * NO CHANGE: Already uses string format
 */
export interface InputTextRendererContract {
  /**
   * Internal state: string
   * Save format: string (passthrough)
   */
  internalState: string
  savedValue: string
}

/**
 * InputMultiSelectRenderer Contract
 *
 * Renders multiple choice selection
 * NO CHANGE: Already uses string[] format
 */
export interface InputMultiSelectRendererContract {
  /**
   * Internal state: string[] (selected option values)
   * Save format: string[] (passthrough)
   */
  internalState: string[]
  savedValue: string[]
}

/**
 * Conversion Utilities
 *
 * Helper functions for converting between UI state and save format
 */
export const RendererConversions = {
  /**
   * Convert boolean UI state to yes/no string
   */
  booleanToYesNo: (value: boolean): 'yes' | 'no' => {
    return value ? 'yes' : 'no'
  },

  /**
   * Convert yes/no string to boolean UI state
   */
  yesNoToBoolean: (value: string | undefined): boolean | undefined => {
    if (value === 'yes') return true
    if (value === 'no') return false
    return undefined
  },

  /**
   * Convert number UI state to string
   */
  numberToString: (value: number): string => {
    return String(value)
  },

  /**
   * Convert string to number UI state (with validation)
   */
  stringToNumber: (value: string | undefined): number | undefined => {
    if (value === undefined) return undefined
    const parsed = Number(value)
    return isNaN(parsed) ? undefined : parsed
  },
}
