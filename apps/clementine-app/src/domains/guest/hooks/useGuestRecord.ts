/**
 * useGuestRecord Hook
 *
 * Handles anonymous authentication and guest record creation.
 * Creates a guest record in Firestore on first visit to track session association.
 *
 * Pattern: Combines Firebase auth with Firestore record creation
 * Reference: Auth pattern from GuestExperiencePage.tsx
 */
import { useEffect, useRef, useState } from 'react'
import { signInAnonymously } from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import * as Sentry from '@sentry/tanstackstart-react'
import type { Guest } from '../schemas/guest.schema'
import { auth as firebaseAuth, firestore } from '@/integrations/firebase/client'
import { useAuth } from '@/domains/auth'

export interface UseGuestRecordReturn {
  /** Guest record if exists */
  guest: Guest | null
  /** True while authenticating or creating record */
  isLoading: boolean
  /** Error if operations failed */
  error: Error | null
  /** True if guest record exists */
  isReady: boolean
}

/**
 * Hook for managing guest authentication and record creation
 *
 * Flow:
 * 1. Check if user is already authenticated
 * 2. If not, sign in anonymously
 * 3. Once authenticated, check for existing guest record
 * 4. If no record exists, create one
 * 5. Return guest data when ready
 *
 * @param projectId - Project ID for the guest record
 * @returns Guest record state
 *
 * @example
 * ```tsx
 * function GuestContent({ projectId }: { projectId: string }) {
 *   const { guest, isLoading, isReady, error } = useGuestRecord(projectId)
 *
 *   if (isLoading) return <div>Preparing your experience...</div>
 *   if (error) return <div>Failed to initialize. Please refresh.</div>
 *   if (!isReady) return null
 *
 *   return <div>Welcome, guest {guest?.id}!</div>
 * }
 * ```
 */
export function useGuestRecord(projectId: string): UseGuestRecordReturn {
  const auth = useAuth()
  const signingInRef = useRef(false)
  const creatingRecordRef = useRef(false)

  const [guest, setGuest] = useState<Guest | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isCreatingRecord, setIsCreatingRecord] = useState(false)

  // Step 1-2: Sign in anonymously if not authenticated
  useEffect(() => {
    async function ensureAuth() {
      // Prevent duplicate sign-in attempts (React Strict Mode runs effects twice)
      if (auth.user || auth.isLoading || signingInRef.current) {
        return
      }

      signingInRef.current = true
      try {
        await signInAnonymously(firebaseAuth)
      } catch (err) {
        Sentry.captureException(err, {
          tags: {
            domain: 'guest',
            action: 'anonymous-signin',
          },
          extra: { projectId },
        })
        setError(
          err instanceof Error
            ? err
            : new Error('Failed to sign in automatically'),
        )
      } finally {
        signingInRef.current = false
      }
    }
    ensureAuth()
  }, [auth.user, auth.isLoading, projectId])

  // Step 3-4: Create or retrieve guest record once authenticated
  useEffect(() => {
    async function ensureGuestRecord() {
      // Wait for auth to complete and ensure we have a user
      if (auth.isLoading || !auth.user || creatingRecordRef.current) {
        return
      }

      creatingRecordRef.current = true
      setIsCreatingRecord(true)

      try {
        const authUid = auth.user.uid
        const guestRef = doc(
          firestore,
          `projects/${projectId}/guests/${authUid}`,
        )

        // Check if guest record already exists
        const existingDoc = await getDoc(guestRef)

        if (existingDoc.exists()) {
          // Guest record exists, use it
          const data = existingDoc.data()
          setGuest({
            id: existingDoc.id,
            projectId: data.projectId as string,
            authUid: data.authUid as string,
            createdAt:
              typeof data.createdAt === 'number'
                ? data.createdAt
                : (data.createdAt?.toMillis?.() ?? Date.now()),
          })
        } else {
          // Create new guest record
          const now = Date.now()
          await setDoc(guestRef, {
            id: authUid,
            projectId,
            authUid,
            createdAt: serverTimestamp(),
          })

          // Return client-side copy immediately
          setGuest({
            id: authUid,
            projectId,
            authUid,
            createdAt: now,
          })
        }
      } catch (err) {
        Sentry.captureException(err, {
          tags: {
            domain: 'guest',
            action: 'create-guest-record',
          },
          extra: { projectId },
        })
        setError(
          err instanceof Error
            ? err
            : new Error('Failed to create guest record'),
        )
      } finally {
        creatingRecordRef.current = false
        setIsCreatingRecord(false)
      }
    }
    ensureGuestRecord()
  }, [auth.user, auth.isLoading, projectId])

  return {
    guest,
    isLoading: auth.isLoading || isCreatingRecord,
    error,
    isReady: guest !== null,
  }
}
