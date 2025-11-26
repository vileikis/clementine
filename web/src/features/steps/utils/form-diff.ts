/**
 * Utility functions for comparing form values with original step data.
 * Used by step editors to determine which fields have actually changed.
 */

/**
 * Normalizes a value for comparison.
 * Treats empty strings, null, and undefined as equivalent (all become null).
 */
function normalizeValue(value: unknown): unknown {
  if (value === "" || value === null || value === undefined) {
    return null;
  }
  return value;
}

/**
 * Compares form values with original values and returns only the changed fields.
 * Uses deep comparison (JSON.stringify) for objects/arrays like config.
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

    const normalizedFormValue = normalizeValue(formValue);
    const normalizedOriginalValue = normalizeValue(originalValue);

    // Use JSON.stringify for deep comparison (handles arrays/objects like config)
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
