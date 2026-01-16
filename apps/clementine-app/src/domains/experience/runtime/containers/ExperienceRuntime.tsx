/**
 * ExperienceRuntime Container
 *
 * Orchestrates experience execution by initializing the runtime store,
 * subscribing to state changes, and handling Firestore synchronization on navigation.
 *
 * Architecture:
 * - Store = pure state + synchronous actions
 * - Container = initializes store, syncs to Firestore on navigation events
 * - Children = call store actions directly via useRuntime()
 *
 * Sync Strategy:
 * - Answers and media are saved to store immediately (local state)
 * - Firestore sync happens on forward navigation (next step or complete)
 * - This minimizes Firestore writes while ensuring data is persisted at meaningful moments
 */
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'

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
 * Initializes the runtime store and handles Firestore synchronization.
 * Sync happens on navigation (forward only) rather than reactively on every change.
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

  // Refs for tracking state changes
  const prevStepIndexRef = useRef<number>(0)
  const hasCompletedRef = useRef(session.status === 'completed')

  // Initialize store synchronously before paint using useLayoutEffect
  // This ensures useRuntime() works in children during initial render
  useLayoutEffect(() => {
    if (!store.sessionId || store.sessionId !== session.id) {
      store.initFromSession(session, steps, experienceId)
      prevStepIndexRef.current = 0
      hasCompletedRef.current = session.status === 'completed'
    }
  }, [session.id, experienceId, steps, store.sessionId, store.initFromSession, session])

  // Sync to Firestore helper - used on navigation events
  const syncToFirestore = useCallback(
    async (options: {
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
    [
      session.projectId,
      session.id,
      updateProgress,
      onError,
      store.setSyncing,
      store.markSynced,
    ],
  )

  // Handle zero steps edge case
  useEffect(() => {
    if (steps.length === 0 && !store.isComplete) {
      store.complete()
    }
  }, [steps.length, store.isComplete, store.complete])

  // React to step changes - sync on forward navigation only
  useEffect(() => {
    if (!store.isReady) return

    const current = store.currentStepIndex
    const prev = prevStepIndexRef.current

    // Sync answers/media to Firestore on forward navigation
    if (current > prev) {
      syncToFirestore({
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
    store.isReady,
    store.currentStepIndex,
    store.answers,
    store.capturedMedia,
    store.steps,
    syncToFirestore,
    onStepChange,
  ])

  // React to completion
  useEffect(() => {
    if (!store.isReady) return
    if (!store.isComplete) return
    if (hasCompletedRef.current) return // Already completed

    hasCompletedRef.current = true

    // Sync final state before completing
    syncToFirestore({
      answers: store.answers,
      capturedMedia: store.capturedMedia,
    })
      .then(() => {
        return completeSession.mutateAsync({
          projectId: session.projectId,
          sessionId: session.id,
        })
      })
      .then(() => {
        onComplete?.()
      })
      .catch((error) => {
        onError?.(
          error instanceof Error ? error : new Error('Complete failed'),
        )
      })
  }, [
    store.isReady,
    store.isComplete,
    store.answers,
    store.capturedMedia,
    session.projectId,
    session.id,
    completeSession,
    syncToFirestore,
    onComplete,
    onError,
  ])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      store.reset()
    }
  }, [store.reset])

  // Don't render children until store is initialized
  if (!store.isReady) {
    return null
  }

  return <>{children}</>
}
