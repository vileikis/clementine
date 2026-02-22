# Quickstart: Fix SSR Firestore Offline Crash

**Feature**: 077-fix-ssr-offline
**Date**: 2026-02-22

## What This Fix Does

Removes a broken server-side Firestore call from the project route loader that causes a 500 error on every page refresh or direct URL navigation to project routes. Replaces it with client-side data fetching using the existing `useProject` hook, matching the established pattern from the workspace route.

## Files Changed

| File | Change |
|------|--------|
| `apps/clementine-app/src/app/workspace/$workspaceSlug.projects/$projectId.tsx` | Remove `loader`, update component to handle loading/not-found states |

## Before vs After

### Before (broken)
```
Page refresh → SSR → loader calls getDoc() → Firebase offline → 500 error
```

### After (fixed)
```
Page refresh → SSR renders loading state → client hydrates → useProject() fetches data → renders project
```

## How to Verify

1. Start the dev server: `pnpm app:dev`
2. Navigate to any project route (e.g., `/workspace/slug/projects/id/designer/welcome`)
3. Refresh the page — should load successfully with a brief loading state
4. Navigate to a non-existent project ID — should show "Project Not Found"
5. Use in-app navigation between project sub-routes — should work without interruption

## How to Verify in Production Build

1. Build: `pnpm app:build`
2. Start: `pnpm app:start`
3. Repeat the verification steps above — SSR behavior is only visible in production builds
