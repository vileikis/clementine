import * as admin from 'firebase-admin'

/**
 * Firebase Admin SDK initialization for server-side operations
 *
 * This module initializes the Firebase Admin SDK using service account credentials
 * from environment variables. It's used ONLY in server functions (createServerFn),
 * NEVER imported in client code.
 *
 * Environment variables required:
 * - FIREBASE_ADMIN_PROJECT_ID
 * - FIREBASE_ADMIN_CLIENT_EMAIL
 * - FIREBASE_ADMIN_PRIVATE_KEY
 */

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    storageBucket: process.env.FIREBASE_ADMIN_STORAGE_BUCKET,
  })
}
export const adminAuth = admin.auth()
export const adminDb = admin.firestore()
export const adminStorage = admin.storage()

// Export admin module for advanced use cases
export { admin }
