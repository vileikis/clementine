/**
 * Firestore Utilities (Admin SDK)
 *
 * Converts Firestore Admin SDK types to JavaScript-friendly types.
 * Mirror of apps/clementine-app/src/shared/utils/firestore-utils.ts
 * but using firebase-admin/firestore types instead of firebase/firestore.
 *
 * TODO: Move to @clementine/shared once we have a shared kernel strategy
 */
import {
  Timestamp,
  DocumentReference,
  GeoPoint,
  DocumentSnapshot,
} from 'firebase-admin/firestore'
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
 */
export function convertFirestoreData<T = Record<string, unknown>>(
  data: Record<string, unknown>,
): T {
  return convertFirestoreValue(data) as T
}

/**
 * Convert Firestore document to validated schema object
 * Extracts document ID, converts all Firestore types, and validates with Zod schema
 */
export function convertFirestoreDoc<T>(
  doc: DocumentSnapshot,
  schema: z.ZodSchema<T>,
): T {
  const data = doc.data()

  if (!data) {
    throw new Error(`Document does not exist: ${doc.id}`)
  }

  // Convert all Firestore types
  const converted = convertFirestoreData(data)

  // Validate with Zod schema (includes id + converted data)
  return schema.parse({
    id: doc.id,
    ...converted,
  })
}
