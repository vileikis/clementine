/**
 * Shared Transaction Helper: updateAIPresetDraft
 *
 * Updates AI preset draft fields using Firestore dot notation with transactions.
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
 * await updateAIPresetDraft(workspaceId, presetId, {
 *   model: 'gemini-2.5-pro'
 * })
 *
 * // Update multiple fields atomically
 * await updateAIPresetDraft(workspaceId, presetId, {
 *   model: 'gemini-2.5-pro',
 *   aspectRatio: '16:9'
 * })
 * ```
 */
import {
  doc,
  increment,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'
import { firestore } from '@/integrations/firebase/client'

/**
 * Update AI preset draft fields using dot notation with transaction
 *
 * @param workspaceId - Workspace ID
 * @param presetId - AI Preset ID
 * @param updates - Field updates (e.g., { model: 'gemini-2.5-pro' })
 * @returns Promise that resolves when update completes
 */
export async function updateAIPresetDraft(
  workspaceId: string,
  presetId: string,
  updates: Record<string, unknown>,
): Promise<void> {
  await runTransaction(firestore, async (transaction) => {
    const presetRef = doc(
      firestore,
      `workspaces/${workspaceId}/aiPresets/${presetId}`,
    )

    // Read preset to validate it exists (all reads must happen before writes)
    const presetDoc = await transaction.get(presetRef)
    if (!presetDoc.exists()) {
      throw new Error(`Preset ${presetId} not found`)
    }

    // Transform updates to Firestore paths with draft prefix
    const firestoreUpdates: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(updates)) {
      firestoreUpdates[`draft.${key}`] = value
    }

    // Atomic update with version increment
    transaction.update(presetRef, {
      ...firestoreUpdates,
      draftVersion: increment(1),
      updatedAt: serverTimestamp(),
    })
  })
}
