/**
 * Type Guards for Preview Domain
 *
 * Runtime type checking utilities for test input values.
 */

import type { MediaReference } from '@clementine/shared'

/**
 * Type guard to check if a value is a MediaReference
 *
 * MediaReference is the serializable format for uploaded images,
 * containing mediaAssetId, url, and filePath.
 *
 * @param value - Value to check
 * @returns True if value is a MediaReference
 *
 * @example
 * ```typescript
 * const input = testInputs['profilePic']
 * if (isMediaReference(input)) {
 *   console.log(input.url) // TypeScript knows input.url exists
 * }
 * ```
 */
export function isMediaReference(value: unknown): value is MediaReference {
  return (
    value !== null &&
    typeof value === 'object' &&
    'mediaAssetId' in value &&
    'url' in value &&
    typeof (value as MediaReference).url === 'string' &&
    typeof (value as MediaReference).mediaAssetId === 'string'
  )
}
