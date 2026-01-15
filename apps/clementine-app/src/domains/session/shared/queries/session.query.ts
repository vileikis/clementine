/**
 * Session Query Keys
 *
 * TanStack Query key factory for session data fetching.
 * Used for consistent query key management and cache invalidation.
 *
 * Pattern: Query key factory following TanStack Query best practices
 * @see https://tanstack.com/query/latest/docs/framework/react/guides/query-options
 */

/**
 * Query key factory for sessions
 *
 * Provides consistent, hierarchical query keys for cache management.
 */
export const sessionKeys = {
  /** Base key for all session queries */
  all: ['sessions'] as const,

  /** Key for session lists */
  lists: () => [...sessionKeys.all, 'list'] as const,

  /** Key for sessions in a specific project */
  list: (projectId: string) => [...sessionKeys.lists(), projectId] as const,

  /** Key for session details */
  details: () => [...sessionKeys.all, 'detail'] as const,

  /** Key for specific session detail */
  detail: (projectId: string, sessionId: string) =>
    [...sessionKeys.details(), projectId, sessionId] as const,
}
