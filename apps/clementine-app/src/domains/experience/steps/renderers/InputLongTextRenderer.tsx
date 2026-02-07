/**
 * Input Long Text Renderer
 *
 * Renderer for long text input steps.
 * Shows title with textarea using themed styling.
 *
 * Supports both edit and run modes:
 * - Edit mode: Preview-only display with disabled textarea
 * - Run mode: Interactive textarea with character count
 *
 * Navigation is handled by ExperienceRuntime.
 */
import { useCallback } from 'react'
import type { StepRendererProps } from '../registry/step-registry'
import type { ExperienceInputLongTextStepConfig } from '@clementine/shared'
import { ThemedText, ThemedTextarea } from '@/shared/theming'

export function InputLongTextRenderer({
  step,
  mode,
  response,
  onResponseChange,
}: StepRendererProps) {
  const config = step.config as ExperienceInputLongTextStepConfig
  const { title, placeholder, maxLength } = config

  // Current value from response data
  const value = typeof response?.data === 'string' ? response.data : ''

  // Handle textarea change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (mode === 'run' && onResponseChange) {
        onResponseChange(e.target.value)
      }
    },
    [mode, onResponseChange],
  )

  // Show character count when approaching limit
  const showCharCount =
    mode === 'run' && maxLength && value.length > maxLength * 0.7

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-md px-4">
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
  )
}
