/**
 * Firestore Client-Side Utilities
 *
 * This file contains client-only code with Firebase Client SDK.
 * Only import this in client-side code (components, hooks, etc.)
 */

import { useEffect } from 'react'
import { useQueryClient, type QueryKey } from '@tanstack/react-query'
import { getFirestore, doc, onSnapshot, collection, query } from 'firebase/firestore'
import type { DocumentData, QueryConstraint } from 'firebase/firestore'

/**
 * Hook that sets up a Firestore real-time listener for a document
 * and syncs it with TanStack Query cache
 *
 * @example
 * ```tsx
 * function EventComponent({ eventId }: { eventId: string }) {
 *   const { data } = useQuery(eventQueryOptions(eventId))
 *   useFirestoreDocSync(['events', eventId], 'events', eventId)
 *   // data now updates in real-time!
 * }
 * ```
 */
export function useFirestoreDocSync(
  queryKey: QueryKey,
  collectionPath: string,
  docId: string
) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const db = getFirestore()
    const docRef = doc(db, collectionPath, docId)

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = {
            id: snapshot.id,
            ...snapshot.data(),
          }
          queryClient.setQueryData(queryKey, data)
        } else {
          // Document was deleted
          queryClient.setQueryData(queryKey, null)
        }
      },
      (error) => {
        console.error('[Firestore Doc Sync] Error:', error)
      }
    )

    return () => unsubscribe()
  }, [queryKey, collectionPath, docId, queryClient])
}

/**
 * Hook for syncing nested Firestore documents
 *
 * @example
 * ```tsx
 * useFirestoreNestedDocSync(
 *   ['projects', projectId, 'events', eventId],
 *   ['projects', projectId, 'events', eventId]
 * )
 * ```
 */
export function useFirestoreNestedDocSync(
  queryKey: QueryKey,
  path: string[] // e.g., ['projects', 'proj-1', 'events', 'evt-1']
) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const db = getFirestore()
    const docRef = doc(db, ...path)

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = {
            id: snapshot.id,
            ...snapshot.data(),
          }
          queryClient.setQueryData(queryKey, data)
        } else {
          queryClient.setQueryData(queryKey, null)
        }
      },
      (error) => {
        console.error('[Firestore Nested Doc Sync] Error:', error)
      }
    )

    return () => unsubscribe()
  }, [queryKey, path.join('/'), queryClient])
}

/**
 * Hook for syncing Firestore collection queries
 *
 * @example
 * ```tsx
 * import { where, orderBy, limit } from 'firebase/firestore'
 *
 * useFirestoreCollectionSync(
 *   ['events', projectId],
 *   `projects/${projectId}/events`,
 *   [where('status', '==', 'active'), orderBy('createdAt', 'desc')]
 * )
 * ```
 */
export function useFirestoreCollectionSync<T extends DocumentData = DocumentData>(
  queryKey: QueryKey,
  collectionPath: string,
  constraints?: QueryConstraint[]
) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const db = getFirestore()
    const collectionRef = collection(db, collectionPath)
    const q = constraints ? query(collectionRef, ...constraints) : collectionRef

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as T[]

        queryClient.setQueryData(queryKey, data)
      },
      (error) => {
        console.error('[Firestore Collection Sync] Error:', error)
      }
    )

    return () => unsubscribe()
  }, [queryKey, collectionPath, queryClient, constraints])
}

/**
 * Type guard to check if we're on the client
 */
export const isClient = typeof window !== 'undefined'
