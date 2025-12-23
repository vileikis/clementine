/**
 * Firestore + TanStack Query Integration
 *
 * This file re-exports utilities split into client and server modules.
 *
 * IMPORTANT: The old version of this file had inline dynamic imports which
 * looked weird. It's now been split into proper modules:
 *
 * - firestore-client.ts - Client-side hooks with Firebase Client SDK
 * - firestore-server.ts - Server-side helpers with Firebase Admin SDK
 */

// Re-export client-side hooks
export {
  useFirestoreDocSync,
  useFirestoreNestedDocSync,
  useFirestoreCollectionSync,
  isClient,
} from './firestore-client'

// Re-export server-side helpers
export { getDoc, getNestedDoc, getCollection, getNestedCollection } from './firestore-server'

// Backward compatibility aliases
export { useFirestoreDocSync as useFirestoreRealtimeSync } from './firestore-client'
export { useFirestoreNestedDocSync as useFirestoreNestedRealtimeSync } from './firestore-client'
