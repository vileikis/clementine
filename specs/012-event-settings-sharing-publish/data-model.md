# Data Model: Event Settings - Sharing Configuration & Draft/Publish

**Feature**: 012-event-settings-sharing-publish
**Date**: 2026-01-05
**Status**: Complete

## Overview

This document defines the Firestore data model for event settings sharing configuration and the draft/publish workflow. All schemas already exist in the codebase - this feature only adds new mutation logic, no schema changes required.

## Firestore Collections

### projects/{projectId}/events/{eventId}

**Collection Path**: `projects/{projectId}/events`
**Document ID**: Auto-generated or custom
**Schema**: `ProjectEventFull` (existing schema, no changes)

```typescript
interface ProjectEventFull {
  // Identity
  id: string

  // Admin metadata
  name: string
  status: 'active' | 'deleted'
  createdAt: number // Firestore Timestamp → number
  updatedAt: number // Firestore Timestamp → number
  deletedAt: number | null

  // Draft/Publish workflow (EXISTING - no changes needed)
  draftConfig: ProjectEventConfig | null      // Auto-saved changes
  publishedConfig: ProjectEventConfig | null  // Live guest-facing config
  draftVersion: number | null                 // Increments on every draft update
  publishedVersion: number | null             // Matches draftVersion when published
  publishedAt: number | null                  // Firestore Timestamp → number
}
```

**Indexes Required**: None (existing indexes sufficient)

---

## Nested Data Structures

### ProjectEventConfig (Existing Schema)

**Location**: `src/domains/event/shared/schemas/project-event-config.schema.ts`
**Changes**: None (schema already complete)

```typescript
interface ProjectEventConfig {
  // Schema version
  schemaVersion: number // Default: 1

  // Visual theme (out of scope for this feature)
  theme: Theme | null

  // Overlays (out of scope for this feature)
  overlays: OverlaysConfig | null

  // Sharing configuration (THIS FEATURE)
  sharing: SharingConfig | null
}
```

### SharingConfig (Existing Schema)

**Location**: `src/domains/event/shared/schemas/project-event-config.schema.ts`
**Changes**: None (schema already complete)

```typescript
interface SharingConfig {
  // Main options
  downloadEnabled: boolean // Default: true
  copyLinkEnabled: boolean // Default: true

  // Social media platforms
  socials: SocialSharingConfig | null
}

interface SocialSharingConfig {
  email: boolean       // Default: false
  instagram: boolean   // Default: false
  facebook: boolean    // Default: false
  linkedin: boolean    // Default: false
  twitter: boolean     // Default: false
  tiktok: boolean      // Default: false
  telegram: boolean    // Default: false
}
```

**Key Design Decisions**:
- **Nullable socials**: Allows lazy initialization (null → object on first social toggle)
- **Boolean flags**: Simple enable/disable, no configuration needed
- **Default false**: All social platforms disabled by default (opt-in)
- **Default true for main options**: Download and copy link enabled by default

---

## Data Mutations

### 1. Update Share Options

**Operation**: Partial update to `draftConfig.sharing` with deep merge for nested `socials`

**Firestore Operation**: Transaction with `runTransaction()`

**Fields Updated**:
```typescript
{
  'draftConfig.sharing.downloadEnabled': boolean (optional),
  'draftConfig.sharing.copyLinkEnabled': boolean (optional),
  'draftConfig.sharing.socials.email': boolean (optional),
  'draftConfig.sharing.socials.instagram': boolean (optional),
  'draftConfig.sharing.socials.facebook': boolean (optional),
  // ... other social fields
  'draftVersion': increment by 1,
  'updatedAt': serverTimestamp()
}
```

**Transaction Logic**:
```typescript
// 1. Read current event
const eventDoc = await transaction.get(eventRef)
const currentEvent = eventDoc.data() as ProjectEventFull

// 2. Get current draft or initialize
const currentDraft = currentEvent.draftConfig ?? {
  schemaVersion: 1,
  theme: null,
  overlays: null,
  sharing: null,
}

// 3. Deep merge sharing config
const currentSharing = currentDraft.sharing ?? {
  downloadEnabled: true,
  copyLinkEnabled: true,
  socials: null,
}

const updatedSharing: SharingConfig = {
  downloadEnabled: validated.downloadEnabled ?? currentSharing.downloadEnabled,
  copyLinkEnabled: validated.copyLinkEnabled ?? currentSharing.copyLinkEnabled,
  socials: {
    ...currentSharing.socials, // Preserve existing flags
    ...validated.socials,      // Apply updates
  },
}

// 4. Write updated draft
transaction.update(eventRef, {
  draftConfig: {
    ...currentDraft,
    sharing: updatedSharing,
  },
  draftVersion: (currentEvent.draftVersion ?? 0) + 1,
  updatedAt: serverTimestamp(),
})
```

**Validation**: `updateShareOptionsSchema` (Zod partial schema)

---

### 2. Publish Event

**Operation**: Copy `draftConfig` → `publishedConfig`, update version and timestamp

**Firestore Operation**: Transaction with `runTransaction()`

**Fields Updated**:
```typescript
{
  'publishedConfig': ProjectEventConfig (full copy from draftConfig),
  'publishedVersion': number (copy from draftVersion),
  'publishedAt': serverTimestamp(),
  'updatedAt': serverTimestamp()
}
```

**Transaction Logic**:
```typescript
// 1. Read current event
const eventDoc = await transaction.get(eventRef)
const currentEvent = eventDoc.data() as ProjectEventFull

// 2. Validate draftConfig exists
if (!currentEvent.draftConfig) {
  throw new Error('Cannot publish: no draft configuration exists')
}

// 3. Copy draft → published
transaction.update(eventRef, {
  publishedConfig: currentEvent.draftConfig,      // Full copy
  publishedVersion: currentEvent.draftVersion,    // Sync versions
  publishedAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
})
```

**Validation**: No input validation needed (read-only operation)

---

## State Machine: Draft/Publish

### States

| State | Condition | draftVersion | publishedVersion | UI Indicators |
|-------|-----------|--------------|------------------|---------------|
| **Never Published** | No published config | > 0 | `null` | 🟡 "New changes" badge, Publish enabled |
| **Published, In Sync** | Draft matches published | N | N (equal) | No badge, Publish disabled |
| **Published, New Changes** | Draft ahead of published | N | M (N > M) | 🟡 "New changes" badge, Publish enabled |
| **Publishing** | Mutation in progress | N | M | Loading spinner, Publish disabled |

### State Transitions

```
[Initial State: New Event]
draftConfig: null, draftVersion: null
publishedConfig: null, publishedVersion: null

  ↓ First edit (toggle sharing option)

[Never Published]
draftConfig: {...}, draftVersion: 1
publishedConfig: null, publishedVersion: null
→ Badge: "New changes" (yellow)
→ Publish: Enabled

  ↓ More edits (auto-save)

[Never Published, More Changes]
draftConfig: {...}, draftVersion: 3
publishedConfig: null, publishedVersion: null
→ Badge: "New changes" (yellow)
→ Publish: Enabled

  ↓ User clicks Publish

[Publishing]
→ Badge: "New changes" (yellow)
→ Publish: Disabled (loading)

  ↓ Publish mutation succeeds

[Published, In Sync]
draftConfig: {...}, draftVersion: 3
publishedConfig: {...}, publishedVersion: 3
publishedAt: <timestamp>
→ Badge: Hidden
→ Publish: Disabled

  ↓ User edits again (toggle option)

[Published, New Changes]
draftConfig: {...}, draftVersion: 4
publishedConfig: {...}, publishedVersion: 3
publishedAt: <timestamp>
→ Badge: "New changes" (yellow)
→ Publish: Enabled

  ↓ User clicks Publish again

[Publishing]
→ Badge: "New changes" (yellow)
→ Publish: Disabled (loading)

  ↓ Publish mutation succeeds

[Published, In Sync]
draftConfig: {...}, draftVersion: 4
publishedConfig: {...}, publishedVersion: 4
publishedAt: <new timestamp>
→ Badge: Hidden
→ Publish: Disabled
```

---

## Data Validation

### Zod Schemas

All schemas already exist in the codebase. This feature only adds validation logic for partial updates:

#### Existing Schemas (No Changes)
- `projectEventConfigSchema` - Full event config (draftConfig, publishedConfig)
- `sharingConfigSchema` - Complete sharing configuration
- `socialSharingConfigSchema` - Social media flags

#### New Schemas (For Mutations)
```typescript
// Update schema for partial sharing updates
export const updateShareOptionsSchema = sharingConfigSchema.partial()

export type UpdateShareOptionsInput = z.infer<typeof updateShareOptionsSchema>
```

**Validation Flow**:
1. Client input → `updateShareOptionsSchema.parse(input)` → Validated partial update
2. Firestore read → `projectEventFullSchema.parse(doc.data())` → Validated full document
3. Merge logic → Deep merge sharing.socials, shallow merge top-level
4. Firestore write → Transaction ensures atomic update

---

## Change Detection Logic

### Version-Based Detection

**Implementation**:
```typescript
function hasUnpublishedChanges(event: ProjectEventFull): boolean {
  // Never published
  if (event.publishedVersion === null) {
    return event.draftVersion !== null && event.draftVersion > 0
  }

  // Published, check if draft is ahead
  return event.draftVersion !== null && event.draftVersion > event.publishedVersion
}
```

**Key Principles**:
- **Integer comparison**: Fast, reliable, no deep equality needed
- **Null safety**: Handles never-published state (publishedVersion === null)
- **Zero version**: draftVersion: 0 means no edits yet (no badge)
- **Version increment**: Every auto-save increments draftVersion by 1

---

## Firestore Security Rules

**Required Rules** (should already exist in `firestore.rules`):

```javascript
match /projects/{projectId}/events/{eventId} {
  // Read: Project members only
  allow read: if isProjectMember(projectId);

  // Write: Project admins only (mutations via client SDK validated)
  allow update: if isProjectAdmin(projectId)
    && request.resource.data.keys().hasAll(['updatedAt'])
    && request.resource.data.updatedAt is timestamp;

  // Validate draftConfig structure if present
  allow update: if isProjectAdmin(projectId)
    && (!request.resource.data.keys().hasAny(['draftConfig'])
        || validateEventConfig(request.resource.data.draftConfig));

  // Validate publishedConfig structure if present
  allow update: if isProjectAdmin(projectId)
    && (!request.resource.data.keys().hasAny(['publishedConfig'])
        || validateEventConfig(request.resource.data.publishedConfig));
}

function validateEventConfig(config) {
  return config == null || (
    config.schemaVersion is number
    && (!config.keys().hasAny(['sharing']) || validateSharingConfig(config.sharing))
  );
}

function validateSharingConfig(sharing) {
  return sharing == null || (
    sharing.downloadEnabled is bool
    && sharing.copyLinkEnabled is bool
    && (!sharing.keys().hasAny(['socials']) || validateSocials(sharing.socials))
  );
}

function validateSocials(socials) {
  return socials == null || (
    socials.email is bool
    && socials.instagram is bool
    && socials.facebook is bool
    && socials.linkedin is bool
    && socials.twitter is bool
    && socials.tiktok is bool
    && socials.telegram is bool
  );
}
```

**Note**: These rules may already exist from feature 011 (events domain backbone). Verify and update if needed.

---

## Real-Time Updates

### TanStack Query + Firestore onSnapshot

**Pattern** (already implemented in `useProjectEvent`):
```typescript
// Route loader warms cache
const event = await context.queryClient.ensureQueryData(
  projectEventQuery(projectId, eventId)
)

// Component hook subscribes to real-time updates
const { data: event } = useProjectEvent(projectId, eventId)

// Behind the scenes: onSnapshot → TanStack Query cache update → re-render
```

**Mutation → Real-Time Flow**:
1. User toggles sharing option
2. Auto-save mutation: `useUpdateShareOptions.mutateAsync()`
3. Firestore transaction: Update `draftConfig`, increment `draftVersion`
4. Mutation success: `queryClient.invalidateQueries(['project-event', ...])`
5. TanStack Query: Re-fetch from cache (optimistic) + trigger onSnapshot listener
6. onSnapshot: Firestore sends updated document
7. TanStack Query: Update cache with server data
8. Component: Re-render with new draft config and version

**Key Benefits**:
- **Immediate feedback**: Cache invalidation updates UI instantly (optimistic)
- **Server sync**: onSnapshot ensures cache matches Firestore within ~500ms
- **Concurrent edits**: Real-time listener picks up changes from other users
- **Type safety**: All data validated with Zod before reaching UI

---

## Performance Considerations

### Auto-Save Debouncing

**Pattern**: 300ms debounce on blur events
**Rationale**: Prevents excessive Firestore writes while user is actively toggling cards

**Worst Case**: User toggles 7 social cards in 2 seconds → Only 1 Firestore write
**Best Case**: User toggles 1 card, focuses out → 1 Firestore write after 300ms

### Firestore Transaction Cost

**Update Share Options**:
- 1 read (get current event)
- 1 write (update draftConfig, draftVersion, updatedAt)
- Total: 2 operations per auto-save

**Publish Event**:
- 1 read (get current event)
- 1 write (copy draft → published, update version/timestamp)
- Total: 2 operations per publish

**Optimization**: Transaction ensures atomicity, prevents race conditions (worth the extra read)

### Real-Time Listener Efficiency

**Pattern**: Single onSnapshot listener per event document (already implemented)
**Cost**: 1 read per document change (triggered by mutations or other users)
**Optimization**: TanStack Query cache prevents redundant component re-renders

---

## Migration & Backwards Compatibility

### No Migration Needed

**Reason**: All schema fields already exist in `projectEventConfigSchema` and `projectEventFullSchema` from feature 011.

**Existing Events**:
- `draftConfig`: May be `null` (lazy initialization)
- `publishedConfig`: May be `null` (never published)
- `draftVersion`: May be `null` (no edits yet)
- `publishedVersion`: May be `null` (never published)

**Lazy Initialization Pattern**:
```typescript
// First edit on existing event
if (currentEvent.draftConfig === null) {
  // Create default config
  const newDraft: ProjectEventConfig = {
    schemaVersion: 1,
    theme: null,
    overlays: null,
    sharing: {
      downloadEnabled: true,
      copyLinkEnabled: true,
      socials: null,
    },
  }
  transaction.update(eventRef, {
    draftConfig: newDraft,
    draftVersion: 1,
    updatedAt: serverTimestamp(),
  })
}
```

**Forward Compatibility**: `z.looseObject()` allows future fields to be added without breaking existing code.

---

## Summary

### Existing Data Model (No Changes)
- ✅ `ProjectEventFull` schema complete
- ✅ `ProjectEventConfig` schema complete
- ✅ `SharingConfig` schema complete
- ✅ Real-time subscription working
- ✅ Query infrastructure ready

### New Mutation Logic Only
- → `useUpdateShareOptions` hook (deep merge, version increment, transaction)
- → `usePublishEvent` hook (copy draft → published, sync versions, transaction)
- → Version-based change detection (draftVersion > publishedVersion)
- → Auto-save integration (React Hook Form + useAutoSave)

**Data Model Status**: ✅ Complete (no schema changes needed, only new mutation logic)
