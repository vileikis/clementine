/**
 * MediaMentionNode - Custom TextNode for Reference Media Mentions
 *
 * Extends TextNode (not DecoratorNode) for proper text selection behavior.
 * Renders reference media mentions as colored pills inline in the text.
 *
 * Reference media = static media from preset's media registry
 * Storage format: @{ref:media_name}
 *
 * Color coding:
 * - Media: Green (#e8f5e9 background, #2e7d32 text)
 *
 * Features:
 * - Atomic selection (select as a unit)
 * - Prevents text insertion at boundaries
 * - Bidirectional text support
 * - Proper serialization/deserialization
 */
import { $applyNodeReplacement, TextNode } from 'lexical'
import type { EditorConfig, NodeKey, SerializedTextNode, Spread } from 'lexical'

export type SerializedMediaMentionNode = Spread<
  {
    mediaId: string
    mediaName: string
  },
  SerializedTextNode
>

/**
 * MediaMentionNode
 *
 * Custom node for rendering media mentions as colored pills.
 * Extends TextNode for natural text selection behavior.
 */
export class MediaMentionNode extends TextNode {
  __mediaId: string
  __mediaName: string

  static getType(): string {
    return 'media-mention'
  }

  static clone(node: MediaMentionNode): MediaMentionNode {
    return new MediaMentionNode(
      node.__mediaId,
      node.__mediaName,
      node.__text,
      node.__key,
    )
  }

  static importJSON(serialized: SerializedMediaMentionNode): MediaMentionNode {
    const node = $createMediaMentionNode(
      serialized.mediaId,
      serialized.mediaName,
    )
    node.setFormat(serialized.format)
    node.setDetail(serialized.detail)
    node.setMode(serialized.mode)
    node.setStyle(serialized.style)
    return node
  }

  constructor(
    mediaId: string,
    mediaName: string,
    text?: string,
    key?: NodeKey,
  ) {
    super(text ?? `@${mediaName}`, key)
    this.__mediaId = mediaId
    this.__mediaName = mediaName
  }

  exportJSON(): SerializedMediaMentionNode {
    return {
      ...super.exportJSON(),
      mediaId: this.__mediaId,
      mediaName: this.__mediaName,
      type: 'media-mention',
      version: 1,
    }
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config)
    dom.className = 'media-mention'

    // Apply green color coding for reference media
    dom.style.cssText = `
      background-color: #e8f5e9;
      color: #2e7d32;
      border-radius: 4px;
      padding: 2px 6px;
      font-family: monospace;
      font-weight: 500;
      user-select: none;
      cursor: pointer;
    `
    dom.setAttribute('data-media-id', this.__mediaId)
    dom.setAttribute('data-media-name', this.__mediaName)
    dom.setAttribute('contenteditable', 'false')
    dom.spellcheck = false

    return dom
  }

  // Mark as text entity for proper handling
  isTextEntity(): true {
    return true
  }

  // Prevent text insertion at boundaries (makes mention atomic)
  canInsertTextBefore(): boolean {
    return false
  }

  canInsertTextAfter(): boolean {
    return false
  }

  // Getters for accessing node data
  getMediaId(): string {
    return this.__mediaId
  }

  getMediaName(): string {
    return this.__mediaName
  }
}

/**
 * Factory function to create MediaMentionNode
 *
 * Creates a segmented, directionless node for proper inline rendering.
 *
 * @param mediaId - Unique ID of the media asset
 * @param mediaName - Display name of the media
 * @returns MediaMentionNode instance
 */
export function $createMediaMentionNode(
  mediaId: string,
  mediaName: string,
): MediaMentionNode {
  const node = new MediaMentionNode(mediaId, mediaName, `@${mediaName}`)
  // Make mention atomic (select as a unit) and bidirectional
  node.setMode('segmented').toggleDirectionless()
  return $applyNodeReplacement(node)
}

/**
 * Type guard to check if a node is a MediaMentionNode
 */
export function $isMediaMentionNode(node: unknown): node is MediaMentionNode {
  return node instanceof MediaMentionNode
}
