/**
 * Prompt Fragment Input Component
 *
 * Textarea input for adding optional AI context text to multiselect options.
 * Features: character counter (max 500), debounced onChange, info tooltip.
 */
import { useEffect, useState } from 'react'
import { Info } from 'lucide-react'
import { useDebouncedCallback } from 'use-debounce'
import { Textarea } from '@/ui-kit/ui/textarea'
import { Label } from '@/ui-kit/ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/ui-kit/ui/tooltip'

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
        <div className="flex items-center gap-1.5">
          <Label>Prompt Fragment</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p>
                  This text will be added to the AI prompt when the user selects
                  this option.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
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
    </div>
  )
}
