/**
 * ValueMappingsEditor Component
 *
 * Unified editor for value mappings and default value.
 * Displays a clean grid with mappings and default fallback row.
 */
import { useCallback, useEffect, useRef } from 'react'
import { Info, Plus, Trash2 } from 'lucide-react'
import type { ValueMappingEntry } from '@clementine/shared'
import { Button } from '@/ui-kit/ui/button'
import { Input } from '@/ui-kit/ui/input'
import { Textarea } from '@/ui-kit/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/ui-kit/ui/tooltip'
import { cn } from '@/shared/utils'

interface ValueMappingsEditorProps {
  /** Current value mappings */
  mappings: ValueMappingEntry[]
  /** Default value (fallback when no mapping matches) */
  defaultValue: string
  /** Called when mappings are updated */
  onMappingsChange: (mappings: ValueMappingEntry[]) => void
  /** Called when default value is updated */
  onDefaultValueChange: (value: string) => void
  /** Whether the editor is disabled */
  disabled?: boolean
}

/**
 * Auto-growing textarea component
 */
function AutoGrowTextarea({
  value,
  onChange,
  placeholder,
  disabled,
  className,
  'aria-label': ariaLabel,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  'aria-label'?: string
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize on value change
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [value])

  return (
    <Textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(
        'min-h-[36px] resize-none overflow-hidden py-2 text-sm',
        className,
      )}
      rows={1}
      aria-label={ariaLabel}
    />
  )
}

/**
 * Unified editor for value mappings with default value as fallback row
 *
 * @example
 * ```tsx
 * <ValueMappingsEditor
 *   mappings={[{ value: 'summer', text: 'bright sunny day' }]}
 *   defaultValue="neutral lighting"
 *   onMappingsChange={setMappings}
 *   onDefaultValueChange={setDefaultValue}
 * />
 * ```
 */
export function ValueMappingsEditor({
  mappings,
  defaultValue,
  onMappingsChange,
  onDefaultValueChange,
  disabled = false,
}: ValueMappingsEditorProps) {
  // Add a new empty mapping
  const handleAdd = useCallback(() => {
    onMappingsChange([...mappings, { value: '', text: '' }])
  }, [mappings, onMappingsChange])

  // Remove a mapping by index
  const handleRemove = useCallback(
    (index: number) => {
      onMappingsChange(mappings.filter((_, i) => i !== index))
    },
    [mappings, onMappingsChange],
  )

  // Update a mapping's value
  const handleUpdateValue = useCallback(
    (index: number, value: string) => {
      const updated = [...mappings]
      updated[index] = { ...updated[index], value }
      onMappingsChange(updated)
    },
    [mappings, onMappingsChange],
  )

  // Update a mapping's text
  const handleUpdateText = useCallback(
    (index: number, text: string) => {
      const updated = [...mappings]
      updated[index] = { ...updated[index], text }
      onMappingsChange(updated)
    },
    [mappings, onMappingsChange],
  )

  return (
    <div className="space-y-3">
      {/* Header with label, info tooltip, and add button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium">Value Mappings</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
              >
                <Info className="h-3.5 w-3.5" />
                <span className="sr-only">Info</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              Map input values to specific prompt text. If no mapping matches,
              the default value will be used.
            </TooltipContent>
          </Tooltip>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleAdd}
          disabled={disabled}
          className="h-7 w-7 p-0"
        >
          <Plus className="h-4 w-4" />
          <span className="sr-only">Add mapping</span>
        </Button>
      </div>

      {/* Grid */}
      <div className="space-y-0">
        {/* Column headers */}
        <div className="grid grid-cols-[140px_1fr_32px] gap-2 pb-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Value
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            Prompt Text
          </span>
          <span /> {/* Spacer for delete button column */}
        </div>

        {/* Mapping rows */}
        {mappings.map((mapping, index) => (
          <div
            key={index}
            className="group grid grid-cols-[140px_1fr_32px] items-start gap-2 border-t py-2"
          >
            <Input
              value={mapping.value}
              onChange={(e) => handleUpdateValue(index, e.target.value)}
              placeholder="value"
              disabled={disabled}
              className="h-9 text-sm"
              aria-label="Mapping value"
            />
            <AutoGrowTextarea
              value={mapping.text}
              onChange={(text) => handleUpdateText(index, text)}
              placeholder="Enter prompt text..."
              disabled={disabled}
              aria-label="Mapping prompt text"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleRemove(index)}
              disabled={disabled}
              className="h-9 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              aria-label="Remove mapping"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {/* Default value row (always visible, at bottom) */}
        <div className="grid grid-cols-[140px_1fr_32px] items-start gap-2 border-t pt-2">
          <div className="flex h-9 items-center">
            <span className="text-sm text-muted-foreground">Default</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="ml-1.5 text-muted-foreground hover:text-foreground"
                >
                  <Info className="h-3 w-3" />
                  <span className="sr-only">Info</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                Used when no input is provided or when the input doesn't match
                any mapping.
              </TooltipContent>
            </Tooltip>
          </div>
          <AutoGrowTextarea
            value={defaultValue}
            onChange={onDefaultValueChange}
            placeholder="Enter default prompt text..."
            disabled={disabled}
            aria-label="Default prompt text"
          />
          <span /> {/* Spacer to align with mapping rows */}
        </div>
      </div>
    </div>
  )
}
