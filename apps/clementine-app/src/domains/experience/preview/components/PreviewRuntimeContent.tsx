/**
 * PreviewRuntimeContent
 *
 * Inner component for preview modal that consumes the runtime context.
 * Must be rendered inside ExperienceRuntime provider.
 *
 * Handles:
 * - Displaying current step via StepRendererRouter
 * - Response management
 *
 * Note: Navigation (back/next buttons) is handled by ExperienceRuntime.
 * Note: Completion state is handled by ExperienceRuntime (completing spinner).
 */
import { useCallback } from 'react'

import { useRuntime } from '../../runtime'
import { StepRendererRouter } from '../../steps'
import type { SessionResponseData } from '@clementine/shared'

/**
 * PreviewRuntimeContent Component
 *
 * Renders the current step.
 * Uses runtime hook for response management.
 */
export function PreviewRuntimeContent() {
  const { currentStep, setStepResponse, getResponse } = useRuntime()

  // Handle response change - writes to unified responses
  const handleResponseChange = useCallback(
    (data: SessionResponseData | null) => {
      if (!currentStep) return
      setStepResponse(currentStep, data)
    },
    [currentStep, setStepResponse],
  )

  // No current step
  if (!currentStep) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">No step to display</p>
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
