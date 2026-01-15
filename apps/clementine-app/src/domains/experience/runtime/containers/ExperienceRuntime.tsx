/**
 * ExperienceRuntime Container
 *
 * Orchestrates experience execution by initializing the runtime store,
 * managing lifecycle callbacks, and handling Firestore synchronization.
 *
 * This is the top-level container for experience execution.
 * Children use the `useRuntime()` hook to access runtime state and actions.
 */
import { useCallback, useEffect, useRef } from 'react'

import { useExperienceRuntimeStore } from '../stores/experienceRuntimeStore'
import type { ExperienceStep } from '../../shared/schemas/experience.schema'
import type {
  Answer,
  CapturedMedia,
  Session,
} from '@/domains/session'
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
 * Responsibilities:
 * 1. Initialize store from session on mount
 * 2. Handle zero-steps edge case
 * 3. Call onStepChange when step changes
 * 4. Call onComplete when experience completes
 * 5. Call onError on sync failures
 * 6. Clean up on unmount
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

  // Track previous step index for onStepChange callback
  const prevStepIndexRef = useRef<number | null>(null)

  // Debounce timer ref for answer updates
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Initialize store from session on mount or session change
  useEffect(() => {
    store.initFromSession(session, steps, experienceId)
    prevStepIndexRef.current = session.currentStepIndex ?? 0
  }, [session.id, experienceId, steps])

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
  }, [steps.length, store.isComplete, session.projectId, session.id, onComplete])

  // Fire onStepChange callback when step index changes
  useEffect(() => {
    const currentIndex = store.currentStepIndex
    const prevIndex = prevStepIndexRef.current

    // Only fire if we have a previous value and it changed
    if (prevIndex !== null && prevIndex !== currentIndex) {
      const currentStep = store.steps[currentIndex]
      if (currentStep) {
        onStepChange?.(currentStep, currentIndex)
      }
    }

    prevStepIndexRef.current = currentIndex
  }, [store.currentStepIndex, store.steps, onStepChange])

  // Fire onComplete when isComplete changes to true
  useEffect(() => {
    // Only fire when store transitions to complete
    // The completeSession mutation should be called by the navigation action
  }, [store.isComplete])

  // Sync to Firestore helper - exposed to store actions via callbacks
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

  // Store refs for actions that need latest callbacks
  const callbacksRef = useRef({ onComplete, onError, syncToFirestore })
  useEffect(() => {
    callbacksRef.current = { onComplete, onError, syncToFirestore }
  }, [onComplete, onError, syncToFirestore])

  // Expose navigation actions and sync callback to children via context-like pattern
  // Children access these via useRuntime() hook which reads from store + this container
  useEffect(() => {
    // Store the sync callback and completion handler in a place useRuntime can access
    // This is done by storing refs that the public useRuntime hook can use
    ;(window as any).__experienceRuntimeCallbacks = {
      syncToFirestore,
      completeSession: async () => {
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
      },
      debounceTimerRef,
    }

    return () => {
      delete (window as any).__experienceRuntimeCallbacks
    }
  }, [
    syncToFirestore,
    store,
    completeSession,
    session.projectId,
    session.id,
    onComplete,
    onError,
  ])

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      store.reset()
    }
  }, [])

  return <>{children}</>
}
