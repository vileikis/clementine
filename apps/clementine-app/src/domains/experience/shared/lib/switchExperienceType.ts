/**
 * Switch Experience Type
 *
 * Atomically replaces the draft with a new discriminated union config variant
 * and updates draftType. Uses a Firestore transaction for consistency.
 *
 * @see specs/083-config-discriminated-union — US3
 */
import {
  doc,
  increment,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'
import { buildDefaultDraft } from '../hooks/useCreateExperience'
import type { ExperienceStep, ExperienceType } from '../schemas'
import { firestore } from '@/integrations/firebase/client'

/**
 * Switch experience type atomically.
 *
 * Builds a new discriminated union config for the target type,
 * preserving existing steps. Replaces the entire draft.
 *
 * Updates:
 * - experience.draftType = newType
 * - experience.draft = { type: newType, steps: existingSteps, [typeConfig]: defaults }
 * - experience.draftVersion += 1
 * - experience.updatedAt = serverTimestamp
 *
 * @param workspaceId - Workspace ID
 * @param experienceId - Experience ID
 * @param newType - New experience type
 */
export async function switchExperienceType(
  workspaceId: string,
  experienceId: string,
  newType: ExperienceType,
): Promise<void> {
  await runTransaction(firestore, async (transaction) => {
    const experienceRef = doc(
      firestore,
      `workspaces/${workspaceId}/experiences/${experienceId}`,
    )

    const snapshot = await transaction.get(experienceRef)
    if (!snapshot.exists()) {
      throw new Error(`Experience ${experienceId} not found`)
    }

    // Preserve existing steps from the current draft
    const currentDraft = (snapshot.data()?.draft ?? {}) as {
      steps?: ExperienceStep[]
    }
    const existingSteps = currentDraft.steps ?? []

    // Build new discriminated config with defaults for the target type
    const newDraft = buildDefaultDraft(newType)

    // Carry over existing steps
    newDraft.steps = existingSteps

    transaction.update(experienceRef, {
      draftType: newType,
      draft: newDraft,
      draftVersion: increment(1),
      updatedAt: serverTimestamp(),
    })
  })
}
