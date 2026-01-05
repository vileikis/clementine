# API Contracts: Events Domain Backbone

**Feature**: Events Domain Backbone
**Date**: 2026-01-05

## No Server API Contracts

This feature does not introduce any server API endpoints. All functionality is client-side:

- **Data Access**: Firebase Firestore client SDK (direct document reads)
- **Routing**: TanStack Router (file-based, client-side navigation)
- **UI Rendering**: React components (client-side rendering with SSR for route loaders)

## Client-Side Contracts

### Firestore Document Contract

**Collection Path**: `/projects/{projectId}/events/{eventId}`

**Read Operations** (Firebase Client SDK):

```typescript
// Read full event document (designer view)
import { doc, getDoc } from 'firebase/firestore'
import { firestore } from '@/integrations/firebase/client'
import { projectEventFullSchema } from '@/domains/event/shared/schemas'

const eventRef = doc(firestore, `projects/${projectId}/events/${eventId}`)
const eventDoc = await getDoc(eventRef)
const event = projectEventFullSchema.parse({
  id: eventDoc.id,
  ...eventDoc.data()
})
```

**Write Operations** (Future - not in Phase 1):
```typescript
// Future: Update draft config
import { updateDoc } from 'firebase/firestore'

await updateDoc(eventRef, {
  draftConfig: newConfig,
  draftVersion: currentVersion + 1,
  updatedAt: Date.now(),
})
```

### TanStack Router Route Contract

**Route Definitions**:

1. **Event Designer Layout** (`$eventId.tsx`)
   - Path: `/workspace/:workspaceSlug/projects/:projectId/events/:eventId`
   - Loader: Fetches event + project for breadcrumb
   - Component: EventDesignerPage (vertical tabs + outlet)

2. **Index Redirect** (`$eventId.index.tsx`)
   - Path: `/workspace/:workspaceSlug/projects/:projectId/events/:eventId/`
   - Redirect: → `./welcome`

3. **Welcome Tab** (`$eventId.welcome.tsx`)
   - Path: `/workspace/:workspaceSlug/projects/:projectId/events/:eventId/welcome`
   - Component: WelcomePage (WIP placeholder)

4. **Theme Tab** (`$eventId.theme.tsx`)
   - Path: `/workspace/:workspaceSlug/projects/:projectId/events/:eventId/theme`
   - Component: ThemePage (WIP placeholder)

5. **Settings Tab** (`$eventId.settings.tsx`)
   - Path: `/workspace/:workspaceSlug/projects/:projectId/events/:eventId/settings`
   - Component: SettingsPage (WIP placeholder)

**Route Loader Contract**:

```typescript
// $eventId.tsx loader
export const Route = createFileRoute('...')({
  loader: async ({ params }) => {
    // Returns: { event: ProjectEventFull, project: Project }
    return { event, project }
  }
})

// Child routes access loader data
function WelcomePage() {
  const { event, project } = Route.useLoaderData()
  // event: ProjectEventFull (complete with config)
}
```

### Component Contracts

**EventDesignerPage**:
- Input: None (reads from route context)
- Output: Renders vertical tabs + Outlet
- Behavior: Highlights active tab based on current route

**Tab Navigation**:
```typescript
interface Tab {
  id: string
  label: string
  href: string // Relative path: './welcome', './theme', './settings'
}
```

## Future API Contracts (Not in Phase 1)

When config editing is implemented:

### Firestore Write Operations

**Update Draft Config**:
```typescript
// Future: Update theme
await updateDoc(eventRef, {
  'draftConfig.theme': newTheme,
  draftVersion: increment(1),
  updatedAt: serverTimestamp(),
})
```

**Publish Config**:
```typescript
// Future: Publish draft to published
const currentDraft = event.draftConfig
const currentDraftVersion = event.draftVersion

await updateDoc(eventRef, {
  publishedConfig: currentDraft,
  publishedVersion: currentDraftVersion,
  publishedAt: serverTimestamp(),
})
```

### Real-time Subscriptions

```typescript
// Future: Collaborative editing
import { onSnapshot } from 'firebase/firestore'

onSnapshot(eventRef, (doc) => {
  const event = projectEventFullSchema.parse({
    id: doc.id,
    ...doc.data()
  })
  // Update UI with latest draft config
})
```

## Validation Contract

All data read from Firestore MUST be validated with Zod schemas:

```typescript
// Required validation pattern
import { projectEventFullSchema } from '@/domains/event/shared/schemas'

const rawData = eventDoc.data()
const validatedEvent = projectEventFullSchema.parse({
  id: eventDoc.id,
  ...rawData
})
```

**Why**: Firestore data is untrusted external input. Runtime validation ensures type safety.

## Security Contract

**Firestore Security Rules** (Future):

```javascript
// Future rules for /projects/{projectId}/events/{eventId}
match /projects/{projectId}/events/{eventId} {
  // Read published config: Anyone (guests)
  allow read: if request.resource.data.keys().hasOnly(['publishedConfig', 'publishedVersion', 'publishedAt'])

  // Read full document: Workspace members only
  allow read: if isWorkspaceMember(projectId)

  // Write: Workspace members only
  allow write: if isWorkspaceMember(projectId)
}
```

## Standards Compliance

✅ **Client-First Architecture**: No server API, Firebase client SDK only
✅ **Type Safety**: Zod runtime validation for all Firestore reads
✅ **Security**: Future Firestore rules enforce authorization
✅ **Performance**: Single document reads, no N+1 queries

**References**:
- `standards/global/client-first-architecture.md`
- `standards/backend/firestore.md`
- `standards/backend/firestore-security.md`
