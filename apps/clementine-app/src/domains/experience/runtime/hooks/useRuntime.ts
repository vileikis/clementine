/**
 * useRuntime Hook
 *
 * Public hook for accessing runtime state within ExperienceRuntime container.
 * Provides a curated API for children components to interact with the runtime.
 *
 * This hook exposes store state and actions directly. The ExperienceRuntime
 * container handles all side effects (Firestore sync) reactively by subscribing
 * to store state changes.
 *
 * Must be used inside an ExperienceRuntime container.
 */
import { useCallback } from 'react'

import { useExperienceRuntimeStore } from '../stores/experienceRuntimeStore'
import type { SessionResponse } from '@clementine/shared'
import type { RuntimeState } from '../../shared/types/runtime.types'
import type { ExperienceStep } from '../../shared/schemas'

/**
 * Build a SessionResponse from step and data.
 * Internal helper - not exported.
 */
function buildSessionResponse(
  step: ExperienceStep,
  data: unknown,
): SessionResponse {
  const now = Date.now()
  return {
    stepId: step.id,
    stepName: step.name,
    stepType: step.type,
    data,
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Return type for useRuntime hook
 */
export interface RuntimeAPI {
  // Identity
  sessionId: string
  projectId: string

  // Read-only state
  currentStep: ExperienceStep | null
  currentStepIndex: number
  totalSteps: number
  canProceed: boolean
  canGoBack: boolean
  isComplete: boolean
  isSyncing: boolean

  // Navigation actions
  next: () => void
  back: () => void
  goToStep: (index: number) => void

  // Data mutation
  /**
   * Record a response for a step (unified format).
   * Builds the SessionResponse internally from step metadata.
   * @param step - The step being responded to
   * @param data - Step-specific data (string for simple inputs, MultiSelectOption[] for multiSelect, MediaReference[] for capture)
   */
  setStepResponse: (step: ExperienceStep, data: unknown) => void

  // State access
  getResponse: (stepId: string) => SessionResponse | undefined
  getResponses: () => SessionResponse[]
  getState: () => RuntimeState
}

/**
 * Public hook for accessing runtime state and actions
 *
 * Must be used within an ExperienceRuntime container.
 * Throws if the store is not initialized.
 *
 * The container handles all Firestore synchronization reactively -
 * this hook just exposes store state and actions.
 *
 * @returns RuntimeAPI - Curated API for runtime interaction
 *
 * @example
 * ```tsx
 * function StepDisplay() {
 *   const {
 *     currentStep,
 *     canProceed,
 *     canGoBack,
 *     next,
 *     back,
 *     setStepResponse,
 *     getResponse,
 *   } = useRuntime()
 *
 *   if (!currentStep) return <div>No steps</div>
 *
 *   const response = getResponse(currentStep.id)
 *   return (
 *     <div>
 *       <h2>{currentStep.config.title}</h2>
 *       <input
 *         value={response?.data ?? ''}
 *         onChange={(e) => setStepResponse(currentStep, e.target.value)}
 *       />
 *       <button onClick={back} disabled={!canGoBack}>Back</button>
 *       <button onClick={next} disabled={!canProceed}>Next</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useRuntime(): RuntimeAPI {
  const store = useExperienceRuntimeStore()

  // Throw if not initialized (used outside ExperienceRuntime container)
  if (!store.sessionId || !store.projectId) {
    throw new Error(
      'useRuntime must be used within an ExperienceRuntime container. ' +
        'Make sure you have wrapped your component with <ExperienceRuntime>.',
    )
  }

  // These are guaranteed to be non-null after the check above
  const sessionId = store.sessionId
  const projectId = store.projectId

  // Navigation: next
  // Just updates store state - container handles Firestore sync reactively
  const next = useCallback(() => {
    if (!store.canProceed()) {
      throw new Error('Cannot proceed: current step is not complete')
    }

    const currentStepIndex = store.currentStepIndex
    const totalSteps = store.steps.length

    // Check if on last step → complete
    if (currentStepIndex >= totalSteps - 1) {
      store.complete()
      return
    }

    // Move to next step
    store.nextStep()
  }, [store])

  // Navigation: back
  const back = useCallback(() => {
    if (!store.canGoBack()) {
      throw new Error('Cannot go back: already at first step')
    }
    store.previousStep()
  }, [store])

  // Navigation: goToStep
  const goToStep = useCallback(
    (index: number) => {
      const totalSteps = store.steps.length
      if (index < 0 || index >= totalSteps) {
        throw new Error(`Invalid step index: ${index}`)
      }
      if (index > store.currentStepIndex) {
        throw new Error('Cannot skip ahead to unvisited steps')
      }
      store.goToStep(index)
    },
    [store],
  )

  // Data mutation: setStepResponse (unified format)
  // Builds SessionResponse from step metadata, then updates store
  const setStepResponse = useCallback(
    (step: ExperienceStep, data: unknown) => {
      const response = buildSessionResponse(step, data)
      store.setResponse(response)
    },
    [store],
  )

  // State access: getResponse (unified format)
  const getResponse = useCallback(
    (stepId: string): SessionResponse | undefined => {
      return store.getResponse(stepId)
    },
    [store],
  )

  // State access: getResponses (unified format)
  const getResponses = useCallback((): SessionResponse[] => {
    return store.getResponses()
  }, [store])

  // State access: getState
  const getState = useCallback((): RuntimeState => {
    return {
      currentStepIndex: store.currentStepIndex,
      responses: store.responses,
      resultMedia: store.resultMedia,
    }
  }, [store])

  return {
    // Identity
    sessionId,
    projectId,

    // Read-only state
    currentStep: store.getCurrentStep(),
    currentStepIndex: store.currentStepIndex,
    totalSteps: store.steps.length,
    canProceed: store.canProceed(),
    canGoBack: store.canGoBack(),
    isComplete: store.isComplete,
    isSyncing: store.isSyncing,

    // Navigation actions
    next,
    back,
    goToStep,

    // Data mutation
    setStepResponse,

    // State access
    getResponse,
    getResponses,
    getState,
  }
}
