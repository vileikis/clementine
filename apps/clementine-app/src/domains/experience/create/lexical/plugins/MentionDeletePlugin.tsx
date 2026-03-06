/**
 * MentionDeletePlugin - Hover-to-delete for mention nodes
 *
 * Shows a close icon on mention hover via CSS ::after pseudo-element.
 * Detects clicks in the close zone via a root-level mousedown handler.
 * Uses $getNearestNodeFromDOMNode to resolve the Lexical node and remove it.
 *
 * This approach avoids injecting child DOM elements into TextNode spans,
 * which Lexical's reconciliation can strip during text updates.
 */
import { useEffect } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getNearestNodeFromDOMNode } from 'lexical'
import { $isStepMentionNode } from '../nodes/StepMentionNode'
import { $isMediaMentionNode } from '../nodes/MediaMentionNode'

const STYLE_ID = 'mention-delete-plugin-styles'

/** Width of the clickable close zone on the right edge of a mention pill */
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

export function MentionDeletePlugin({
  disabled,
}: {
  disabled?: boolean
}): null {
  const [editor] = useLexicalComposerContext()

  // Inject CSS for ::after close icon
  useEffect(() => {
    if (disabled) return
    if (document.getElementById(STYLE_ID)) return

    const style = document.createElement('style')
    style.id = STYLE_ID
    style.textContent = MENTION_CSS
    document.head.appendChild(style)

    return () => {
      style.remove()
    }
  }, [disabled])

  // Root-level mousedown handler for close zone clicks
  useEffect(() => {
    if (disabled) return

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const mention = target.closest(
        '.step-mention, .media-mention',
      )
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
