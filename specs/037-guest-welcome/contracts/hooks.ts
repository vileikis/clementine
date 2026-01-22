/**
 * Guest Access & Welcome - Hook Contracts
 *
 * This file defines the TypeScript interfaces for hooks used in the guest domain.
 * These contracts ensure type safety between components and data fetching logic.
 *
 * Feature: 037-guest-welcome
 * Date: 2026-01-20
 */

import type { Project } from '@clementine/shared'
import type { ProjectEventFull } from '@/domains/event/shared/schemas'
import type { Experience } from '@/domains/experience/shared/schemas'

// ============================================================================
// Guest Access Hook Contract
// ============================================================================

/**
 * Discriminated union for guest access validation states
 *
 * Used by useGuestAccess hook to communicate access status to containers.
 * Enables exhaustive pattern matching for clean state handling.
 */
export type GuestAccessState =
  | { status: 'loading' }
  | { status: 'not-found'; reason: 'project' | 'event' }
  | { status: 'coming-soon'; reason: 'no-active-event' | 'not-published' }
  | {
      status: 'ready'
      project: Project
      event: ProjectEventFull
      experiences: ExperienceCardData[]
    }

/**
 * Minimal experience data needed for card display
 *
 * Derived from Experience entity, contains only fields needed for UI.
 */
export interface ExperienceCardData {
  /** Experience document ID */
  id: string
  /** Display name */
  name: string
  /** Thumbnail URL (null if no media) */
  thumbnailUrl: string | null
}

/**
 * useGuestAccess hook return type
 *
 * @example
 * ```tsx
 * const access = useGuestAccess(projectId)
 *
 * if (access.status === 'loading') return <LoadingSkeleton />
 * if (access.status === 'not-found') return <ErrorPage />
 * if (access.status === 'coming-soon') return <ComingSoonPage />
 *
 * // TypeScript knows access.status === 'ready' here
 * const { project, event, experiences } = access
 * ```
 */
export type UseGuestAccessReturn = GuestAccessState

// ============================================================================
// Guest Record Hook Contract
// ============================================================================

/**
 * Guest record hook return type
 *
 * Manages guest record creation and retrieval.
 */
export interface UseGuestRecordReturn {
  /** Guest record if exists */
  guest: {
    id: string
    projectId: string
    authUid: string
    createdAt: number
  } | null
  /** True while fetching or creating */
  isLoading: boolean
  /** Error if guest record operations failed */
  error: Error | null
  /** True if guest record exists */
  isReady: boolean
}

// ============================================================================
// Published Event Hook Contract
// ============================================================================

/**
 * Published event data hook return type
 *
 * Provides access to event configuration for the welcome screen.
 */
export interface UsePublishedEventReturn {
  /** Event data with published config */
  event: ProjectEventFull | null
  /** True while fetching */
  isLoading: boolean
  /** Error if fetch failed */
  error: Error | null
}

// ============================================================================
// Experience Selection Contract
// ============================================================================

/**
 * Input for experience selection handler
 */
export interface SelectExperienceInput {
  /** Selected experience ID */
  experienceId: string
  /** Project ID from URL */
  projectId: string
  /** Workspace ID from project */
  workspaceId: string
  /** Active event ID */
  eventId: string
}

/**
 * Result of experience selection
 */
export interface SelectExperienceResult {
  /** Created session ID */
  sessionId: string
  /** Navigation URL with session param */
  navigateUrl: string
}

// ============================================================================
// Component Props Contracts
// ============================================================================

/**
 * WelcomeScreenPage container props
 */
export interface WelcomeScreenPageProps {
  /** Project ID from URL params */
  projectId: string
}

/**
 * ExperiencePlaceholder container props
 */
export interface ExperiencePlaceholderProps {
  /** Project ID from URL params */
  projectId: string
  /** Experience ID from URL params */
  experienceId: string
  /** Session ID from URL query param (optional) */
  sessionId?: string
}

/**
 * ExperienceCard component props
 */
export interface ExperienceCardProps {
  /** Experience data for display */
  experience: ExperienceCardData
  /** Callback when card is clicked */
  onSelect: (experienceId: string) => void
  /** Optional loading state while creating session */
  isLoading?: boolean
}

/**
 * ExperienceCardList component props
 */
export interface ExperienceCardListProps {
  /** List of experiences to display */
  experiences: ExperienceCardData[]
  /** Layout mode from event config */
  layout: 'list' | 'grid'
  /** Callback when an experience is selected */
  onSelect: (experienceId: string) => void
  /** ID of experience currently being selected (for loading state) */
  selectingId?: string | null
}

/**
 * ErrorPage component props
 */
export interface ErrorPageProps {
  /** Optional custom title (defaults to "404") */
  title?: string
  /** Optional custom message */
  message?: string
}

/**
 * ComingSoonPage component props
 */
export interface ComingSoonPageProps {
  /** Optional custom title */
  title?: string
  /** Optional custom message */
  message?: string
}
