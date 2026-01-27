/**
 * PromptTemplateEditor Component
 *
 * Rich text editor for prompt templates with @mention support.
 * Uses contentEditable for custom @mention rendering as colored pills.
 *
 * Features:
 * - Detects @ character and shows autocomplete
 * - Renders @mentions as visual pills (blue for variables, green for media)
 * - Serializes to storage format: @{var:name} or @{media:name}
 * - Handles backspace/delete on pill boundaries
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
   * Parse storage format and render as HTML with pills
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
        const iconSvg = `<svg class="inline-block h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${isVariable ? 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' : 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'}"></path></svg>`

        return `<span class="inline-flex items-center rounded px-1.5 py-0.5 text-sm font-medium ${colorClass}" contenteditable="false" data-mention-type="${type}" data-mention-name="${name}">${iconSvg}@${name}</span>`
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

  // Initialize editor content
  useEffect(() => {
    if (
      editorRef.current &&
      editorRef.current.innerHTML !== parseToHTML(value)
    ) {
      editorRef.current.innerHTML = parseToHTML(value)
    }
  }, [value, parseToHTML])

  /**
   * Detect @ character and show autocomplete
   */
  const handleInput = useCallback(() => {
    if (!editorRef.current) return

    const html = editorRef.current.innerHTML
    const text = serializeToText(html)
    setCurrentValue(text)

    // Get cursor position
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    const textBeforeCursor =
      range.startContainer.textContent?.slice(0, range.startOffset) || ''

    // Check if @ was just typed
    const atMatch = textBeforeCursor.match(/@([a-zA-Z0-9_]*)$/)
    if (atMatch) {
      const query = atMatch[1]
      setAutocompleteQuery(query)

      // Calculate position for autocomplete dropdown
      const rect = range.getBoundingClientRect()
      const editorRect = editorRef.current.getBoundingClientRect()
      setAutocompletePosition({
        top: rect.bottom - editorRect.top + 4,
        left: rect.left - editorRect.left,
      })
      setShowAutocomplete(true)
    } else {
      setShowAutocomplete(false)
    }
  }, [serializeToText])

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
   */
  const handlePaste = useCallback((event: React.ClipboardEvent) => {
    event.preventDefault()
    const text = event.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
  }, [])

  return (
    <div className="relative">
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onPaste={handlePaste}
        className="min-h-[200px] rounded-md border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        data-placeholder="Write your prompt template here. Type @ to mention variables or media."
        style={{
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
        }}
      />

      {/* Autocomplete dropdown */}
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
