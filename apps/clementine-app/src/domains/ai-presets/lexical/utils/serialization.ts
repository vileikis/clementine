/**
 * Serialization Utilities for Lexical Editor
 *
 * Handles conversion between:
 * 1. EditorState ↔ JSON (for database storage)
 * 2. EditorState ↔ Plain text with mention syntax (for backward compatibility)
 *
 * Storage formats:
 * - JSON: Complete EditorState serialization
 * - Plain text: {variable_name} for variables, @media_name for media
 */
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $isParagraphNode,
  $isTextNode,
} from 'lexical'
import {
  $createMediaMentionNode,
  $createVariableMentionNode,
  $isMediaMentionNode,
  $isVariableMentionNode,
} from '../nodes'
import type { EditorState, LexicalEditor } from 'lexical'
import type { MediaOption, VariableOption } from '../plugins/MentionsPlugin'
import type { MentionMatch } from './types'

// ============================================================================
// JSON Serialization (Primary Storage Format)
// ============================================================================

/**
 * Serialize EditorState to JSON string
 *
 * This is the preferred storage format as it preserves all editor state.
 *
 * @param editor - Lexical editor instance
 * @returns JSON string representation of editor state
 */
export function serializeToJSON(editor: LexicalEditor): string {
  const editorState = editor.getEditorState()
  return JSON.stringify(editorState)
}

/**
 * Load EditorState from JSON string
 *
 * Parses JSON and sets editor state. Handles errors gracefully.
 *
 * @param editor - Lexical editor instance
 * @param jsonString - JSON string to parse
 * @returns true if successful, false if parsing failed
 */
export function loadFromJSON(
  editor: LexicalEditor,
  jsonString: string,
): boolean {
  try {
    const editorState = editor.parseEditorState(jsonString)
    editor.setEditorState(editorState)
    return true
  } catch (error) {
    console.error('Failed to parse editor state:', error)
    return false
  }
}

// ============================================================================
// Plain Text Serialization (Backward Compatibility)
// ============================================================================

/**
 * Serialize EditorState to plain text with mention syntax
 *
 * Converts mention nodes to plain text format:
 * - Text variables: @{text:variable_name}
 * - Media input variables: @{input:variable_name}
 * - Reference media: @{ref:media_name}
 *
 * This format is optimized for cloud function parsing:
 * - Clear distinction between text and media
 * - Easy to identify data source (user input vs preset registry)
 * - Scalable for future media types (video, audio, etc.)
 *
 * @param editorState - Current editor state
 * @returns Plain text string with mention syntax
 */
export function serializeToPlainText(editorState: EditorState): string {
  return editorState.read(() => {
    const root = $getRoot()
    let text = ''

    root.getChildren().forEach((node) => {
      if (!$isParagraphNode(node)) return

      node.getChildren().forEach((child) => {
        if ($isVariableMentionNode(child)) {
          // Text vs media input (image/video)
          const prefix = child.getVariableType() === 'text' ? 'text' : 'input'
          text += `@{${prefix}:${child.getVariableName()}}`
        } else if ($isMediaMentionNode(child)) {
          // Reference media from registry
          text += `@{ref:${child.getMediaName()}}`
        } else if ($isTextNode(child)) {
          text += child.getTextContent()
        }
      })
      text += '\n'
    })

    return text.trim()
  })
}

/**
 * Parse plain text with mention syntax and load into editor
 *
 * Converts plain text with mention patterns to EditorState:
 * - @{text:name} → Text VariableMentionNode
 * - @{input:name} → Media VariableMentionNode
 * - @{ref:name} → MediaMentionNode
 *
 * @param editor - Lexical editor instance
 * @param text - Plain text with mention syntax
 * @param variables - Available variables for lookup
 * @param media - Available media for lookup
 */
export function loadFromPlainText(
  editor: LexicalEditor,
  text: string,
  variables: VariableOption[],
  media: MediaOption[],
): void {
  editor.update(() => {
    const root = $getRoot()
    root.clear()

    const paragraphs = text.split('\n')

    paragraphs.forEach((paragraphText) => {
      const paragraph = $createParagraphNode()

      // Parse format: @{type:name}
      const mentionRegex = /@\{(text|input|ref):([a-zA-Z_][a-zA-Z0-9_]*)\}/g

      const allMatches: MentionMatch[] = []

      let match: RegExpExecArray | null

      while ((match = mentionRegex.exec(paragraphText)) !== null) {
        allMatches.push({
          index: match.index,
          length: match[0].length,
          type: match[1] as 'text' | 'input' | 'ref',
          name: match[2],
        })
      }

      let lastIndex = 0
      for (const matchItem of allMatches) {
        // Add text before match
        if (matchItem.index > lastIndex) {
          const textBefore = paragraphText.slice(lastIndex, matchItem.index)
          paragraph.append($createTextNode(textBefore))
        }

        // Add mention node based on type
        if (matchItem.type === 'text' || matchItem.type === 'input') {
          const variable = variables.find((v) => v.name === matchItem.name)
          if (variable) {
            paragraph.append(
              $createVariableMentionNode(
                variable.id,
                variable.name,
                variable.type,
              ),
            )
          } else {
            // Variable not found, keep as text
            paragraph.append(
              $createTextNode(`@{${matchItem.type}:${matchItem.name}}`),
            )
          }
        } else if (matchItem.type === 'ref') {
          const mediaItem = media.find((m) => m.name === matchItem.name)
          if (mediaItem) {
            paragraph.append(
              $createMediaMentionNode(mediaItem.id, mediaItem.name),
            )
          } else {
            // Media not found, keep as text
            paragraph.append($createTextNode(`@{ref:${matchItem.name}}`))
          }
        }

        lastIndex = matchItem.index + matchItem.length
      }

      // Add remaining text
      if (lastIndex < paragraphText.length) {
        paragraph.append($createTextNode(paragraphText.slice(lastIndex)))
      }

      root.append(paragraph)
    })
  })
}
