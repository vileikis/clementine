/**
 * Shared Transaction Helper: updateAIPresetDraft
 *
 * Updates AI preset draft fields using Firestore dot notation with transactions.
 * Uses write-only transactions to prevent race conditions during rapid updates.
 *
 * Benefits:
 * - Atomic updates (no race conditions from concurrent edits)
 * - No precondition checks (prevents stale timestamp conflicts)
 * - Immediate correct values (no snapshot delay)
 * - Version increment handled properly
 * - Firestore-native approach
 * - Efficient (no read operations in transaction)
 *
 * Note: Firestore will automatically fail if the document doesn't exist,
 * so no explicit existence check is needed.
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

    // Transform updates to Firestore paths with draft prefix
    const firestoreUpdates: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(updates)) {
      firestoreUpdates[`draft.${key}`] = value
    }

    // Atomic update with version increment
    // Note: Firestore will automatically fail if document doesn't exist
    transaction.update(presetRef, {
      ...firestoreUpdates,
      draftVersion: increment(1),
      updatedAt: serverTimestamp(),
    })

    return Promise.resolve()
  })
}
