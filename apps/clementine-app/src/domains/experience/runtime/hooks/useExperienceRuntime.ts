/**
 * useExperienceRuntime Hook
 *
 * Runtime engine for executing experiences. Manages step sequencing,
 * navigation, input collection, and session synchronization.
 *
 * Uses Zustand store for runtime state and syncs to Firestore on meaningful events.
 */
import { useCallback, useEffect, useRef } from 'react'

import { useSessionRuntimeStore } from '../stores/useSessionRuntimeStore'
import type { MediaReference } from '@/shared/theming'
import type {
  Answer,
  CapturedMedia,
  Session,
  SessionMode,
} from '@/domains/session'
import type { ExperienceStep } from '../../shared/schemas/experience.schema'
import type {
  RuntimeEngine,
  RuntimeState,
} from '../../shared/types/runtime.types'
import { useCompleteSession, useUpdateSessionProgress } from '@/domains/session'

/**
 * Configuration for the runtime engine
 */
export interface RuntimeConfig {
  /** Experience ID being executed */
  experienceId: string
  /** Steps to execute */
  steps: ExperienceStep[]
  /** Active session for persistence */
  session: Session
  /** Callback when experience completes */
  onComplete?: () => void
  /** Callback on error */
  onError?: (error: Error) => void
}

/**
 * Hook for managing experience runtime execution
 *
 * Features:
 * - Step sequencing (0 -> n)
 * - Navigation (next, back, goToStep)
 * - Input validation based on step type (via registry validation)
 * - Session synchronization with Firestore (on meaningful events only)
 * - Zustand store for immediate UI updates
 *
 * @param config - Runtime configuration
 * @returns RuntimeEngine interface
 *
 * @example
 * ```tsx
 * function PreviewContent({ experience, session, onClose }) {
 *   const runtime = useExperienceRuntime({
 *     experienceId: experience.id,
 *     steps: experience.draft.steps,
 *     session,
 *     onComplete: () => {
 *       toast.success('Preview complete!')
 *       onClose()
 *     },
 *   })
 *
 *   return (
 *     <StepRenderer
 *       step={runtime.currentStep}
 *       mode="run"
 *       answer={runtime.getInput(runtime.currentStep?.id)}
 *       onAnswer={(value) => runtime.setInput(runtime.currentStep.id, value)}
 *       onSubmit={() => runtime.next()}
 *       onBack={() => runtime.back()}
 *       canGoBack={runtime.canGoBack}
 *     />
 *   )
 * }
 * ```
 */
export function useExperienceRuntime(config: RuntimeConfig): RuntimeEngine {
  const { experienceId, steps, session, onComplete, onError } = config

  // Zustand store
  const store = useSessionRuntimeStore()

  // Mutations
  const updateProgress = useUpdateSessionProgress()
  const completeSession = useCompleteSession()

  // Debounce timer ref for input updates
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Initialize store from session on mount or session change
  useEffect(() => {
    store.initFromSession(session, steps, experienceId)
  }, [session.id, experienceId])

  // Handle zero steps edge case
  useEffect(() => {
    if (steps.length === 0 && !store.isComplete) {
      store.complete()
      completeSession.mutate({
        projectId: session.projectId,
        sessionId: session.id,
      })
      onComplete?.()
    }
  }, [
    steps.length,
    store.isComplete,
    session.projectId,
    session.id,
    onComplete,
  ])

  // Sync to Firestore - only on meaningful events (not back navigation)
  const syncToFirestore = useCallback(
    async (options: {
      currentStepIndex?: number
      answers?: Answer[]
      capturedMedia?: CapturedMedia[]
    }) => {
      try {
        store.setSyncing(true)
        await updateProgress.mutateAsync({
          projectId: session.projectId,
          sessionId: session.id,
          ...options,
        })
        store.markSynced()
      } catch (error) {
        store.setSyncing(false)
        onError?.(error instanceof Error ? error : new Error('Sync failed'))
      }
    },
    [session.projectId, session.id, updateProgress, onError, store],
  )

  // Navigation: next (triggers Firestore sync)
  const next = useCallback(async () => {
    if (!store.canProceed()) {
      throw new Error('Cannot proceed: current step is not complete')
    }

    const currentStepIndex = store.currentStepIndex
    const totalSteps = store.steps.length

    // Check if on last step
    if (currentStepIndex >= totalSteps - 1) {
      // Complete the experience
      store.complete()
      try {
        await completeSession.mutateAsync({
          projectId: session.projectId,
          sessionId: session.id,
        })
        onComplete?.()
      } catch (error) {
        onError?.(error instanceof Error ? error : new Error('Complete failed'))
      }
      return
    }

    // Move to next step
    if (store.nextStep()) {
      // Sync new state to Firestore
      await syncToFirestore({
        currentStepIndex: store.currentStepIndex,
        answers: store.answers,
        capturedMedia: store.capturedMedia,
      })
    }
  }, [
    store,
    session.projectId,
    session.id,
    completeSession,
    onComplete,
    onError,
    syncToFirestore,
  ])

  // Navigation: back (does NOT trigger Firestore sync)
  const back = useCallback(() => {
    if (!store.canGoBack()) {
      throw new Error('Cannot go back: already at first step')
    }
    store.previousStep()
    // No Firestore sync on back navigation
  }, [store])

  // Navigation: goToStep (does NOT trigger Firestore sync)
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
      // No Firestore sync on goToStep navigation
    },
    [store],
  )

  // Data mutation: setInput (with debounced Firestore sync)
  const setInput = useCallback(
    (stepId: string, input: unknown) => {
      const currentStep = store.getCurrentStep()
      if (!currentStep) return

      // Store the answer
      store.setAnswer(
        stepId,
        currentStep.type,
        input as string | number | boolean | string[],
      )

      // Debounced sync to Firestore
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      debounceTimerRef.current = setTimeout(() => {
        syncToFirestore({
          answers: store.answers,
        })
      }, 300)
    },
    [store, syncToFirestore],
  )

  // Data mutation: setMedia (immediate Firestore sync)
  const setMedia = useCallback(
    (stepId: string, mediaRef: MediaReference) => {
      store.setCapturedMedia(stepId, {
        assetId: mediaRef.url, // Using URL as assetId for now
        url: mediaRef.url,
        createdAt: Date.now(),
      })
      // Immediate sync for media
      syncToFirestore({
        capturedMedia: store.capturedMedia,
      })
    },
    [store, syncToFirestore],
  )

  // State access
  const getInput = useCallback(
    (stepId: string) => {
      return store.getAnswerValue(stepId)
    },
    [store],
  )

  const getOutput = useCallback(
    (stepId: string) => {
      const media = store.capturedMedia.find((m) => m.stepId === stepId)
      if (!media) return undefined
      return { mediaAssetId: media.assetId, url: media.url }
    },
    [store],
  )

  const getState = useCallback((): RuntimeState => {
    // Convert answers array to Record for backward compatibility
    const inputs: Record<string, unknown> = {}
    for (const answer of store.answers) {
      inputs[answer.stepId] = answer.value
    }

    // Convert capturedMedia array to Record for backward compatibility
    const outputs: Record<string, MediaReference> = {}
    for (const media of store.capturedMedia) {
      outputs[media.stepId] = { mediaAssetId: media.assetId, url: media.url }
    }

    return {
      currentStepIndex: store.currentStepIndex,
      inputs,
      outputs,
    }
  }, [store])

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  // Computed values from store
  const currentStep = store.getCurrentStep()
  const mode: SessionMode = session.mode

  return {
    // Configuration (readonly)
    experienceId,
    sessionId: session.id,
    mode,

    // State accessors (readonly)
    currentStep,
    currentStepIndex: store.currentStepIndex,
    totalSteps: store.steps.length,
    canProceed: store.canProceed(),
    canGoBack: store.canGoBack(),
    isComplete: store.isComplete,

    // Navigation
    next,
    back,
    goToStep,

    // Data mutation
    setInput,
    setMedia,

    // State access
    getInput,
    getOutput,
    getState,
  }
}
