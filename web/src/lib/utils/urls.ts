// URL generation utilities
// Constructs full URLs at runtime based on current environment

/**
 * Generates the full join URL for an event from its joinPath.
 * Uses NEXT_PUBLIC_BASE_URL if available, otherwise falls back to window.location.origin.
 *
 * @param joinPath - The path-relative join URL (e.g., "/join/abc123")
 * @returns Full URL (e.g., "https://example.com/join/abc123")
 */
export function getJoinUrl(joinPath: string): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl}${joinPath}`;
}

/**
 * Gets the base URL for the application.
 * Prefers NEXT_PUBLIC_BASE_URL, falls back to window.location.origin in browser.
 *
 * @returns Base URL without trailing slash
 */
export function getBaseUrl(): string {
  // Server-side or explicitly configured
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, ''); // Remove trailing slash
  }

  // Client-side fallback
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // Fallback for SSR without env var (shouldn't happen in production)
  return 'http://localhost:3000';
}
