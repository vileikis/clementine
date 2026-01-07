# Firestore Operations: Welcome Editor

**Feature**: 017-welcome-editor
**Date**: 2026-01-07

## Overview

This feature uses the client-first Firebase architecture. All data operations go through the Firebase client SDK with Firestore as the data store. There are no REST API endpoints.

---

## Read Operations

### Get Project Event (with Welcome Config)

**Operation**: Real-time listener on event document
**Collection**: `projects/{projectId}/events/{eventId}`
**Hook**: `useProjectEvent(projectId, eventId)`

```typescript
// Existing hook - no changes needed
import { useProjectEvent } from '@/domains/event/shared'

const { data: event } = useProjectEvent(projectId, eventId)

// Access welcome config
const welcome = event?.draftConfig?.welcome ?? DEFAULT_WELCOME
```

**Returns**: Full `ProjectEventFull` document including:
```typescript
{
  draftConfig: {
    welcome: WelcomeConfig | null
  }
}
```

---

## Write Operations

### Update Welcome Config

**Operation**: Atomic update with dot notation
**Collection**: `projects/{projectId}/events/{eventId}`
**Function**: `updateEventConfigField`
**Hook**: `useUpdateWelcome(projectId, eventId)`

**Input**: `WelcomeConfig` (full object replacement)

```typescript
// Hook implementation
async function updateWelcome(welcome: WelcomeConfig) {
  const validated = welcomeConfigSchema.parse(welcome)
  await updateEventConfigField(projectId, eventId, { welcome: validated })
}
```

**Firestore Update** (handled by `updateEventConfigField`):
```typescript
{
  'draftConfig.welcome': validated,
  'draftVersion': increment(1),
  'updatedAt': serverTimestamp(),
}
```

---

### Upload Hero Media

**Operation**: Two-step: upload file then update config
**Storage Path**: `workspaces/{workspaceId}/mediaAssets/{uuid}`
**Hook**: `useUploadAndUpdateHeroMedia`

**Step 1: Upload to Storage**
```typescript
// Uses existing useUploadMediaAsset
const { mediaAssetId, url } = await uploadMediaAsset({
  file: File,
  type: 'hero',
  onProgress: (progress) => void,
})
```

**Step 2: Update Welcome Config**
```typescript
await updateWelcome({
  ...currentWelcome,
  media: { mediaAssetId, url }
})
```

---

## Security Rules

Welcome config is part of `draftConfig`, governed by existing event rules:

```javascript
// Existing rules in firestore.rules
match /projects/{projectId}/events/{eventId} {
  // Read: workspace members
  allow read: if isWorkspaceMember(getEvent().workspaceId);

  // Write: workspace admins/editors
  allow update: if isWorkspaceEditor(getEvent().workspaceId)
                && isValidEventUpdate(request.resource.data);
}
```

**No additional rules needed** - welcome config updates go through the same validation.

---

## Optimistic Updates

The `useUpdateWelcome` hook uses TanStack Query's `useMutation` without optimistic updates. Real-time updates are handled by the `onSnapshot` listener in `useProjectEvent`.

**Flow**:
1. User changes field
2. `handleUpdate` called
3. `form.setValue` updates local form state (instant preview)
4. `triggerSave` debounces and calls mutation
5. Mutation updates Firestore
6. `onSnapshot` listener receives update
7. TanStack Query cache updated
8. Form syncs via `values` prop

---

## Error Handling

**Mutation Errors**:
- Logged to Sentry with domain tags
- Toast shown to user
- Save indicator reflects failure

```typescript
onError: (error) => {
  Sentry.captureException(error, {
    tags: {
      domain: 'event/welcome',
      action: 'update-welcome',
    },
  })
  toast.error('Failed to save welcome settings')
}
```

---

## Query Keys

```typescript
// Event data (includes welcome config)
['project-event', projectId, eventId]
```

**Invalidation**:
- After successful welcome update
- After successful media upload
