/**
 * PromptTemplateEditor Component (Lexical-based)
 *
 * Rich text editor for prompt templates with @mention support using Lexical.
 * Replaces the contentEditable-based implementation with Lexical framework.
 *
 * Features:
 * - Position-aware autocomplete (variables with {, media with @)
 * - Renders @mentions as visual pills (blue for text vars, green for image vars, purple for media)
 * - Smart paste detection (converts {var} and @media patterns)
 * - Serializes to JSON format for storage
 * - Preserves cursor position during auto-save
 * - Auto-saves changes to draft
 *
 * Migration from contentEditable:
 * - Same external API (props and behavior unchanged)
 * - Enhanced features: icons, click interactions, better paste handling
 * - Improved accessibility and mobile support
 */
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import type { EditorState, LexicalEditor } from 'lexical'
import { useEffect, useRef, useState } from 'react'
import type { PresetMediaEntry, PresetVariable } from '@clementine/shared'
import { useDebounce } from '@/shared/utils/useDebounce'
import { useUpdateAIPresetDraft } from '../hooks/useUpdateAIPresetDraft'
import {
  MediaMentionNode,
  MentionsPlugin,
  SmartPastePlugin,
  VariableMentionNode,
  loadFromJSON,
  loadFromPlainText,
  serializeToJSON,
  serializeToPlainText,
  type MediaOption,
  type VariableOption,
} from '../../lexical'

interface PromptTemplateEditorProps {
  /** Current prompt template value (JSON or plain text) */
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
 * Convert PresetVariable to VariableOption for Lexical plugins
 */
function toVariableOption(variable: PresetVariable): VariableOption {
  // PresetVariable has an 'id' field after Phase 5.5 schema updates
  return {
    id: variable.id ?? variable.name, // Fallback to name if id is missing
    name: variable.name,
    type: variable.type,
  }
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
 * Prompt template editor with @mention autocomplete and pill rendering
 *
 * Provides rich text editing with visual pills for @mentions using Lexical.
 * Automatically saves changes to draft after debounce.
 *
 * Storage format: JSON (Lexical EditorState)
 * Display format: Blue pill for text vars, green for image vars, purple for media
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
  const editorRef = useRef<LexicalEditor | null>(null)
  const [currentValue, setCurrentValue] = useState(value)
  const [characterCount, setCharacterCount] = useState(0)

  // Convert to plugin format
  const variableOptions = variables.map(toVariableOption)
  const mediaOptions = media.map(toMediaOption)

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
  }, [debouncedValue, value, disabled, updateMutation])

  // Initialize editor configuration
  const initialConfig = {
    namespace: 'PromptTemplateEditor',
    theme: {
      // Lexical theme classes (can be extended)
      paragraph: 'editor-paragraph',
      text: {
        bold: 'editor-text-bold',
        italic: 'editor-text-italic',
      },
    },
    onError: (error: Error) => {
      console.error('Lexical error:', error)
    },
    nodes: [VariableMentionNode as never, MediaMentionNode as never],
    editable: !disabled,
  }

  /**
   * Handle editor state changes
   * Updates current value and character count
   */
  const handleChange = (editorState: EditorState, editor: LexicalEditor) => {
    // Save editor reference
    if (!editorRef.current) {
      editorRef.current = editor
    }

    // Serialize to JSON for storage
    const json = serializeToJSON(editor)
    setCurrentValue(json)

    // Update character count (plain text length)
    const plainText = serializeToPlainText(editorState)
    setCharacterCount(plainText.length)
  }

  /**
   * Initialize editor content from stored value
   * Handles both JSON (new format) and plain text (old format)
   */
  const handleEditorInit = (editor: LexicalEditor) => {
    editorRef.current = editor

    if (!value) return

    // Try to load as JSON first (new format)
    const isJSON = value.trim().startsWith('{')
    if (isJSON) {
      const success = loadFromJSON(editor, value)
      if (success) return
    }

    // Fallback: Load as plain text (old format)
    loadFromPlainText(editor, value, variableOptions, mediaOptions)
  }

  return (
    <div className="relative">
      <LexicalComposer initialConfig={initialConfig}>
        {/* Main editor */}
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="min-h-[200px] rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Prompt template editor"
                aria-describedby="editor-help-text"
              />
            }
            placeholder={
              <div className="pointer-events-none absolute left-3 top-3 text-sm text-muted-foreground">
                Write your prompt template here. Type { '{' } to mention
                variables or @ to mention media.
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>

        {/* Plugins */}
        <HistoryPlugin />
        <OnChangePlugin onChange={handleChange} ignoreSelectionChange />
        <MentionsPlugin variables={variableOptions} media={mediaOptions} />
        <SmartPastePlugin variables={variableOptions} media={mediaOptions} />

        {/* Initialize content */}
        <InitializeContentPlugin onInit={handleEditorInit} />
      </LexicalComposer>

      {/* Character count */}
      <div className="mt-2 text-right text-xs text-muted-foreground">
        {characterCount} characters
      </div>

      {/* Help text */}
      <div id="editor-help-text" className="sr-only">
        Use curly brace to mention variables or @ to mention media. Press
        escape to close autocomplete. Arrow keys to navigate suggestions.
      </div>
    </div>
  )
}

/**
 * Plugin to initialize editor content on mount
 * Runs once after editor is created
 */
function InitializeContentPlugin({
  onInit,
}: {
  onInit: (editor: LexicalEditor) => void
}) {
  const [editor] = useLexicalComposerContext()
  const hasInitialized = useRef(false)

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true
      onInit(editor)
    }
  }, [editor, onInit])

  return null
}
