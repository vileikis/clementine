import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore'
import type { Workspace } from '@/domains/workspace/types/workspace.types'
import { firestore } from '@/integrations/firebase/client'

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

  // Set up real-time listener separately from queryFn
  useEffect(() => {
    const q = query(
      collection(firestore, 'workspaces'),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const workspaces = snapshot.docs.map((doc) => doc.data() as Workspace)
      queryClient.setQueryData(['workspaces', 'active'], workspaces)
    })

    return () => unsubscribe()
  }, [queryClient])

  return useQuery<Workspace[]>({
    queryKey: ['workspaces', 'active'],
    queryFn: async () => {
      const q = query(
        collection(firestore, 'workspaces'),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc'),
      )

      // Initial fetch only
      const snapshot = await getDocs(q)
      return snapshot.docs.map((doc) => doc.data() as Workspace)
    },
    staleTime: Infinity, // Real-time via onSnapshot
    refetchOnWindowFocus: false,
  })
}
