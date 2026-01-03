import { doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as Sentry from '@sentry/tanstackstart-react'
import { updateProjectInputSchema } from '../schemas/project.schemas'
import type { RenameProjectInput } from '../types/project.types'
import { firestore } from '@/integrations/firebase/client'

/**
 * Hook for renaming a project
 * Follows single responsibility principle: handles mutation only, no navigation
 *
 * @param workspaceId - Workspace ID for query invalidation context
 * @returns TanStack Query mutation result
 *
 * @example
 * ```tsx
 * const renameProject = useRenameProject(workspaceId)
 *
 * await renameProject.mutateAsync({
 *   projectId: 'abc123',
 *   name: 'New Project Name'
 * })
 * ```
 */
export function useRenameProject(workspaceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: RenameProjectInput) => {
      // Validate input with Zod schema
      const validated = updateProjectInputSchema.parse({
        name: input.name,
      })

      // Use transaction to ensure serverTimestamp resolves before listener fires
      return await runTransaction(firestore, async (transaction) => {
        const projectRef = doc(firestore, 'projects', input.projectId)

        // Verify project exists before updating
        const projectDoc = await transaction.get(projectRef)
        if (!projectDoc.exists()) {
          throw new Error('Project not found')
        }

        // Update name and timestamp
        transaction.update(projectRef, {
          name: validated.name,
          updatedAt: serverTimestamp(),
        })

        // Return data for consumer
        return {
          projectId: input.projectId,
          name: validated.name,
        }
      })
    },

    onSuccess: () => {
      // Invalidate projects query to trigger refetch
      queryClient.invalidateQueries({
        queryKey: ['projects', workspaceId],
      })
    },

    onError: (error) => {
      // Report to Sentry for debugging (no UI handling)
      Sentry.captureException(error, {
        tags: {
          domain: 'workspace/projects',
          action: 'rename-project',
        },
        extra: {
          errorType: 'project-rename-failure',
        },
      })
    },
  })
}
