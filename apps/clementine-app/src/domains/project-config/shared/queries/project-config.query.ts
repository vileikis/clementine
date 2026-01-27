/**
 * Project Config Query Options
 *
 * TanStack Query configuration for fetching project configuration.
 * Config now lives directly on the project document (not in a subcollection).
 *
 * Note: This is an alias to projectQuery from the project domain.
 * The config fields (draftConfig, publishedConfig) are part of the Project schema.
 *
 * Pattern: Query options factory following TanStack Query best practices
 * @see https://tanstack.com/query/latest/docs/framework/react/guides/query-options
 */
import { projectQuery } from '@/domains/project/shared/queries/project.query'

/**
 * Query options for fetching project with config
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
 * // In loader
 * const project = await context.queryClient.ensureQueryData(
 *   projectConfigQuery(params.projectId)
 * )
 *
 * // In hook
 * return useQuery(projectConfigQuery(projectId))
 * ```
 */
export const projectConfigQuery = (projectId: string | undefined) => {
  // Guard against undefined - return a disabled query
  if (!projectId) {
    return {
      queryKey: ['project', ''],
      queryFn: () => Promise.resolve(null),
      enabled: false,
    }
  }
  return projectQuery(projectId)
}
