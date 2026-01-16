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
import type {
  Answer,
  CapturedMedia,
  Session,
  SessionResultMedia,
} from '@/domains/session'
import type { ExperienceStep } from '../../shared/schemas/experience.schema'

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
  answers: Answer[]
  capturedMedia: CapturedMedia[]
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
   * Record an answer for a step
   * Replaces any existing answer for the same stepId
   */
  setAnswer: (
    stepId: string,
    stepType: string,
    value: string | number | boolean | string[],
  ) => void

  /**
   * Record captured media for a step
   * Replaces any existing media for the same stepId
   */
  setCapturedMedia: (
    stepId: string,
    media: Omit<CapturedMedia, 'stepId'>,
  ) => void

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
   * Get answer for a specific step
   */
  getAnswer: (stepId: string) => Answer | undefined

  /**
   * Get answer value for a specific step
   */
  getAnswerValue: (
    stepId: string,
  ) => string | number | boolean | string[] | undefined

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
  answers: [],
  capturedMedia: [],
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
      // Derive starting step from answers (find first unanswered step)
      const answeredStepIds = new Set(
        (session.answers ?? []).map((a) => a.stepId),
      )
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
        answers: session.answers ?? [],
        capturedMedia: session.capturedMedia ?? [],
        resultMedia: session.resultMedia ?? null,
        isReady: true,
        isSyncing: false,
        lastSyncedAt: null,
      })
    },

    setAnswer: (stepId, stepType, value) => {
      set((state) => {
        const newAnswer: Answer = {
          stepId,
          stepType,
          value,
          answeredAt: Date.now(),
        }

        // Replace existing answer for this step or add new
        const existingIndex = state.answers.findIndex(
          (a) => a.stepId === stepId,
        )
        const newAnswers =
          existingIndex >= 0
            ? [
                ...state.answers.slice(0, existingIndex),
                newAnswer,
                ...state.answers.slice(existingIndex + 1),
              ]
            : [...state.answers, newAnswer]

        return { answers: newAnswers }
      })
    },

    setCapturedMedia: (stepId, media) => {
      set((state) => {
        const newMedia: CapturedMedia = {
          stepId,
          ...media,
        }

        // Replace existing media for this step or add new
        const existingIndex = state.capturedMedia.findIndex(
          (m) => m.stepId === stepId,
        )
        const newCapturedMedia =
          existingIndex >= 0
            ? [
                ...state.capturedMedia.slice(0, existingIndex),
                newMedia,
                ...state.capturedMedia.slice(existingIndex + 1),
              ]
            : [...state.capturedMedia, newMedia]

        return { capturedMedia: newCapturedMedia }
      })
    },

    setResultMedia: (resultMedia) => {
      set({ resultMedia })
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

      // Get the answer value for validation
      const answer = state.answers.find((a) => a.stepId === currentStep.id)
      const result = validateStepInput(currentStep, answer?.value)
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

    getAnswer: (stepId) => {
      const state = get()
      return state.answers.find((a) => a.stepId === stepId)
    },

    getAnswerValue: (stepId) => {
      const state = get()
      return state.answers.find((a) => a.stepId === stepId)?.value
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

