/**
 * Permission Utilities
 *
 * Extracted from PermissionPrompt.tsx for reuse in themed renderers.
 * These utilities provide platform-specific behavior without UI coupling.
 */

/**
 * Detect if running in a mobile browser
 */
export function isMobileBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

/**
 * Get instructions for enabling camera based on platform
 */
export function getDeniedInstructions(): string {
  if (isMobileBrowser()) {
    return 'To use the camera, please go to your device settings, find your browser app, and enable camera access. Then return here and refresh the page.'
  }
  return "To use the camera, click the camera icon in your browser's address bar or go to site settings and allow camera access. Then refresh this page."
}
