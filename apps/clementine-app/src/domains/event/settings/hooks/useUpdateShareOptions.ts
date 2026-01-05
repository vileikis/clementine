/**
 * Mutation Hook: useUpdateShareOptions
 *
 * Updates event sharing configuration with deep merge for nested socials.
 * Handles lazy initialization, version increment, and query invalidation.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import * as Sentry from '@sentry/tanstackstart-react'
import type { UpdateData } from 'firebase/firestore'
import type { z } from 'zod'
import type {
  ProjectEventConfig,
  ProjectEventFull,
  SharingConfig,
} from '@/domains/event/shared/schemas'
import { firestore } from '@/integrations/firebase/client'
import { sharingConfigSchema } from '@/domains/event/shared/schemas'

/**
 * Partial update schema for sharing options
 * Allows updating individual fields without sending the entire object
 */
export const updateShareOptionsSchema = sharingConfigSchema.partial()
export type UpdateShareOptionsInput = z.infer<typeof updateShareOptionsSchema>

/**
 * Hook for updating event sharing options with auto-save support
 *
 * Features:
 * - Deep merge for socials (preserves existing flags)
 * - Lazy initialization (creates draftConfig on first update)
 * - Version increment (tracks changes)
 * - Query invalidation (triggers re-render)
 * - Error reporting to Sentry
 *
 * @param projectId - Parent project ID
 * @param eventId - Event ID to update
 * @returns TanStack Query mutation
 *
 * @example
 * ```tsx
 * const updateShareOptions = useUpdateShareOptions(projectId, eventId)
 *
 * // Update single social platform
 * await updateShareOptions.mutateAsync({
 *   socials: { instagram: true }
 * })
 *
 * // Update download option
 * await updateShareOptions.mutateAsync({
 *   downloadEnabled: false
 * })
 * ```
 */
export function useUpdateShareOptions(projectId: string, eventId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateShareOptionsInput) => {
      // 1. Validate input
      const validated = updateShareOptionsSchema.parse(input)

      // 2. Transaction with deep merge
      return await runTransaction(firestore, async (transaction) => {
        const eventRef = doc(firestore, `projects/${projectId}/events`, eventId)
        const eventDoc = await transaction.get(eventRef)

        if (!eventDoc.exists()) {
          throw new Error(`Event ${eventId} not found`)
        }

        const currentEvent = eventDoc.data() as ProjectEventFull

        // 3. Lazy initialization
        const currentDraft = currentEvent.draftConfig ?? {
          schemaVersion: 1,
          theme: null,
          overlays: null,
          sharing: null,
        }

        const currentSharing = currentDraft.sharing ?? {
          downloadEnabled: true,
          copyLinkEnabled: true,
          socials: null,
        }

        // 4. Deep merge for socials
        const updatedSharing: SharingConfig = {
          downloadEnabled:
            validated.downloadEnabled ?? currentSharing.downloadEnabled,
          copyLinkEnabled:
            validated.copyLinkEnabled ?? currentSharing.copyLinkEnabled,
          socials: validated.socials
            ? {
                ...currentSharing.socials, // Preserve existing flags
                ...validated.socials, // Apply updates
              }
            : currentSharing.socials,
        }

        // 5. Update draft
        const updatedDraft: ProjectEventConfig = {
          ...currentDraft,
          sharing: updatedSharing,
        }

        const currentVersion = currentEvent.draftVersion ?? 0

        // 6. Write
        transaction.update(eventRef, {
          draftConfig: updatedDraft,
          draftVersion: currentVersion + 1,
          updatedAt: serverTimestamp(),
        } as UpdateData<ProjectEventFull>)

        return updatedDraft
      })
    },

    // 7. Success handling
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-event', projectId, eventId],
      })
    },

    // 8. Error handling
    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          domain: 'event/settings',
          action: 'update-share-options',
        },
        extra: {
          errorType: 'sharing-config-update-failure',
          projectId,
          eventId,
        },
      })
    },
  })
}
