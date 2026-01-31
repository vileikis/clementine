/**
 * Transform Operations
 *
 * Pure functions for manipulating transform configuration.
 * These functions are side-effect free and easy to test.
 */
import { nanoid } from 'nanoid'

import { AI_IMAGE_NODE_TYPE } from '@clementine/shared'
import type {
  AIImageAspectRatio,
  AIImageModel,
  AIImageNode,
  MediaReference,
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

/**
 * Updates the prompt for an AI Image node
 *
 * @param transform - Current transform config
 * @param nodeId - ID of the node to update
 * @param prompt - New prompt text
 * @returns New transform config with updated prompt
 */
export function updateNodePrompt(
  transform: TransformConfig,
  nodeId: string,
  prompt: string,
): TransformConfig {
  return {
    ...transform,
    nodes: transform.nodes.map((node) =>
      node.id === nodeId && node.type === AI_IMAGE_NODE_TYPE
        ? { ...node, config: { ...node.config, prompt } }
        : node,
    ),
  }
}

/**
 * Updates the model for an AI Image node
 *
 * @param transform - Current transform config
 * @param nodeId - ID of the node to update
 * @param model - New model selection
 * @returns New transform config with updated model
 */
export function updateNodeModel(
  transform: TransformConfig,
  nodeId: string,
  model: AIImageModel,
): TransformConfig {
  return {
    ...transform,
    nodes: transform.nodes.map((node) =>
      node.id === nodeId && node.type === AI_IMAGE_NODE_TYPE
        ? { ...node, config: { ...node.config, model } }
        : node,
    ),
  }
}

/**
 * Updates the aspect ratio for an AI Image node
 *
 * @param transform - Current transform config
 * @param nodeId - ID of the node to update
 * @param aspectRatio - New aspect ratio selection
 * @returns New transform config with updated aspect ratio
 */
export function updateNodeAspectRatio(
  transform: TransformConfig,
  nodeId: string,
  aspectRatio: AIImageAspectRatio,
): TransformConfig {
  return {
    ...transform,
    nodes: transform.nodes.map((node) =>
      node.id === nodeId && node.type === AI_IMAGE_NODE_TYPE
        ? { ...node, config: { ...node.config, aspectRatio } }
        : node,
    ),
  }
}

/**
 * Maximum number of reference media items allowed per node
 */
export const MAX_REF_MEDIA_COUNT = 10

/**
 * Adds reference media to an AI Image node
 * Deduplicates by mediaAssetId and enforces max limit of 10
 *
 * @param transform - Current transform config
 * @param nodeId - ID of the node to update
 * @param newRefs - New media references to add
 * @returns New transform config with added references
 */
export function addNodeRefMedia(
  transform: TransformConfig,
  nodeId: string,
  newRefs: MediaReference[],
): TransformConfig {
  return {
    ...transform,
    nodes: transform.nodes.map((node) => {
      if (node.id !== nodeId || node.type !== AI_IMAGE_NODE_TYPE) {
        return node
      }

      const existingIds = new Set(
        node.config.refMedia.map((r) => r.mediaAssetId),
      )
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
    }),
  }
}

/**
 * Removes a reference media item from an AI Image node
 *
 * @param transform - Current transform config
 * @param nodeId - ID of the node to update
 * @param mediaAssetId - ID of the media asset to remove
 * @returns New transform config with removed reference
 */
export function removeNodeRefMedia(
  transform: TransformConfig,
  nodeId: string,
  mediaAssetId: string,
): TransformConfig {
  return {
    ...transform,
    nodes: transform.nodes.map((node) =>
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
    ),
  }
}
