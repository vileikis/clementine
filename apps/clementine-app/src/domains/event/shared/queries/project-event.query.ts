/**
 * Project Event Query Options
 *
 * TanStack Query configuration for fetching project events.
 * Used by both route loaders (ensureQueryData) and hooks (useQuery).
 *
 * Pattern: Query options factory following TanStack Query best practices
 * @see https://tanstack.com/query/latest/docs/framework/react/guides/query-options
 */
import { queryOptions } from '@tanstack/react-query'
import { doc, getDoc } from 'firebase/firestore'
import { projectEventFullSchema } from '../schemas/project-event-full.schema'
import type { ProjectEventFull } from '../schemas/project-event-full.schema'
import { firestore } from '@/integrations/firebase/client'
import { convertFirestoreDoc } from '@/shared/utils/firestore-utils'

/**
 * Query options for fetching a project event
 *
 * Features:
 * - Type-safe query key and data
 * - Reusable across loaders and hooks
 * - Returns null for non-existent events (loader handles 404)
 * - Validates with Zod schema
 *
 * @param projectId - Parent project ID
 * @param eventId - Event ID
 * @returns Query options object for TanStack Query
 *
 * @example
 * ```typescript
 * // In loader
 * const event = await context.queryClient.ensureQueryData(
 *   projectEventQuery(params.projectId, params.eventId)
 * )
 *
 * // In hook
 * return useQuery(projectEventQuery(projectId, eventId))
 * ```
 */
export const projectEventQuery = (projectId: string, eventId: string) =>
  queryOptions({
    queryKey: ['project-event', projectId, eventId],
    queryFn: async (): Promise<ProjectEventFull | null> => {
      const eventRef = doc(firestore, `projects/${projectId}/events/${eventId}`)
      const eventSnapshot = await getDoc(eventRef)

      if (!eventSnapshot.exists()) {
        return null
      }

      return convertFirestoreDoc(eventSnapshot, projectEventFullSchema)
    },
  })
