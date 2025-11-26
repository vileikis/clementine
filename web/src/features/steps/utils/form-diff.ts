/**
 * Utility functions for comparing form values with original step data.
 * Used by step editors to determine which fields have actually changed.
 */

/**
 * Deeply normalizes a value for comparison.
 * Treats empty strings, null, and undefined as equivalent (all become null).
 * Recursively normalizes nested objects and arrays.
 */
function deepNormalize(value: unknown): unknown {
  // Treat empty strings, null, and undefined as equivalent
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  // Recursively normalize arrays
  if (Array.isArray(value)) {
    return value.map(deepNormalize);
  }

  // Recursively normalize objects (but not special types like Date)
  if (typeof value === "object" && value !== null && value.constructor === Object) {
    const normalized: Record<string, unknown> = {};
    // Sort keys for consistent comparison regardless of property order
    const sortedKeys = Object.keys(value).sort();
    for (const key of sortedKeys) {
      normalized[key] = deepNormalize((value as Record<string, unknown>)[key]);
    }
    return normalized;
  }

  return value;
}

/**
 * Compares form values with original values and returns only the changed fields.
 * Uses deep comparison with normalization for objects/arrays like config.
 *
 * @param formValues - Current form values
 * @param originalValues - Original step values to compare against
 * @param fieldsToCompare - Array of field keys to check for changes
 * @returns Object containing only the fields that have changed
 */
export function getChangedFields<T extends Record<string, unknown>>(
  formValues: T,
  originalValues: Record<string, unknown>,
  fieldsToCompare: (keyof T)[]
): Partial<T> {
  const updates: Partial<T> = {};

  for (const key of fieldsToCompare) {
    const formValue = formValues[key];
    const originalValue = originalValues[key as string];

    // Deep normalize both values before comparison
    const normalizedFormValue = deepNormalize(formValue);
    const normalizedOriginalValue = deepNormalize(originalValue);

    // Use JSON.stringify for comparison (now with sorted keys and normalized values)
    const hasChanged =
      JSON.stringify(normalizedFormValue) !==
      JSON.stringify(normalizedOriginalValue);

    if (hasChanged) {
      // For string fields, convert empty strings to null for storage
      if (typeof formValue === "string") {
        updates[key] = (formValue || null) as T[keyof T];
      } else {
        updates[key] = formValue;
      }
    }
  }

  return updates;
}
