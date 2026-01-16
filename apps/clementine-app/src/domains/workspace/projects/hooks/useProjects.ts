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
import { projectSchema } from '@clementine/shared'
import type { Project } from '@clementine/shared'
import { firestore } from '@/integrations/firebase/client'
import { convertFirestoreDoc } from '@/shared/utils/firestore-utils'

/**
 * List active projects in workspace with real-time updates (admin only)
 *
 * Features:
 * - Real-time updates via Firestore onSnapshot
 * - Filters by workspaceId and excludes soft-deleted projects
 * - Sorted by createdAt descending (newest first)
 * - Proper Firestore type conversion (Timestamps → numbers)
 *
 * @param workspaceId - Workspace to list projects from
 * @returns TanStack Query result with projects array
 */
export function useProjects(workspaceId: string) {
  const queryClient = useQueryClient()

  // Set up real-time listener
  useEffect(() => {
    const q = query(
      collection(firestore, 'projects'),
      where('workspaceId', '==', workspaceId),
      where('type', '==', 'standard'), // Exclude ghost projects
      where('status', '!=', 'deleted'),
      orderBy('status'), // Required for != query
      orderBy('createdAt', 'desc'),
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projects = snapshot.docs.map((doc) =>
        convertFirestoreDoc(doc, projectSchema),
      )
      queryClient.setQueryData(['projects', workspaceId], projects)
    })

    return () => unsubscribe()
  }, [workspaceId, queryClient])

  return useQuery<Project[]>({
    queryKey: ['projects', workspaceId],
    queryFn: async () => {
      const q = query(
        collection(firestore, 'projects'),
        where('workspaceId', '==', workspaceId),
        where('type', '==', 'standard'), // Exclude ghost projects
        where('status', '!=', 'deleted'),
        orderBy('status'),
        orderBy('createdAt', 'desc'),
      )

      // Initial fetch only
      const snapshot = await getDocs(q)
      return snapshot.docs.map((doc) => convertFirestoreDoc(doc, projectSchema))
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })
}
