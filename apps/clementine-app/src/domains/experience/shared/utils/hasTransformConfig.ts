import type { Experience } from '@clementine/shared'

/**
 * Check if experience has active transform nodes
 *
 * An experience has transform nodes if:
 * - The transformNodes array has at least one node
 *
 * @param experience - Experience to check
 * @param configSource - Which config to check ('draft' or 'published')
 * @returns true if experience has transform nodes
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
 * @deprecated Use hasTransformNodes instead
 */
export const hasTransformConfig = hasTransformNodes
