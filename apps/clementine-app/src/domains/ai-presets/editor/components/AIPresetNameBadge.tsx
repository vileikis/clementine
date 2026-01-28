/**
 * AIPresetNameBadge Component
 *
 * Inline editable preset name displayed in the breadcrumb.
 * Click to edit, Enter to save, Escape to cancel.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, Pencil, X } from 'lucide-react'

import type { AIPreset } from '@clementine/shared'
import { cn } from '@/shared/utils/style-utils'

interface AIPresetNameBadgeProps {
  preset: AIPreset
  onNameChange: (name: string) => void
  disabled?: boolean
}

/**
 * Inline editable name badge for AI presets
 *
 * Features:
 * - Click to enter edit mode
 * - Enter to save, Escape to cancel
 * - Shows pencil icon on hover
 * - Validates non-empty name
 *
 * @example
 * ```tsx
 * <AIPresetNameBadge
 *   preset={preset}
 *   onNameChange={(name) => updatePreset.mutate({ name })}
 * />
 * ```
 */
export function AIPresetNameBadge({
  preset,
  onNameChange,
  disabled = false,
}: AIPresetNameBadgeProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(preset.name)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  // Reset edit value when preset name changes externally
  useEffect(() => {
    if (!isEditing) {
      setEditValue(preset.name)
    }
  }, [preset.name, isEditing])

  const handleStartEdit = useCallback(() => {
    if (disabled) return
    setEditValue(preset.name)
    setError(null)
    setIsEditing(true)
  }, [disabled, preset.name])

  const handleSave = useCallback(() => {
    const trimmedValue = editValue.trim()

    // Validate non-empty name
    if (!trimmedValue) {
      setError('Name cannot be empty')
      return
    }

    // Only save if changed
    if (trimmedValue !== preset.name) {
      onNameChange(trimmedValue)
    }

    setError(null)
    setIsEditing(false)
  }, [editValue, preset.name, onNameChange])

  const handleCancel = useCallback(() => {
    setEditValue(preset.name)
    setError(null)
    setIsEditing(false)
  }, [preset.name])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        handleSave()
      } else if (event.key === 'Escape') {
        event.preventDefault()
        handleCancel()
      }
    },
    [handleSave, handleCancel],
  )

  if (isEditing) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1">
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => {
              setEditValue(e.target.value)
              if (error) setError(null)
            }}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className={cn(
              'h-7 w-[200px] rounded border bg-background px-2 text-sm font-medium',
              'focus:outline-none focus:ring-2 focus:ring-offset-1',
              error
                ? 'border-destructive focus:ring-destructive'
                : 'focus:ring-ring',
            )}
            maxLength={100}
            aria-label="Preset name"
            aria-invalid={!!error}
            aria-describedby={error ? 'name-error' : undefined}
          />
          <button
            type="button"
            onClick={handleSave}
            className="rounded p-1 hover:bg-accent"
            aria-label="Save name"
          >
            <Check className="h-4 w-4 text-green-600" />
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="rounded p-1 hover:bg-accent"
            aria-label="Cancel editing"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={handleStartEdit}
      disabled={disabled}
      className={cn(
        'group flex items-center gap-2 rounded-md px-2 py-1 transition-colors',
        !disabled && 'hover:bg-accent',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <span className="max-w-[200px] truncate text-sm font-medium">
        {preset.name}
      </span>
      {!disabled && (
        <Pencil className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      )}
    </button>
  )
}
