/**
 * SmartPastePlugin - Smart Paste Detection for Mentions
 *
 * Automatically detects and converts @mention patterns in pasted text.
 * Supports both variable and media mention formats:
 * - Variables: {variable_name} → VariableMentionNode
 * - Media: @media_name → MediaMentionNode
 *
 * Features:
 * - Detects multiple mentions in a single paste
 * - Preserves text between mentions
 * - Falls back to plain text if mention not found
 * - High priority command to override default paste behavior
 */
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  PASTE_COMMAND,
  TextNode,
} from 'lexical'
import { useEffect } from 'react'
import {
  $createMediaMentionNode,
  $createVariableMentionNode,
} from '../nodes'
import type { MediaOption, VariableOption } from './MentionsPlugin'

export interface SmartPastePluginProps {
  variables: VariableOption[]
  media: MediaOption[]
}

/**
 * SmartPastePlugin
 *
 * Detects @mention patterns in pasted text and converts them to mention nodes.
 * Uses high priority command handler to intercept paste events.
 *
 * @example
 * ```tsx
 * <SmartPastePlugin
 *   variables={[{ id: '1', name: 'subject', type: 'text' }]}
 *   media={[{ id: '2', name: 'background' }]}
 * />
 * ```
 */
export function SmartPastePlugin({
  variables,
  media,
}: SmartPastePluginProps): null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND,
      (event: ClipboardEvent) => {
        const clipboardData = event.clipboardData
        if (!clipboardData) return false

        const text = clipboardData.getData('text/plain')
        if (!text) return false

        // Check if text contains mention patterns
        const hasVariableMentions = /\{[a-zA-Z_][a-zA-Z0-9_]*\}/.test(text)
        const hasMediaMentions = /@[a-zA-Z_][a-zA-Z0-9_]*/.test(text)

        // If no mentions detected, use default paste behavior
        if (!hasVariableMentions && !hasMediaMentions) {
          return false
        }

        editor.update(() => {
          const selection = $getSelection()
          if (!$isRangeSelection(selection)) return

          // Build array of nodes from pasted text
          const nodes: TextNode[] = []

          // Regex patterns for mentions
          const variableRegex = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g
          const mediaRegex = /@([a-zA-Z_][a-zA-Z0-9_]*)/g

          // Find all matches (both variables and media)
          const allMatches: Array<{
            index: number
            length: number
            type: 'variable' | 'media'
            name: string
          }> = []

          let match
          while ((match = variableRegex.exec(text)) !== null) {
            allMatches.push({
              index: match.index,
              length: match[0].length,
              type: 'variable',
              name: match[1],
            })
          }

          while ((match = mediaRegex.exec(text)) !== null) {
            allMatches.push({
              index: match.index,
              length: match[0].length,
              type: 'media',
              name: match[1],
            })
          }

          // Sort matches by index (left to right)
          allMatches.sort((a, b) => a.index - b.index)

          // Build node array with text and mention nodes
          let lastIndex = 0
          for (const matchItem of allMatches) {
            // Add text before match
            if (matchItem.index > lastIndex) {
              const textBefore = text.slice(lastIndex, matchItem.index)
              nodes.push($createTextNode(textBefore))
            }

            // Add mention node (if found in registry)
            if (matchItem.type === 'variable') {
              const variable = variables.find((v) => v.name === matchItem.name)
              if (variable) {
                nodes.push(
                  $createVariableMentionNode(
                    variable.id,
                    variable.name,
                    variable.type,
                  ),
                )
              } else {
                // Variable not found, keep as text
                nodes.push($createTextNode(`{${matchItem.name}}`))
              }
            } else if (matchItem.type === 'media') {
              const mediaItem = media.find((m) => m.name === matchItem.name)
              if (mediaItem) {
                nodes.push(
                  $createMediaMentionNode(mediaItem.id, mediaItem.name),
                )
              } else {
                // Media not found, keep as text
                nodes.push($createTextNode(`@${matchItem.name}`))
              }
            }

            lastIndex = matchItem.index + matchItem.length
          }

          // Add remaining text after last match
          if (lastIndex < text.length) {
            nodes.push($createTextNode(text.slice(lastIndex)))
          }

          // Insert all nodes at selection
          if (nodes.length > 0) {
            selection.insertNodes(nodes)
          }
        })

        // Prevent default paste behavior
        event.preventDefault()
        return true
      },
      COMMAND_PRIORITY_HIGH, // Higher priority to override default
    )
  }, [editor, variables, media])

  return null
}
