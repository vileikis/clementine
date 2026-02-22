# SSR Firestore Offline Bug

## Problem

When a user is on the project designer route (e.g., `/workspace/:workspaceSlug/projects/:projectId/designer/welcome`) and refreshes the page, the app crashes with:

```
Something went wrong!
Failed to get document because the client is offline.
```

The server returns a `500 Internal Server Error`. This is a **production bug** — it affects any page refresh or direct navigation to any route under `/workspace/:workspaceSlug/projects/:projectId/`.

## Root Cause

The route file `$workspaceSlug.projects/$projectId.tsx` has a `loader` that calls the Firebase client SDK directly:

```ts
// src/app/workspace/$workspaceSlug.projects/$projectId.tsx (lines 21-41)
loader: async ({ params }) => {
  const projectRef = doc(firestore, 'projects', params.projectId)
  const projectDoc = await getDoc(projectRef)  // <- fails on server

  if (!projectDoc.exists()) {
    throw notFound()
  }

  const project = convertFirestoreDoc(projectDoc, projectSchema)

  if (project.status === 'deleted') {
    throw notFound()
  }

  return { project }
}
```

TanStack Start executes route loaders on the **server** during SSR. The Firebase client SDK (`firebase/firestore`) is browser-only — there is no authenticated Firestore connection on the server. The SDK treats this as "offline" and throws the error.

### Why it works without refresh

On client-side navigation (clicking links), TanStack Router runs the loader in the **browser** where the Firebase client SDK is initialized and authenticated. The bug only surfaces on full page loads (refresh, direct URL entry, sharing links) when SSR kicks in.

## Affected Routes

Every route nested under `$projectId.tsx` is affected because TanStack Start runs all parent loaders during SSR:

- `/workspace/:slug/projects/:id/designer/*` (welcome, theme, share, settings, experiences)
- `/workspace/:slug/projects/:id/distribute`
- `/workspace/:slug/projects/:id/connect`
- `/workspace/:slug/projects/:id/analytics`

## Architecture Violation

This loader violates the app's **client-first architecture** principle (see `CLAUDE.md`):

- "Firebase client SDKs for all data operations" — correct, but client SDKs don't work on the server
- "Minimal server functions (use only when absolutely necessary)"
- "SSR only for entry points and SEO (metadata, Open Graph tags)"

The loader is also **redundant** — the `ProjectLayoutRoute` component already fetches the project via `useProject(projectId)` (line 51), a client-side hook with real-time `onSnapshot` updates.

## Proposed Solution

Remove the Firestore call from the route loader and rely entirely on the existing client-side `useProject` hook for data fetching.

### Changes

**1. Remove the `loader` from `$projectId.tsx`**

Strip the `loader` property that calls `getDoc()`. The `beforeLoad` auth guard from the parent route already handles access control.

**2. Handle loading state in the component**

The component currently returns `null` when `project` is undefined (line 55-57). Replace this with a proper loading skeleton/spinner so the user sees meaningful feedback while the client-side hook fetches data.

**3. Handle not-found and deleted projects client-side**

Move the `!project` and `project.status === 'deleted'` checks into the component or the `useProject` hook, rendering the `NotFound` component when appropriate.

### Result

```ts
// After fix — no loader, client handles everything
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/projects/$projectId',
)({
  component: ProjectLayoutRoute,
  notFoundComponent: ProjectNotFound,
})

function ProjectLayoutRoute() {
  const { workspaceSlug, projectId } = Route.useParams()
  const { data: project, isLoading } = useProject(projectId)

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (!project || project.status === 'deleted') {
    return <ProjectNotFound />
  }

  return <ProjectLayout project={project} workspaceSlug={workspaceSlug} />
}
```

This aligns with how other routes in the app work (e.g., `$workspaceSlug.tsx` uses `useWorkspace` without a loader) and follows the client-first architecture standard.

## Impact

- **Fix**: Page refresh and direct navigation to project routes will work correctly
- **Risk**: Minimal — the `useProject` hook already provides the data; removing the loader just eliminates the redundant (and broken) server-side fetch
- **Trade-off**: Brief loading state on first render instead of instant data from loader cache. Acceptable given the app already shows loading states for workspace data and experiences.
