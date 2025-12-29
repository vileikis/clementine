import { DocumentReference, GeoPoint, Timestamp } from 'firebase/firestore'
import type { DocumentSnapshot } from 'firebase/firestore'
import type { z } from 'zod'

/**
 * Convert a single Firestore value to a JavaScript-friendly type
 * Handles Timestamp, DocumentReference, GeoPoint, and nested objects/arrays
 *
 * Conversions:
 * - Timestamp → number (milliseconds since epoch)
 * - DocumentReference → string (document ID)
 * - GeoPoint → { lat: number, lng: number }
 * - Nested objects/arrays → recursively converted
 * - Everything else → unchanged
 *
 * @param value - Any value from Firestore document
 * @returns Converted value
 *
 * @example
 * ```typescript
 * const timestamp = Timestamp.now()
 * convertFirestoreValue(timestamp) // → 1234567890123 (number)
 *
 * const ref = doc(firestore, 'users', 'abc123')
 * convertFirestoreValue(ref) // → 'abc123' (string)
 *
 * const nested = { createdAt: Timestamp.now(), userRef: ref }
 * convertFirestoreValue(nested) // → { createdAt: 1234567890123, userRef: 'abc123' }
 * ```
 */
export function convertFirestoreValue(value: unknown): unknown {
  // Null/undefined - return as-is
  if (value === null || value === undefined) {
    return value
  }

  // Timestamp → number (milliseconds)
  if (value instanceof Timestamp) {
    return value.toMillis()
  }

  // DocumentReference → string (document ID)
  if (value instanceof DocumentReference) {
    return value.id
  }

  // GeoPoint → { lat, lng }
  if (value instanceof GeoPoint) {
    return { lat: value.latitude, lng: value.longitude }
  }

  // Array → recursively convert each element
  if (Array.isArray(value)) {
    return value.map((item) => convertFirestoreValue(item))
  }

  // Plain object → recursively convert each property
  if (typeof value === 'object' && value.constructor === Object) {
    return Object.entries(value).reduce(
      (acc, [key, val]) => {
        acc[key] = convertFirestoreValue(val)
        return acc
      },
      {} as Record<string, unknown>,
    )
  }

  // Primitives (string, number, boolean) - return as-is
  return value
}

/**
 * Convert Firestore document data to JavaScript-friendly types
 * Does NOT extract document ID or validate with schema
 *
 * Use this when you need conversion without validation, or when
 * working with nested Firestore data that isn't a top-level document.
 *
 * @param data - Raw Firestore document data
 * @returns Converted data with all Firestore types transformed
 *
 * @example
 * ```typescript
 * const data = doc.data()
 * const converted = convertFirestoreData(data)
 * // All Timestamps, DocumentReferences, and GeoPoints are now converted
 * ```
 */
export function convertFirestoreData<T = Record<string, unknown>>(
  data: Record<string, unknown>,
): T {
  return convertFirestoreValue(data) as T
}

/**
 * Convert Firestore document to validated schema object
 * Extracts document ID, converts all Firestore types, and validates with Zod schema
 *
 * This is the high-level utility you'll use most often. It handles the complete workflow:
 * 1. Extracts document ID
 * 2. Converts Timestamps → numbers, DocumentReferences → IDs, GeoPoints → { lat, lng }
 * 3. Validates with Zod schema
 *
 * Why convert Firestore types?
 * - Serializable: Works with JSON, localStorage, API responses
 * - Universal: No Firestore dependency in domain types
 * - Simple: Primitives are easier to work with than Firestore objects
 * - Framework-agnostic: Can migrate away from Firestore later
 *
 * Note: Firestore stores data as Timestamp/Reference objects, which are human-readable
 * in the Firestore dashboard. This conversion only affects client-side data.
 *
 * @param doc - Firestore DocumentSnapshot
 * @param schema - Zod schema for validation
 * @returns Validated and converted object (includes `id` field)
 *
 * @throws {Error} If document doesn't exist
 * @throws {ZodError} If document data doesn't match schema
 *
 * @example
 * ```typescript
 * // Fetch workspace from Firestore and validate
 * const docSnap = await getDoc(workspaceRef)
 * const workspace = convertFirestoreDoc(docSnap, workspaceSchema)
 * // workspace.id → string (document ID)
 * // workspace.createdAt → number (milliseconds since epoch)
 * // workspace.organizerRef → string (document ID, if it was a DocumentReference)
 * ```
 */
export function convertFirestoreDoc<T>(
  doc: DocumentSnapshot,
  schema: z.ZodSchema<T>,
): T {
  const data = doc.data()

  if (!data) {
    throw new Error(`Document does not exist: ${doc.id}`)
  }

  // Convert all Firestore types (Timestamps, DocumentReferences, GeoPoints, nested)
  const converted = convertFirestoreData(data)

  // Validate with Zod schema (includes id + converted data)
  // This will throw ZodError if validation fails
  return schema.parse({
    id: doc.id,
    ...converted,
  })
}
