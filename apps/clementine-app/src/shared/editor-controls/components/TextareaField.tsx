/**
 * TextareaField Component
 *
 * A textarea wrapper with label, optional character counter, and consistent styling.
 * Uses stacked layout (label above textarea).
 */

import { useId } from 'react'
import { getCounterColorClass } from '../utils'
import type { TextareaFieldProps } from '../types'
import { Textarea } from '@/ui-kit/components/ui/textarea'
import { Label } from '@/ui-kit/components/label'
import { cn } from '@/shared/utils'

export function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  rows = 3,
  disabled = false,
}: TextareaFieldProps) {
  const id = useId()
  const currentLength = (value ?? '').length
  const showCounter = maxLength !== undefined

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label
          htmlFor={id}
          className="text-sm font-normal text-muted-foreground"
        >
          {label}
        </Label>
        {showCounter && (
          <span
            className={cn(
              'text-xs',
              getCounterColorClass(currentLength, maxLength),
            )}
          >
            {currentLength}/{maxLength}
          </span>
        )}
      </div>
      <Textarea
        id={id}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
      />
    </div>
  )
}
