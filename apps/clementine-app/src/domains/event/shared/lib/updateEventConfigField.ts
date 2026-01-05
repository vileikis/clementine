/**
 * Shared Transaction Helper: updateEventConfigField
 *
 * Updates event config fields using Firestore dot notation for atomic updates.
 * No read-merge-write pattern - uses direct field paths for better performance.
 *
 * Benefits:
 * - Atomic updates (no race conditions)
 * - No unnecessary reads
 * - Simpler code (no merge logic)
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
import { doc, increment, serverTimestamp, updateDoc } from 'firebase/firestore'
import { firestore } from '@/integrations/firebase/client'

/**
 * Update event config fields using dot notation
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
  const eventRef = doc(firestore, `projects/${projectId}/events`, eventId)

  // Transform updates to Firestore paths with draftConfig prefix
  const firestoreUpdates: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(updates)) {
    firestoreUpdates[`draftConfig.${key}`] = value
  }

  // Atomic update with version increment
  await updateDoc(eventRef, {
    ...firestoreUpdates,
    draftVersion: increment(1),
    updatedAt: serverTimestamp(),
  })
}
