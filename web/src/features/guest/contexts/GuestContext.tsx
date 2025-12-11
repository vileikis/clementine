"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react"
import { useGuestAuth } from "../hooks/useGuestAuth"
import { createGuestAction } from "../actions"
import type { Guest, GuestAuthState } from "../types"

/**
 * Context value for guest state management
 */
interface GuestContextValue {
  /** Firebase auth state */
  auth: GuestAuthState
  /** Guest record from Firestore (null until created) */
  guest: Guest | null
  /** True while guest record is being created/fetched */
  guestLoading: boolean
  /** Error from guest record creation */
  guestError: Error | null
  /** Combined loading state (auth OR guest loading) */
  isLoading: boolean
  /** Refresh guest record */
  refreshGuest: () => Promise<void>
}

const GuestContext = createContext<GuestContextValue | null>(null)

interface GuestProviderProps {
  /** Project ID for guest record */
  projectId: string
  /** Children to render */
  children: ReactNode
}

/**
 * Provider component for guest authentication and record management.
 *
 * Wraps useGuestAuth for Firebase auth and automatically creates/fetches
 * guest records via Server Actions when auth is ready.
 */
export function GuestProvider({ projectId, children }: GuestProviderProps) {
  const auth = useGuestAuth()
  const [guest, setGuest] = useState<Guest | null>(null)
  const [guestLoading, setGuestLoading] = useState(true)
  const [guestError, setGuestError] = useState<Error | null>(null)

  // Create or fetch guest record when auth is ready
  const initializeGuest = useCallback(async () => {
    if (!auth.userId) {
      setGuestLoading(false)
      return
    }

    setGuestLoading(true)
    setGuestError(null)

    try {
      const result = await createGuestAction(projectId, auth.userId)
      if (result.success) {
        setGuest(result.data)
      } else {
        // Log error but don't block the UI
        console.error("Failed to create guest:", result.error)
        setGuestError(new Error(result.error.message))
      }
    } catch (e) {
      console.error("Error creating guest:", e)
      setGuestError(e instanceof Error ? e : new Error("Failed to create guest"))
    } finally {
      setGuestLoading(false)
    }
  }, [projectId, auth.userId])

  // Initialize guest when auth is ready
  useEffect(() => {
    if (!auth.loading && auth.userId) {
      initializeGuest()
    } else if (!auth.loading && !auth.userId) {
      // Auth failed - stop loading
      setGuestLoading(false)
    }
  }, [auth.loading, auth.userId, initializeGuest])

  const value: GuestContextValue = {
    auth,
    guest,
    guestLoading,
    guestError,
    isLoading: auth.loading || guestLoading,
    refreshGuest: initializeGuest,
  }

  return <GuestContext.Provider value={value}>{children}</GuestContext.Provider>
}

/**
 * Hook to access guest context.
 * Must be used within a GuestProvider.
 */
export function useGuestContext(): GuestContextValue {
  const context = useContext(GuestContext)
  if (!context) {
    throw new Error("useGuestContext must be used within a GuestProvider")
  }
  return context
}
