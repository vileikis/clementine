/**
 * Transform Operations
 *
 * Pure functions for manipulating transform nodes.
 * These functions are side-effect free and easy to test.
 */
import { nanoid } from 'nanoid'

import { AI_IMAGE_NODE_TYPE } from '@clementine/shared'
import type {
  AIImageAspectRatio,
  AIImageModel,
  AIImageNode,
  MediaReference,
  TransformNode,
} from '@clementine/shared'

/**
 * Default transform nodes (empty array)
 */
export const DEFAULT_TRANSFORM_NODES: TransformNode[] = []

/**
 * Creates a new AI Image node with default configuration
 */
export function createDefaultAIImageNode(): AIImageNode {
  return {
    id: nanoid(),
    type: AI_IMAGE_NODE_TYPE,
    config: {
      model: 'gemini-2.5-flash-image',
      aspectRatio: '3:2',
      prompt: '',
      refMedia: [],
    },
  }
}

/**
 * Adds a new node to the transform nodes array
 *
 * @param nodes - Current transform nodes (or undefined)
 * @returns New transform nodes array with the added node
 */
export function addNode(nodes: TransformNode[] | undefined): TransformNode[] {
  const current = nodes ?? DEFAULT_TRANSFORM_NODES
  const newNode = createDefaultAIImageNode()

  return [...current, newNode]
}

/**
 * Removes a node from the transform nodes array
 *
 * @param nodes - Current transform nodes (or undefined)
 * @param nodeId - ID of the node to remove
 * @returns New transform nodes array without the specified node
 */
export function removeNode(
  nodes: TransformNode[] | undefined,
  nodeId: string,
): TransformNode[] {
  const current = nodes ?? DEFAULT_TRANSFORM_NODES

  return current.filter((n) => n.id !== nodeId)
}

/**
 * Duplicates a node in the transform nodes array
 * The duplicate is inserted immediately after the original
 *
 * @param nodes - Current transform nodes (or undefined)
 * @param nodeId - ID of the node to duplicate
 * @returns New transform nodes array with the duplicated node
 * @throws Error if the node is not found
 */
export function duplicateNode(
  nodes: TransformNode[] | undefined,
  nodeId: string,
): TransformNode[] {
  const current = nodes ?? DEFAULT_TRANSFORM_NODES
  const nodeIndex = current.findIndex((n) => n.id === nodeId)

  if (nodeIndex === -1) {
    throw new Error(`Node with id ${nodeId} not found`)
  }

  const originalNode = current[nodeIndex]
  const duplicatedNode: TransformNode = {
    ...originalNode,
    id: nanoid(),
    config: { ...originalNode.config },
  }

  const newNodes = [...current]
  newNodes.splice(nodeIndex + 1, 0, duplicatedNode)

  return newNodes
}

/**
 * Reorders nodes in the transform nodes array
 *
 * @param _nodes - Current transform nodes (unused, for API consistency)
 * @param newNodes - New ordered array of nodes
 * @returns New transform nodes array with reordered nodes
 */
export function reorderNodes(
  _nodes: TransformNode[] | undefined,
  newNodes: TransformNode[],
): TransformNode[] {
  return newNodes
}

/**
 * Updates the prompt for an AI Image node
 *
 * @param nodes - Current transform nodes
 * @param nodeId - ID of the node to update
 * @param prompt - New prompt text
 * @returns New transform nodes array with updated prompt
 */
export function updateNodePrompt(
  nodes: TransformNode[],
  nodeId: string,
  prompt: string,
): TransformNode[] {
  return nodes.map((node) =>
    node.id === nodeId && node.type === AI_IMAGE_NODE_TYPE
      ? { ...node, config: { ...node.config, prompt } }
      : node,
  )
}

/**
 * Updates the model for an AI Image node
 *
 * @param nodes - Current transform nodes
 * @param nodeId - ID of the node to update
 * @param model - New model selection
 * @returns New transform nodes array with updated model
 */
export function updateNodeModel(
  nodes: TransformNode[],
  nodeId: string,
  model: AIImageModel,
): TransformNode[] {
  return nodes.map((node) =>
    node.id === nodeId && node.type === AI_IMAGE_NODE_TYPE
      ? { ...node, config: { ...node.config, model } }
      : node,
  )
}

/**
 * Updates the aspect ratio for an AI Image node
 *
 * @param nodes - Current transform nodes
 * @param nodeId - ID of the node to update
 * @param aspectRatio - New aspect ratio selection
 * @returns New transform nodes array with updated aspect ratio
 */
export function updateNodeAspectRatio(
  nodes: TransformNode[],
  nodeId: string,
  aspectRatio: AIImageAspectRatio,
): TransformNode[] {
  return nodes.map((node) =>
    node.id === nodeId && node.type === AI_IMAGE_NODE_TYPE
      ? { ...node, config: { ...node.config, aspectRatio } }
      : node,
  )
}

/**
 * Maximum number of reference media items allowed per node
 */
export const MAX_REF_MEDIA_COUNT = 10

/**
 * Adds reference media to an AI Image node
 * Deduplicates by mediaAssetId and enforces max limit of 10
 *
 * @param nodes - Current transform nodes
 * @param nodeId - ID of the node to update
 * @param newRefs - New media references to add
 * @returns New transform nodes array with added references
 */
export function addNodeRefMedia(
  nodes: TransformNode[],
  nodeId: string,
  newRefs: MediaReference[],
): TransformNode[] {
  return nodes.map((node) => {
    if (node.id !== nodeId || node.type !== AI_IMAGE_NODE_TYPE) {
      return node
    }

    const existingIds = new Set(node.config.refMedia.map((r) => r.mediaAssetId))
    const uniqueNewRefs = newRefs.filter(
      (r) => !existingIds.has(r.mediaAssetId),
    )
    const combined = [...node.config.refMedia, ...uniqueNewRefs]

    return {
      ...node,
      config: {
        ...node.config,
        refMedia: combined.slice(0, MAX_REF_MEDIA_COUNT),
      },
    }
  })
}

/**
 * Removes a reference media item from an AI Image node
 *
 * @param nodes - Current transform nodes
 * @param nodeId - ID of the node to update
 * @param mediaAssetId - ID of the media asset to remove
 * @returns New transform nodes array with removed reference
 */
export function removeNodeRefMedia(
  nodes: TransformNode[],
  nodeId: string,
  mediaAssetId: string,
): TransformNode[] {
  return nodes.map((node) =>
    node.id === nodeId && node.type === AI_IMAGE_NODE_TYPE
      ? {
          ...node,
          config: {
            ...node.config,
            refMedia: node.config.refMedia.filter(
              (r) => r.mediaAssetId !== mediaAssetId,
            ),
          },
        }
      : node,
  )
}
