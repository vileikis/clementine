/**
 * Font Utilities
 *
 * Helper for displaying font family names in the theme editor.
 */

/**
 * Get display label for a font family value
 */
export function getFontLabel(fontFamily: string | null): string {
  if (!fontFamily) return 'System Default'
  return fontFamily
}
