/**
 * Shared Transaction Helper: updateEventConfigField
 *
 * Updates event config fields using Firestore dot notation with transactions.
 * Uses transactions to ensure immediate snapshot updates with correct values.
 *
 * Benefits:
 * - Atomic updates (no race conditions)
 * - Immediate correct values (no snapshot delay)
 * - Version increment handled properly
 * - Firestore-native approach
 *
 * @example
 * ```typescript
 * // Update single field
 * await updateEventConfigField(projectId, eventId, {
 *   'theme.primaryColor': '#FF0000'
 * })
 *
 * // Update multiple fields atomically
 * await updateEventConfigField(projectId, eventId, {
 *   'sharing.download': false,
 *   'sharing.instagram': true,
 *   'sharing.facebook': true
 * })
 * ```
 */
import {
  doc,
  increment,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'
import type { UpdateData } from 'firebase/firestore'
import type { ProjectEventFull } from '../schemas'
import { firestore } from '@/integrations/firebase/client'

/**
 * Update event config fields using dot notation with transaction
 *
 * @param projectId - Project ID
 * @param eventId - Event ID
 * @param updates - Field updates using dot notation (e.g., { 'sharing.download': false })
 * @returns Promise that resolves when update completes
 */
export async function updateEventConfigField(
  projectId: string,
  eventId: string,
  updates: Record<string, unknown>,
): Promise<void> {
  await runTransaction(firestore, async (transaction) => {
    const eventRef = doc(firestore, `projects/${projectId}/events/${eventId}`)

    // Transform updates to Firestore paths with draftConfig prefix
    const firestoreUpdates: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(updates)) {
      firestoreUpdates[`draftConfig.${key}`] = value
    }

    // Atomic update with version increment
    // Note: Firestore will throw clear error if document doesn't exist
    const updateData: UpdateData<ProjectEventFull> = {
      ...firestoreUpdates,
      draftVersion: increment(1),
      updatedAt: serverTimestamp(),
    }

    transaction.update(eventRef, updateData)

    return Promise.resolve()
  })
}
