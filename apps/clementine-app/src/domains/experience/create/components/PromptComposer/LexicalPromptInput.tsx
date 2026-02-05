/**
 * LexicalPromptInput Component
 *
 * Rich text editor for AI image prompt input with @mention support.
 * Replaces the plain textarea PromptInput component.
 *
 * Features:
 * - @mention autocomplete for steps and media
 * - Visual pills for mentions (blue for steps, green for media)
 * - Serialization to @{step:name} and @{ref:name} format
 */
import { useCallback } from 'react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import {
  InitializePlugin,
  MediaMentionNode,
  MentionValidationPlugin,
  MentionsPlugin,
  SmartPastePlugin,
  StepMentionNode,
  serializeToPlainText,
} from '../../lexical'
import type { MediaOption, StepOption } from '../../lexical'
import type { EditorState } from 'lexical'

export interface LexicalPromptInputProps {
  /** Current prompt value (serialized format) */
  value: string
  /** Callback when prompt changes */
  onChange: (value: string) => void
  /** Available steps for @mention */
  steps: StepOption[]
  /** Available media for @mention */
  media: MediaOption[]
  /** Whether the input is disabled */
  disabled?: boolean
}

/**
 * LexicalPromptInput - Rich text editor for prompts with @mention support
 */
export function LexicalPromptInput({
  value,
  onChange,
  steps,
  media,
  disabled,
}: LexicalPromptInputProps) {
  // Handle editor state changes - serialize to plain text format
  const handleChange = useCallback(
    (editorState: EditorState) => {
      const serialized = serializeToPlainText(editorState)
      onChange(serialized)
    },
    [onChange],
  )

  const initialConfig = {
    namespace: 'PromptEditor',
    nodes: [StepMentionNode, MediaMentionNode],
    onError: (error: Error) => {
      console.error('Lexical error:', error)
    },
    editable: !disabled,
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="relative">
        <PlainTextPlugin
          contentEditable={
            <ContentEditable
              className="field-sizing-content min-h-24 w-full resize-none border-0 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="AI image generation prompt"
            />
          }
          placeholder={
            <div className="pointer-events-none absolute left-3 top-2 text-sm text-muted-foreground">
              Enter your prompt... Type @ to insert step or media references.
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <OnChangePlugin onChange={handleChange} ignoreSelectionChange />
        <MentionsPlugin steps={steps} media={media} />
        <InitializePlugin value={value} steps={steps} media={media} />
        <MentionValidationPlugin steps={steps} media={media} />
        <SmartPastePlugin steps={steps} media={media} />
      </div>
    </LexicalComposer>
  )
}
