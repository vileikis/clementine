/**
 * useAddNode Hook
 *
 * Hook for adding a new AI Image node to the transform pipeline.
 * Creates node with nanoid, default config, updates local state, and persists to Firestore.
 */
import { nanoid } from 'nanoid'

import { useUpdateTransformConfig } from './useUpdateTransformConfig'
import type { AIImageNodeConfig, TransformNode } from '@clementine/shared'
import type { Experience } from '../../shared/schemas'

/**
 * Input for adding a new node
 */
export interface AddNodeInput {
  /** Current experience with transform config */
  experience: Experience
  /** Workspace ID containing the experience */
  workspaceId: string
}

/**
 * Hook for adding new AI Image nodes to the pipeline
 *
 * Features:
 * - Generates unique node ID with nanoid
 * - Creates default AI Image node config
 * - Appends to nodes array
 * - Calls useUpdateTransformConfig to persist
 *
 * @returns Mutation hook for adding nodes
 *
 * @example
 * ```tsx
 * function TransformPipelineEditor({ experience }) {
 *   const addNode = useAddNode()
 *
 *   const handleAddNode = async () => {
 *     await addNode.mutateAsync({ experience })
 *   }
 *
 *   return (
 *     <AddNodeButton
 *       onClick={handleAddNode}
 *       isPending={addNode.isPending}
 *     />
 *   )
 * }
 * ```
 */
export function useAddNode() {
  const updateTransformConfig = useUpdateTransformConfig()

  const mutateAsync = async (input: AddNodeInput) => {
    const { experience, workspaceId } = input

    // Create new AI Image node with default config
    const newNode: TransformNode = {
      id: nanoid(),
      type: 'ai.imageGeneration',
      config: {
        model: 'gemini-2.5-flash-image',
        aspectRatio: '3:2',
        prompt: '',
        refMedia: [],
      } satisfies AIImageNodeConfig,
    }

    // Get existing transform or create default
    const currentTransform = experience.draft.transform ?? {
      nodes: [],
      outputFormat: null,
    }

    // Append to nodes array
    const updatedTransform = {
      ...currentTransform,
      nodes: [...currentTransform.nodes, newNode],
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
