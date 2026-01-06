/**
 * Prefix Keys Utility
 *
 * Transforms object keys by adding a prefix for Firestore dot notation.
 * Used when updating nested config fields atomically.
 *
 * @example
 * ```typescript
 * const updates = { download: false, instagram: true }
 * const result = prefixKeys(updates, 'sharing')
 * // => { 'sharing.download': false, 'sharing.instagram': true }
 *
 * const overlayUpdates = { '1:1': { mediaAssetId: 'abc', url: '...' } }
 * const result = prefixKeys(overlayUpdates, 'overlays')
 * // => { 'overlays.1:1': { mediaAssetId: 'abc', url: '...' } }
 * ```
 */

/**
 * Add a prefix to all object keys (for Firestore dot notation)
 *
 * @param obj - Object with keys to prefix
 * @param prefix - Prefix to add (e.g., 'sharing', 'overlays', 'theme')
 * @returns New object with prefixed keys
 * @throws {Error} If prefix is empty or not a string
 */
export function prefixKeys(
  obj: Record<string, unknown>,
  prefix: string,
): Record<string, unknown> {
  // Validate prefix is non-empty
  if (!prefix || typeof prefix !== 'string' || prefix.trim() === '') {
    throw new Error(
      'prefixKeys: prefix must be a non-empty string (e.g., "sharing", "overlays")',
    )
  }

  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    result[`${prefix}.${key}`] = value
  }
  return result
}
