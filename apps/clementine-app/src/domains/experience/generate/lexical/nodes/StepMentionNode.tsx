/**
 * StepMentionNode - Custom TextNode for Experience Step Mentions
 *
 * Extends TextNode (not DecoratorNode) for proper text selection behavior.
 * Renders step mentions as colored pills inline in the text.
 *
 * Color coding:
 * - All steps: Blue (#e3f2fd background, #1976d2 text)
 * - Invalid: Red (#fee background, #c33 text)
 *
 * Storage format: @{step:stepName}
 *
 * Features:
 * - Atomic selection (select as a unit)
 * - Prevents text insertion at boundaries
 * - Bidirectional text support
 * - Proper serialization/deserialization
 */
import { $applyNodeReplacement, TextNode } from 'lexical'
import type { EditorConfig, NodeKey, SerializedTextNode, Spread } from 'lexical'
import type { ExperienceStepType } from '@clementine/shared'

export type SerializedStepMentionNode = Spread<
  {
    stepName: string
    stepType: ExperienceStepType
    isInvalid?: boolean
  },
  SerializedTextNode
>

/**
 * StepMentionNode
 *
 * Custom node for rendering step mentions as colored pills.
 * Extends TextNode for natural text selection behavior.
 */
export class StepMentionNode extends TextNode {
  __stepName: string
  __stepType: ExperienceStepType
  __isInvalid: boolean

  static getType(): string {
    return 'step-mention'
  }

  static clone(node: StepMentionNode): StepMentionNode {
    const cloned = new StepMentionNode(
      node.__stepName,
      node.__stepType,
      node.__text,
      node.__key,
    )
    cloned.__isInvalid = node.__isInvalid
    return cloned
  }

  static importJSON(serialized: SerializedStepMentionNode): StepMentionNode {
    const node = $createStepMentionNode(serialized.stepName, serialized.stepType)
    node.__isInvalid = serialized.isInvalid ?? false
    node.setFormat(serialized.format)
    node.setDetail(serialized.detail)
    node.setMode(serialized.mode)
    node.setStyle(serialized.style)
    return node
  }

  constructor(
    stepName: string,
    stepType: ExperienceStepType,
    text?: string,
    key?: NodeKey,
  ) {
    super(text ?? `@${stepName}`, key)
    this.__stepName = stepName
    this.__stepType = stepType
    this.__isInvalid = false
  }

  exportJSON(): SerializedStepMentionNode {
    return {
      ...super.exportJSON(),
      stepName: this.__stepName,
      stepType: this.__stepType,
      isInvalid: this.__isInvalid,
      type: 'step-mention',
      version: 1,
    }
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config)
    dom.className = `step-mention step-type-${this.__stepType} ${this.__isInvalid ? 'step-invalid' : ''}`

    // Apply color coding based on validity
    let bgColor: string
    let textColor: string

    if (this.__isInvalid) {
      // Invalid mention: red styling
      bgColor = '#fee'
      textColor = '#c33'
    } else {
      // Valid mention: blue styling for all step types
      bgColor = '#e3f2fd'
      textColor = '#1976d2'
    }

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
    dom.setAttribute('data-step-name', this.__stepName)
    dom.setAttribute('data-step-type', this.__stepType)
    dom.setAttribute('data-invalid', String(this.__isInvalid))
    dom.setAttribute('contenteditable', 'false')
    dom.spellcheck = false

    if (this.__isInvalid) {
      dom.title = `Step "${this.__stepName}" no longer exists`
    }

    return dom
  }

  // Update DOM when invalid state changes
  updateDOM(prevNode: StepMentionNode, _dom: HTMLElement): boolean {
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
  getStepName(): string {
    return this.__stepName
  }

  getStepType(): ExperienceStepType {
    return this.__stepType
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
 * Factory function to create StepMentionNode
 *
 * Creates a segmented, directionless node for proper inline rendering.
 *
 * @param stepName - Display name of the step (used for storage)
 * @param stepType - Type of step (for icon display)
 * @returns StepMentionNode instance
 */
export function $createStepMentionNode(
  stepName: string,
  stepType: ExperienceStepType,
): StepMentionNode {
  const node = new StepMentionNode(stepName, stepType, `@${stepName}`)
  // Make mention atomic (select as a unit) and bidirectional
  node.setMode('segmented').toggleDirectionless()
  return $applyNodeReplacement(node)
}

/**
 * Type guard to check if a node is a StepMentionNode
 */
export function $isStepMentionNode(node: unknown): node is StepMentionNode {
  return node instanceof StepMentionNode
}
