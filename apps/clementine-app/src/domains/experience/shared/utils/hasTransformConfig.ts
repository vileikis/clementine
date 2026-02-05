import type { Experience } from '@clementine/shared'

/**
 * Check if experience has a configured outcome
 *
 * An experience has an outcome if:
 * - The outcome.type is set (not null)
 *
 * @param experience - Experience to check
 * @param configSource - Which config to check ('draft' or 'published')
 * @returns true if experience has a configured outcome
 */
export function hasOutcome(
  experience: Experience,
  configSource: 'draft' | 'published',
): boolean {
  const config =
    configSource === 'draft' ? experience.draft : experience.published
  return config?.outcome?.type !== null && config?.outcome?.type !== undefined
}

/**
 * @deprecated Use hasOutcome instead. Transform nodes are no longer used.
 */
export function hasTransformNodes(
  experience: Experience,
  configSource: 'draft' | 'published',
): boolean {
  const config =
    configSource === 'draft' ? experience.draft : experience.published
  return (config?.transformNodes?.length ?? 0) > 0
}

/**
 * @deprecated Use hasOutcome instead
 */
export const hasTransformConfig = hasTransformNodes
