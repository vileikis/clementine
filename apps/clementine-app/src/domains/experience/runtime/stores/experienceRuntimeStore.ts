/**
 * Experience Runtime Store
 *
 * Zustand store for managing runtime state during experience execution.
 * Separates UI navigation state from Firestore session persistence.
 *
 * Design rationale:
 * - Firestore session = persistent progress (for recovery, analytics)
 * - Zustand store = runtime navigation state (for immediate UI updates)
 * - Navigation (back/forward) updates Zustand immediately without Firestore writes
 * - Firestore sync only on "meaningful" events (answer submitted, step completed)
 */
import { create } from 'zustand'

import { validateStepInput } from '../../steps/registry/step-validation'
import type { Session, SessionResultMedia } from '@/domains/session'
import type { SessionResponse } from '@clementine/shared'
import type { ExperienceStep } from '../../shared/schemas'

/**
 * Experience runtime state
 */
export interface ExperienceRuntimeState {
  // Identity
  sessionId: string | null
  projectId: string | null
  experienceId: string | null

  // Steps configuration
  steps: ExperienceStep[]

  // Navigation state
  currentStepIndex: number
  isComplete: boolean

  // Collected data
  responses: SessionResponse[]
  resultMedia: SessionResultMedia | null

  // Lifecycle status
  /** Whether the store has been initialized and is ready for use */
  isReady: boolean

  // Sync status
  isSyncing: boolean
  lastSyncedAt: number | null
}

/**
 * Experience runtime actions
 */
export interface ExperienceRuntimeActions {
  /**
   * Initialize store from a session document
   * Call this when the session is first loaded or changes
   */
  initFromSession: (
    session: Session,
    steps: ExperienceStep[],
    experienceId: string,
  ) => void

  /**
   * Record a response for a step (unified format)
   * Replaces any existing response for the same stepId
   */
  setResponse: (response: SessionResponse) => void

  /**
   * Get response for a specific step
   */
  getResponse: (stepId: string) => SessionResponse | undefined

  /**
   * Get all responses
   */
  getResponses: () => SessionResponse[]

  /**
   * Set the final result media
   */
  setResultMedia: (resultMedia: SessionResultMedia) => void

  /**
   * Navigate to a specific step (previously visited only)
   * Does NOT trigger Firestore sync (back navigation)
   */
  goToStep: (index: number) => void

  /**
   * Move to the next step
   * Returns true if navigation succeeded, false if at end or invalid
   */
  nextStep: () => boolean

  /**
   * Move to the previous step
   * Returns true if navigation succeeded, false if at start
   */
  previousStep: () => boolean

  /**
   * Mark the experience as complete
   */
  complete: () => void

  /**
   * Check if the current step input is valid
   */
  canProceed: () => boolean

  /**
   * Check if can go back from current step
   */
  canGoBack: () => boolean

  /**
   * Get the current step
   */
  getCurrentStep: () => ExperienceStep | null

  /**
   * Set syncing status
   */
  setSyncing: (isSyncing: boolean) => void

  /**
   * Mark as synced with timestamp
   */
  markSynced: () => void

  /**
   * Reset the store
   */
  reset: () => void
}

export type ExperienceRuntimeStore = ExperienceRuntimeState &
  ExperienceRuntimeActions

/**
 * Initial state for the store
 */
const initialState: ExperienceRuntimeState = {
  sessionId: null,
  projectId: null,
  experienceId: null,
  steps: [],
  currentStepIndex: 0,
  isComplete: false,
  responses: [],
  resultMedia: null,
  isReady: false,
  isSyncing: false,
  lastSyncedAt: null,
}

/**
 * Create the experience runtime store
 *
 * @example
 * ```tsx
 * function RuntimeComponent({ session, steps, experienceId }) {
 *   const store = useExperienceRuntimeStore()
 *
 *   // Initialize on mount
 *   useEffect(() => {
 *     store.initFromSession(session, steps, experienceId)
 *   }, [session.id])
 *
 *   // Use store state
 *   const currentStep = store.getCurrentStep()
 *   const canProceed = store.canProceed()
 *
 *   // Handle navigation
 *   const handleNext = () => {
 *     if (store.nextStep()) {
 *       // Sync to Firestore
 *       syncToFirestore(store)
 *     }
 *   }
 * }
 * ```
 */
export const useExperienceRuntimeStore = create<ExperienceRuntimeStore>(
  (set, get) => ({
    ...initialState,

    initFromSession: (session, steps, experienceId) => {
      // Derive starting step from responses (preferred) or answers (legacy)
      // First try unified responses, fall back to answers for backward compatibility
      const existingResponses = session.responses ?? []
      const respondedStepIds = new Set(existingResponses.map((r) => r.stepId))

      // Fall back to answers if no responses exist (legacy sessions)
      const answeredStepIds =
        respondedStepIds.size > 0
          ? respondedStepIds
          : new Set((session.answers ?? []).map((a) => a.stepId))

      const firstUnansweredIndex = steps.findIndex(
        (step) => !answeredStepIds.has(step.id),
      )
      const startingIndex =
        firstUnansweredIndex === -1 ? steps.length : firstUnansweredIndex

      set({
        sessionId: session.id,
        projectId: session.projectId,
        experienceId,
        steps,
        currentStepIndex: startingIndex,
        isComplete: session.status === 'completed',
        responses: existingResponses,
        resultMedia: session.resultMedia ?? null,
        isReady: true,
        isSyncing: false,
        lastSyncedAt: null,
      })
    },

    setResultMedia: (resultMedia) => {
      set({ resultMedia })
    },

    setResponse: (response) => {
      set((state) => {
        // Replace existing response for this step or add new
        const existingIndex = state.responses.findIndex(
          (r) => r.stepId === response.stepId,
        )
        const newResponses =
          existingIndex >= 0
            ? state.responses.map((r, i) =>
                i === existingIndex
                  ? { ...response, updatedAt: Date.now() }
                  : r,
              )
            : [...state.responses, response]

        return { responses: newResponses }
      })
    },

    getResponse: (stepId) => {
      const state = get()
      return state.responses.find((r) => r.stepId === stepId)
    },

    getResponses: () => {
      return get().responses
    },

    goToStep: (index) => {
      const state = get()
      // Can only go to previously visited steps (index <= currentStepIndex)
      if (index < 0 || index >= state.steps.length) {
        return
      }
      // Can't skip ahead to unvisited steps
      if (index > state.currentStepIndex) {
        return
      }
      set({ currentStepIndex: index })
    },

    nextStep: () => {
      const state = get()
      const { currentStepIndex, steps } = state

      // Check if at end
      if (currentStepIndex >= steps.length - 1) {
        return false
      }

      // Check if can proceed
      if (!get().canProceed()) {
        return false
      }

      set({ currentStepIndex: currentStepIndex + 1 })
      return true
    },

    previousStep: () => {
      const state = get()
      const { currentStepIndex } = state

      // Check if at start
      if (currentStepIndex <= 0) {
        return false
      }

      set({ currentStepIndex: currentStepIndex - 1 })
      return true
    },

    complete: () => {
      set({ isComplete: true })
    },

    canProceed: () => {
      const state = get()
      const currentStep = state.steps[state.currentStepIndex]
      if (!currentStep) return false

      // Get the response value for validation
      const response = state.responses.find((r) => r.stepId === currentStep.id)
      const result = validateStepInput(currentStep, response?.value)
      return result.isValid
    },

    canGoBack: () => {
      const state = get()
      return state.currentStepIndex > 0
    },

    getCurrentStep: () => {
      const state = get()
      return state.steps[state.currentStepIndex] ?? null
    },

    setSyncing: (isSyncing) => {
      set({ isSyncing })
    },

    markSynced: () => {
      set({ isSyncing: false, lastSyncedAt: Date.now() })
    },

    reset: () => {
      set(initialState)
    },
  }),
)

/**
 * Selector for getting the current step
 */
export const selectCurrentStep = (state: ExperienceRuntimeStore) =>
  state.steps[state.currentStepIndex] ?? null

/**
 * Selector for getting the total number of steps
 */
export const selectTotalSteps = (state: ExperienceRuntimeStore) =>
  state.steps.length

/**
 * Selector for checking if experience is complete
 */
export const selectIsComplete = (state: ExperienceRuntimeStore) =>
  state.isComplete
