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
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore'
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

      // Use transaction to atomically check and create ghost project
      // This prevents race conditions when concurrent callers both see no document
      await runTransaction(firestore, async (transaction) => {
        const existing = await transaction.get(projectRef)

        if (existing.exists()) {
          // Project already exists, nothing to do
          return
        }

        // Create ghost project with required fields
        // Note: Ghost projects don't need config fields - they're just containers for preview sessions
        const ghostProject: WithFieldValue<Project> = {
          id: ghostProjectId,
          name: 'Ghost Project', // System name, never displayed
          workspaceId,
          status: 'live' as const, // Always live so sessions can be created
          type: 'ghost' as const,
          draftConfig: null,
          publishedConfig: null,
          exports: null,
          draftVersion: 1,
          publishedVersion: null,
          publishedAt: null,
          deletedAt: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }

        transaction.set(projectRef, ghostProject)
      })

      return ghostProjectId
    },
    staleTime: Infinity, // Ghost project never changes
    retry: 2, // Retry on transient failures
    // Error handling: relies on global QueryCache.onError configured in root-provider.tsx
  })
}
