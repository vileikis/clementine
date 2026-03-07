'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { onIdTokenChanged, signOut } from 'firebase/auth'
import { useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import * as Sentry from '@sentry/tanstackstart-react'
import { clearSessionFn, createSessionFn } from '../server/functions'
import type { User } from 'firebase/auth'
import type {
  AuthContextValue,
  AuthState,
  TypedIdTokenResult,
} from '../types/auth.types'
import { auth } from '@/integrations/firebase/client'

const AUTH_TIMEOUT_MS = 6_000

const UNAUTHENTICATED_STATE: AuthState = {
  user: null,
  isAdmin: false,
  isAnonymous: false,
  isLoading: false,
  hasTimedOut: false,
  idTokenResult: null,
}

function logAuthEvent(
  message: string,
  level: 'info' | 'warning' | 'error',
  data?: Record<string, unknown>,
) {
  Sentry.addBreadcrumb({ category: 'auth', message, level, data })
  const loggers = {
    error: console.error,
    warning: console.warn,
    info: console.info,
  }
  const log = loggers[level] ?? console.info
  log(`[AuthProvider] ${message}`, data ?? '')
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAdmin: false,
    isAnonymous: false,
    isLoading: true,
    hasTimedOut: false,
    idTokenResult: null,
  })

  const router = useRouter()

  // Wrap server functions with useServerFn hook
  const createSession = useServerFn(createSessionFn)
  const clearSession = useServerFn(clearSessionFn)

  /**
   * Logout user (clears both Firebase auth and server session)
   * Automatically navigates to /login after logout
   */
  const logout = useCallback(async () => {
    try {
      // 1. Clear Firebase client auth
      await signOut(auth)

      // 2. Clear server session
      await clearSession()

      // 3. Navigate to login
      router.navigate({ to: '/login' })
    } catch (error) {
      Sentry.captureException(error, {
        tags: { component: 'AuthProvider', action: 'logout' },
      })
      // Defensive: Navigate to login even if error occurred
      router.navigate({ to: '/login' })
    }
  }, [clearSession, router])

  useEffect(() => {
    const startTime = Date.now()
    const elapsed = () => Date.now() - startTime
    let authResolved = false

    logAuthEvent('Auth initialization started', 'info')

    const timeoutId = setTimeout(() => {
      if (!authResolved) {
        logAuthEvent('Auth initialization timed out', 'warning', {
          elapsed: elapsed(),
        })
        setAuthState({ ...UNAUTHENTICATED_STATE, hasTimedOut: true })
      }
    }, AUTH_TIMEOUT_MS)

    const resolve = () => {
      authResolved = true
      clearTimeout(timeoutId)
    }

    const unsubscribe = onIdTokenChanged(auth, async (user: User | null) => {
      try {
        if (user) {
          const idToken = await user.getIdToken()
          const idTokenResult =
            (await user.getIdTokenResult()) as TypedIdTokenResult
          await createSession({ data: { idToken } })

          resolve()
          logAuthEvent('Auth resolved successfully', 'info', {
            elapsed: elapsed(),
            isAnonymous: user.isAnonymous,
          })
          setAuthState({
            user,
            isAdmin: idTokenResult.claims.admin === true,
            isAnonymous: user.isAnonymous,
            isLoading: false,
            hasTimedOut: false,
            idTokenResult,
          })
        } else {
          resolve()
          logAuthEvent('Auth resolved (no user)', 'info', {
            elapsed: elapsed(),
          })
          setAuthState(UNAUTHENTICATED_STATE)
        }
      } catch (error) {
        resolve()
        Sentry.captureException(error, {
          tags: { component: 'AuthProvider', action: 'onIdTokenChanged' },
        })
        logAuthEvent(
          `Auth error: ${error instanceof Error ? `${error.name}: ${error.message}` : String(error)}`,
          'error',
        )
        setAuthState(UNAUTHENTICATED_STATE)
      }
    })

    return () => {
      clearTimeout(timeoutId)
      unsubscribe()
    }
  }, [createSession])

  const value: AuthContextValue = {
    ...authState,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
