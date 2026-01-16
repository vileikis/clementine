/**
 * Input Long Text Renderer
 *
 * Renderer for long text input steps.
 * Shows title with textarea using themed styling.
 * Uses StepLayout for responsive layout with submit button.
 *
 * Supports both edit and run modes:
 * - Edit mode: Preview-only display with disabled textarea
 * - Run mode: Interactive textarea with character count
 */
import { useCallback } from 'react'
import { StepLayout } from './StepLayout'
import type { StepRendererProps } from '../registry/step-registry'
import type { InputLongTextStepConfig } from '../schemas/input-long-text.schema'
import { ThemedText, ThemedTextarea } from '@/shared/theming'

export function InputLongTextRenderer({
  step,
  mode,
  answer,
  onAnswer,
  onSubmit,
  onBack,
  canGoBack,
  canProceed,
}: StepRendererProps) {
  const config = step.config as InputLongTextStepConfig
  const { title, placeholder, maxLength } = config

  // Current value
  const value = typeof answer === 'string' ? answer : ''

  // Handle textarea change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (mode === 'run' && onAnswer) {
        onAnswer(e.target.value)
      }
    },
    [mode, onAnswer],
  )

  // Show character count when approaching limit
  const showCharCount =
    mode === 'run' && maxLength && value.length > maxLength * 0.7

  return (
    <StepLayout
      onSubmit={onSubmit}
      onBack={onBack}
      canGoBack={canGoBack}
      canProceed={canProceed}
    >
      <div className="flex flex-col items-center gap-8 w-full max-w-md">
        {/* Title */}
        <ThemedText variant="heading" as="h2">
          {title ||
            (mode === 'edit' ? (
              <span className="opacity-50">Enter your question...</span>
            ) : null)}
        </ThemedText>

        {/* Textarea with character count */}
        <div className="w-full">
          <ThemedTextarea
            value={value}
            onChange={handleChange}
            placeholder={placeholder || 'Type your answer...'}
            maxLength={maxLength}
            disabled={mode === 'edit'}
            rows={4}
            className="w-full"
          />
          {showCharCount && (
            <ThemedText
              variant="small"
              className={`mt-2 text-right ${
                value.length > maxLength ? 'text-red-500' : 'opacity-60'
              }`}
            >
              {value.length}/{maxLength}
            </ThemedText>
          )}
        </div>
      </div>
    </StepLayout>
  )
}
