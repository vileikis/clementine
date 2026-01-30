/**
 * GuestRuntimeContent Component
 *
 * Inner component for guest experience pages that consumes the runtime context.
 * Must be rendered inside ExperienceRuntime provider.
 *
 * This is the guest-facing equivalent of PreviewRuntimeContent.
 *
 * Handles:
 * - Displaying current step via StepRendererRouter
 * - Answer management via useRuntime hook
 * - Completion state (returns null - parent handles completion navigation)
 *
 * Note: Does NOT include ThemedBackground - parent page owns the background.
 * Must be used within ThemeProvider, ThemedBackground, and ExperienceRuntime.
 *
 * @example
 * ```tsx
 * <ThemeProvider theme={event.theme}>
 *   <ThemedBackground className="h-screen">
 *     <ExperienceRuntime
 *       experienceId={experience.id}
 *       steps={experience.published.steps}
 *       session={session}
 *       onComplete={handleComplete}
 *     >
 *       <GuestRuntimeContent />
 *     </ExperienceRuntime>
 *   </ThemedBackground>
 * </ThemeProvider>
 * ```
 */
import { useCallback } from 'react'

import type { AnswerValue } from '@/domains/experience/steps/registry/step-registry'
import { useRuntime } from '@/domains/experience/runtime'
import { StepRendererRouter } from '@/domains/experience/steps/components/StepRendererRouter'
import { ThemedText } from '@/shared/theming'

/**
 * GuestRuntimeContent Component
 *
 * Renders the current step or returns null when complete.
 * Uses runtime hook for navigation and answer management.
 */
export function GuestRuntimeContent() {
  const runtime = useRuntime()

  const {
    currentStep,
    canProceed,
    canGoBack,
    next,
    back,
    setAnswer,
    getAnswer,
    getAnswerContext,
    isComplete,
  } = runtime

  // Handle answer change
  const handleAnswer = useCallback(
    (value: AnswerValue, context?: unknown) => {
      if (currentStep) {
        setAnswer(currentStep.id, value, context)
      }
    },
    [currentStep, setAnswer],
  )

  // When complete, return null - parent handles navigation
  // The onComplete callback in ExperienceRuntime will handle the transition
  if (isComplete) {
    return null
  }

  // No current step (edge case - should not happen with proper step validation)
  if (!currentStep) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <ThemedText variant="body">No step to display</ThemedText>
      </div>
    )
  }

  // Render current step
  return (
    <StepRendererRouter
      step={currentStep}
      mode="run"
      answer={getAnswer(currentStep.id)}
      answerContext={getAnswerContext(currentStep.id)}
      onAnswer={handleAnswer}
      onSubmit={next}
      onBack={back}
      canGoBack={canGoBack}
      canProceed={canProceed}
    />
  )
}
