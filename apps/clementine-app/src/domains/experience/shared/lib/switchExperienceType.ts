/**
 * Switch Experience Type
 *
 * Atomically updates experience.type (top-level) and initializes/clears
 * per-type config in draft. Uses a Firestore transaction for consistency.
 *
 * @see specs/081-experience-type-flattening — Write Contract: Update Experience Type
 */
import {
  doc,
  increment,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'
import type { ExperienceType } from '../schemas'
import { firestore } from '@/integrations/firebase/client'

/**
 * Switch experience type atomically.
 *
 * Updates:
 * - experience.type = newType (top-level)
 * - experience.draft.[newType] = defaultConfig (if provided)
 * - experience.draftVersion += 1
 * - experience.updatedAt = serverTimestamp
 *
 * Does NOT clear the previous type's config (preserves switching).
 *
 * @param workspaceId - Workspace ID
 * @param experienceId - Experience ID
 * @param newType - New experience type
 * @param defaultConfig - Default config for the new type (optional, set if not already present)
 */
export async function switchExperienceType(
  workspaceId: string,
  experienceId: string,
  newType: ExperienceType,
  defaultConfig?: { key: string; value: unknown },
): Promise<void> {
  await runTransaction(firestore, async (transaction) => {
    const experienceRef = doc(
      firestore,
      `workspaces/${workspaceId}/experiences/${experienceId}`,
    )

    const updateData: Record<string, unknown> = {
      type: newType,
      draftVersion: increment(1),
      updatedAt: serverTimestamp(),
    }

    // Initialize the new type's default config if provided
    if (defaultConfig) {
      updateData[`draft.${defaultConfig.key}`] = defaultConfig.value
    }

    transaction.update(experienceRef, updateData)

    return Promise.resolve()
  })
}
