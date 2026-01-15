/**
 * Shared Transaction Helper: updateExperienceConfigField
 *
 * Updates experience config fields using Firestore dot notation with transactions.
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
 * await updateExperienceConfigField(workspaceId, experienceId, {
 *   steps: newSteps
 * })
 *
 * // Update multiple fields atomically
 * await updateExperienceConfigField(workspaceId, experienceId, {
 *   'steps': newSteps,
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
import type { Experience } from '../schemas'
import { firestore } from '@/integrations/firebase/client'

/**
 * Update experience config fields using dot notation with transaction
 *
 * @param workspaceId - Workspace ID
 * @param experienceId - Experience ID
 * @param updates - Field updates using dot notation (e.g., { steps: [...] })
 * @returns Promise that resolves when update completes
 */
export async function updateExperienceConfigField(
  workspaceId: string,
  experienceId: string,
  updates: Record<string, unknown>,
): Promise<void> {
  await runTransaction(firestore, async (transaction) => {
    const experienceRef = doc(
      firestore,
      `workspaces/${workspaceId}/experiences/${experienceId}`,
    )

    // Transform updates to Firestore paths with draft prefix
    const firestoreUpdates: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(updates)) {
      firestoreUpdates[`draft.${key}`] = value
    }

    // Atomic update with version increment
    // Note: Firestore will throw clear error if document doesn't exist
    const updateData: UpdateData<Experience> = {
      ...firestoreUpdates,
      draftVersion: increment(1),
      updatedAt: serverTimestamp(),
    }

    transaction.update(experienceRef, updateData)

    return Promise.resolve()
  })
}
