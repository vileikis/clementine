// Public API for auth domain

// Client-side components and providers
export { AuthProvider, useAuth } from './providers/AuthProvider'

// Authentication hooks
export { useAnonymousSignIn } from './hooks/useAnonymousSignIn'
export { LoginPage } from './components/LoginPage'
export { WaitingMessage } from './components/WaitingMessage'

// Route guards (server-side, work on both server and client)
export * from './guards'

// Auth type helpers (pure functions for conditional logic)
export * from './utils'

// Server functions (for direct use in components/routes)
export * from './server'

// TypeScript types
export type * from './types/auth.types'
export type * from './types/session.types'
