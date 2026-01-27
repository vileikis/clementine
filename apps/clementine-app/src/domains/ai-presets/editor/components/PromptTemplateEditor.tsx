/**
 * PromptTemplateEditor Component
 *
 * Rich text editor for prompt templates with @mention support.
 * Uses contentEditable for custom @mention rendering as colored pills.
 *
 * Features:
 * - Position-aware autocomplete (shows when cursor is after @)
 * - Renders @mentions as visual pills (blue for variables, green for media)
 * - Serializes to storage format: @{var:name} or @{media:name}
 * - Preserves cursor position during auto-save
 * - Auto-saves changes to draft
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useUpdateAIPresetDraft } from '../hooks/useUpdateAIPresetDraft'
import { MentionAutocomplete } from './MentionAutocomplete'
import type { MentionSuggestion } from './MentionAutocomplete'
import type { PresetMediaEntry, PresetVariable } from '@clementine/shared'
import { useDebounce } from '@/shared/utils/useDebounce'

interface PromptTemplateEditorProps {
  /** Current prompt template value */
  value: string
  /** All available variables for @mentions */
  variables: PresetVariable[]
  /** All available media for @mentions */
  media: PresetMediaEntry[]
  /** Workspace ID for updates */
  workspaceId: string
  /** Preset ID for updates */
  presetId: string
  /** Disabled state */
  disabled?: boolean
}

/**
 * Prompt template editor with @mention autocomplete and pill rendering
 *
 * Provides rich text editing with visual pills for @mentions.
 * Automatically saves changes to draft after debounce.
 *
 * Storage format: @{var:subject} or @{media:style_ref}
 * Display format: Blue pill for variables, green pill for media
 *
 * @example
 * ```tsx
 * <PromptTemplateEditor
 *   value={draft.promptTemplate}
 *   variables={draft.variables}
 *   media={draft.mediaRegistry}
 *   workspaceId={workspaceId}
 *   presetId={presetId}
 *   disabled={isPublishing}
 * />
 * ```
 */
export function PromptTemplateEditor({
  value,
  variables,
  media,
  workspaceId,
  presetId,
  disabled = false,
}: PromptTemplateEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [autocompleteQuery, setAutocompleteQuery] = useState('')
  const [autocompletePosition, setAutocompletePosition] = useState({
    top: 0,
    left: 0,
  })
  const [currentValue, setCurrentValue] = useState(value)

  // Debounce value for auto-save
  const debouncedValue = useDebounce(currentValue, 2000)

  // Update mutation
  const updateMutation = useUpdateAIPresetDraft(workspaceId, presetId)

  // Auto-save debounced value
  useEffect(() => {
    // Only save if:
    // 1. Value has changed
    // 2. Not disabled
    // 3. No mutation is currently in progress (prevent race conditions)
    if (debouncedValue !== value && !disabled && !updateMutation.isPending) {
      updateMutation.mutate({ promptTemplate: debouncedValue })
    }
  }, [debouncedValue, value, disabled, updateMutation.mutate])

  /**
   * Parse storage format and render as HTML with pills (no icons)
   * Format: @{var:name} → <span data-mention-type="variable" data-mention-name="name">@name</span>
   */
  const parseToHTML = useCallback((text: string): string => {
    // Replace @{var:name} and @{media:name} with pill HTML
    return text.replace(
      /@\{(var|media):([a-zA-Z_][a-zA-Z0-9_]*)\}/g,
      (_match, type, name) => {
        const isVariable = type === 'var'
        const colorClass = isVariable
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
          : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'

        return `<span class="inline-flex items-center rounded px-1.5 py-0.5 text-sm font-medium ${colorClass}" contenteditable="false" data-mention-type="${type}" data-mention-name="${name}">@${name}</span>`
      },
    )
  }, [])

  /**
   * Serialize HTML back to storage format
   * <span data-mention-type="variable" data-mention-name="name">...</span> → @{var:name}
   */
  const serializeToText = useCallback((html: string): string => {
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html

    // Replace pill spans with storage format
    const spans = tempDiv.querySelectorAll('[data-mention-type]')
    spans.forEach((span) => {
      const type = span.getAttribute('data-mention-type')
      const name = span.getAttribute('data-mention-name')
      if (type && name) {
        span.replaceWith(`@{${type}:${name}}`)
      }
    })

    return tempDiv.textContent || ''
  }, [])

  // Initialize editor content (only update when not actively editing)
  useEffect(() => {
    if (!editorRef.current) return

    // Don't update if user is actively editing (has focus)
    // This prevents cursor reset when typing and auto-save completes
    if (document.activeElement === editorRef.current) {
      return
    }

    // Get current serialized content
    const currentHtml = editorRef.current.innerHTML
    const currentText = serializeToText(currentHtml)

    // Only update if the incoming value is different from what we have
    // This handles external changes (e.g., same preset open in another tab)
    if (currentText !== value) {
      editorRef.current.innerHTML = parseToHTML(value)
    }
  }, [value, parseToHTML, serializeToText])

  /**
   * Check cursor position and update autocomplete state
   * Called on input, click, and keyup to handle all cursor movements
   */
  const updateAutocompleteFromCursor = useCallback(() => {
    if (!editorRef.current) return

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) {
      setShowAutocomplete(false)
      return
    }

    const range = selection.getRangeAt(0)

    // Get text before cursor (handle text nodes properly)
    let textBeforeCursor = ''
    const node = range.startContainer
    if (node.nodeType === Node.TEXT_NODE) {
      textBeforeCursor = node.textContent?.slice(0, range.startOffset) || ''
    }

    // Check if we're in @mention context
    const atMatch = textBeforeCursor.match(/@([a-zA-Z0-9_]*)$/)
    if (atMatch) {
      const query = atMatch[1]
      setAutocompleteQuery(query)

      // Calculate viewport position for autocomplete dropdown (fixed positioning)
      const rect = range.getBoundingClientRect()
      setAutocompletePosition({
        top: rect.bottom + 4, // Position below cursor with 4px gap
        left: rect.left,      // Align with cursor horizontally
      })
      setShowAutocomplete(true)
    } else {
      setShowAutocomplete(false)
    }
  }, [])

  /**
   * Handle input events (typing)
   */
  const handleInput = useCallback(() => {
    if (!editorRef.current) return

    const html = editorRef.current.innerHTML
    const text = serializeToText(html)
    setCurrentValue(text)

    // Update autocomplete based on cursor position
    updateAutocompleteFromCursor()
  }, [serializeToText, updateAutocompleteFromCursor])

  /**
   * Handle cursor position changes (arrow keys, clicks)
   * Ignore ESC key to prevent autocomplete from reopening after close
   */
  const handleCursorMove = useCallback(
    (event?: React.KeyboardEvent) => {
      // Don't reopen autocomplete after ESC key
      if (event?.key === 'Escape') return
      updateAutocompleteFromCursor()
    },
    [updateAutocompleteFromCursor],
  )

  /**
   * Handle blur - close autocomplete when editor loses focus
   */
  const handleBlur = useCallback(() => {
    // Small delay to allow clicking on autocomplete items
    setTimeout(() => {
      setShowAutocomplete(false)
    }, 150)
  }, [])

  /**
   * Insert mention pill at cursor position
   */
  const handleSelectMention = useCallback(
    (suggestion: MentionSuggestion) => {
      if (!editorRef.current) return

      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0) return

      const range = selection.getRangeAt(0)

      // Delete the @ and query text
      const textBeforeCursor = range.startContainer.textContent || ''
      const atMatch = textBeforeCursor
        .slice(0, range.startOffset)
        .match(/@[a-zA-Z0-9_]*$/)
      if (atMatch) {
        range.setStart(
          range.startContainer,
          range.startOffset - atMatch[0].length,
        )
        range.deleteContents()
      }

      // Create pill HTML
      const type = suggestion.type === 'variable' ? 'var' : 'media'
      const pillHTML = parseToHTML(`@{${type}:${suggestion.name}}`)

      // Insert pill
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = pillHTML
      const pill = tempDiv.firstChild as HTMLElement

      range.insertNode(pill)

      // Add space after pill
      const space = document.createTextNode('\u00A0')
      pill.after(space)

      // Move cursor after space
      range.setStartAfter(space)
      range.setEndAfter(space)
      selection.removeAllRanges()
      selection.addRange(range)

      // Update value
      const html = editorRef.current.innerHTML
      const text = serializeToText(html)
      setCurrentValue(text)
      setShowAutocomplete(false)
    },
    [parseToHTML, serializeToText],
  )

  /**
   * Handle paste - strip formatting and convert to plain text
   * Uses modern Selection API (execCommand is deprecated)
   */
  const handlePaste = useCallback(
    (event: React.ClipboardEvent) => {
      event.preventDefault()
      const text = event.clipboardData.getData('text/plain')

      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0) return

      const range = selection.getRangeAt(0)
      range.deleteContents()

      const textNode = document.createTextNode(text)
      range.insertNode(textNode)

      // Move cursor after inserted text
      range.setStartAfter(textNode)
      range.setEndAfter(textNode)
      selection.removeAllRanges()
      selection.addRange(range)

      // Trigger input event to update state
      if (editorRef.current) {
        const html = editorRef.current.innerHTML
        const newText = serializeToText(html)
        setCurrentValue(newText)
      }
    },
    [serializeToText],
  )

  return (
    <div className="relative">
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onPaste={handlePaste}
        onClick={() => handleCursorMove()}
        onKeyUp={(e) => handleCursorMove(e)}
        onBlur={handleBlur}
        className="min-h-[200px] rounded-md border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        data-placeholder="Write your prompt template here. Type @ to mention variables or media."
        style={{
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
        }}
      />

      {/* Autocomplete dropdown (rendered via portal) */}
      {showAutocomplete && (
        <MentionAutocomplete
          variables={variables}
          media={media}
          query={autocompleteQuery}
          position={autocompletePosition}
          onSelect={handleSelectMention}
          onClose={() => setShowAutocomplete(false)}
        />
      )}

      {/* Character count */}
      <div className="mt-2 text-right text-xs text-muted-foreground">
        {currentValue.length} characters
      </div>
    </div>
  )
}
