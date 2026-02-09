/**
 * Font CSS Utilities
 *
 * URL builders and CSS font-family constructors for Google Fonts integration.
 */

/**
 * Builds the CSS font-family value from theme font configuration.
 *
 * @returns CSS font-family string or undefined (for system default)
 *
 * @example
 * buildFontFamilyValue("Inter", "google", "system-ui, sans-serif")
 * // → '"Inter", system-ui, sans-serif'
 *
 * buildFontFamilyValue(null, "system", "system-ui, sans-serif")
 * // → undefined (let browser use default)
 */
export function buildFontFamilyValue(
  fontFamily: string | null,
  fontSource: 'google' | 'system',
  fallbackStack: string,
): string | undefined {
  if (!fontFamily || fontSource === 'system') return undefined
  return `"${fontFamily}", ${fallbackStack}`
}

/**
 * Constructs the Google Fonts CSS API v2 stylesheet URL.
 *
 * @example
 * buildGoogleFontsUrl("Playfair Display", [400, 700])
 * // → "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap"
 */
export function buildGoogleFontsUrl(family: string, weights: number[]): string {
  const encoded = family.replace(/ /g, '+')
  const sorted = [...weights].sort((a, b) => a - b)
  const weightStr = sorted.join(';')
  return `https://fonts.googleapis.com/css2?family=${encoded}:wght@${weightStr}&display=swap`
}

/**
 * Constructs a Google Fonts URL loading only glyphs needed for preview text.
 *
 * @example
 * buildGoogleFontsPreviewUrl("Inter", "Clementine makes sharing magical.")
 * // → "https://fonts.googleapis.com/css2?family=Inter&text=Clementine%20makes%20sharing%20magical.&display=swap"
 */
export function buildGoogleFontsPreviewUrl(
  family: string,
  previewText: string,
): string {
  const encoded = family.replace(/ /g, '+')
  const text = encodeURIComponent(previewText)
  return `https://fonts.googleapis.com/css2?family=${encoded}&text=${text}&display=swap`
}
