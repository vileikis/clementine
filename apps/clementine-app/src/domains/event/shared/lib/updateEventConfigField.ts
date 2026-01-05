/**
 * Shared Transaction Helper: updateEventConfigField
 *
 * Reusable helper for simple event config field updates.
 * Handles lazy initialization, version increment, and atomic transactions.
 *
 * Use this for simple field replacements (theme, overlays).
 * For complex deep merge operations (sharing with nested socials), use custom hooks.
 */
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import type { UpdateData } from 'firebase/firestore'
import type { ProjectEventConfig, ProjectEventFull } from '../schemas'
import { firestore } from '@/integrations/firebase/client'

/**
 * Update a single field in event configuration with lazy initialization
 *
 * @param projectId - Project ID
 * @param eventId - Event ID
 * @param field - Field name in ProjectEventConfig (type-safe)
 * @param value - New value for the field
 * @returns Updated config
 *
 * @example
 * ```typescript
 * // Update theme
 * await updateEventConfigField(
 *   projectId,
 *   eventId,
 *   'theme',
 *   { primaryColor: '#FF0000', ... }
 * )
 *
 * // Update overlays
 * await updateEventConfigField(
 *   projectId,
 *   eventId,
 *   'overlays',
 *   { '1:1': 'https://...', '9:16': 'https://...' }
 * )
 * ```
 */
export async function updateEventConfigField<
  TKey extends keyof ProjectEventConfig,
>(
  projectId: string,
  eventId: string,
  field: TKey,
  value: ProjectEventConfig[TKey],
): Promise<ProjectEventConfig> {
  return await runTransaction(firestore, async (transaction) => {
    const eventRef = doc(firestore, `projects/${projectId}/events`, eventId)
    const eventDoc = await transaction.get(eventRef)

    if (!eventDoc.exists()) {
      throw new Error(`Event ${eventId} not found`)
    }

    const currentEvent = eventDoc.data() as ProjectEventFull

    // Lazy initialization of draftConfig
    const currentDraft = currentEvent.draftConfig ?? {
      schemaVersion: 1,
      theme: null,
      overlays: null,
      sharing: null,
    }

    // Update field
    const updatedDraft: ProjectEventConfig = {
      ...currentDraft,
      [field]: value,
    }

    // Increment version
    const currentVersion = currentEvent.draftVersion ?? 0

    // Write update
    transaction.update(eventRef, {
      draftConfig: updatedDraft,
      draftVersion: currentVersion + 1,
      updatedAt: serverTimestamp(),
    } as UpdateData<ProjectEventFull>)

    return updatedDraft
  })
}
