# Research: Fix SSR Firestore Offline Crash

**Feature**: 077-fix-ssr-offline
**Date**: 2026-02-22

## Research Summary

This bug fix has no major unknowns — the root cause is well-understood and the fix follows an established pattern already in the codebase. Research focused on confirming assumptions and identifying the exact implementation approach.

## R1: Root Cause Confirmation

**Decision**: The 500 error is caused by the Firebase client SDK (`firebase/firestore`) being invoked server-side during SSR in the route loader.

**Rationale**: TanStack Start runs route `loader` functions on the server during SSR. The Firebase client SDK's `getDoc()` function requires an authenticated browser connection. On the server, there is no Firebase Auth context or active Firestore connection, so the SDK treats it as "offline" and throws: `"Failed to get document because the client is offline."`

**Evidence**:
- `$projectId.tsx` (line 21-41) calls `getDoc()` in the loader
- The Firebase client SDK is initialized in `@/integrations/firebase/client` — browser-only
- The error is `FirebaseError: Failed to get document because the client is offline`

## R2: Existing Pattern — Workspace Route

**Decision**: Follow the `$workspaceSlug.tsx` pattern exactly: no loader, client-side hook, three-state rendering (loading/error/success).

**Rationale**: The workspace route (`$workspaceSlug.tsx`) already solves the identical problem correctly:
- No `loader` — all data fetched via `useWorkspace()` hook
- Loading state: centered "Loading workspace..." text
- Error/not-found state: `WorkspaceNotFound` component
- Success state: renders `<Outlet />`

**Alternatives considered**:
1. *Wrap loader in try/catch and return empty data on server* — Rejected: adds complexity, still attempts a broken SDK call, violates client-first architecture
2. *Use `isServer` check in loader to skip on server* — Rejected: loader is specifically for server-side data; skipping it defeats its purpose. Simpler to remove it entirely
3. *Move to Firebase Admin SDK in loader* — Rejected: requires server credentials, violates client-first architecture, adds unnecessary server dependency

## R3: `useProject` Hook Capabilities

**Decision**: The `useProject` hook is a complete replacement for the loader's data fetching.

**Rationale**: The hook provides:
- Real-time data via `onSnapshot` listener (better than loader's one-time `getDoc`)
- TanStack Query integration with `isLoading`, `isError`, `data` states
- Automatic cache management with `staleTime: Infinity`
- Handles non-existent documents by setting cache to `null`
- Same `convertFirestoreDoc` + `projectSchema` validation as the loader

**Key detail**: The hook returns `null` for non-existent projects (line 40 of `useProject.ts`), which can be used for not-found detection.

## R4: Loading State Approach

**Decision**: Use a simple centered loading text, matching the workspace route's loading pattern.

**Rationale**: The workspace route uses a minimal `<div className="flex items-center justify-center min-h-screen">` with a text indicator. This is consistent, requires no additional component dependencies, and provides adequate feedback for the brief loading window.

**Alternatives considered**:
1. *Full skeleton layout* — Rejected: over-engineering for a brief loading state; the project layout is complex and a skeleton would be hard to maintain
2. *ThemedLoading component* — Considered but rejected: requires ThemeProvider context which may not be available at the project layout level; simpler to match workspace pattern
3. *No loading state (return null)* — Rejected: current behavior (`return null` at line 55-57) causes a flash of blank content

## R5: Not-Found/Deleted Project Handling

**Decision**: Check `!project` and `project.status === 'deleted'` in the component, rendering `ProjectNotFound` when either condition is true.

**Rationale**: The existing `ProjectNotFound` component already has the correct messaging and navigation. Moving the checks from the loader to the component preserves identical user experience. The `useProject` hook returns `null` for non-existent docs, making the `!project` check work naturally.

**Key consideration**: The real-time listener means if a project is deleted while a user is viewing it, they'll see the not-found view immediately — an improvement over the loader approach which only checked at page load.
