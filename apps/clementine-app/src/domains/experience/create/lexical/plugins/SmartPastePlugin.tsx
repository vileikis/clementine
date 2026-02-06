/**
 * SmartPastePlugin - Detect and convert mention patterns in pasted text
 *
 * When users paste text containing @{step:name} or @{ref:name} patterns,
 * this plugin converts them to StepMentionNode or MediaMentionNode.
 *
 * Features:
 * - Detects @{step:name} patterns → StepMentionNode
 * - Detects @{ref:name} patterns → MediaMentionNode
 * - Validates names against current steps/media
 * - Creates invalid mentions if names don't match
 *
 * Usage:
 * ```tsx
 * <SmartPastePlugin steps={steps} media={media} />
 * ```
 */
import { useEffect } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  PASTE_COMMAND,
} from 'lexical'
import { $createStepMentionNode } from '../nodes/StepMentionNode'
import { $createMediaMentionNode } from '../nodes/MediaMentionNode'
import type { MediaOption, StepOption } from '../utils/types'

export interface SmartPastePluginProps {
  /** Available steps for mention validation */
  steps: StepOption[]
  /** Available media for mention validation */
  media: MediaOption[]
}

/**
 * SmartPastePlugin
 *
 * Intercepts paste events and converts @{step:name} and @{ref:name}
 * patterns to mention nodes.
 */
export function SmartPastePlugin({
  steps,
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

        // Check if the text contains mention patterns
        const mentionPattern = /@\{(step|ref):([^}]+)\}/g
        if (!mentionPattern.test(text)) {
          // No mention patterns - let default paste handler handle it
          return false
        }

        // Reset regex index after test
        mentionPattern.lastIndex = 0

        // Prevent default paste and handle manually
        event.preventDefault()

        editor.update(() => {
          const selection = $getSelection()
          if (!$isRangeSelection(selection)) return

          // Parse the text and build nodes
          const nodes: (
            | ReturnType<typeof $createTextNode>
            | ReturnType<typeof $createStepMentionNode>
            | ReturnType<typeof $createMediaMentionNode>
          )[] = []

          let lastIndex = 0
          let match: RegExpExecArray | null

          while ((match = mentionPattern.exec(text)) !== null) {
            // Add text before the match
            if (match.index > lastIndex) {
              const textBefore = text.slice(lastIndex, match.index)
              nodes.push($createTextNode(textBefore))
            }

            const type = match[1] as 'step' | 'ref'
            const name = match[2].trim()

            if (type === 'step') {
              const step = steps.find((s) => s.name === name)
              const mentionNode = $createStepMentionNode(
                name,
                step?.type ?? 'info',
              )
              if (!step) {
                mentionNode.setInvalid(true)
              }
              nodes.push(mentionNode)
            } else if (type === 'ref') {
              const mediaItem = media.find((m) => m.name === name)
              const mentionNode = $createMediaMentionNode(name)
              if (!mediaItem) {
                mentionNode.setInvalid(true)
              }
              nodes.push(mentionNode)
            }

            lastIndex = match.index + match[0].length
          }

          // Add remaining text after last match
          if (lastIndex < text.length) {
            nodes.push($createTextNode(text.slice(lastIndex)))
          }

          // Insert all nodes
          if (nodes.length > 0) {
            selection.insertNodes(nodes)
          }
        })

        return true
      },
      COMMAND_PRIORITY_HIGH,
    )
  }, [editor, steps, media])

  return null
}
