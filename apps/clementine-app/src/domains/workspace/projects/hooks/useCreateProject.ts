import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'
import * as Sentry from '@sentry/tanstackstart-react'
import type { WithFieldValue } from 'firebase/firestore'
import type { CreateProjectInput, Project } from '../types'
import { firestore } from '@/integrations/firebase/client'

/**
 * Create project mutation (admin-only operation)
 *
 * Creates a new project with default values.
 * Follows single responsibility principle: handles mutation only, no navigation.
 * Consumer handles navigation using the returned project data.
 * Security enforced via Firestore rules.
 */
export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      const projectsRef = collection(firestore, 'projects')

      // Create project in transaction to ensure server timestamps are applied
      return await runTransaction(firestore, (transaction) => {
        const newProjectRef = doc(projectsRef)

        const newProject: WithFieldValue<Project> = {
          id: newProjectRef.id,
          name: input.name || 'Untitled project',
          workspaceId: input.workspaceId,
          status: 'draft' as const,
          type: 'standard' as const,
          draftConfig: null,
          publishedConfig: null,
          draftVersion: 1,
          publishedVersion: null,
          publishedAt: null,
          deletedAt: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }

        transaction.set(newProjectRef, newProject)

        return Promise.resolve({
          projectId: newProjectRef.id,
          workspaceId: input.workspaceId,
          workspaceSlug: input.workspaceSlug,
        })
      })
    },
    onSuccess: ({ workspaceId }) => {
      // Invalidate projects list
      queryClient.invalidateQueries({
        queryKey: ['projects', workspaceId],
      })
      // No navigation - consumer handles this using return value
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          domain: 'workspace/projects',
          action: 'create-project',
        },
        extra: {
          errorType: 'project-creation-failure',
        },
      })
    },
  })
}
