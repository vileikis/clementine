/**
 * TextField Component
 *
 * A text input wrapper with label, optional character counter, and consistent styling.
 * Uses stacked layout (label above input).
 */

import { useId } from 'react'
import { getCounterColorClass } from '../utils'
import type { TextFieldProps } from '../types'
import { Input } from '@/ui-kit/components/input'
import { Label } from '@/ui-kit/components/label'
import { cn } from '@/shared/utils'

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  disabled = false,
}: TextFieldProps) {
  const id = useId()
  const currentLength = value.length
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
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
      />
    </div>
  )
}
