// Route constants for authentication and navigation

/**
 * Public routes that don't require authentication
 */
export const PUBLIC_ROUTES = {
  LOGIN: "/login",
  JOIN: "/join",
} as const;

/**
 * Default redirect route after successful login
 */
export const DEFAULT_AUTHENTICATED_ROUTE = "/events";

/**
 * Check if a pathname is a public route (doesn't require auth)
 */
export function isPublicRoute(pathname: string): boolean {
  // Login page
  if (pathname === PUBLIC_ROUTES.LOGIN) {
    return true;
  }
  
  // All join routes (guest links)
  if (pathname.startsWith(PUBLIC_ROUTES.JOIN)) {
    return true;
  }
  
  return false;
}
