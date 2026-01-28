/**
 * ValueMappingsEditor Component
 *
 * Unified editor for value mappings and default value with Lexical support.
 * Displays a clean grid with mappings and default fallback row.
 * Prompt text fields support @mention autocomplete for reference media only.
 */
import { useCallback, useEffect, useRef } from 'react'
import { Info, Plus, Trash2 } from 'lucide-react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import {
  MediaMentionNode,
  MentionsPlugin,
  SmartPastePlugin,
  VariableMentionNode,
  loadFromPlainText,
  serializeToPlainText,
} from '../../lexical'
import type { EditorState } from 'lexical'
import type { PresetMediaEntry, ValueMappingEntry } from '@clementine/shared'
import type { MediaOption } from '../../lexical'
import { cn } from '@/shared/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui-kit/ui/tooltip'
import { Input } from '@/ui-kit/ui/input'
import { Button } from '@/ui-kit/ui/button'

interface ValueMappingsEditorProps {
  /** Current value mappings */
  mappings: ValueMappingEntry[]
  /** Default value (fallback when no mapping matches) */
  defaultValue: string
  /** Available media for @mention autocomplete */
  media: PresetMediaEntry[]
  /** Called when mappings are updated */
  onMappingsChange: (mappings: ValueMappingEntry[]) => void
  /** Called when default value is updated */
  onDefaultValueChange: (value: string) => void
  /** Whether the editor is disabled */
  disabled?: boolean
}

/**
 * Convert PresetMediaEntry to MediaOption for Lexical plugins
 */
function toMediaOption(media: PresetMediaEntry): MediaOption {
  return {
    id: media.mediaAssetId,
    name: media.name,
  }
}

/**
 * Initialize content plugin for inline editor
 */
function InitializeContentPlugin({
  value,
  mediaOptions,
}: {
  value: string
  mediaOptions: MediaOption[]
}) {
  const [editor] = useLexicalComposerContext()
  const hasInitialized = useRef(false)

  useEffect(() => {
    if (!hasInitialized.current && value) {
      hasInitialized.current = true
      // Load plain text with @{ref:name} mentions
      loadFromPlainText(editor, value, [], mediaOptions)
    }
  }, [editor, value, mediaOptions])

  return null
}

/**
 * Inline Lexical editor for prompt text with media-only @mentions
 * Compact version for table cells
 */
function InlineLexicalEditor({
  value,
  onChange,
  placeholder,
  disabled,
  mediaOptions,
  'aria-label': ariaLabel,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  mediaOptions: MediaOption[]
  'aria-label'?: string
}) {
  const handleChange = (editorState: EditorState) => {
    // Serialize to plain text with @{ref:name} format
    const plainText = serializeToPlainText(editorState)
    onChange(plainText)
  }

  const initialConfig = {
    namespace: 'InlineValueMappingEditor',
    theme: {
      paragraph: 'editor-paragraph',
    },
    onError: (error: Error) => {
      console.error('Lexical error in value mapping:', error)
    },
    nodes: [VariableMentionNode as never, MediaMentionNode as never],
    editable: !disabled,
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="relative">
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className={cn(
                'min-h-[36px] rounded-md border border-input bg-background px-3 py-2 text-sm outline-none',
                'focus:ring-2 focus:ring-ring focus:ring-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-50',
              )}
              aria-label={ariaLabel}
            />
          }
          placeholder={
            <div className="pointer-events-none absolute left-3 top-2 text-sm text-muted-foreground">
              {placeholder}
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
      </div>

      {/* Plugins */}
      <HistoryPlugin />
      <OnChangePlugin onChange={handleChange} ignoreSelectionChange />
      {/* Pass empty variables array to show only media */}
      <MentionsPlugin variables={[]} media={mediaOptions} />
      <SmartPastePlugin variables={[]} media={mediaOptions} />

      {/* Initialize content */}
      <InitializeContentPlugin value={value} mediaOptions={mediaOptions} />
    </LexicalComposer>
  )
}

/**
 * Unified editor for value mappings with default value as fallback row
 *
 * Now includes Lexical editor with media-only @mention support for prompt text fields.
 *
 * @example
 * ```tsx
 * <ValueMappingsEditor
 *   mappings={[{ value: 'summer', text: 'bright sunny day with @{ref:style}' }]}
 *   defaultValue="neutral lighting"
 *   media={draft.mediaRegistry}
 *   onMappingsChange={setMappings}
 *   onDefaultValueChange={setDefaultValue}
 * />
 * ```
 */
export function ValueMappingsEditor({
  mappings,
  defaultValue,
  media,
  onMappingsChange,
  onDefaultValueChange,
  disabled = false,
}: ValueMappingsEditorProps) {
  // Convert media to options for Lexical
  const mediaOptions = media.map(toMediaOption)
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
            <InlineLexicalEditor
              value={mapping.text}
              onChange={(text) => handleUpdateText(index, text)}
              placeholder="Type @ to mention media..."
              disabled={disabled}
              mediaOptions={mediaOptions}
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
          <InlineLexicalEditor
            value={defaultValue}
            onChange={onDefaultValueChange}
            placeholder="Type @ to mention media..."
            disabled={disabled}
            mediaOptions={mediaOptions}
            aria-label="Default prompt text"
          />
          <span /> {/* Spacer to align with mapping rows */}
        </div>
      </div>
    </div>
  )
}
