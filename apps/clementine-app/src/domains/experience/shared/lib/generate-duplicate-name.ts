const COPY_SUFFIX = ' (Copy)'
const MAX_NAME_LENGTH = 100

/**
 * Generate a duplicate name by appending "(Copy)" suffix.
 *
 * - If name already ends with " (Copy)", return unchanged.
 * - Otherwise, append " (Copy)".
 * - If result exceeds 100 chars, truncate original name to fit.
 */
export function generateDuplicateName(name: string): string {
  if (name.endsWith(COPY_SUFFIX)) {
    return name
  }

  const result = name + COPY_SUFFIX
  if (result.length <= MAX_NAME_LENGTH) {
    return result
  }

  // Truncate original name to fit within limit
  const maxOriginalLength = MAX_NAME_LENGTH - COPY_SUFFIX.length
  return name.slice(0, maxOriginalLength) + COPY_SUFFIX
}
