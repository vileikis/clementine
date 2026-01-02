// useProject hook
// Real-time subscription to project data

import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import type { Project } from '../types/project.types'
import { firestore } from '@/integrations/firebase/client'

/**
 * Fetch project with real-time updates
 *
 * Features:
 * - Real-time updates via Firestore onSnapshot
 * - TanStack Query cache integration
 * - Automatic subscription cleanup
 * - Reusable across the application
 *
 * @param projectId - Project ID to fetch
 * @returns TanStack Query result with real-time project data
 *
 * @example
 * ```tsx
 * const { data: project, isLoading, error } = useProject(projectId)
 * const activeEventId = project?.activeEventId
 * ```
 */
export function useProject(projectId: string) {
  const queryClient = useQueryClient()

  // Set up real-time listener for project
  useEffect(() => {
    const projectRef = doc(firestore, 'projects', projectId)

    const unsubscribe = onSnapshot(projectRef, (snapshot) => {
      if (!snapshot.exists()) {
        queryClient.setQueryData<Project | null>(['project', projectId], null)
        return
      }

      const projectData = snapshot.data()
      const project: Project = {
        id: snapshot.id,
        activeEventId: projectData?.activeEventId ?? null,
        // Add more fields as they're needed
      }

      queryClient.setQueryData<Project>(['project', projectId], project)
    })

    return () => {
      unsubscribe()
    }
  }, [projectId, queryClient])

  return useQuery<Project | null>({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const projectRef = doc(firestore, 'projects', projectId)
      const projectSnapshot = await getDoc(projectRef)

      if (!projectSnapshot.exists()) {
        return null
      }

      const projectData = projectSnapshot.data()
      return {
        id: projectSnapshot.id,
        activeEventId: projectData?.activeEventId ?? null,
        // Add more fields as they're needed
      }
    },
    staleTime: Infinity, // Never stale (real-time via onSnapshot)
    refetchOnWindowFocus: false, // Disable refetch (real-time handles it)
  })
}
