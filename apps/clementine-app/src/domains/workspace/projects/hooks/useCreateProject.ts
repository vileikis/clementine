import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'
import { useNavigate } from '@tanstack/react-router'
import * as Sentry from '@sentry/tanstackstart-react'
import type { WithFieldValue } from 'firebase/firestore'
import type { CreateProjectInput, Project } from '../types'
import { firestore } from '@/integrations/firebase/client'

/**
 * Create project mutation (admin-only operation)
 *
 * Creates a new project with default values and redirects to project details page.
 * Follows "mutations via dedicated hooks" pattern.
 * Security enforced via Firestore rules.
 */
export function useCreateProject() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

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
          activeEventId: null,
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
    onSuccess: ({ projectId, workspaceId, workspaceSlug }) => {
      // Invalidate projects list
      queryClient.invalidateQueries({
        queryKey: ['projects', workspaceId],
      })

      // Navigate to project details page
      navigate({
        to: '/workspace/$workspaceSlug/projects/$projectId',
        params: { workspaceSlug, projectId },
      })
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
