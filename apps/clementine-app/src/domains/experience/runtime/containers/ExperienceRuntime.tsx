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
import { RuntimeNavigation } from '../components/RuntimeNavigation'
import { RuntimeTopBar } from '../components/RuntimeTopBar'
import type { Experience, ExperienceStep } from '../../shared/schemas'
import type { Session } from '@/domains/session'
import { useCompleteSession, useUpdateSessionProgress } from '@/domains/session'
import { cn } from '@/shared/utils'
import { ScrollableView, ThemedError, ThemedLoading } from '@/shared/theming'

/** Step types that manage their own navigation buttons */
const STEPS_WITH_CUSTOM_NAVIGATION = new Set(['capture.photo'])

/**
 * Props for ExperienceRuntime container
 */
export interface ExperienceRuntimeProps {
  /** Experience being executed */
  experience: Experience
  /** Steps to execute */
  steps: ExperienceStep[]
  /** Active session for persistence */
  session: Session
  /** Children that use useRuntime() hook */
  children: React.ReactNode

  // Runtime TopBar props
  /** Exit handler (guest mode: navigate home, preview mode: undefined/disabled) */
  onClose?: () => void
  /** Whether to show the runtime topbar (default: true) */
  showTopBar?: boolean

  // Lifecycle callbacks
  /** Called when step changes (for analytics, etc.) */
  onStepChange?: (step: ExperienceStep, index: number) => void
  /** Called when experience completes (async supported — rejection shows error state) */
  onComplete?: () => void | Promise<void>
  /** Called on sync errors */
  onError?: (error: Error) => void
}

/**
 * ExperienceRuntime Container Component
 *
 * Initializes the runtime store, handles Firestore synchronization, and renders RuntimeTopBar.
 * Sync happens on navigation (forward only) rather than reactively on every change.
 *
 * When the experience is complete (store.isComplete), renders a completing state
 * (spinner + text) instead of children, providing visual feedback during async completion.
 */
export function ExperienceRuntime({
  experience,
  steps,
  session,
  children,
  onClose,
  showTopBar = true,
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
  const syncDoneRef = useRef(session.status === 'completed')
  // True when the session was already completed at mount — skip completing UI
  const mountedAlreadyCompleteRef = useRef(session.status === 'completed')

  // Initialize store synchronously before paint using useLayoutEffect
  // This ensures useRuntime() works in children during initial render
  useLayoutEffect(() => {
    if (!store.sessionId || store.sessionId !== session.id) {
      store.initFromSession(session, steps, experience)
      prevStepIndexRef.current = 0
      syncDoneRef.current = session.status === 'completed'
      mountedAlreadyCompleteRef.current = session.status === 'completed'
    }
  }, [
    session.id,
    experience,
    steps,
    store.sessionId,
    store.initFromSession,
    session,
  ])

  // Sync to Firestore helper - used on navigation events
  // Returns a promise that rejects on failure (for completion flow to handle)
  const syncToFirestore = useCallback(
    async (responses: typeof store.responses) => {
      try {
        store.setSyncing(true)
        await updateProgress.mutateAsync({
          projectId: session.projectId,
          sessionId: session.id,
          responses,
        })
        store.markSynced()
      } catch (error) {
        store.setSyncing(false)
        const syncError =
          error instanceof Error ? error : new Error('Sync failed')
        onError?.(syncError)
        throw syncError // Re-throw so callers can handle
      }
    },
    [
      session.projectId,
      session.id,
      updateProgress.mutateAsync,
      onError,
      store.setSyncing,
      store.markSynced,
    ],
  )

  // React to step changes - sync on forward navigation only
  useEffect(() => {
    if (!store.isReady) return

    const current = store.currentStepIndex
    const prev = prevStepIndexRef.current

    // Sync responses to Firestore on forward navigation
    if (current > prev) {
      syncToFirestore(store.responses)
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
    store.responses,
    store.steps,
    syncToFirestore,
    onStepChange,
  ])

  // Completion flow — extracted so both the effect and retry button can invoke it.
  // syncDoneRef guards Firestore sync (skip on retry if already succeeded).
  // completeSession is idempotent so it can safely re-run on retry.
  const runCompletion = useCallback(async () => {
    store.setCompletionError(null)

    try {
      // Step 1: Sync to Firestore (skip if already synced)
      if (!syncDoneRef.current) {
        await syncToFirestore(store.responses)
        syncDoneRef.current = true
      }

      // Step 2: Complete the session (idempotent — safe to re-call on retry)
      await completeSession.mutateAsync({
        projectId: session.projectId,
        sessionId: session.id,
      })

      // Step 3: Parent callback (transform pipeline, navigation, etc.)
      await onComplete?.()
    } catch (error) {
      store.setCompletionError(
        error instanceof Error ? error.message : 'Something went wrong',
      )
    }
  }, [
    syncToFirestore,
    store.responses,
    store.setCompletionError,
    completeSession.mutateAsync,
    session.projectId,
    session.id,
    onComplete,
  ])

  // Trigger completion when isComplete becomes true
  useEffect(() => {
    if (!store.isReady) return
    if (!store.isComplete) return
    if (syncDoneRef.current) return // Already past sync

    void runCompletion()
  }, [store.isReady, store.isComplete, runCompletion])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      store.reset()
    }
  }, [store.reset])

  // Show loading until store is initialized
  if (!store.isReady) {
    return <ThemedLoading />
  }

  // Check if experience is completing (async completion in progress).
  // Skip when session was already completed at mount — no async work to wait for.
  const isCompleting = store.isComplete && !mountedAlreadyCompleteRef.current

  // Check if current step manages its own navigation and layout
  const currentStep = store.steps[store.currentStepIndex]
  const isFullHeightStep = currentStep
    ? STEPS_WITH_CUSTOM_NAVIGATION.has(currentStep.type)
    : false

  return (
    <>
      {showTopBar && <RuntimeTopBar onClose={onClose} />}
      {isCompleting && store.completionError ? (
        // Completion error: show message + retry instead of infinite spinner
        <ThemedError
          message={store.completionError}
          onRetry={() => void runCompletion()}
        />
      ) : isCompleting ? (
        // Completing state: themed spinner + text while async completion runs
        <ThemedLoading message="Completing your experience..." />
      ) : isFullHeightStep ? (
        // Full-height steps (camera, video): no ScrollableView, no padding, own controls
        <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
      ) : (
        // Content steps (forms, info): scrollable, centered, with topbar/nav padding
        <ScrollableView
          className={cn(
            'items-center max-w-2xl',
            // Padding for fixed top bar
            'pt-28',
            // Padding for fixed bottom navigation (mobile only)
            'pb-28 md:pb-0',
          )}
        >
          {children}
          <RuntimeNavigation />
        </ScrollableView>
      )}
    </>
  )
}
