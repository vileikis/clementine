import type { Experience } from '@clementine/shared'

/**
 * Check if experience has a configured outcome
 *
 * An experience has type-specific config if the corresponding field
 * on the draft/published config is non-null.
 *
 * @param experience - Experience to check
 * @param configSource - Which config to check ('draft' or 'published')
 * @returns true if experience has a configured outcome for its type
 */
export function hasOutcome(
  experience: Experience,
  configSource: 'draft' | 'published',
): boolean {
  const config =
    configSource === 'draft' ? experience.draft : experience.published
  if (!config) return false

  const type = experience.type
  switch (type) {
    case 'photo':
      return config.photo != null
    case 'ai.image':
      return config.aiImage != null
    case 'ai.video':
      return config.aiVideo != null
    case 'gif':
      return config.gif != null
    case 'video':
      return config.video != null
    case 'survey':
      return true // surveys don't need outcome config
    default:
      return false
  }
}
