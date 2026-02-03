/**
 * Guest URL generation utilities
 * Feature: 011-project-share-dialog
 */

import type { GuestUrl, ProjectId } from '../types'

/**
 * Generates guest URL for a project
 * ProjectId is already validated by TanStack Router route params
 *
 * @param projectId - Project identifier (from route params)
 * @returns Guest URL for sharing
 *
 * @example
 * const url = generateGuestUrl('abc123'); // https://app.clementine.com/join/abc123
 */
export function generateGuestUrl(projectId: string): GuestUrl {
  // Get current origin (handles dev/staging/prod)
  const origin = window.location.origin

  // Construct and brand guest URL
  return `${origin}/join/${projectId}` as GuestUrl
}

/**
 * Extracts project ID from guest URL
 * Useful for testing and validation
 *
 * @param url - Guest URL
 * @returns Project ID or null if URL doesn't match pattern
 */
export function extractProjectIdFromGuestUrl(url: GuestUrl): ProjectId | null {
  const match = url.match(/\/join\/([^/?]+)/)
  return match?.[1] ? (match[1] as ProjectId) : null
}
