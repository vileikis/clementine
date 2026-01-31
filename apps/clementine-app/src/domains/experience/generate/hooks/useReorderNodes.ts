/**
 * useReorderNodes Hook
 *
 * Hook for reordering nodes in the transform pipeline.
 * Used with @dnd-kit for drag and drop functionality.
 */
import { useUpdateTransformConfig } from './useUpdateTransformConfig'
import type { TransformNode } from '@clementine/shared'
import type { Experience } from '../../shared/schemas'

/**
 * Input for reordering nodes
 */
export interface ReorderNodesInput {
  /** Current experience with transform config */
  experience: Experience
  /** Workspace ID containing the experience */
  workspaceId: string
  /** New ordered array of nodes */
  nodes: TransformNode[]
}

/**
 * Hook for reordering nodes in the pipeline
 *
 * Features:
 * - Updates node order
 * - Preserves all node configs
 * - Calls useUpdateTransformConfig to persist
 *
 * @returns Mutation hook for reordering nodes
 *
 * @example
 * ```tsx
 * function TransformPipelineEditor({ experience }) {
 *   const reorderNodes = useReorderNodes()
 *
 *   const handleDragEnd = (event) => {
 *     // Compute new order from drag event
 *     const newNodes = computeNewOrder(event)
 *     reorderNodes.mutate({ experience, nodes: newNodes })
 *   }
 *
 *   return <DndContext onDragEnd={handleDragEnd}>...</DndContext>
 * }
 * ```
 */
export function useReorderNodes() {
  const updateTransformConfig = useUpdateTransformConfig()

  const mutateAsync = async (input: ReorderNodesInput) => {
    const { experience, workspaceId, nodes } = input

    // Get existing transform or create default
    const currentTransform = experience.draft.transform ?? {
      nodes: [],
      outputFormat: null,
    }

    // Update transform config with new node order
    const updatedTransform = {
      ...currentTransform,
      nodes,
    }

    // Persist to Firestore
    return updateTransformConfig.mutateAsync({
      workspaceId,
      experienceId: experience.id,
      transform: updatedTransform,
    })
  }

  const mutate = (input: ReorderNodesInput) => {
    mutateAsync(input).catch(console.error)
  }

  return {
    ...updateTransformConfig,
    mutateAsync,
    mutate,
  }
}
