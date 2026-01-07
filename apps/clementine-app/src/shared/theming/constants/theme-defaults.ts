import type { ButtonRadius } from '../schemas/theme.schemas'

/**
 * Maps button radius preset names to CSS border-radius values.
 *
 * Canonical source of truth - use this constant everywhere
 * to ensure consistent button styling across the application.
 */
export const BUTTON_RADIUS_MAP: Record<ButtonRadius, string> = {
  square: '0',
  rounded: '0.5rem',
  pill: '9999px',
}
