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
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

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

  // State for tracking store readiness
  const [isStoreReady, setIsStoreReady] = useState(false)

  // Refs
  const isInitializedRef = useRef(false)
  const prevStepIndexRef = useRef<number>(session.currentStepIndex ?? 0)
  const answerDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasCompletedRef = useRef(session.status === 'completed')

  // Initialize store synchronously before paint using useLayoutEffect
  // This ensures useRuntime() works in children during initial render
  useLayoutEffect(() => {
    if (!store.sessionId || store.sessionId !== session.id) {
      store.initFromSession(session, steps, experienceId)
      prevStepIndexRef.current = session.currentStepIndex ?? 0
      hasCompletedRef.current = session.status === 'completed'
      isInitializedRef.current = true
    }
    setIsStoreReady(true)
  }, [session.id, experienceId, steps, store, session])

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

  // Reset isStoreReady when session changes
  useEffect(() => {
    return () => {
      isInitializedRef.current = false
      setIsStoreReady(false)
    }
  }, [session.id])

  // Handle zero steps edge case
  useEffect(() => {
    if (steps.length === 0 && !store.isComplete) {
      store.complete()
    }
  }, [steps.length, store.isComplete])

  // React to step changes
  useEffect(() => {
    if (!isInitializedRef.current) return

    const current = store.currentStepIndex
    const prev = prevStepIndexRef.current

    // Only sync stepIndex on forward navigation
    if (current > prev) {
      syncToFirestore({
        currentStepIndex: current,
        answers: store.answers,
        capturedMedia: store.capturedMedia,
      })
    }

    // Fire onStepChange callback on any step change
    if (current !== prev) {
      const currentStep = store.steps[current]
      if (currentStep) {
        onStepChange?.(currentStep, current)
      }
    }

    prevStepIndexRef.current = current
  }, [
    store.currentStepIndex,
    store.answers,
    store.capturedMedia,
    store.steps,
    syncToFirestore,
    onStepChange,
  ])

  // React to answer changes - debounced sync
  // Zustand creates new array reference on change, so this fires on content changes too
  useEffect(() => {
    if (!isInitializedRef.current) return
    if (store.answers.length === 0) return

    if (answerDebounceRef.current) {
      clearTimeout(answerDebounceRef.current)
    }

    answerDebounceRef.current = setTimeout(() => {
      syncToFirestore({ answers: store.answers })
    }, 300)

    return () => {
      if (answerDebounceRef.current) {
        clearTimeout(answerDebounceRef.current)
      }
    }
  }, [store.answers, syncToFirestore])

  // React to media changes - immediate sync
  // Zustand creates new array reference on change, so this fires on content changes too
  useEffect(() => {
    if (!isInitializedRef.current) return
    if (store.capturedMedia.length === 0) return

    syncToFirestore({ capturedMedia: store.capturedMedia })
  }, [store.capturedMedia, syncToFirestore])

  // React to completion
  useEffect(() => {
    if (!isInitializedRef.current) return
    if (!store.isComplete) return
    if (hasCompletedRef.current) return // Already completed

    hasCompletedRef.current = true

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
  }, [
    store.isComplete,
    session.projectId,
    session.id,
    completeSession,
    onComplete,
    onError,
  ])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (answerDebounceRef.current) {
        clearTimeout(answerDebounceRef.current)
      }
      store.reset()
    }
  }, [])

  // Don't render children until store is initialized
  if (!isStoreReady) {
    return null
  }

  return <>{children}</>
}
