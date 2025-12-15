"use client"

import { useState, useEffect } from "react"
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  type User,
} from "firebase/auth"
import { app } from "@/lib/firebase/client"
import type { GuestAuthState } from "../types"

/**
 * Hook for anonymous Firebase authentication.
 *
 * Automatically signs in anonymously if no user is authenticated.
 * Firebase persists the anonymous user session in IndexedDB,
 * so returning guests will get the same UID.
 *
 * @returns GuestAuthState with user, userId, loading, and error
 */
export function useGuestAuth(): GuestAuthState {
  const [user, setUser] = useState<{ uid: string; isAnonymous: boolean } | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const auth = getAuth(app)

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: User | null) => {
        if (firebaseUser) {
          // User already authenticated
          setUser({
            uid: firebaseUser.uid,
            isAnonymous: firebaseUser.isAnonymous,
          })
          setLoading(false)
          setError(null)
        } else {
          // No user - sign in anonymously
          try {
            const credential = await signInAnonymously(auth)
            setUser({
              uid: credential.user.uid,
              isAnonymous: credential.user.isAnonymous,
            })
            setLoading(false)
            setError(null)
          } catch (e) {
            console.error("Failed to sign in anonymously:", e)
            setError(e instanceof Error ? e : new Error("Authentication failed"))
            setLoading(false)
          }
        }
      },
      (e) => {
        console.error("Auth state error:", e)
        setError(e)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  return {
    user,
    userId: user?.uid ?? null,
    loading,
    error,
  }
}
