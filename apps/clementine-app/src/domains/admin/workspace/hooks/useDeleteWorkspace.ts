import { useMutation, useQueryClient } from '@tanstack/react-query'
import { doc, updateDoc } from 'firebase/firestore'
import { firestore } from '@/integrations/firebase/client'

/**
 * Delete workspace mutation (dedicated hook with full business logic)
 *
 * Admin-only operation. Follows "mutations via dedicated hooks" pattern.
 * Performs soft delete by updating status and deletedAt fields.
 * Security enforced via Firestore rules (admin-only writes with data validation).
 */
export function useDeleteWorkspace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (workspaceId: string) => {
      const workspaceRef = doc(firestore, 'workspaces', workspaceId)

      // Soft delete - Firestore rules validate admin access and structure
      const now = Date.now()
      await updateDoc(workspaceRef, {
        status: 'deleted',
        deletedAt: now,
        updatedAt: now,
      })

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
