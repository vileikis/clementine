/**
 * Runtime Engine Types
 *
 * Defines the runtime engine interface for executing experiences.
 * The runtime engine manages step navigation, data collection, and state.
 *
 * This is an interface definition only for Phase 0 - implementation comes in Phase 3.
 */
import type { MediaReference } from '../schemas/media-reference.schema'
import type { Step } from './step.types'

/**
 * Session mode type
 * Re-exported here for runtime engine use
 */
export type SessionMode = 'preview' | 'guest'

/**
 * Runtime state snapshot
 * Represents the current state of an experience execution
 */
export interface RuntimeState {
  /** Current step index (0-based) */
  currentStepIndex: number

  /** Collected answers keyed by step ID */
  answers: Record<string, unknown>

  /** Generated outputs (media) keyed by step ID */
  outputs: Record<string, MediaReference>
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
 * engine.setAnswer('step1', { response: 'yes' })
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
  readonly currentStep: Step | null

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
   * Set the answer for a step
   * @param stepId - The step ID
   * @param answer - The answer value (type depends on step type)
   */
  setAnswer: (stepId: string, answer: unknown) => void

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
   * Get the answer for a step
   * @param stepId - The step ID
   * @returns The answer value, or undefined if not set
   */
  getAnswer: (stepId: string) => unknown | undefined

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
