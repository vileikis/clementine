/**
 * useDeleteNode Hook
 *
 * Hook for deleting an AI Image node from the transform pipeline.
 * Filters node from array, updates local state, and persists to Firestore.
 */
import { useUpdateTransformConfig } from './useUpdateTransformConfig'
import type { Experience } from '../../shared/schemas'

/**
 * Input for deleting a node
 */
export interface DeleteNodeInput {
  /** Current experience with transform config */
  experience: Experience
  /** Workspace ID containing the experience */
  workspaceId: string
  /** ID of node to delete */
  nodeId: string
}

/**
 * Hook for deleting AI Image nodes from the pipeline
 *
 * Features:
 * - Filters node from nodes array
 * - Preserves other nodes
 * - Calls useUpdateTransformConfig to persist
 *
 * @returns Mutation hook for deleting nodes
 *
 * @example
 * ```tsx
 * function DeleteNodeDialog({ experience, nodeId, open, onOpenChange }) {
 *   const deleteNode = useDeleteNode()
 *
 *   const handleDelete = async () => {
 *     await deleteNode.mutateAsync({ experience, nodeId })
 *     onOpenChange(false)
 *   }
 *
 *   return (
 *     <AlertDialog open={open} onOpenChange={onOpenChange}>
 *       <AlertDialogAction
 *         onClick={handleDelete}
 *         disabled={deleteNode.isPending}
 *       >
 *         {deleteNode.isPending ? 'Deleting...' : 'Delete'}
 *       </AlertDialogAction>
 *     </AlertDialog>
 *   )
 * }
 * ```
 */
export function useDeleteNode() {
  const updateTransformConfig = useUpdateTransformConfig()

  const mutateAsync = async (input: DeleteNodeInput) => {
    const { experience, workspaceId, nodeId } = input

    // Get existing transform or create default
    const currentTransform = experience.draft.transform ?? {
      nodes: [],
      outputFormat: null,
    }

    // Filter node from array
    const updatedTransform = {
      ...currentTransform,
      nodes: currentTransform.nodes.filter((n) => n.id !== nodeId),
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
