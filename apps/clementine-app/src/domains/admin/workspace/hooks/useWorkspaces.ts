import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
} from 'firebase/firestore'
import { firestore } from '@/integrations/firebase/client'
import type { Workspace } from '@/domains/workspace/types/workspace.types'

/**
 * List active workspaces with real-time updates (admin only)
 *
 * This hook is admin-scoped - it lists ALL workspaces for admin management.
 * For workspace-scoped features, use domains/workspace/hooks instead.
 *
 * Features:
 * - Real-time updates via Firestore onSnapshot
 * - Filters by status='active' only
 * - Sorted by createdAt descending (newest first)
 *
 * @returns TanStack Query result with workspaces array
 */
export function useWorkspaces() {
  const queryClient = useQueryClient()

  return useQuery<Workspace[]>({
    queryKey: ['workspaces', 'active'],
    queryFn: async () => {
      const q = query(
        collection(firestore, 'workspaces'),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      )

      // Initial fetch
      const snapshot = await getDocs(q)
      const workspaces = snapshot.docs.map((doc) => doc.data() as Workspace)

      // Set up real-time listener
      onSnapshot(q, (snapshot) => {
        const updatedWorkspaces = snapshot.docs.map(
          (doc) => doc.data() as Workspace
        )
        queryClient.setQueryData(['workspaces', 'active'], updatedWorkspaces)
      })

      return workspaces
    },
    staleTime: Infinity, // Real-time via onSnapshot
    refetchOnWindowFocus: false,
  })
}
