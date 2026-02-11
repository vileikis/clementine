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
 *
 * Note: Navigation (back/next buttons) is handled by ExperienceRuntime.
 * Note: Completion state is handled by ExperienceRuntime (completing spinner).
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
 * Renders the current step.
 * Uses runtime hook for response management.
 */
export function GuestRuntimeContent() {
  const { currentStep, setStepResponse, getResponse } = useRuntime()

  // Handle response change - writes to unified responses
  const handleResponseChange = useCallback(
    (data: SessionResponseData | null) => {
      if (!currentStep) return
      setStepResponse(currentStep, data)
    },
    [currentStep, setStepResponse],
  )

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
