/**
 * PreviewRuntimeContent
 *
 * Inner component for preview modal that consumes the runtime context.
 * Must be rendered inside ExperienceRuntime provider.
 *
 * Handles:
 * - Displaying current step via StepRendererRouter
 * - Answer management
 * - Completion state display
 */
import { useCallback } from 'react'
import { useRuntime } from '../../runtime'
import { StepRendererRouter } from '../../steps'
import type { AnswerValue } from '../../steps/registry/step-registry'

/**
 * PreviewRuntimeContent Component
 *
 * Renders the current step or completion state.
 * Uses runtime hook for navigation and answer management.
 */
export function PreviewRuntimeContent() {
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

  // Show completion message
  if (isComplete) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="text-lg font-medium">Preview Complete!</p>
          <p className="text-sm text-muted-foreground">
            All steps have been completed.
          </p>
        </div>
      </div>
    )
  }

  // No current step
  if (!currentStep) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">No step to display</p>
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
