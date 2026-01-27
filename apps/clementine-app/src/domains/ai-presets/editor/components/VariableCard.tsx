/**
 * VariableCard Component
 *
 * Draggable card displaying a variable with inline name editing.
 * Color-coded by type: text (info/blue), image (success/green).
 */
import { useEffect, useRef, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Check, Image, Pencil, Settings, Trash2, Type, X } from 'lucide-react'
import type { PresetVariable } from '@clementine/shared'
import { Button } from '@/ui-kit/ui/button'
import { Input } from '@/ui-kit/ui/input'
import { cn } from '@/shared/utils'

interface VariableCardProps {
  /** The variable to display */
  variable: PresetVariable
  /** All existing variable names for validation */
  existingNames: string[]
  /** Called when variable name is changed */
  onRename: (id: string, newName: string) => void
  /** Called when settings button is clicked */
  onSettings: (id: string) => void
  /** Called when delete button is clicked */
  onDelete: (id: string) => void
  /** Whether the card is disabled */
  disabled?: boolean
}

/**
 * Draggable variable card with inline name editing
 *
 * Displays type icon and name with color coding:
 * - Text variables: info color (blue)
 * - Image variables: success color (green)
 *
 * @example
 * ```tsx
 * <VariableCard
 *   variable={{ id: '1', type: 'text', name: 'style', defaultValue: null, valueMap: null }}
 *   existingNames={['style', 'mood']}
 *   onRename={(id, name) => handleRename(id, name)}
 *   onSettings={(id) => openSettingsDialog(id)}
 *   onDelete={(id) => handleDelete(id)}
 * />
 * ```
 */
export function VariableCard({
  variable,
  existingNames,
  onRename,
  onSettings,
  onDelete,
  disabled = false,
}: VariableCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(variable.name)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: variable.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // Reset edit value when variable name changes externally
  useEffect(() => {
    setEditValue(variable.name)
  }, [variable.name])

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const validateName = (name: string): string | null => {
    if (!name) return 'Name is required'

    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
      return 'Name must start with a letter or underscore'
    }

    // Check uniqueness (exclude current variable name)
    const otherNames = existingNames.filter((n) => n !== variable.name)
    if (otherNames.includes(name)) {
      return 'A variable with this name already exists'
    }

    return null
  }

  const handleStartEdit = (e: React.MouseEvent) => {
    if (disabled) return
    e.stopPropagation() // Prevent drag from triggering
    setIsEditing(true)
    setError(null)
  }

  const handleSave = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    const trimmedValue = editValue.trim()
    const validationError = validateName(trimmedValue)
    if (validationError) {
      setError(validationError)
      return
    }

    if (trimmedValue !== variable.name) {
      onRename(variable.id, trimmedValue)
    }
    setIsEditing(false)
    setError(null)
  }

  const handleCancel = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setEditValue(variable.name)
    setIsEditing(false)
    setError(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  const handleDeleteClick = () => {
    if (confirm(`Delete variable @${variable.name}?`)) {
      onDelete(variable.id)
    }
  }

  // Color classes based on variable type
  const isTextType = variable.type === 'text'
  const colorClasses = isTextType
    ? 'text-info [&>svg]:text-info' // Blue for text
    : 'text-success [&>svg]:text-success' // Green for image

  const Icon = isTextType ? Type : Image

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'group flex items-center gap-3 border-b bg-card py-3',
        isDragging && 'opacity-50 cursor-grabbing',
        !isDragging && !disabled && 'cursor-grab',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      {/* Type icon */}
      <div className={cn('shrink-0', colorClasses)}>
        <Icon className="h-4 w-4" />
      </div>

      {/* Variable name (editable) */}
      <div className="min-w-0 flex-1">
        {isEditing ? (
          <div className="flex items-center gap-1">
            <Input
              ref={inputRef}
              value={editValue}
              onChange={(e) => {
                setEditValue(e.target.value)
                setError(null)
              }}
              onKeyDown={handleKeyDown}
              placeholder="my_variable"
              className={cn(
                'h-7 text-sm font-mono',
                error && 'border-destructive',
              )}
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
        ) : (
          <button
            type="button"
            onClick={handleStartEdit}
            disabled={disabled}
            className={cn(
              'group/name flex items-center gap-2 rounded-md px-2 py-1 transition-colors',
              !disabled && 'hover:bg-accent',
              disabled && 'cursor-not-allowed',
            )}
          >
            <span className={cn('font-mono text-sm font-medium', colorClasses)}>
              @{variable.name}
            </span>
            {!disabled && (
              <Pencil className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover/name:opacity-100" />
            )}
          </button>
        )}
        {error && !isEditing && (
          <p className="mt-1 text-xs text-destructive">{error}</p>
        )}
      </div>

      {/* Settings button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation()
          onSettings(variable.id)
        }}
        disabled={disabled}
        className={cn(
          'h-8 w-8 shrink-0 p-0 opacity-0 transition-opacity group-hover:opacity-100',
          'focus-visible:opacity-100',
        )}
      >
        <Settings className="h-4 w-4" />
        <span className="sr-only">Variable settings</span>
      </Button>

      {/* Delete button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation()
          handleDeleteClick()
        }}
        disabled={disabled}
        className={cn(
          'h-8 w-8 shrink-0 p-0 opacity-0 transition-opacity group-hover:opacity-100',
          'focus-visible:opacity-100',
        )}
      >
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">Delete variable</span>
      </Button>
    </div>
  )
}
