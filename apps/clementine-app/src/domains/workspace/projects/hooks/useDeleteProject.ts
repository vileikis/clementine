import { useMutation, useQueryClient } from '@tanstack/react-query'
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import * as Sentry from '@sentry/tanstackstart-react'
import type { UpdateData } from 'firebase/firestore'
import type { Project } from '../types'
import { firestore } from '@/integrations/firebase/client'

/**
 * Delete project mutation (admin-only operation)
 *
 * Performs soft delete by updating status and deletedAt fields.
 * Security enforced via Firestore rules.
 */
export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (projectId: string) => {
      const projectRef = doc(firestore, 'projects', projectId)

      const updateData: UpdateData<Project> = {
        status: 'deleted',
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      await updateDoc(projectRef, updateData)
      return projectId
    },
    onSuccess: () => {
      // Real-time updates via onSnapshot, but invalidate for consistency
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          domain: 'workspace/projects',
          action: 'delete-project',
        },
        extra: {
          errorType: 'project-deletion-failure',
        },
      })
    },
  })
}
