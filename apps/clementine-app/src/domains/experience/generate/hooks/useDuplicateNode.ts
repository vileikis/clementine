/**
 * useDuplicateNode Hook
 *
 * Hook for duplicating an AI Image node in the transform pipeline.
 * Creates a copy with a new ID and inserts it after the original.
 */
import { nanoid } from 'nanoid'

import { useUpdateTransformConfig } from './useUpdateTransformConfig'
import type { Experience } from '../../shared/schemas'

/**
 * Input for duplicating a node
 */
export interface DuplicateNodeInput {
  /** Current experience with transform config */
  experience: Experience
  /** Workspace ID containing the experience */
  workspaceId: string
  /** ID of node to duplicate */
  nodeId: string
}

/**
 * Hook for duplicating AI Image nodes in the pipeline
 *
 * Features:
 * - Creates copy of node with new ID
 * - Inserts after the original node
 * - Preserves all config values
 * - Calls useUpdateTransformConfig to persist
 *
 * @returns Mutation hook for duplicating nodes
 *
 * @example
 * ```tsx
 * function NodeContextMenu({ experience, nodeId }) {
 *   const duplicateNode = useDuplicateNode()
 *
 *   const handleDuplicate = async () => {
 *     await duplicateNode.mutateAsync({ experience, nodeId })
 *   }
 *
 *   return (
 *     <DropdownMenuItem onClick={handleDuplicate}>
 *       Duplicate
 *     </DropdownMenuItem>
 *   )
 * }
 * ```
 */
export function useDuplicateNode() {
  const updateTransformConfig = useUpdateTransformConfig()

  const mutateAsync = async (input: DuplicateNodeInput) => {
    const { experience, workspaceId, nodeId } = input

    // Get existing transform or create default
    const currentTransform = experience.draft.transform ?? {
      nodes: [],
      outputFormat: null,
    }

    // Find the node to duplicate
    const nodeIndex = currentTransform.nodes.findIndex((n) => n.id === nodeId)
    if (nodeIndex === -1) {
      throw new Error(`Node with id ${nodeId} not found`)
    }

    const originalNode = currentTransform.nodes[nodeIndex]

    // Create duplicate with new ID
    const duplicatedNode = {
      ...originalNode,
      id: nanoid(),
      config: { ...originalNode.config },
    }

    // Insert after the original
    const newNodes = [...currentTransform.nodes]
    newNodes.splice(nodeIndex + 1, 0, duplicatedNode)

    // Update transform config
    const updatedTransform = {
      ...currentTransform,
      nodes: newNodes,
    }

    // Persist to Firestore
    return updateTransformConfig.mutateAsync({
      workspaceId,
      experienceId: experience.id,
      transform: updatedTransform,
    })
  }

  return {
    ...updateTransformConfig,
    mutateAsync,
  }
}
