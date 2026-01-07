/**
 * Default Theme Values
 *
 * Derived from themeSchema defaults - single source of truth.
 * Use this when initializing form state or providing fallbacks.
 */

import type { Theme } from '@/shared/theming/schemas/theme.schemas'
import { themeSchema } from '@/shared/theming/schemas/theme.schemas'

/**
 * Default theme with all fields populated from schema defaults.
 * Parsing an empty object applies all .default() values.
 */
export const DEFAULT_THEME: Theme = themeSchema.parse({})
