import type { ExperienceConfig } from '@clementine/shared'

/**
 * Check if a config has type-specific configuration (i.e., is not a survey).
 *
 * With the discriminated union, type-specific config is guaranteed to exist
 * on each variant. Only surveys lack type-specific config.
 *
 * @param config - Experience config (discriminated union)
 * @returns true if the config type is not 'survey'
 */
export function hasTypeConfig(config: ExperienceConfig): boolean {
  return config.type !== 'survey'
}
