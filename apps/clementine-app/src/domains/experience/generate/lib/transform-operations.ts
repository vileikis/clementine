/**
 * Transform Operations
 *
 * Pure functions for manipulating transform configuration.
 * These functions are side-effect free and easy to test.
 */
import { nanoid } from 'nanoid'

import type {
  AIImageNodeConfig,
  TransformConfig,
  TransformNode,
} from '@clementine/shared'

/**
 * Default transform configuration
 */
export const DEFAULT_TRANSFORM_CONFIG: TransformConfig = {
  nodes: [],
  outputFormat: null,
}

/**
 * Creates a new AI Image node with default configuration
 */
export function createDefaultAIImageNode(): TransformNode {
  return {
    id: nanoid(),
    type: 'ai.imageGeneration',
    config: {
      model: 'gemini-2.5-flash-image',
      aspectRatio: '3:2',
      prompt: '',
      refMedia: [],
    } satisfies AIImageNodeConfig,
  }
}

/**
 * Adds a new node to the transform configuration
 *
 * @param transform - Current transform config (or null/undefined)
 * @returns New transform config with the added node
 */
export function addNode(
  transform: TransformConfig | null | undefined,
): TransformConfig {
  const current = transform ?? DEFAULT_TRANSFORM_CONFIG
  const newNode = createDefaultAIImageNode()

  return {
    ...current,
    nodes: [...current.nodes, newNode],
  }
}

/**
 * Removes a node from the transform configuration
 *
 * @param transform - Current transform config (or null/undefined)
 * @param nodeId - ID of the node to remove
 * @returns New transform config without the specified node
 */
export function removeNode(
  transform: TransformConfig | null | undefined,
  nodeId: string,
): TransformConfig {
  const current = transform ?? DEFAULT_TRANSFORM_CONFIG

  return {
    ...current,
    nodes: current.nodes.filter((n) => n.id !== nodeId),
  }
}

/**
 * Duplicates a node in the transform configuration
 * The duplicate is inserted immediately after the original
 *
 * @param transform - Current transform config (or null/undefined)
 * @param nodeId - ID of the node to duplicate
 * @returns New transform config with the duplicated node
 * @throws Error if the node is not found
 */
export function duplicateNode(
  transform: TransformConfig | null | undefined,
  nodeId: string,
): TransformConfig {
  const current = transform ?? DEFAULT_TRANSFORM_CONFIG
  const nodeIndex = current.nodes.findIndex((n) => n.id === nodeId)

  if (nodeIndex === -1) {
    throw new Error(`Node with id ${nodeId} not found`)
  }

  const originalNode = current.nodes[nodeIndex]
  const duplicatedNode: TransformNode = {
    ...originalNode,
    id: nanoid(),
    config: { ...originalNode.config },
  }

  const newNodes = [...current.nodes]
  newNodes.splice(nodeIndex + 1, 0, duplicatedNode)

  return {
    ...current,
    nodes: newNodes,
  }
}

/**
 * Reorders nodes in the transform configuration
 *
 * @param transform - Current transform config (or null/undefined)
 * @param newNodes - New ordered array of nodes
 * @returns New transform config with reordered nodes
 */
export function reorderNodes(
  transform: TransformConfig | null | undefined,
  newNodes: TransformNode[],
): TransformConfig {
  const current = transform ?? DEFAULT_TRANSFORM_CONFIG

  return {
    ...current,
    nodes: newNodes,
  }
}
