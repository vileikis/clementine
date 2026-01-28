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
    isInvalid?: boolean
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
  __isInvalid: boolean

  static getType(): string {
    return 'media-mention'
  }

  static clone(node: MediaMentionNode): MediaMentionNode {
    const cloned = new MediaMentionNode(
      node.__mediaId,
      node.__mediaName,
      node.__text,
      node.__key,
    )
    cloned.__isInvalid = node.__isInvalid
    return cloned
  }

  static importJSON(serialized: SerializedMediaMentionNode): MediaMentionNode {
    const node = $createMediaMentionNode(
      serialized.mediaId,
      serialized.mediaName,
    )
    node.__isInvalid = serialized.isInvalid ?? false
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
    this.__isInvalid = false
  }

  exportJSON(): SerializedMediaMentionNode {
    return {
      ...super.exportJSON(),
      mediaId: this.__mediaId,
      mediaName: this.__mediaName,
      isInvalid: this.__isInvalid,
      type: 'media-mention',
      version: 1,
    }
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config)
    dom.className = `media-mention ${this.__isInvalid ? 'media-invalid' : ''}`

    // Apply color coding based on validity
    const bgColor = this.__isInvalid ? '#fee' : '#e8f5e9'
    const textColor = this.__isInvalid ? '#c33' : '#2e7d32'

    dom.style.cssText = `
      background-color: ${bgColor};
      color: ${textColor};
      border-radius: 4px;
      padding: 2px 6px;
      font-family: monospace;
      font-weight: 500;
      user-select: none;
      cursor: pointer;
      ${this.__isInvalid ? 'text-decoration: line-through;' : ''}
    `
    dom.setAttribute('data-media-id', this.__mediaId)
    dom.setAttribute('data-media-name', this.__mediaName)
    dom.setAttribute('data-invalid', String(this.__isInvalid))
    dom.setAttribute('contenteditable', 'false')
    dom.spellcheck = false

    if (this.__isInvalid) {
      dom.title = `Media @${this.__mediaName} no longer exists`
    }

    return dom
  }

  // Update DOM when invalid state changes
  updateDOM(prevNode: MediaMentionNode, _dom: HTMLElement): boolean {
    // Return true to trigger full re-render if invalid state changed
    return prevNode.__isInvalid !== this.__isInvalid
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

  getIsInvalid(): boolean {
    return this.__isInvalid
  }

  // Method to mark mention as invalid
  setInvalid(invalid: boolean): void {
    const self = this.getWritable()
    self.__isInvalid = invalid
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
