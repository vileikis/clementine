# Route Contracts: Experience Designer Tabs

**Feature**: 050-exp-designer-tabs
**Date**: 2026-01-30
**Purpose**: Define route structure, parameters, and navigation contracts

## Overview

This document specifies the URL structure and routing contracts for the Experience Designer tab navigation.

## Route Hierarchy

```
/workspace/$workspaceSlug/experiences/$experienceId
├── [redirect to /collect]
├── /collect (Collect tab - step management)
└── /generate (Generate tab - transform pipeline placeholder)
```

## Route Definitions

### 1. Parent Route (Redirect)

**Path**: `/workspace/:workspaceSlug/experiences/:experienceId`

**Purpose**: Redirect to default tab (Collect)

**File**: `apps/clementine-app/src/app/workspace/$workspaceSlug.experiences/$experienceId.tsx`

**Behavior**:
- **Before Load**: Executes redirect before rendering
- **Redirect Target**: `/workspace/:workspaceSlug/experiences/:experienceId/collect`
- **Params Preserved**: Yes (workspaceSlug, experienceId passed through)
- **Search Params Preserved**: No (root has no search params)

**Contract**:
```typescript
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/experiences/$experienceId'
)({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/workspace/$workspaceSlug/experiences/$experienceId/collect',
      params,
    })
  },
})
```

**HTTP Response**: 307 Temporary Redirect (server-side)

**Edge Cases**:
- Direct navigation to parent route → Redirects to /collect
- Bookmark of parent route → Redirects to /collect
- External link to parent route → Redirects to /collect

---

### 2. Collect Tab Route

**Path**: `/workspace/:workspaceSlug/experiences/:experienceId/collect`

**Purpose**: Step management interface (existing designer functionality)

**File**: `apps/clementine-app/src/app/workspace/$workspaceSlug.experiences/$experienceId.collect.tsx`

**Path Parameters**:

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `workspaceSlug` | string | Yes | Workspace URL slug | `acme-corp` |
| `experienceId` | string | Yes | Experience document ID | `exp-abc123` |

**Search Parameters**:

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `step` | string | No | Selected step ID for deep linking | `step-def456` |

**Search Schema**:
```typescript
const collectSearchSchema = z.object({
  step: z.string().optional(),
})

type CollectSearch = z.infer<typeof collectSearchSchema>
```

**Contract**:
```typescript
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/experiences/$experienceId/collect'
)({
  validateSearch: (search) => collectSearchSchema.parse(search),
  component: ExperienceCollectRoute,
})

function ExperienceCollectRoute() {
  const { experience, workspaceSlug, workspaceId } = Route.useLoaderData()

  return (
    <ExperienceDesignerLayout
      experience={experience}
      workspaceSlug={workspaceSlug}
      workspaceId={workspaceId}
    >
      <ExperienceCollectPage
        experience={experience}
        workspaceSlug={workspaceSlug}
        workspaceId={workspaceId}
      />
    </ExperienceDesignerLayout>
  )
}
```

**Response**: HTML page with step management UI

**Edge Cases**:
- `?step=invalid-id` → Step selection ignored (no step highlighted)
- `?step=` (empty value) → Treated as no step selected
- `?step=abc&step=def` (duplicate params) → First value used
- No `?step` param → No step selected initially

---

### 3. Generate Tab Route

**Path**: `/workspace/:workspaceSlug/experiences/:experienceId/generate`

**Purpose**: Transform pipeline configuration (placeholder/WIP)

**File**: `apps/clementine-app/src/app/workspace/$workspaceSlug.experiences/$experienceId.generate.tsx`

**Path Parameters**:

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `workspaceSlug` | string | Yes | Workspace URL slug | `acme-corp` |
| `experienceId` | string | Yes | Experience document ID | `exp-abc123` |

**Search Parameters**: None (no search schema defined)

**Contract**:
```typescript
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/experiences/$experienceId/generate'
)({
  component: ExperienceGenerateRoute,
})

function ExperienceGenerateRoute() {
  const { experience, workspaceSlug, workspaceId } = Route.useLoaderData()

  return (
    <ExperienceDesignerLayout
      experience={experience}
      workspaceSlug={workspaceSlug}
      workspaceId={workspaceId}
    >
      <ExperienceGeneratePage />
    </ExperienceDesignerLayout>
  )
}
```

**Response**: HTML page with WIP placeholder message

**Edge Cases**:
- Any query params → Ignored (no search schema)
- `?step=abc` → Ignored (step param not used in Generate tab)

---

## Navigation Contract

### Tab Switching Behavior

**From Collect to Generate**:
- **URL Change**: `/collect?step=abc` → `/generate?step=abc`
- **Search Params**: Preserved (TanStack Router default behavior)
- **State**: Save status indicators reflect same state
- **Performance**: < 1 second transition (client-side navigation)

**From Generate to Collect**:
- **URL Change**: `/generate?step=abc` → `/collect?step=abc`
- **Search Params**: Preserved (step selection restored)
- **State**: Selected step re-rendered in preview and config panel
- **Performance**: < 1 second transition (client-side navigation)

### Browser Navigation

**Back Button**:
- `/collect` → `/generate` → (back) → `/collect`
- History stack managed by TanStack Router
- Search params restored from history

**Forward Button**:
- `/collect` → (back) → (forward) → `/collect`
- Same behavior as browser forward

**Refresh (F5)**:
- Current tab and search params preserved
- SSR re-renders current route
- Experience data re-fetched from Firestore

### Bookmarking

**Bookmark URL**: Full URL with tab and search params

**Examples**:
- `https://app.clementine.ai/workspace/acme/experiences/exp-123/collect?step=step-456`
- `https://app.clementine.ai/workspace/acme/experiences/exp-123/generate`

**Behavior**: Direct navigation to bookmarked URL works correctly (SSR support)

---

## Shared Loader Contract

### Parent Route Loader

**Route**: `/workspace/$workspaceSlug/experiences/$experienceId` (parent)

**Data Loaded**:
```typescript
interface LoaderData {
  experience: Experience      // Experience document from Firestore
  workspaceSlug: string       // Workspace slug from URL
  workspaceId: string         // Workspace ID (derived from slug)
}
```

**Inheritance**: Child routes (Collect, Generate) inherit loader data via `Route.useLoaderData()`

**Caching**: TanStack Router caches loader data (avoids re-fetch on tab switch)

**Error Handling**:
- Experience not found → 404 page
- Experience deleted (`status: 'deleted'`) → 404 page
- Firestore permission denied → Error boundary

---

## Tab Configuration Contract

### TabItem Interface

```typescript
interface TabItem {
  id: string    // Tab identifier
  label: string // Display label
  to: string    // Route path
}
```

### Tab Array

```typescript
const experienceDesignerTabs: TabItem[] = [
  {
    id: 'collect',
    label: 'Collect',
    to: '/workspace/$workspaceSlug/experiences/$experienceId/collect',
  },
  {
    id: 'generate',
    label: 'Generate',
    to: '/workspace/$workspaceSlug/experiences/$experienceId/generate',
  },
]
```

**Passed to**: `TopNavBar` component via `tabs` prop

**Active Detection**: `TopNavBar` matches current route path against `to` values

**Rendering**: `<Link to={tab.to}>` for each tab (preserves search params)

---

## URL Parameter Encoding

### Path Parameters

**Workspace Slug**:
- Format: Lowercase alphanumeric with hyphens
- Example: `acme-corp`, `test-workspace-123`
- Encoding: URL-safe (no encoding needed)

**Experience ID**:
- Format: Firestore document ID (alphanumeric)
- Example: `exp-abc123`, `5GqK3mZP7dR2wX9nL4sT`
- Encoding: URL-safe (no encoding needed)

### Search Parameters

**Step ID**:
- Format: UUID v4 or custom alphanumeric
- Example: `98b51e24-f859-4e75-8dd3-f84d8058681c`
- Encoding: URL-safe (no encoding needed)

---

## SEO & Metadata Contract

### Page Titles

- **Collect Tab**: `{experienceName} - Collect | Clementine`
- **Generate Tab**: `{experienceName} - Generate | Clementine`

### Meta Tags

```html
<head>
  <title>{experienceName} - Collect | Clementine</title>
  <meta name="description" content="Configure data collection steps for {experienceName}" />
  <meta name="robots" content="noindex, nofollow" />  <!-- Designer is admin-only -->
</head>
```

### Open Graph

Not applicable (admin-only pages, no social sharing)

---

## Security Contract

### Authentication

**Required**: Yes (admin only)

**Enforcement**: Parent route loader checks user authentication via `useAuth()`

**Redirect**: Unauthenticated users → `/login` with return URL

### Authorization

**Required**: Yes (workspace member with admin role)

**Enforcement**: Firestore security rules prevent unauthorized reads

**Error**: 403 Forbidden (permission denied) → Error boundary

### Route Protection

All child routes inherit authentication/authorization from parent route.

---

## Performance Contract

### Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Tab switch (client-side) | < 1 second | Time from click to tab highlighted |
| Page load (SSR) | < 2 seconds (4G) | Time to interactive (TTI) |
| Search param update | < 100ms | Time from step click to URL update |
| Back/forward navigation | < 500ms | Browser history navigation |

### Optimization Strategies

- **Route caching**: TanStack Router caches loader data across tabs
- **Component reuse**: Same `ExperienceDesignerLayout` for both tabs
- **Lazy loading**: Tab components loaded on-demand (code splitting)
- **SSR**: Initial page load server-rendered for performance

---

## Summary

This routing contract defines:
- **3 routes**: Parent (redirect), Collect, Generate
- **Tab navigation**: Client-side transitions with search param preservation
- **Deep linking**: Step selection via `?step=` query param
- **Performance**: < 1 second tab switching, < 2 second page load
- **Security**: Admin-only access enforced via parent route loader

All routes follow TanStack Router conventions and maintain type safety with Zod validation.
