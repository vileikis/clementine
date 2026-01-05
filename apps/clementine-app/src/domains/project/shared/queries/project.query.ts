/**
 * Project Query Options
 *
 * TanStack Query configuration for fetching projects.
 * Used by both route loaders (prefetchQuery/ensureQueryData) and hooks (useQuery).
 *
 * Pattern: Query options factory following TanStack Query best practices
 * @see https://tanstack.com/query/latest/docs/framework/react/guides/query-options
 */
import { queryOptions } from '@tanstack/react-query'
import { doc, getDoc } from 'firebase/firestore'
import { projectSchema } from '@clementine/shared'
import type { Project } from '@clementine/shared'
import { firestore } from '@/integrations/firebase/client'
import { convertFirestoreDoc } from '@/shared/utils/firestore-utils'

/**
 * Query options for fetching a project
 *
 * Features:
 * - Type-safe query key and data
 * - Reusable across loaders and hooks
 * - Returns null for non-existent projects
 * - Validates with Zod schema
 *
 * @param projectId - Project ID
 * @returns Query options object for TanStack Query
 *
 * @example
 * ```typescript
 * // In loader (prefetch for breadcrumb)
 * context.queryClient.prefetchQuery(projectQuery(params.projectId))
 *
 * // In hook
 * return useQuery(projectQuery(projectId))
 * ```
 */
export const projectQuery = (projectId: string) =>
  queryOptions({
    queryKey: ['project', projectId],
    queryFn: async (): Promise<Project | null> => {
      const projectRef = doc(firestore, 'projects', projectId)
      const projectSnapshot = await getDoc(projectRef)

      if (!projectSnapshot.exists()) {
        return null
      }

      return convertFirestoreDoc(projectSnapshot, projectSchema)
    },
  })
