/**
 * Runtime Engine Types
 *
 * Defines the runtime engine interface for executing experiences.
 * The runtime engine manages step navigation, data collection, and state.
 *
 * This is an interface definition only for Phase 0 - implementation comes in Phase 3.
 */
import type { MediaReference } from '@clementine/shared'
import type { Answer, SessionMode, SessionResultMedia } from '@/domains/session'
import type { ExperienceStep } from '../schemas'

// Re-export SessionMode for convenience
export type { SessionMode }

/**
 * Captured media reference for runtime state
 */
export interface CapturedMediaRef {
  assetId: string
  url: string
}

/**
 * Runtime state snapshot
 * Represents the current state of an experience execution
 */
export interface RuntimeState {
  /** Current step index (0-based) */
  currentStepIndex: number

  /** Collected answers keyed by step ID */
  answers: Record<string, Answer['value']>

  /** Captured media keyed by step ID */
  capturedMedia: Record<string, CapturedMediaRef>

  /** Final result media from transform/capture */
  resultMedia: SessionResultMedia | null
}

/**
 * Runtime Engine Interface
 *
 * Defines the contract for experience execution engines.
 * Implementations manage step navigation, data collection, and state persistence.
 *
 * @example
 * ```typescript
 * // Future implementation usage
 * const engine: RuntimeEngine = createRuntimeEngine({
 *   experienceId: 'exp123',
 *   sessionId: 'sess456',
 *   mode: 'guest',
 *   steps: [...],
 * })
 *
 * // Navigate through steps
 * await engine.next()
 *
 * // Collect data
 * engine.setInput('step1', { photo: photoData })
 *
 * // Check state
 * if (engine.isComplete) {
 *   const finalState = engine.getState()
 * }
 * ```
 */
export interface RuntimeEngine {
  /**
   * CONFIGURATION (readonly)
   */

  /** Experience ID this engine is running */
  readonly experienceId: string

  /** Session ID for state persistence */
  readonly sessionId: string

  /** Execution mode (preview or guest) */
  readonly mode: SessionMode

  /**
   * STATE ACCESSORS (readonly)
   */

  /** Current step object, or null if no steps */
  readonly currentStep: ExperienceStep | null

  /** Current step index (0-based) */
  readonly currentStepIndex: number

  /** Total number of steps in the experience */
  readonly totalSteps: number

  /** Whether the user can proceed to the next step */
  readonly canProceed: boolean

  /** Whether the user can go back to the previous step */
  readonly canGoBack: boolean

  /** Whether the experience is complete */
  readonly isComplete: boolean

  /**
   * NAVIGATION
   */

  /**
   * Move to the next step
   * May be async if the current step requires processing (e.g., transform)
   */
  next: () => Promise<void>

  /**
   * Move to the previous step
   */
  back: () => void

  /**
   * Jump to a specific step by index
   * @param index - Target step index (0-based)
   */
  goToStep: (index: number) => void

  /**
   * DATA MUTATION
   */

  /**
   * Set the input for a step (form data, photos, etc.)
   * @param stepId - The step ID
   * @param input - The input value (type depends on step type)
   */
  setInput: (stepId: string, input: unknown) => void

  /**
   * Set a media reference for a step
   * @param stepId - The step ID
   * @param mediaRef - The media reference
   */
  setMedia: (stepId: string, mediaRef: MediaReference) => void

  /**
   * STATE ACCESS
   */

  /**
   * Get the input for a step
   * @param stepId - The step ID
   * @returns The input value, or undefined if not set
   */
  getInput: (stepId: string) => unknown | undefined

  /**
   * Get the output media for a step
   * @param stepId - The step ID
   * @returns The media reference, or undefined if not set
   */
  getOutput: (stepId: string) => MediaReference | undefined

  /**
   * Get a snapshot of the current runtime state
   * @returns The current state object
   */
  getState: () => RuntimeState
}
