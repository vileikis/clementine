import type { Experience } from '@clementine/shared'

/**
 * Check if experience has active transform configuration
 *
 * An experience has transform configuration if:
 * - The transform field exists
 * - The transform nodes array has at least one node
 *
 * @param experience - Experience to check
 * @param configSource - Which config to check ('draft' or 'published')
 * @returns true if experience has transform configuration
 */
export function hasTransformConfig(
  experience: Experience,
  configSource: 'draft' | 'published',
): boolean {
  const config =
    configSource === 'draft' ? experience.draft : experience.published
  return (config?.transform?.nodes?.length ?? 0) > 0
}
