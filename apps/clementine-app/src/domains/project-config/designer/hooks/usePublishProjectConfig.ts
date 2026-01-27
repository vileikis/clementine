/**
 * Mutation Hook: usePublishProjectConfig
 *
 * Publishes draft configuration by copying draftConfig → publishedConfig.
 * Syncs versions and updates timestamp.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import * as Sentry from '@sentry/tanstackstart-react'
import type { UpdateData } from 'firebase/firestore'
import type { Project } from '@clementine/shared'
import { firestore } from '@/integrations/firebase/client'

/**
 * Hook for publishing project config changes
 *
 * Copies draft configuration to published configuration, making changes
 * visible to guests. Syncs version numbers and updates timestamp.
 *
 * @param projectId - Project ID to publish
 * @returns TanStack Query mutation
 *
 * @example
 * ```tsx
 * const publishConfig = usePublishProjectConfig(projectId)
 *
 * // Publish changes
 * await publishConfig.mutateAsync()
 *
 * // Show loading state
 * {publishConfig.isPending && <Spinner />}
 * ```
 */
export function usePublishProjectConfig(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      return await runTransaction(firestore, async (transaction) => {
        const projectRef = doc(firestore, 'projects', projectId)
        const projectDoc = await transaction.get(projectRef)

        if (!projectDoc.exists()) {
          throw new Error(`Project ${projectId} not found`)
        }

        const currentProject = projectDoc.data() as Project

        // Validate draftConfig exists
        if (!currentProject.draftConfig) {
          throw new Error('Cannot publish: no draft configuration exists')
        }

        // Copy draft → published
        transaction.update(projectRef, {
          publishedConfig: currentProject.draftConfig,
          publishedVersion: currentProject.draftVersion,
          publishedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        } as UpdateData<Project>)

        return {
          projectId,
          publishedVersion: currentProject.draftVersion,
        }
      })
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project', projectId],
      })
    },

    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          domain: 'project-config/designer',
          action: 'publish-project-config',
        },
        extra: {
          errorType: 'project-publish-failure',
          projectId,
        },
      })
    },
  })
}
