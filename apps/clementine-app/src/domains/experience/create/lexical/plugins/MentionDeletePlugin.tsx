/**
 * MentionDeletePlugin - Hover-to-delete and cursor correction for mention nodes
 *
 * 1. Shows a close icon on mention hover via CSS ::after pseudo-element.
 *    Detects clicks in the close zone via a root-level mousedown handler.
 * 2. Arrow key handlers jump the cursor past mention nodes (atomic navigation).
 * 3. Click inside a mention snaps cursor to the nearest boundary.
 */
import { useEffect } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getNearestNodeFromDOMNode,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_HIGH,
  KEY_ARROW_LEFT_COMMAND,
  KEY_ARROW_RIGHT_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from 'lexical'
import { $isStepMentionNode } from '../nodes/StepMentionNode'
import { $isMediaMentionNode } from '../nodes/MediaMentionNode'
import type { LexicalNode } from 'lexical'

const STYLE_ID = 'mention-delete-plugin-styles'
let styleRefCount = 0

/** Width of the clickable close zone on the left edge of a mention pill */
const CLOSE_ZONE_WIDTH = 16

const MENTION_CSS = `
.step-mention,
.media-mention {
  position: relative;
}
.step-mention::after,
.media-mention::after {
  content: '\\00d7';
  position: absolute;
  left: 1px;
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  font-size: 11px;
  font-family: sans-serif;
  line-height: 14px;
  text-align: center;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.1s;
}
.step-mention:hover::after,
.media-mention:hover::after {
  opacity: 1;
}
`

function isMentionNode(node: LexicalNode | null | undefined): boolean {
  return $isStepMentionNode(node) || $isMediaMentionNode(node)
}

/** Move cursor to after a mention node (start of next sibling, or end of mention) */
function selectAfterMention(node: LexicalNode): void {
  const next = node.getNextSibling()
  if (next && $isTextNode(next) && !isMentionNode(next)) {
    next.select(0, 0)
  } else {
    node.selectNext()
  }
}

/** Move cursor to before a mention node (end of prev sibling, or start of mention) */
function selectBeforeMention(node: LexicalNode): void {
  const prev = node.getPreviousSibling()
  if (prev && $isTextNode(prev) && !isMentionNode(prev)) {
    const len = prev.getTextContentSize()
    prev.select(len, len)
  } else {
    node.selectPrevious()
  }
}

export function MentionDeletePlugin({
  disabled,
}: {
  disabled?: boolean
}): null {
  const [editor] = useLexicalComposerContext()

  // Inject CSS for ::after close icon (ref-counted for multiple instances)
  useEffect(() => {
    if (disabled) return

    let existing = document.getElementById(STYLE_ID)
    if (!existing) {
      existing = document.createElement('style')
      existing.id = STYLE_ID
      existing.textContent = MENTION_CSS
      document.head.appendChild(existing)
    }
    styleRefCount++

    return () => {
      styleRefCount--
      if (styleRefCount <= 0) {
        document.getElementById(STYLE_ID)?.remove()
        styleRefCount = 0
      }
    }
  }, [disabled])

  // Arrow key handlers: jump cursor past mention nodes
  useEffect(() => {
    const unregisterRight = editor.registerCommand(
      KEY_ARROW_RIGHT_COMMAND,
      (event: KeyboardEvent) => {
        const selection = $getSelection()
        if (!$isRangeSelection(selection) || !selection.isCollapsed())
          return false

        const { anchor } = selection
        const node = anchor.getNode()

        // Cursor is inside a mention → jump to after it
        if (isMentionNode(node)) {
          event.preventDefault()
          selectAfterMention(node)
          return true
        }

        // Cursor is at end of a text node, next sibling is mention → skip it
        if ($isTextNode(node) && anchor.type === 'text') {
          const atEnd = anchor.offset >= node.getTextContentSize()
          if (atEnd) {
            const next = node.getNextSibling()
            if (next && isMentionNode(next)) {
              event.preventDefault()
              selectAfterMention(next)
              return true
            }
          }
        }

        return false
      },
      COMMAND_PRIORITY_HIGH,
    )

    const unregisterLeft = editor.registerCommand(
      KEY_ARROW_LEFT_COMMAND,
      (event: KeyboardEvent) => {
        const selection = $getSelection()
        if (!$isRangeSelection(selection) || !selection.isCollapsed())
          return false

        const { anchor } = selection
        const node = anchor.getNode()

        // Cursor is inside a mention → jump to before it
        if (isMentionNode(node)) {
          event.preventDefault()
          selectBeforeMention(node)
          return true
        }

        // Cursor is at start of a text node, prev sibling is mention → skip it
        if ($isTextNode(node) && anchor.type === 'text') {
          if (anchor.offset <= 0) {
            const prev = node.getPreviousSibling()
            if (prev && isMentionNode(prev)) {
              event.preventDefault()
              selectBeforeMention(prev)
              return true
            }
          }
        }

        return false
      },
      COMMAND_PRIORITY_HIGH,
    )

    return () => {
      unregisterRight()
      unregisterLeft()
    }
  }, [editor])

  // Snap cursor to nearest boundary on click inside a mention
  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        const selection = $getSelection()
        if (!$isRangeSelection(selection)) return false

        const { anchor, focus } = selection
        const anchorNode = anchor.getNode()

        if (!isMentionNode(anchorNode)) return false
        if (anchor.type !== 'text') return false

        const textLen = anchorNode.getTextContentSize()
        const offset = anchor.offset

        // Already at boundary — nothing to do
        if (offset <= 0 || offset >= textLen) return false

        // Snap to nearest edge
        const newOffset = offset <= textLen / 2 ? 0 : textLen
        anchor.set(anchorNode.getKey(), newOffset, 'text')
        focus.set(anchorNode.getKey(), newOffset, 'text')

        return true
      },
      COMMAND_PRIORITY_HIGH,
    )
  }, [editor])

  // Root-level mousedown handler for close zone clicks
  useEffect(() => {
    if (disabled) return

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const mention = target.closest('.step-mention, .media-mention')
      if (!mention) return
      if (!editor.isEditable()) return

      // Check if click is in the close zone (left edge of the pill)
      const rect = mention.getBoundingClientRect()
      const localX = e.clientX - rect.left
      if (localX > CLOSE_ZONE_WIDTH) return

      e.preventDefault()
      e.stopPropagation()

      editor.update(() => {
        const node = $getNearestNodeFromDOMNode(mention)
        if (node && ($isStepMentionNode(node) || $isMediaMentionNode(node))) {
          node.remove()
        }
      })
    }

    return editor.registerRootListener((root, prevRoot) => {
      prevRoot?.removeEventListener('mousedown', handleMouseDown)
      root?.addEventListener('mousedown', handleMouseDown)
    })
  }, [editor, disabled])

  return null
}
