# Quickstart: Flatten Project/Event Structure

**Feature**: 042-flatten-structure-refactor
**Date**: 2026-01-26

## Overview

This refactor flattens the nested project/event structure by merging event configuration directly into the project document. After this change:

- Projects contain their configuration directly (`draftConfig`, `publishedConfig`)
- The `events` subcollection is eliminated
- Routes and hooks reference projects only (no more `eventId`)

---

## Before & After

### Importing Types

**Before:**
```typescript
import {
  projectSchema,
  type Project,
  projectEventFullSchema,
  type ProjectEventFull,
  projectEventConfigSchema,
  type ProjectEventConfig,
} from '@clementine/shared'
```

**After:**
```typescript
import {
  projectSchema,
  type Project,           // Now includes config
  projectConfigSchema,    // Renamed from projectEventConfigSchema
  type ProjectConfig,     // Renamed from ProjectEventConfig
} from '@clementine/shared'
```

### Fetching Project Data

**Before (Two Queries):**
```typescript
// Route loader
const project = await queryClient.ensureQueryData(projectQuery(projectId))
const event = await queryClient.ensureQueryData(projectEventQuery(projectId, eventId))

// Component
const { data: project } = useProject(projectId)
const { data: event } = useProjectEvent(projectId, eventId)

// Access config
const theme = event?.draftConfig?.theme
```

**After (Single Query):**
```typescript
// Route loader
const project = await queryClient.ensureQueryData(projectQuery(projectId))

// Component
const { data: project } = useProject(projectId)

// Access config directly
const theme = project?.draftConfig?.theme
```

### Updating Configuration

**Before:**
```typescript
import { useUpdateTheme } from '@/domains/event/theme/hooks'

function ThemeEditor({ projectId, eventId }) {
  const updateTheme = useUpdateTheme(projectId, eventId)

  const handleSave = (theme) => {
    updateTheme.mutateAsync(theme)
  }
}
```

**After:**
```typescript
import { useUpdateTheme } from '@/domains/project-config/theme/hooks'

function ThemeEditor({ projectId }) {
  const updateTheme = useUpdateTheme(projectId)

  const handleSave = (theme) => {
    updateTheme.mutateAsync(theme)
  }
}
```

### Publishing

**Before:**
```typescript
import { usePublishEvent } from '@/domains/event/designer/hooks'

const publish = usePublishEvent(projectId, eventId)
await publish.mutateAsync()
```

**After:**
```typescript
import { usePublishProjectConfig } from '@/domains/project-config/designer/hooks'

const publish = usePublishProjectConfig(projectId)
await publish.mutateAsync()
```

---

## URL Changes

### Admin Routes

**Before:**
```
/workspace/{slug}/projects/{projectId}/events/{eventId}/welcome
/workspace/{slug}/projects/{projectId}/events/{eventId}/theme
/workspace/{slug}/projects/{projectId}/events/{eventId}/share
/workspace/{slug}/projects/{projectId}/events/{eventId}/settings
```

**After:**
```
/workspace/{slug}/projects/{projectId}/welcome
/workspace/{slug}/projects/{projectId}/theme
/workspace/{slug}/projects/{projectId}/share
/workspace/{slug}/projects/{projectId}/settings
```

### Guest Routes (Unchanged)

```
/join/{projectId}/...
```

---

## Route Params

**Before:**
```typescript
function WelcomePage() {
  const { projectId, eventId, workspaceSlug } = useParams()
  // ...
}
```

**After:**
```typescript
function WelcomePage() {
  const { projectId, workspaceSlug } = useParams()
  // eventId no longer exists
  // ...
}
```

---

## Creating Sessions

**Before:**
```typescript
const session = await createSession({
  projectId,
  eventId,       // Required
  experienceId,
  workspaceId,
  mode: 'guest',
  configSource: 'published',
})
```

**After:**
```typescript
const session = await createSession({
  projectId,
  // eventId removed
  experienceId,
  workspaceId,
  mode: 'guest',
  configSource: 'published',
})
```

---

## Schema Types

### Project (Extended)

```typescript
import { type Project } from '@clementine/shared'

// Project now includes:
interface Project {
  id: string
  name: string
  workspaceId: string
  status: 'draft' | 'live' | 'deleted'
  type: 'standard' | 'ghost'

  // NEW: Config fields (from ProjectEventFull)
  draftConfig: ProjectConfig | null
  publishedConfig: ProjectConfig | null
  draftVersion: number
  publishedVersion: number | null
  publishedAt: number | null

  createdAt: number
  updatedAt: number
  deletedAt: number | null
}
```

### ProjectConfig (Renamed)

```typescript
import { type ProjectConfig } from '@clementine/shared'

// Previously ProjectEventConfig
interface ProjectConfig {
  schemaVersion: number
  overlays: OverlaysConfig | null
  shareOptions: ShareOptionsConfig | null
  share: ShareConfig | null
  welcome: WelcomeConfig | null
  theme: Theme | null
  experiences: ExperiencesConfig | null
}
```

### Session (Updated)

```typescript
import { type Session } from '@clementine/shared'

// eventId removed
interface Session {
  id: string
  projectId: string
  workspaceId: string
  // eventId: REMOVED
  experienceId: string
  mode: 'preview' | 'guest'
  configSource: 'draft' | 'published'
  // ... rest unchanged
}
```

---

## Backward Compatibility Aliases

For gradual migration, these aliases are available temporarily:

```typescript
// These work but are deprecated
import {
  projectEventConfigSchema,  // -> projectConfigSchema
  type ProjectEventConfig,   // -> ProjectConfig
} from '@clementine/shared'
```

---

## Domain File Locations

### Before

```
src/domains/
├── event/
│   ├── shared/hooks/useProjectEvent.ts
│   ├── designer/hooks/usePublishEvent.ts
│   ├── theme/hooks/useUpdateTheme.ts
│   └── ...
├── project/
│   ├── shared/hooks/useProject.ts
│   └── events/hooks/useProjectEvents.ts
```

### After

```
src/domains/
├── project/
│   └── shared/hooks/useProject.ts                    # Enhanced with config
├── project-config/                                   # RENAMED from event/
│   ├── shared/
│   │   ├── hooks/useProjectConfig.ts                 # Renamed from useProjectEvent
│   │   └── lib/updateProjectConfigField.ts           # Renamed from updateEventConfigField
│   ├── designer/
│   │   ├── containers/ProjectConfigDesignerLayout.tsx  # Renamed from EventDesignerLayout
│   │   ├── components/ProjectConfigDesignerSidebar.tsx # Renamed from EventDesignerSidebar
│   │   └── hooks/usePublishProjectConfig.ts          # Renamed from usePublishEvent
│   ├── theme/hooks/useUpdateTheme.ts                 # Remove eventId param
│   ├── welcome/hooks/useUpdateWelcome.ts             # Remove eventId param
│   ├── share/hooks/useUpdateShare.ts                 # Remove eventId param
│   └── settings/
│       ├── containers/ProjectConfigSettingsPage.tsx  # Renamed from EventSettingsPage
│       └── hooks/useUpdateSettings.ts                # Remove eventId param
```

---

## Common Migration Tasks

### 1. Remove eventId from useParams

```diff
- const { projectId, eventId, workspaceSlug } = useParams()
+ const { projectId, workspaceSlug } = useParams()
```

### 2. Update Hook Imports

```diff
- import { useProjectEvent } from '@/domains/event/shared/hooks'
- import { useUpdateTheme } from '@/domains/event/theme/hooks'
+ import { useProject } from '@/domains/project/shared/hooks'
+ import { useUpdateTheme } from '@/domains/project-config/theme/hooks'
```

### 3. Update Hook Calls

```diff
- const { data: event } = useProjectEvent(projectId, eventId)
- const updateTheme = useUpdateTheme(projectId, eventId)
+ const { data: project } = useProject(projectId)
+ const updateTheme = useUpdateTheme(projectId)
```

### 4. Update Config Access

```diff
- const theme = event?.draftConfig?.theme
+ const theme = project?.draftConfig?.theme
```

### 5. Update Navigation

```diff
- navigate({
-   to: '/workspace/$workspaceSlug/projects/$projectId/events/$eventId/theme',
-   params: { workspaceSlug, projectId, eventId }
- })
+ navigate({
+   to: '/workspace/$workspaceSlug/projects/$projectId/theme',
+   params: { workspaceSlug, projectId }
+ })
```

---

## Testing the Migration

After completing changes, verify these flows:

1. **Admin Flow**: Create project → Configure theme/welcome/share → Publish → View live
2. **Guest Flow**: Join via link → Select experience → Capture → Share
3. **Preview Flow**: Admin preview uses draft config correctly
4. **Real-time Updates**: Config changes reflect immediately in preview
