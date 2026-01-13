/**
 * Share Config Update Contract
 *
 * Defines the interface for updating share screen configuration.
 * This is a client-side operation using Firebase Firestore client SDK.
 *
 * Feature: 024-share-editor
 * Date: 2026-01-13
 */

// ============================================================================
// Types
// ============================================================================

/**
 * CTA (Call-to-Action) configuration input
 */
export interface CtaConfigInput {
  /** Button text label. When null, CTA button is hidden. */
  label: string | null
  /** Destination URL. Required when label is provided. */
  url: string | null
}

/**
 * Share configuration update input
 */
export interface UpdateShareInput {
  /** Share screen title. When null, title is hidden. */
  title?: string | null
  /** Share screen description. When null, description is hidden. */
  description?: string | null
  /** CTA button configuration. When null or label is null, button is hidden. */
  cta?: CtaConfigInput | null
}

/**
 * Mutation context required for the update operation
 */
export interface UpdateShareContext {
  /** Project ID containing the event */
  projectId: string
  /** Event ID to update */
  eventId: string
}

// ============================================================================
// Mutation Hook Interface
// ============================================================================

/**
 * useUpdateShare Hook Contract
 *
 * @param projectId - Project ID containing the event
 * @param eventId - Event ID to update
 * @returns TanStack Query mutation result
 *
 * @example
 * ```tsx
 * const updateShare = useUpdateShare(projectId, eventId)
 *
 * // Update title only
 * await updateShare.mutateAsync({ title: 'Your photo is ready!' })
 *
 * // Update full config
 * await updateShare.mutateAsync({
 *   title: 'Your photo is ready!',
 *   description: 'Download or share your creation',
 *   cta: { label: 'Visit Website', url: 'https://example.com' }
 * })
 *
 * // Clear CTA
 * await updateShare.mutateAsync({ cta: null })
 * ```
 */
export interface UseUpdateShareHook {
  (projectId: string, eventId: string): {
    mutate: (input: UpdateShareInput) => void
    mutateAsync: (input: UpdateShareInput) => Promise<void>
    isPending: boolean
    isError: boolean
    error: Error | null
  }
}

// ============================================================================
// Firestore Update Contract
// ============================================================================

/**
 * Firestore update payload structure
 *
 * Updates are sent using dot-notation for atomic field updates.
 * This allows partial updates without overwriting entire share config.
 *
 * @example
 * ```typescript
 * // Input: { title: 'New Title', cta: { label: 'Click', url: 'https://...' } }
 * // Firestore update:
 * {
 *   'draftConfig.share.title': 'New Title',
 *   'draftConfig.share.cta.label': 'Click',
 *   'draftConfig.share.cta.url': 'https://...',
 *   'draftVersion': increment(1),
 *   'updatedAt': serverTimestamp()
 * }
 * ```
 */
export interface FirestoreShareUpdate {
  /** Dot-notation update path */
  path: `draftConfig.share.${string}`
  /** Field value (string, null, or nested object) */
  value: string | null | Record<string, unknown>
}

// ============================================================================
// Validation Contract
// ============================================================================

/**
 * Validation rules for share configuration
 */
export const SHARE_VALIDATION = {
  /** Maximum length for title field */
  TITLE_MAX_LENGTH: 100,
  /** Maximum length for description field */
  DESCRIPTION_MAX_LENGTH: 500,
  /** Maximum length for CTA label */
  CTA_LABEL_MAX_LENGTH: 50,
  /** URL validation: must be valid URL format (http/https) */
  URL_PATTERN: /^https?:\/\/.+/,
} as const

/**
 * Validation error codes
 */
export const SHARE_VALIDATION_ERRORS = {
  TITLE_TOO_LONG: 'Title must be 100 characters or less',
  DESCRIPTION_TOO_LONG: 'Description must be 500 characters or less',
  CTA_LABEL_TOO_LONG: 'CTA label must be 50 characters or less',
  CTA_URL_INVALID: 'Please enter a valid URL',
  CTA_URL_REQUIRED: 'URL is required when CTA label is provided',
} as const
