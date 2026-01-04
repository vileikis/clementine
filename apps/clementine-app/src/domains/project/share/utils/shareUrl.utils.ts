/**
 * Guest URL generation utilities
 * Feature: 011-project-share-dialog
 */

import { validateGuestUrl, validateProjectId } from './validation'
import type { GuestUrl, ProjectId } from '../types'

/**
 * Generates guest URL for a project
 * Validates inputs and output
 *
 * @param projectId - Project identifier (from route params)
 * @returns Validated guest URL
 * @throws {ZodError} if projectId is invalid or URL generation fails
 *
 * @example
 * const url = generateGuestUrl('abc123'); // https://app.clementine.com/guest/abc123
 */
export function generateGuestUrl(projectId: string): GuestUrl {
  // Validate input
  const validatedId = validateProjectId(projectId)

  // Get current origin (handles dev/staging/prod)
  const origin = window.location.origin

  // Construct guest URL
  const url = `${origin}/guest/${validatedId}`

  // Validate output
  const validatedUrl = validateGuestUrl(url)

  return validatedUrl
}

/**
 * Extracts project ID from guest URL
 * Useful for testing and validation
 *
 * @param url - Guest URL
 * @returns Project ID or null if invalid
 */
export function extractProjectIdFromGuestUrl(url: GuestUrl): ProjectId | null {
  try {
    const match = url.match(/\/guest\/([^/?]+)/)
    if (!match?.[1]) return null

    return validateProjectId(match[1])
  } catch {
    return null
  }
}
