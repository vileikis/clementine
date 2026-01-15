/**
 * useGhostProject Hook
 *
 * Gets or creates the ghost project for a workspace.
 * Ghost projects are used for preview sessions to store session data
 * in a real Firestore path while keeping them separate from production.
 *
 * Features:
 * - Lazy creation (only creates on first use)
 * - Deterministic ID based on workspace
 * - Idempotent (safe to call multiple times)
 * - Caches result in TanStack Query
 */
import { useQuery } from '@tanstack/react-query'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import * as Sentry from '@sentry/tanstackstart-react'
import { getGhostProjectId } from '../lib/ghost-project.utils'
import type { WithFieldValue } from 'firebase/firestore'
import type { Project } from '@clementine/shared'
import { firestore } from '@/integrations/firebase/client'

/**
 * Hook for getting or creating a ghost project for preview sessions
 *
 * @param workspaceId - Workspace to get/create ghost project for
 * @returns Query result with ghost project ID
 *
 * @example
 * ```tsx
 * const { data: ghostProjectId, isLoading } = useGhostProject(workspaceId)
 *
 * // Use ghostProjectId for preview session creation
 * createSession.mutateAsync({
 *   projectId: ghostProjectId,
 *   eventId: null,
 *   // ...
 * })
 * ```
 */
export function useGhostProject(workspaceId: string) {
  return useQuery({
    queryKey: ['ghost-project', workspaceId],
    queryFn: async () => {
      const ghostProjectId = getGhostProjectId(workspaceId)
      const projectRef = doc(firestore, 'projects', ghostProjectId)

      // Check if ghost project exists
      const existing = await getDoc(projectRef)
      if (existing.exists()) {
        return ghostProjectId
      }

      // Create ghost project with required fields
      const ghostProject: WithFieldValue<Project> = {
        id: ghostProjectId,
        name: 'Ghost Project', // System name, never displayed
        workspaceId,
        status: 'live' as const, // Always live so sessions can be created
        type: 'ghost' as const,
        activeEventId: null,
        deletedAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      await setDoc(projectRef, ghostProject)
      return ghostProjectId
    },
    staleTime: Infinity, // Ghost project never changes
    retry: 2, // Retry on transient failures
    meta: {
      errorHandler: (error: Error) => {
        Sentry.captureException(error, {
          tags: {
            domain: 'project',
            action: 'get-or-create-ghost-project',
          },
          extra: { workspaceId },
        })
      },
    },
  })
}
