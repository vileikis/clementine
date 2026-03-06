## Brief 3: Investigate & Fix `auth.isLoading` Infinite Hang

**Objective**
Prevent the application from getting permanently stuck on the "Initializing authentication..." screen within `__root.tsx` due to unresolved `auth.isLoading` states.

**Acceptance Criteria**

- **Implement Timeout/Fallback**: Introduce a timeout mechanism to the auth initialization. If auth takes longer than a reasonable threshold (e.g., 10 seconds), resolve the loading state and gracefully fall back to an unauthenticated/error state.
- **Add Telemetry**: Implement robust logging around the auth initialization lifecycle to capture the exact failure point in production.
- **Ensure Route Rendering**: The `RootLayout` must always eventually render `<Outlet />` or a clear, actionable error state for the user.

**Technical Notes**
This is a race condition or silent failure likely originating in the auth provider itself. Check for unhandled promise rejections or dropped network requests in the authentication service library.
