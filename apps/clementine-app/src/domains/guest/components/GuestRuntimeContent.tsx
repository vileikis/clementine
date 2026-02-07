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
 * - Response management via useRuntime hook
 * - Completion state (returns null - parent handles completion navigation)
 *
 * Note: Navigation (back/next buttons) is handled by ExperienceRuntime.
 * Note: Does NOT include ThemedBackground - parent page owns the background.
 * Must be used within ThemeProvider, ThemedBackground, and ExperienceRuntime.
 *
 * @example
 * ```tsx
 * <ThemeProvider theme={event.theme}>
 *   <ThemedBackground className="h-dvh">
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

import type { SessionResponseData } from '@clementine/shared'
import { useRuntime } from '@/domains/experience/runtime'
import { StepRendererRouter } from '@/domains/experience/steps/components/StepRendererRouter'
import { ThemedText } from '@/shared/theming'

/**
 * GuestRuntimeContent Component
 *
 * Renders the current step or returns null when complete.
 * Uses runtime hook for response management.
 */
export function GuestRuntimeContent() {
  const { currentStep, setStepResponse, getResponse, isComplete } = useRuntime()

  // Handle response change - writes to unified responses
  const handleResponseChange = useCallback(
    (data: SessionResponseData | null) => {
      if (!currentStep) return
      setStepResponse(currentStep, data)
    },
    [currentStep, setStepResponse],
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

  // Render current step (navigation handled by ExperienceRuntime)
  return (
    <StepRendererRouter
      step={currentStep}
      mode="run"
      response={getResponse(currentStep.id)}
      onResponseChange={handleResponseChange}
    />
  )
}
