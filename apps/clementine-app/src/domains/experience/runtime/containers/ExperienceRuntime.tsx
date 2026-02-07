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
import type { ExperienceStep } from '../../shared/schemas'
import type { Session } from '@/domains/session'
import { useCompleteSession, useUpdateSessionProgress } from '@/domains/session'
import { cn } from '@/shared/utils'
import { ScrollableView } from '@/shared/theming'

/** Step types that manage their own navigation buttons */
const STEPS_WITH_CUSTOM_NAVIGATION = new Set(['capture.photo'])

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

  // Runtime TopBar props
  /** Experience name to display in topbar */
  experienceName?: string
  /** Home navigation handler (guest mode: navigate home, preview mode: undefined/disabled) */
  onHomeClick?: () => void
  /** Whether to show the runtime topbar (default: true) */
  showTopBar?: boolean

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
 * Initializes the runtime store, handles Firestore synchronization, and renders RuntimeTopBar.
 * Sync happens on navigation (forward only) rather than reactively on every change.
 *
 * @example
 * ```tsx
 * // Guest mode - with topbar and home button
 * function ExperiencePage({ experience, session }) {
 *   return (
 *     <ExperienceRuntime
 *       experienceId={experience.id}
 *       steps={experience.published.steps}
 *       session={session}
 *       experienceName={experience.name}
 *       onHomeClick={() => navigate('/home')}
 *       onComplete={() => navigate('/share')}
 *     >
 *       <GuestRuntimeContent />
 *     </ExperienceRuntime>
 *   )
 * }
 *
 * // Preview mode - no topbar or home button disabled
 * function PreviewModal({ experience, session }) {
 *   return (
 *     <ExperienceRuntime
 *       experienceId={experience.id}
 *       steps={experience.draft.steps}
 *       session={session}
 *       experienceName={experience.name}
 *       showTopBar={false}
 *       onComplete={() => toast.success('Preview complete!')}
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
  experienceName,
  onHomeClick,
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
  const hasCompletedRef = useRef(session.status === 'completed')

  // Initialize store synchronously before paint using useLayoutEffect
  // This ensures useRuntime() works in children during initial render
  useLayoutEffect(() => {
    if (!store.sessionId || store.sessionId !== session.id) {
      store.initFromSession(session, steps, experienceId)
      prevStepIndexRef.current = 0
      hasCompletedRef.current = session.status === 'completed'
    }
  }, [
    session.id,
    experienceId,
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

  // React to completion
  // Note: No cancellation pattern - hasCompletedRef prevents re-execution.
  // Once completion starts, it must run to completion to call onComplete.
  // Sync must succeed before we mark complete - if sync fails, we don't proceed.
  useEffect(() => {
    if (!store.isReady) return
    if (!store.isComplete) return
    if (hasCompletedRef.current) return // Already completed

    // Sync final state before completing
    // Only proceed with completion if sync succeeds
    const runCompletion = async () => {
      // Step 1: Sync to Firestore
      try {
        await syncToFirestore(store.responses)
      } catch {
        // Error already reported by syncToFirestore via onError
        return
      }

      // Step 2: Mark as completed only after successful sync
      hasCompletedRef.current = true

      // Step 3: Complete the session
      try {
        await completeSession.mutateAsync({
          projectId: session.projectId,
          sessionId: session.id,
        })
        onComplete?.()
      } catch (error) {
        onError?.(error instanceof Error ? error : new Error('Complete failed'))
      }
    }

    void runCompletion()
  }, [
    store.isReady,
    store.isComplete,
    store.responses,
    session.projectId,
    session.id,
    completeSession.mutateAsync,
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

  // Check if current step manages its own navigation
  const currentStep = store.steps[store.currentStepIndex]
  const hideNavigation = currentStep
    ? STEPS_WITH_CUSTOM_NAVIGATION.has(currentStep.type)
    : false

  return (
    <>
      {showTopBar && (
        <RuntimeTopBar
          experienceName={experienceName ?? 'Experience'}
          currentStepIndex={store.currentStepIndex}
          totalSteps={steps.length}
          onHomeClick={onHomeClick}
          onBack={steps.length > 1 ? store.previousStep : undefined}
          canGoBack={steps.length > 1 && store.canGoBack()}
        />
      )}
      <ScrollableView
        className={cn(
          'items-center max-w-md',
          // Padding for fixed top bar
          'pt-28',
          // Padding for fixed bottom navigation (mobile only)
          'pb-28 md:pb-0',
        )}
      >
        {children}
        {!hideNavigation && (
          <RuntimeNavigation
            onNext={store.nextStep}
            canProceed={store.canProceed()}
          />
        )}
      </ScrollableView>
    </>
  )
}
