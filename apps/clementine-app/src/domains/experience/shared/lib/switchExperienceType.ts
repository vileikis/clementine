/**
 * Switch Experience Type
 *
 * Switches the draft's discriminator (`draft.type`) to the new type using
 * dot-notation partial updates. Existing type-specific configs are preserved
 * as inert sibling fields (looseObject tolerates them), so switching back
 * restores previous inputs without data loss.
 *
 * If the new type has no config field yet, initializes it with defaults.
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
import type { ExperienceType } from '../schemas'
import { firestore } from '@/integrations/firebase/client'

/** Maps outcome types to their config field key on the draft object */
const CONFIG_FIELD_KEYS: Partial<Record<ExperienceType, string>> = {
  photo: 'photo',
  gif: 'gif',
  video: 'video',
  'ai.image': 'aiImage',
  'ai.video': 'aiVideo',
}

/**
 * Switch experience type atomically.
 *
 * Uses dot-notation updates so only the discriminator and (optionally)
 * the new type's config field are written. All other draft fields —
 * including steps and other type configs — are left untouched.
 *
 * Updates:
 * - draftType = newType
 * - draft.type = newType
 * - draft.[newConfigKey] = defaults  (only if the field doesn't exist yet)
 * - draftVersion += 1
 * - updatedAt = serverTimestamp
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

    const updates: Record<string, unknown> = {
      draftType: newType,
      'draft.type': newType,
      draftVersion: increment(1),
      updatedAt: serverTimestamp(),
    }

    // Initialize the new type's config field if it doesn't exist yet
    const configKey = CONFIG_FIELD_KEYS[newType]
    if (configKey) {
      const currentDraft = snapshot.data()?.draft as
        | Record<string, unknown>
        | undefined
      if (!currentDraft || !(configKey in currentDraft)) {
        const defaults = buildDefaultDraft(newType) as Record<string, unknown>
        updates[`draft.${configKey}`] = defaults[configKey]
      }
    }

    transaction.update(experienceRef, updates)
  })
}
