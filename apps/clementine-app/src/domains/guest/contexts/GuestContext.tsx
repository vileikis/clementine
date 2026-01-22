/**
 * GuestContext
 *
 * React Context for sharing ready state from GuestLayout with child routes.
 * Provides access to project, event, experiences, and guest data without
 * needing to re-fetch or re-initialize in child components.
 *
 * Usage:
 * - GuestLayout renders GuestProvider when base state is ready
 * - Experiences are lazy-loaded and added to context
 * - Child routes (WelcomeScreen, ExperiencePage) use useGuestContext() to access data
 */
import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import type { User } from 'firebase/auth'
import type { Project } from '@clementine/shared'
import type { ProjectEventFull } from '@/domains/event/shared'
import type { Experience } from '@/domains/experience/shared'
import type { Guest } from '../schemas/guest.schema'

/**
 * Value provided by the guest context
 *
 * Contains all data needed by child routes after initialization is complete.
 * Experiences are lazy-loaded after the base state is ready.
 */
export interface GuestContextValue {
  /** Authenticated user (anonymous or admin) */
  user: User
  /** Project being accessed */
  project: Project
  /** Active event with published config */
  event: ProjectEventFull
  /** Guest record for the current user */
  guest: Guest
  /** Full experience documents for enabled experiences (empty array while loading) */
  experiences: Experience[]
  /** Whether experiences are still loading */
  experiencesLoading: boolean
}

const GuestContext = createContext<GuestContextValue | null>(null)

export interface GuestProviderProps {
  /** Context value containing all guest data */
  value: GuestContextValue
  /** Child components to render */
  children: ReactNode
}

/**
 * Provider component for guest context
 *
 * Should only be rendered by GuestLayout when initialization is complete.
 *
 * @example
 * ```tsx
 * function GuestLayout({ projectId }) {
 *   const state = useGuestPageInit(projectId)
 *
 *   if (state.status !== 'ready') {
 *     // Handle other states...
 *   }
 *
 *   return (
 *     <GuestProvider value={state}>
 *       <Outlet />
 *     </GuestProvider>
 *   )
 * }
 * ```
 */
export function GuestProvider({ value, children }: GuestProviderProps) {
  return <GuestContext.Provider value={value}>{children}</GuestContext.Provider>
}

/**
 * Hook to access guest context in child routes
 *
 * Must be used within a GuestProvider (rendered by GuestLayout).
 * Throws if used outside of provider - this indicates a routing/structure error.
 *
 * @returns Guest context value with project, event, experiences, and guest data
 * @throws Error if used outside of GuestProvider
 *
 * @example
 * ```tsx
 * function WelcomeScreen() {
 *   const { experiences, experiencesLoading } = useGuestContext()
 *
 *   if (experiencesLoading) return <SkeletonCards />
 *
 *   return <ExperienceCards experiences={experiences} />
 * }
 * ```
 */
export function useGuestContext(): GuestContextValue {
  const context = useContext(GuestContext)
  if (!context) {
    throw new Error(
      'useGuestContext must be used within a GuestProvider. ' +
        'Make sure this component is rendered as a child of GuestLayout.',
    )
  }
  return context
}
