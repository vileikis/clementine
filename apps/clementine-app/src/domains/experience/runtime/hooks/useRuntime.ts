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
import type { MediaReference } from '@clementine/shared'
import type { Answer } from '@/domains/session'
import type {
  CapturedMediaRef,
  RuntimeState,
} from '../../shared/types/runtime.types'
import type { ExperienceStep } from '../../shared/schemas'

/**
 * Return type for useRuntime hook
 */
export interface RuntimeAPI {
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
  setAnswer: (stepId: string, value: Answer['value']) => void
  setMedia: (stepId: string, mediaRef: MediaReference) => void

  // State access
  getAnswer: (stepId: string) => Answer['value'] | undefined
  getMedia: (stepId: string) => CapturedMediaRef | undefined
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
 *     setAnswer,
 *     getAnswer,
 *   } = useRuntime()
 *
 *   if (!currentStep) return <div>No steps</div>
 *
 *   return (
 *     <div>
 *       <h2>{currentStep.config.title}</h2>
 *       <input
 *         value={getAnswer(currentStep.id) ?? ''}
 *         onChange={(e) => setAnswer(currentStep.id, e.target.value)}
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
  if (!store.sessionId) {
    throw new Error(
      'useRuntime must be used within an ExperienceRuntime container. ' +
        'Make sure you have wrapped your component with <ExperienceRuntime>.',
    )
  }

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

  // Data mutation: setAnswer
  // Just updates store - container handles debounced Firestore sync
  const setAnswer = useCallback(
    (stepId: string, value: Answer['value']) => {
      const currentStep = store.getCurrentStep()
      if (!currentStep) return
      store.setAnswer(stepId, currentStep.type, value)
    },
    [store],
  )

  // Data mutation: setMedia
  // Just updates store - container handles immediate Firestore sync
  const setMedia = useCallback(
    (stepId: string, mediaRef: MediaReference) => {
      store.setCapturedMedia(stepId, {
        assetId: mediaRef.url, // Using URL as assetId for now
        url: mediaRef.url,
        createdAt: Date.now(),
      })
    },
    [store],
  )

  // State access: getAnswer
  const getAnswer = useCallback(
    (stepId: string): Answer['value'] | undefined => {
      return store.getAnswerValue(stepId)
    },
    [store],
  )

  // State access: getMedia
  const getMedia = useCallback(
    (stepId: string): CapturedMediaRef | undefined => {
      const media = store.capturedMedia.find((m) => m.stepId === stepId)
      if (!media) return undefined
      return { assetId: media.assetId, url: media.url }
    },
    [store],
  )

  // State access: getState
  const getState = useCallback((): RuntimeState => {
    // Convert answers array to Record
    const answers: Record<string, Answer['value']> = {}
    for (const answer of store.answers) {
      answers[answer.stepId] = answer.value
    }

    // Convert capturedMedia array to Record
    const capturedMedia: Record<string, CapturedMediaRef> = {}
    for (const media of store.capturedMedia) {
      capturedMedia[media.stepId] = { assetId: media.assetId, url: media.url }
    }

    return {
      currentStepIndex: store.currentStepIndex,
      answers,
      capturedMedia,
      resultMedia: store.resultMedia,
    }
  }, [store])

  return {
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
    setAnswer,
    setMedia,

    // State access
    getAnswer,
    getMedia,
    getState,
  }
}
