/**
 * Firestore Server-Side Utilities
 *
 * This file contains server-only code with Firebase Admin SDK.
 * Only use in server functions (createServerFn handlers).
 */

import { getFirestore } from 'firebase-admin/firestore'
import type { DocumentData } from 'firebase-admin/firestore'

/**
 * Get a document from Firestore (server-side)
 *
 * @example
 * ```ts
 * const getCompany = createServerFn({ method: 'GET' })
 *   .inputValidator((id: string) => id)
 *   .handler(async ({ data: id }) => {
 *     return await getDoc('companies', id)
 *   })
 * ```
 */
export async function getDoc<T extends DocumentData = DocumentData>(
  collectionPath: string,
  docId: string,
): Promise<T> {
  const db = getFirestore()
  const docSnap = await db.collection(collectionPath).doc(docId).get()

  if (!docSnap.exists) {
    throw new Error(`Document not found: ${collectionPath}/${docId}`)
  }

  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as T
}

/**
 * Get a nested document from Firestore (server-side)
 *
 * @example
 * ```ts
 * const event = await getNestedDoc(
 *   ['projects', projectId, 'events'],
 *   eventId
 * )
 * ```
 */
export async function getNestedDoc<T extends DocumentData = DocumentData>(
  path: string[], // e.g., ['projects', 'proj-1', 'events']
  docId: string,
): Promise<T> {
  const db = getFirestore()

  // Build the nested path
  let ref: any = db.collection(path[0])

  for (let i = 1; i < path.length; i += 2) {
    if (i < path.length) {
      ref = ref.doc(path[i])
      if (i + 1 < path.length) {
        ref = ref.collection(path[i + 1])
      }
    }
  }

  const docSnap = await ref.doc(docId).get()

  if (!docSnap.exists) {
    throw new Error(`Document not found: ${[...path, docId].join('/')}`)
  }

  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as T
}

/**
 * Get a collection from Firestore (server-side)
 *
 * @example
 * ```ts
 * const companies = await getCollection('companies')
 * ```
 */
export async function getCollection<T extends DocumentData = DocumentData>(
  collectionPath: string,
): Promise<T[]> {
  const db = getFirestore()
  const snapshot = await db.collection(collectionPath).get()

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as T[]
}

/**
 * Get a nested collection from Firestore (server-side)
 *
 * @example
 * ```ts
 * const events = await getNestedCollection(
 *   ['projects', projectId, 'events']
 * )
 * ```
 */
export async function getNestedCollection<
  T extends DocumentData = DocumentData,
>(path: string[]): Promise<T[]> {
  const db = getFirestore()

  // Build the nested path
  let ref: any = db.collection(path[0])

  for (let i = 1; i < path.length; i += 2) {
    ref = ref.doc(path[i])
    if (i + 1 < path.length) {
      ref = ref.collection(path[i + 1])
    }
  }

  const snapshot = await ref.get()

  return snapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data(),
  })) as T[]
}
