import { useMutation, useQueryClient } from '@tanstack/react-query'
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import type { UpdateData } from 'firebase/firestore'
import type { Workspace } from '@/domains/workspace'
import { firestore } from '@/integrations/firebase/client'

/**
 * Delete workspace mutation (dedicated hook with full business logic)
 *
 * Admin-only operation. Follows "mutations via dedicated hooks" pattern.
 * Performs soft delete by updating status and deletedAt fields.
 * Security enforced via Firestore rules (admin-only writes with data validation).
 * Timestamps use serverTimestamp() for accuracy (server-side time, not client clock).
 */
export function useDeleteWorkspace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (workspaceId: string) => {
      const workspaceRef = doc(firestore, 'workspaces', workspaceId)

      // Soft delete - Firestore rules validate admin access and structure
      const updateData: UpdateData<Workspace> = {
        status: 'deleted',
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      await updateDoc(workspaceRef, updateData)

      return workspaceId
    },
    onSuccess: () => {
      // Real-time updates via onSnapshot, but invalidate for consistency
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    },
    onError: (error) => {
      console.error('Failed to delete workspace:', error)
      // Error available in mutation.error for UI
    },
  })
}
