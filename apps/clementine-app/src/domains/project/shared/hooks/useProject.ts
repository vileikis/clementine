// useProject hook
// Real-time subscription to project data

import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { doc, onSnapshot } from 'firebase/firestore'
import { projectSchema } from '@clementine/shared'
import { projectQuery } from '../queries/project.query'
import type { Project } from '@clementine/shared'
import { firestore } from '@/integrations/firebase/client'
import { convertFirestoreDoc } from '@/shared/utils/firestore-utils'

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
 * const theme = project?.draftConfig?.theme
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

      // Convert Firestore document (Timestamps → numbers) and validate with schema
      const project = convertFirestoreDoc(snapshot, projectSchema)

      queryClient.setQueryData<Project>(['project', projectId], project)
    })

    return () => {
      unsubscribe()
    }
  }, [projectId, queryClient])

  return useQuery({
    ...projectQuery(projectId),
    staleTime: Infinity, // Never stale (real-time via onSnapshot)
    refetchOnWindowFocus: false, // Disable refetch (real-time handles it)
  })
}
