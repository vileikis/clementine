/**
 * Workspace Experience Query Options
 *
 * TanStack Query configuration for fetching a single workspace experience.
 * Used by both route loaders (prefetchQuery/ensureQueryData) and hooks (useQuery).
 *
 * Pattern: Query options factory following TanStack Query best practices
 * @see https://tanstack.com/query/latest/docs/framework/react/guides/query-options
 */
import { queryOptions } from '@tanstack/react-query'
import { doc, getDoc } from 'firebase/firestore'
import { workspaceExperienceSchema } from '../schemas'
import type { WorkspaceExperience } from '../schemas'
import { firestore } from '@/integrations/firebase/client'
import { convertFirestoreDoc } from '@/shared/utils/firestore-utils'

/**
 * Query options for fetching a single workspace experience
 *
 * Features:
 * - Type-safe query key and data
 * - Reusable across loaders and hooks
 * - Returns null for non-existent experiences
 * - Validates with Zod schema
 *
 * @param workspaceId - Workspace ID containing the experience
 * @param experienceId - Experience ID to fetch
 * @returns Query options object for TanStack Query
 *
 * @example
 * ```typescript
 * // In loader (prefetch for detail page)
 * context.queryClient.prefetchQuery(
 *   workspaceExperienceQuery(params.workspaceId, params.experienceId)
 * )
 *
 * // In hook
 * return useQuery(workspaceExperienceQuery(workspaceId, experienceId))
 * ```
 */
export const workspaceExperienceQuery = (
  workspaceId: string,
  experienceId: string,
) =>
  queryOptions({
    queryKey: ['workspaceExperience', workspaceId, experienceId],
    queryFn: async (): Promise<WorkspaceExperience | null> => {
      const experienceRef = doc(
        firestore,
        `workspaces/${workspaceId}/experiences`,
        experienceId,
      )
      const experienceSnapshot = await getDoc(experienceRef)

      if (!experienceSnapshot.exists()) {
        return null
      }

      return convertFirestoreDoc(experienceSnapshot, workspaceExperienceSchema)
    },
  })
