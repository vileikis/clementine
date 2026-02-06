/**
 * Serialization Utilities for Lexical Prompt Editor
 *
 * Handles conversion between:
 * - EditorState → Plain text with mention syntax (for storage)
 * - Plain text with mention syntax → EditorState (for loading)
 *
 * Storage formats:
 * - Step mentions: @{step:stepName}
 * - Media mentions: @{ref:displayName}
 *
 * Human-readable names are used for debuggability in Firestore.
 */
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $isLineBreakNode,
  $isParagraphNode,
  $isTextNode,
} from 'lexical'
import {
  $createMediaMentionNode,
  $isMediaMentionNode,
} from '../nodes/MediaMentionNode'
import {
  $createStepMentionNode,
  $isStepMentionNode,
} from '../nodes/StepMentionNode'
import type { EditorState, LexicalEditor } from 'lexical'
import type { MediaOption, MentionMatch, StepOption } from './types'

// ============================================================================
// Plain Text Serialization (Storage Format)
// ============================================================================

/**
 * Serialize EditorState to plain text with mention syntax
 *
 * Converts mention nodes to plain text format:
 * - Step mentions: @{step:stepName}
 * - Media mentions: @{ref:displayName}
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
        if ($isStepMentionNode(child)) {
          // Use step name (human-readable) for storage
          text += `@{step:${child.getStepName()}}`
        } else if ($isMediaMentionNode(child)) {
          // Use display name (human-readable) for storage
          text += `@{ref:${child.getMediaName()}}`
        } else if ($isLineBreakNode(child)) {
          text += '\n'
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
 * - @{step:name} → StepMentionNode (if name matches a step, else invalid)
 * - @{ref:name} → MediaMentionNode (if name matches media, else invalid)
 *
 * @param editor - Lexical editor instance
 * @param text - Plain text with mention syntax
 * @param steps - Available steps for lookup
 * @param media - Available media for lookup
 */
export function deserializeFromPlainText(
  editor: LexicalEditor,
  text: string,
  steps: StepOption[],
  media: MediaOption[],
): void {
  editor.update(() => {
    const root = $getRoot()
    root.clear()

    const paragraphs = text.split('\n')

    paragraphs.forEach((paragraphText) => {
      const paragraph = $createParagraphNode()

      // Parse format: @{step:name} and @{ref:name}
      // Allow any character except } in the name (to support spaces, dots, etc.)
      const mentionRegex = /@\{(step|ref):([^}]+)\}/g

      const allMatches: MentionMatch[] = []

      let match: RegExpExecArray | null

      while ((match = mentionRegex.exec(paragraphText)) !== null) {
        allMatches.push({
          index: match.index,
          length: match[0].length,
          type: match[1] as 'step' | 'ref',
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

        // Calculate if this match is at the end of the paragraph
        const nextIndex = matchItem.index + matchItem.length
        const isAtEnd = nextIndex === paragraphText.length

        // Add mention node based on type
        let mentionNode
        if (matchItem.type === 'step') {
          const step = steps.find((s) => s.name === matchItem.name)
          if (step) {
            mentionNode = $createStepMentionNode(step.name, step.type)
            paragraph.append(mentionNode)
          } else {
            // Step not found - create invalid mention node
            // Use 'info' as default type since we don't know the actual type
            mentionNode = $createStepMentionNode(matchItem.name, 'info')
            mentionNode.setInvalid(true)
            paragraph.append(mentionNode)
          }
        } else if (matchItem.type === 'ref') {
          const mediaItem = media.find((m) => m.name === matchItem.name)
          if (mediaItem) {
            mentionNode = $createMediaMentionNode(mediaItem.name)
            paragraph.append(mentionNode)
          } else {
            // Media not found - create invalid mention node
            mentionNode = $createMediaMentionNode(matchItem.name)
            mentionNode.setInvalid(true)
            paragraph.append(mentionNode)
          }
        }

        // Add space after mention to prevent cursor trap
        // Only add if mention is at the end of paragraph to avoid accumulation
        if (mentionNode && isAtEnd) {
          paragraph.append($createTextNode(' '))
        }

        lastIndex = nextIndex
      }

      // Add remaining text
      const remainingText = paragraphText.slice(lastIndex)
      if (remainingText.length > 0) {
        paragraph.append($createTextNode(remainingText))
      } else if (allMatches.length > 0) {
        // If paragraph ends with a mention, ensure there's a text node
        // This ensures cursor can always land somewhere
        paragraph.append($createTextNode(''))
      }

      root.append(paragraph)
    })
  })
}
