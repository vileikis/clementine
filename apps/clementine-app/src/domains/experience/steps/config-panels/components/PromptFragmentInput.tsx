/**
 * Prompt Fragment Input Component
 *
 * Textarea input for adding optional AI context text to multiselect options.
 * Features: character counter (max 500), debounced onChange, help text.
 */
import { useEffect, useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { Textarea } from '@/ui-kit/ui/textarea'
import { Label } from '@/ui-kit/ui/label'

interface PromptFragmentInputProps {
  value: string | undefined
  onChange: (value: string | undefined) => void
  disabled?: boolean
}

export function PromptFragmentInput({
  value,
  onChange,
  disabled = false,
}: PromptFragmentInputProps) {
  const [localValue, setLocalValue] = useState(value || '')

  // Sync local state with prop changes
  useEffect(() => {
    setLocalValue(value || '')
  }, [value])

  const debouncedOnChange = useDebouncedCallback((newValue: string) => {
    // Only call onChange if value actually changed
    const trimmed = newValue.trim()
    onChange(trimmed || undefined)
  }, 2000)

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)
    debouncedOnChange(newValue)
  }

  const charCount = localValue.length
  const maxChars = 500

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Prompt Fragment (optional)</Label>
        <span className="text-xs text-muted-foreground">
          {charCount}/{maxChars}
        </span>
      </div>
      <Textarea
        value={localValue}
        onChange={handleChange}
        maxLength={maxChars}
        placeholder="Text to insert when this option is selected"
        className="min-h-20"
        disabled={disabled}
      />
      <p className="text-xs text-muted-foreground">
        This text will be added to the AI prompt when the user selects this
        option.
      </p>
    </div>
  )
}
