/**
 * VariableMentionNode - Custom TextNode for Variable Mentions
 *
 * Extends TextNode (not DecoratorNode) for proper text selection behavior.
 * Renders variable mentions as colored pills inline in the text.
 *
 * Color coding:
 * - Text variables: Blue (#e3f2fd background, #1976d2 text)
 * - Image variables: Green (#e8f5e9 background, #2e7d32 text)
 *
 * Features:
 * - Atomic selection (select as a unit)
 * - Prevents text insertion at boundaries
 * - Bidirectional text support
 * - Proper serialization/deserialization
 */
import { $applyNodeReplacement, TextNode } from 'lexical'
import type { EditorConfig, NodeKey, SerializedTextNode, Spread } from 'lexical'

export type SerializedVariableMentionNode = Spread<
  {
    variableId: string
    variableName: string
    variableType: 'text' | 'image'
  },
  SerializedTextNode
>

/**
 * VariableMentionNode
 *
 * Custom node for rendering variable mentions as colored pills.
 * Extends TextNode for natural text selection behavior.
 */
export class VariableMentionNode extends TextNode {
  __variableId: string
  __variableName: string
  __variableType: 'text' | 'image'

  static getType(): string {
    return 'variable-mention'
  }

  static clone(node: VariableMentionNode): VariableMentionNode {
    return new VariableMentionNode(
      node.__variableId,
      node.__variableName,
      node.__variableType,
      node.__text,
      node.__key,
    )
  }

  static importJSON(
    serialized: SerializedVariableMentionNode,
  ): VariableMentionNode {
    const node = $createVariableMentionNode(
      serialized.variableId,
      serialized.variableName,
      serialized.variableType,
    )
    node.setFormat(serialized.format)
    node.setDetail(serialized.detail)
    node.setMode(serialized.mode)
    node.setStyle(serialized.style)
    return node
  }

  constructor(
    variableId: string,
    variableName: string,
    variableType: 'text' | 'image',
    text?: string,
    key?: NodeKey,
  ) {
    super(text ?? `@${variableName}`, key)
    this.__variableId = variableId
    this.__variableName = variableName
    this.__variableType = variableType
  }

  exportJSON(): SerializedVariableMentionNode {
    return {
      ...super.exportJSON(),
      variableId: this.__variableId,
      variableName: this.__variableName,
      variableType: this.__variableType,
      type: 'variable-mention',
      version: 1,
    }
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config)
    dom.className = `variable-mention variable-type-${this.__variableType}`

    // Apply color coding based on variable type
    const bgColor = this.__variableType === 'text' ? '#e3f2fd' : '#e8f5e9'
    const textColor = this.__variableType === 'text' ? '#1976d2' : '#2e7d32'

    dom.style.cssText = `
      background-color: ${bgColor};
      color: ${textColor};
      border-radius: 4px;
      padding: 2px 6px;
      font-family: monospace;
      font-weight: 500;
      user-select: none;
      cursor: pointer;
    `
    dom.setAttribute('data-variable-id', this.__variableId)
    dom.setAttribute('data-variable-name', this.__variableName)
    dom.setAttribute('data-variable-type', this.__variableType)
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
  getVariableId(): string {
    return this.__variableId
  }

  getVariableName(): string {
    return this.__variableName
  }

  getVariableType(): 'text' | 'image' {
    return this.__variableType
  }
}

/**
 * Factory function to create VariableMentionNode
 *
 * Creates a segmented, directionless node for proper inline rendering.
 *
 * @param variableId - Unique ID of the variable
 * @param variableName - Display name of the variable
 * @param variableType - Type of variable (text or image)
 * @returns VariableMentionNode instance
 */
export function $createVariableMentionNode(
  variableId: string,
  variableName: string,
  variableType: 'text' | 'image',
): VariableMentionNode {
  const node = new VariableMentionNode(
    variableId,
    variableName,
    variableType,
    `@${variableName}`,
  )
  // Make mention atomic (select as a unit) and bidirectional
  node.setMode('segmented').toggleDirectionless()
  return $applyNodeReplacement(node)
}

/**
 * Type guard to check if a node is a VariableMentionNode
 */
export function $isVariableMentionNode(
  node: unknown,
): node is VariableMentionNode {
  return node instanceof VariableMentionNode
}
