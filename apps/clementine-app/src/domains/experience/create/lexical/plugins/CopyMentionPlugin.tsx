/**
 * CopyMentionPlugin - Serialize mentions in storage format on copy/cut
 *
 * When copying or cutting content that contains mention nodes, this plugin
 * intercepts the clipboard and writes the storage format (@{step:name},
 * @{ref:name}) into text/plain. This ensures:
 *
 * - Pasting back into the editor reconstructs mention nodes (via SmartPastePlugin)
 * - Pasting into external editors (Notion, Google Docs, etc.) shows the storage
 *   format, which users can edit and paste back
 * - Consistent round-trip: editor → clipboard → external tool → clipboard → editor
 *
 * Only activates when the selection contains mention nodes.
 * Falls through to default handler for plain text selections.
 */
import { useEffect } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getSelection,
  $isLineBreakNode,
  $isParagraphNode,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_HIGH,
  COPY_COMMAND,
  CUT_COMMAND,
} from 'lexical'
import { $isStepMentionNode } from '../nodes/StepMentionNode'
import { $isMediaMentionNode } from '../nodes/MediaMentionNode'
import type { RangeSelection } from 'lexical'

/**
 * Serialize a RangeSelection to plain text with mention storage format.
 *
 * Iterates through the selected nodes and outputs:
 * - StepMentionNode → @{step:name}
 * - MediaMentionNode → @{ref:name}
 * - TextNode → text content (respecting anchor/focus offsets at boundaries)
 * - LineBreakNode → \n
 * - ParagraphNode boundaries → \n
 */
function serializeSelectionWithMentions(selection: RangeSelection): string {
  const nodes = selection.getNodes()
  if (nodes.length === 0) return ''

  const anchor = selection.anchor
  const focus = selection.focus
  const isBackward = selection.isBackward()
  const [start, end] = isBackward ? [focus, anchor] : [anchor, focus]

  // Find the first and last leaf nodes for offset handling
  const firstLeafKey = nodes
    .find((n) => $isTextNode(n) || $isLineBreakNode(n))
    ?.getKey()
  const lastLeafKey = [...nodes]
    .reverse()
    .find((n) => $isTextNode(n) || $isLineBreakNode(n))
    ?.getKey()

  let text = ''
  let seenFirstParagraph = false

  for (const node of nodes) {
    if ($isParagraphNode(node)) {
      if (seenFirstParagraph) {
        text += '\n'
      }
      seenFirstParagraph = true
      continue
    }

    if ($isStepMentionNode(node)) {
      text += `@{step:${node.getStepName()}}`
    } else if ($isMediaMentionNode(node)) {
      text += `@{ref:${node.getMediaName()}}`
    } else if ($isLineBreakNode(node)) {
      text += '\n'
    } else if ($isTextNode(node)) {
      let nodeText = node.getTextContent()
      const key = node.getKey()

      // Handle partial selection at boundaries
      if (key === start.key && key === end.key) {
        nodeText = nodeText.slice(start.offset, end.offset)
      } else if (key === firstLeafKey && key === start.key) {
        nodeText = nodeText.slice(start.offset)
      } else if (key === lastLeafKey && key === end.key) {
        nodeText = nodeText.slice(0, end.offset)
      }

      text += nodeText
    }
  }

  return text
}

/**
 * CopyMentionPlugin
 *
 * Intercepts copy/cut to serialize mentions in storage format.
 * Only activates when the selection contains mention nodes.
 */
export function CopyMentionPlugin(): null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    const handleCopyOrCut = (event: ClipboardEvent, isCut: boolean) => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return false

      // Only intercept if selection contains mention nodes
      const nodes = selection.getNodes()
      const hasMentions = nodes.some(
        (node) => $isStepMentionNode(node) || $isMediaMentionNode(node),
      )
      if (!hasMentions) return false

      const text = serializeSelectionWithMentions(selection)

      if (!event.clipboardData) return false
      event.clipboardData.setData('text/plain', text)
      event.preventDefault()

      // For cut, also delete the selected content
      if (isCut) {
        selection.removeText()
      }

      return true
    }

    const unregisterCopy = editor.registerCommand(
      COPY_COMMAND,
      (event: ClipboardEvent) => handleCopyOrCut(event, false),
      COMMAND_PRIORITY_HIGH,
    )

    const unregisterCut = editor.registerCommand(
      CUT_COMMAND,
      (event: ClipboardEvent) => handleCopyOrCut(event, true),
      COMMAND_PRIORITY_HIGH,
    )

    return () => {
      unregisterCopy()
      unregisterCut()
    }
  }, [editor])

  return null
}
