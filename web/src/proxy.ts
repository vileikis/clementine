import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isValidAdminSecret } from "@/lib/auth";
import {
  PUBLIC_ROUTES,
  DEFAULT_AUTHENTICATED_ROUTE,
  isPublicRoute,
} from "@/lib/routes";

/**
 * Middleware for authentication and route protection
 *
 * Protected routes: All routes except /login and /join/*
 * Public routes: /login, /join/*
 *
 * Behavior:
 * - Unauthenticated + protected route → redirect to /login
 * - Authenticated + /login → redirect to /events
 * - Everything else → allow
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const adminSecret = request.cookies.get("ADMIN_SECRET")?.value;

  // Check authentication status
  const isAuthenticated = isValidAdminSecret(adminSecret);

  // Check if current route is public
  const isPublic = isPublicRoute(pathname);

  // Redirect unauthenticated users to login (unless already on public route)
  if (!isAuthenticated && !isPublic) {
    const loginUrl = new URL(PUBLIC_ROUTES.LOGIN, request.url);
    // Preserve the original URL as a redirect parameter
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from login page
  if (isAuthenticated && pathname === PUBLIC_ROUTES.LOGIN) {
    return NextResponse.redirect(
      new URL(DEFAULT_AUTHENTICATED_ROUTE, request.url)
    );
  }

  // Allow the request to proceed
  return NextResponse.next();
}

/**
 * Matcher configuration for middleware
 *
 * Runs on all routes except:
 * - Next.js internals (_next/static, _next/image)
 * - Static files (favicon.ico, images, etc.)
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - _next/webpack-hmr (hot module replacement in dev)
     * - favicon.ico, sitemap.xml, robots.txt
     * - Static files with extensions (images, css, js, etc.)
     */
    "/((?!_next/static|_next/image|_next/webpack-hmr|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)",
  ],
};
