/**
 * VariableCard Component
 *
 * Draggable card displaying a variable with inline name editing and expandable settings.
 * Color-coded by type: text (info/blue), image (success/green).
 *
 * Phase 11.5: Converted from dialog-based to inline accordion pattern.
 * Click to expand/collapse inline settings (default value, value mappings).
 */
import { useEffect, useRef, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Check,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Image,
  Pencil,
  Trash2,
  Type,
  X,
} from 'lucide-react'
import { ValueMappingsEditor } from './ValueMappingsEditor'
import type { PresetMediaEntry, PresetVariable } from '@clementine/shared'
import { Button } from '@/ui-kit/ui/button'
import { Input } from '@/ui-kit/ui/input'
import { cn } from '@/shared/utils'

interface VariableCardProps {
  /** The variable to display */
  variable: PresetVariable
  /** All existing variable names for validation */
  existingNames: string[]
  /** Media entries for @mention in value mappings */
  media: PresetMediaEntry[]
  /** Called when variable name is changed */
  onRename: (id: string, newName: string) => void
  /** Called when variable settings are updated */
  onUpdateSettings: (
    id: string,
    updates: { defaultValue?: string | null; valueMap?: {value: string, text: string}[] | null },
  ) => void
  /** Called when delete button is clicked */
  onDelete: (id: string) => void
  /** Whether the card is expanded */
  isExpanded: boolean
  /** Called when expansion state changes */
  onToggleExpanded: (id: string) => void
  /** Whether the card is disabled */
  disabled?: boolean
}

/**
 * Draggable variable card with inline name editing and expandable settings
 *
 * Displays type icon and name with color coding:
 * - Text variables: info color (blue)
 * - Image variables: success color (green)
 *
 * Collapsed state shows: name + type icon + indicators (# mappings, has default)
 * Expanded state shows: full settings inline (default value, value mappings)
 *
 * @example
 * ```tsx
 * <VariableCard
 *   variable={{ id: '1', type: 'text', name: 'style', defaultValue: null, valueMap: null }}
 *   existingNames={['style', 'mood']}
 *   media={[...]}
 *   onRename={(id, name) => handleRename(id, name)}
 *   onUpdateSettings={(id, updates) => handleUpdate(id, updates)}
 *   onDelete={(id) => handleDelete(id)}
 *   isExpanded={expandedId === '1'}
 *   onToggleExpanded={(id) => setExpandedId(id)}
 * />
 * ```
 */
export function VariableCard({
  variable,
  existingNames,
  media,
  onRename,
  onUpdateSettings,
  onDelete,
  isExpanded,
  onToggleExpanded,
  disabled = false,
}: VariableCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(variable.name)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Local state for settings (only for text variables)
  const [defaultValue, setDefaultValue] = useState(
    variable.type === 'text' ? variable.defaultValue || '' : '',
  )
  const [valueMap, setValueMap] = useState(
    variable.type === 'text' && variable.valueMap ? variable.valueMap : [],
  )

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

  const handleToggleExpanded = () => {
    if (disabled || variable.type === 'image') return
    onToggleExpanded(variable.id)
  }

  // Save settings when changing default value or value mappings
  const handleDefaultValueChange = (value: string) => {
    const newValue = value || null
    setDefaultValue(value)
    onUpdateSettings(variable.id, { defaultValue: newValue })
  }

  const handleValueMapChange = (newValueMap: { value: string; text: string }[]) => {
    const newMap = newValueMap.length > 0 ? newValueMap : null
    setValueMap(newValueMap)
    onUpdateSettings(variable.id, { valueMap: newMap })
  }

  // Sync local state when variable changes externally
  useEffect(() => {
    if (variable.type === 'text') {
      setDefaultValue(variable.defaultValue || '')
      setValueMap(variable.valueMap || [])
    }
  }, [variable])

  // Color classes based on variable type
  const isTextType = variable.type === 'text'
  const colorClasses = isTextType
    ? 'text-info [&>svg]:text-info' // Blue for text
    : 'text-success [&>svg]:text-success' // Green for image

  const Icon = isTextType ? Type : Image

  // Indicators for collapsed state
  const numMappings = isTextType && variable.valueMap ? variable.valueMap.length : 0
  const hasDefault = isTextType && variable.defaultValue

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group border-b bg-card',
        isDragging && 'opacity-50',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 py-3">
        {/* Drag handle indicator (shows on hover) */}
        <div
          {...attributes}
          {...listeners}
          className={cn(
            'shrink-0 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100',
            'focus-visible:opacity-100',
            isDragging && 'opacity-100 cursor-grabbing',
            !isDragging && !disabled && 'cursor-grab hover:bg-accent',
            disabled && 'cursor-not-allowed',
          )}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Type icon (not draggable) */}
        <div className={cn('shrink-0', colorClasses)}>
          <Icon className="h-4 w-4" />
        </div>

        {/* Variable name and content - clickable area for expansion */}
        <div
          onClick={isTextType && !disabled && !isEditing ? handleToggleExpanded : undefined}
          className={cn(
            'min-w-0 flex-1',
            isTextType && !disabled && !isEditing && 'cursor-pointer',
            disabled && 'cursor-not-allowed',
          )}
        >
          <div className="min-w-0 flex-1">
            {isEditing ? (
              <div
                className="flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
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
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleStartEdit(e)
                  }}
                  disabled={disabled}
                  className={cn(
                    'group/name flex items-center gap-2 rounded-md px-2 py-1 transition-colors',
                    !disabled && 'hover:bg-accent',
                    disabled && 'cursor-not-allowed',
                  )}
                >
                  <span
                    className={cn('font-mono text-sm font-medium', colorClasses)}
                  >
                    @{variable.name}
                  </span>
                  {!disabled && (
                    <Pencil className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover/name:opacity-100" />
                  )}
                </button>

                {/* Indicators (collapsed state only) */}
                {!isExpanded && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {hasDefault && (
                      <span className="rounded-full bg-muted px-2 py-0.5">
                        has default
                      </span>
                    )}
                    {numMappings > 0 && (
                      <span className="rounded-full bg-muted px-2 py-0.5">
                        {numMappings}{' '}
                        {numMappings === 1 ? 'mapping' : 'mappings'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
            {error && !isEditing && (
              <p className="mt-1 text-xs text-destructive">{error}</p>
            )}
          </div>
        </div>

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

        {/* Expand/collapse chevron (text variables only) - on the right */}
        {isTextType && (
          <button
            type="button"
            onClick={handleToggleExpanded}
            disabled={disabled}
            className={cn(
              'shrink-0 rounded p-1 transition-colors hover:bg-accent',
              disabled && 'cursor-not-allowed opacity-50',
            )}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        )}
      </div>

      {/* Expanded settings (text variables only) */}
      {isExpanded && isTextType && (
        <div className="border-t px-3 pb-4 pt-4">
          <ValueMappingsEditor
            mappings={valueMap}
            defaultValue={defaultValue}
            media={media}
            onMappingsChange={handleValueMapChange}
            onDefaultValueChange={handleDefaultValueChange}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  )
}
