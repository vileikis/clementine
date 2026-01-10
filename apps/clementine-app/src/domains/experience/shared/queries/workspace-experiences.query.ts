/**
 * Workspace Experiences Query Options
 *
 * TanStack Query configuration for fetching workspace experiences list.
 * Used by both route loaders (prefetchQuery/ensureQueryData) and hooks (useQuery).
 *
 * Pattern: Query options factory following TanStack Query best practices
 * @see https://tanstack.com/query/latest/docs/framework/react/guides/query-options
 */
import { queryOptions } from '@tanstack/react-query'
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore'
import { workspaceExperienceSchema } from '../schemas'
import type { WorkspaceExperience } from '../schemas'
import { firestore } from '@/integrations/firebase/client'
import { convertFirestoreDoc } from '@/shared/utils/firestore-utils'

/**
 * Query options for fetching workspace experiences list
 *
 * Features:
 * - Filters by status='active' (excludes deleted)
 * - Sorts by updatedAt DESC (most recently updated first)
 * - Type-safe query key and data
 * - Validates with Zod schema
 *
 * @param workspaceId - Workspace ID to fetch experiences for
 * @returns Query options object for TanStack Query
 *
 * @example
 * ```typescript
 * // In loader (prefetch for list page)
 * context.queryClient.prefetchQuery(
 *   workspaceExperiencesQuery(params.workspaceId)
 * )
 *
 * // In hook
 * return useQuery(workspaceExperiencesQuery(workspaceId))
 * ```
 */
export const workspaceExperiencesQuery = (workspaceId: string) =>
  queryOptions({
    queryKey: ['workspaceExperiences', workspaceId],
    queryFn: async (): Promise<WorkspaceExperience[]> => {
      const experiencesRef = collection(
        firestore,
        `workspaces/${workspaceId}/experiences`,
      )

      const q = query(
        experiencesRef,
        where('status', '==', 'active'),
        orderBy('updatedAt', 'desc'),
      )

      const snapshot = await getDocs(q)

      return snapshot.docs.map((doc) =>
        convertFirestoreDoc(doc, workspaceExperienceSchema),
      )
    },
  })
