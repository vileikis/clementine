import { useMutation, useQueryClient } from '@tanstack/react-query'
import { doc, increment, updateDoc } from 'firebase/firestore'
import type {OverlayReference} from '@/domains/event/shared/schemas/project-event-config.schema';
import { firestore } from '@/integrations/firebase/client'
import {
  
  overlaysConfigSchema
} from '@/domains/event/shared/schemas/project-event-config.schema'

/**
 * Update overlays parameters
 */
interface UpdateOverlaysParams {
  '1:1'?: OverlayReference | null
  '9:16'?: OverlayReference | null
}

/**
 * Update event overlays
 */
async function updateEventOverlays(
  projectId: string,
  eventId: string,
  overlays: UpdateOverlaysParams,
): Promise<void> {
  // Validate overlay config
  const validated = overlaysConfigSchema.parse(overlays)

  // Get event document reference
  const eventRef = doc(firestore, `projects/${projectId}/events/${eventId}`)

  // Update event config
  await updateDoc(eventRef, {
    'draftConfig.overlays': validated,
    draftVersion: increment(1),
    updatedAt: Date.now(),
  })
}

/**
 * Hook: Update event overlays
 */
export function useUpdateOverlays(projectId: string, eventId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (overlays: UpdateOverlaysParams) =>
      updateEventOverlays(projectId, eventId, overlays),
    onSuccess: () => {
      // Invalidate event query to trigger re-fetch
      queryClient.invalidateQueries({
        queryKey: ['event', projectId, eventId],
      })
    },
  })
}
