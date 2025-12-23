/**
 * ❌ OUTDATED EXAMPLE - DO NOT USE
 *
 * This file shows the OLD approach with weird inline imports.
 * It's kept for historical reference only.
 *
 * ✅ USE INSTEAD: firestore-clean-example.tsx
 *
 * The new approach uses:
 * - src/lib/firestore-client.ts (clean client-side hooks)
 * - src/lib/firestore-server.ts (clean server-side helpers)
 */

// Firestore + TanStack Query Integration Patterns
// Three approaches: One-time reads, Real-time snapshots, and Hybrid

import { createServerFn } from '@tanstack/react-start'
import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

// Mock Firestore types - replace with actual Firebase imports
type Firestore = any
type DocumentSnapshot = any
type Unsubscribe = () => void

// ============================================
// APPROACH 1: One-Time Reads (Simplest)
// ============================================
// ✅ Works with SSR
// ✅ Works with TanStack Query caching
// ❌ No real-time updates
// Good for: Data that doesn't change often (companies, projects)

export const getCompanyById = createServerFn({ method: 'GET' })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    // Server-side: Use Firebase Admin SDK
    const { getFirestore } = await import('firebase-admin/firestore')
    const db = getFirestore()

    const docSnap = await db.collection('companies').doc(id).get()

    if (!docSnap.exists) {
      throw new Error('Company not found')
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    }
  })

// Use with TanStack Query
export const companyQueryOptions = (companyId: string) =>
  queryOptions({
    queryKey: ['companies', companyId],
    queryFn: () => getCompanyById({ data: companyId }),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })

// ============================================
// APPROACH 2: Real-time Snapshots with TanStack Query
// ============================================
// ✅ Real-time updates
// ✅ Integrated with TanStack Query cache
// ⚠️ Client-only (need fallback for SSR)
// Good for: Data that changes frequently (events, sessions)

// Helper hook: Subscribe to Firestore and update TanStack Query cache
export function useFirestoreQuery<T>(
  queryKey: string[],
  getSnapshot: (db: Firestore) => Promise<DocumentSnapshot>,
) {
  const queryClient = useQueryClient()

  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return

    // Initialize Firebase client SDK
    const { getFirestore, onSnapshot, doc } = require('firebase/firestore')
    const db = getFirestore()

    let unsubscribe: Unsubscribe | undefined

    // Set up real-time listener
    async function setupListener() {
      try {
        const docRef = await getSnapshot(db)

        unsubscribe = onSnapshot(docRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = {
              id: snapshot.id,
              ...snapshot.data(),
            } as T

            // Update TanStack Query cache with real-time data
            queryClient.setQueryData(queryKey, data)
          }
        })
      } catch (error) {
        console.error('Error setting up Firestore listener:', error)
      }
    }

    setupListener()

    // Cleanup subscription
    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [queryKey.join(','), queryClient])

  // Use TanStack Query normally
  return useQuery({
    queryKey,
    queryFn: async () => {
      // Initial fetch (runs on server and client)
      const data = await getSnapshot(
        typeof window === 'undefined'
          ? require('firebase-admin/firestore').getFirestore()
          : require('firebase/firestore').getFirestore(),
      )
      return data
    },
  })
}

// Usage example
function EventComponent({ eventId }: { eventId: string }) {
  const { data: event } = useFirestoreQuery(['events', eventId], async (db) => {
    const { doc, getDoc } = require('firebase/firestore')
    const docRef = doc(db, 'events', eventId)
    const snapshot = await getDoc(docRef)

    if (!snapshot.exists()) {
      throw new Error('Event not found')
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    }
  })

  return <div>{event?.name}</div>
}

// ============================================
// APPROACH 3: Hybrid (RECOMMENDED)
// ============================================
// Best of both worlds:
// - Use server functions + TanStack Query for initial load
// - Add real-time listeners on client for live updates

// 1. Server function for SSR and initial fetch
export const getEventById = createServerFn({ method: 'GET' })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    const { getFirestore } = await import('firebase-admin/firestore')
    const db = getFirestore()

    const docSnap = await db
      .collection('projects')
      .doc('project-id')
      .collection('events')
      .doc(id)
      .get()

    if (!docSnap.exists) {
      throw new Error('Event not found')
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    }
  })

// 2. Query options
export const eventQueryOptions = (eventId: string) =>
  queryOptions({
    queryKey: ['events', eventId],
    queryFn: () => getEventById({ data: eventId }),
  })

// 3. Custom hook that adds real-time updates
export function useEventWithRealtime(eventId: string) {
  const queryClient = useQueryClient()
  const query = useQuery(eventQueryOptions(eventId))

  useEffect(() => {
    // Only set up listener on client
    if (typeof window === 'undefined') return

    const { getFirestore, doc, onSnapshot } = require('firebase/firestore')
    const db = getFirestore()

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      doc(db, 'events', eventId),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = {
            id: snapshot.id,
            ...snapshot.data(),
          }

          // Update TanStack Query cache
          queryClient.setQueryData(['events', eventId], data)
        }
      },
      (error) => {
        console.error('Firestore listener error:', error)
      },
    )

    return () => unsubscribe()
  }, [eventId, queryClient])

  return query
}

// Usage in component
function EventDetailComponent() {
  const { eventId } = Route.useParams()

  // Gets data from TanStack Query cache (populated by loader)
  // + sets up real-time listener for updates
  const { data: event, isLoading } = useEventWithRealtime(eventId)

  return (
    <div>
      <h1>{event?.name}</h1>
      <p>Status updates in real-time!</p>
    </div>
  )
}

// 4. Route definition
export const EventRoute = createFileRoute(
  '/$companyId/p/$projectId/events/$eventId',
)({
  loader: async ({ params, context }) => {
    // Prefetch on server using one-time read
    await context.queryClient.ensureQueryData(eventQueryOptions(params.eventId))
  },
  component: EventDetailComponent,
})
