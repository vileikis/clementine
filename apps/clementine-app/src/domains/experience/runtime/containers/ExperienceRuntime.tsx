/**
 * ExperienceRuntime Container
 *
 * Orchestrates experience execution by initializing the runtime store,
 * subscribing to state changes, and handling Firestore synchronization reactively.
 *
 * Architecture:
 * - Store = pure state + synchronous actions
 * - Container = subscribes to store changes, triggers side effects reactively
 * - Children = call store actions directly via useRuntime()
 */
import { useCallback, useEffect, useRef } from 'react'

import { useExperienceRuntimeStore } from '../stores/experienceRuntimeStore'
import type { ExperienceStep } from '../../shared/schemas/experience.schema'
import type { Session } from '@/domains/session'
import { useCompleteSession, useUpdateSessionProgress } from '@/domains/session'

/**
 * Props for ExperienceRuntime container
 */
export interface ExperienceRuntimeProps {
  /** Experience ID being executed */
  experienceId: string
  /** Steps to execute */
  steps: ExperienceStep[]
  /** Active session for persistence */
  session: Session
  /** Children that use useRuntime() hook */
  children: React.ReactNode

  // Lifecycle callbacks
  /** Called when step changes (for analytics, etc.) */
  onStepChange?: (step: ExperienceStep, index: number) => void
  /** Called when experience completes */
  onComplete?: () => void
  /** Called on sync errors */
  onError?: (error: Error) => void
}

/**
 * ExperienceRuntime Container Component
 *
 * Uses a reactive pattern:
 * - Initializes store from session on mount
 * - Subscribes to store state changes
 * - Triggers Firestore sync reactively when state changes
 * - Fires lifecycle callbacks at appropriate times
 *
 * @example
 * ```tsx
 * function PreviewModal({ experience, session }) {
 *   return (
 *     <ExperienceRuntime
 *       experienceId={experience.id}
 *       steps={experience.draft.steps}
 *       session={session}
 *       onComplete={() => toast.success('Experience complete!')}
 *       onStepChange={(step, index) => analytics.track('step_viewed', { step, index })}
 *     >
 *       <StepRenderer />
 *     </ExperienceRuntime>
 *   )
 * }
 * ```
 */
export function ExperienceRuntime({
  experienceId,
  steps,
  session,
  children,
  onStepChange,
  onComplete,
  onError,
}: ExperienceRuntimeProps) {
  // Zustand store
  const store = useExperienceRuntimeStore()

  // Mutations
  const updateProgress = useUpdateSessionProgress()
  const completeSession = useCompleteSession()

  // Refs for tracking previous state (to detect changes)
  const prevStepIndexRef = useRef<number | null>(null)
  const prevMediaCountRef = useRef<number>(0)
  const prevIsCompleteRef = useRef<boolean>(false)
  const isInitializedRef = useRef<boolean>(false)

  // Debounce timer ref for answer updates
  const answerDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevAnswersLengthRef = useRef<number>(0)

  // Sync to Firestore helper
  const syncToFirestore = useCallback(
    async (options: {
      currentStepIndex?: number
      answers?: typeof store.answers
      capturedMedia?: typeof store.capturedMedia
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

  // Initialize store from session on mount or session change
  useEffect(() => {
    store.initFromSession(session, steps, experienceId)

    // Initialize refs after store init
    prevStepIndexRef.current = session.currentStepIndex ?? 0
    prevMediaCountRef.current = session.capturedMedia?.length ?? 0
    prevIsCompleteRef.current = session.status === 'completed'
    prevAnswersLengthRef.current = session.answers?.length ?? 0
    isInitializedRef.current = true

    return () => {
      // Cleanup on unmount
      isInitializedRef.current = false
    }
  }, [session.id, experienceId, steps])

  // Handle zero steps edge case
  useEffect(() => {
    if (steps.length === 0 && !store.isComplete) {
      store.complete()
    }
  }, [steps.length, store.isComplete])

  // React to forward navigation → sync to Firestore
  useEffect(() => {
    // Skip if not initialized
    if (!isInitializedRef.current || prevStepIndexRef.current === null) return

    const current = store.currentStepIndex
    const prev = prevStepIndexRef.current

    // Only sync on forward navigation (making progress)
    if (current > prev) {
      syncToFirestore({
        currentStepIndex: current,
        answers: store.answers,
        capturedMedia: store.capturedMedia,
      })
    }

    // Fire onStepChange callback when step changes (forward or back)
    if (current !== prev) {
      const currentStep = store.steps[current]
      if (currentStep) {
        onStepChange?.(currentStep, current)
      }
    }

    prevStepIndexRef.current = current
  }, [store.currentStepIndex, store.answers, store.capturedMedia, store.steps, syncToFirestore, onStepChange])

  // React to new media capture → sync immediately
  useEffect(() => {
    // Skip if not initialized
    if (!isInitializedRef.current) return

    const currentCount = store.capturedMedia.length
    const prevCount = prevMediaCountRef.current

    // Sync when new media is added
    if (currentCount > prevCount) {
      syncToFirestore({ capturedMedia: store.capturedMedia })
    }

    prevMediaCountRef.current = currentCount
  }, [store.capturedMedia, syncToFirestore])

  // React to answer changes → debounced sync
  useEffect(() => {
    // Skip if not initialized
    if (!isInitializedRef.current) return

    const currentLength = store.answers.length
    const prevLength = prevAnswersLengthRef.current

    // Only sync if answers were added or modified
    // We detect this by checking if the answers array changed
    if (currentLength !== prevLength || currentLength > 0) {
      // Clear existing debounce
      if (answerDebounceRef.current) {
        clearTimeout(answerDebounceRef.current)
      }

      // Debounce the sync
      answerDebounceRef.current = setTimeout(() => {
        syncToFirestore({ answers: store.answers })
      }, 300)
    }

    prevAnswersLengthRef.current = currentLength

    return () => {
      if (answerDebounceRef.current) {
        clearTimeout(answerDebounceRef.current)
      }
    }
  }, [store.answers, syncToFirestore])

  // React to completion → complete session in Firestore
  useEffect(() => {
    // Skip if not initialized or was already complete
    if (!isInitializedRef.current || prevIsCompleteRef.current) return

    if (store.isComplete && !prevIsCompleteRef.current) {
      completeSession
        .mutateAsync({
          projectId: session.projectId,
          sessionId: session.id,
        })
        .then(() => {
          onComplete?.()
        })
        .catch((error) => {
          onError?.(error instanceof Error ? error : new Error('Complete failed'))
        })
    }

    prevIsCompleteRef.current = store.isComplete
  }, [store.isComplete, session.projectId, session.id, completeSession, onComplete, onError])

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (answerDebounceRef.current) {
        clearTimeout(answerDebounceRef.current)
      }
      store.reset()
    }
  }, [])

  return <>{children}</>
}
