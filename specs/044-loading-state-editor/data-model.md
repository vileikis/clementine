# Data Model: Loading State Editor

**Date**: 2026-01-28
**Feature**: Loading State Editor for Share Screen

## Overview

This document defines the data model for the loading state editor feature. It includes schema definitions, entity relationships, validation rules, and Firestore storage patterns.

---

## Entity Definitions

### 1. ShareLoadingConfig (NEW)

**Description**: Configuration for the share screen loading state displayed to guests while AI generation is in progress (typically 30-60 seconds).

#### Fields

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `title` | `string \| null` | Yes | `null` | Loading screen title (e.g., "Creating your experience...") |
| `description` | `string \| null` | Yes | `null` | Loading screen description (e.g., "This usually takes 30-60 seconds...") |

#### Validation Rules

**Zod Schema**:
```typescript
export const shareLoadingConfigSchema = z.object({
  title: z.string().nullable().default(null),
  description: z.string().nullable().default(null),
})
```

**Constraints**:
- No max length enforcement (trust admin input)
- Empty strings converted to null by auto-save normalization
- No regex validation (free-form text)

**Validation Timing**:
- Client-side: Before Firestore write (via Zod schema)
- Server-side: N/A (client-first architecture)

#### Default Values

```typescript
export const DEFAULT_SHARE_LOADING: ShareLoadingConfig = {
  title: 'Creating your experience...',
  description: 'This usually takes 30-60 seconds. Please wait while we generate your personalized result.',
}
```

**Default Application**:
- Applied at display time (not storage time)
- `title || DEFAULT_SHARE_LOADING.title`
- `description || DEFAULT_SHARE_LOADING.description`

#### Relationships

- **Parent**: `ProjectConfig` (top-level field: `draftConfig.shareLoading`)
- **Sibling**: `ShareReadyConfig` (formerly ShareConfig)
- **Usage**: Read by guest-facing share screen to display loading UI

#### Firestore Storage

**Path**: `projects/{projectId}`

**Document Structure**:
```typescript
{
  draftConfig: {
    shareLoading: {
      title: string | null,
      description: string | null,
    },
    // ... other config fields
  },
  draftVersion: number, // Incremented on update
  updatedAt: Timestamp, // Server timestamp
}
```

**Update Operation**:
```typescript
// Via updateProjectConfigField utility
await updateProjectConfigField(projectId, {
  shareLoading: { title: 'Custom title', description: 'Custom desc' }
})
```

---

### 2. ShareReadyConfig (RENAMED)

**Description**: Configuration for the share screen ready state displayed to guests when AI-generated results are available.

#### Changes from ShareConfig

- **Schema name**: `shareConfigSchema` → `shareReadyConfigSchema`
- **Type name**: `ShareConfig` → `ShareReadyConfig`
- **Field structure**: Unchanged (title, description, cta)
- **Storage location**: `draftConfig.share` → `draftConfig.shareReady`
- **Backward compatibility**: Old names exported as deprecated aliases

#### Fields

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `title` | `string \| null` | Yes | `null` | Ready screen title |
| `description` | `string \| null` | Yes | `null` | Ready screen description |
| `cta` | `CtaConfig \| null` | Yes | `null` | Call-to-action button config |

#### Validation Rules

**Zod Schema**:
```typescript
export const shareReadyConfigSchema = z.object({
  title: z.string().nullable().default(null),
  description: z.string().nullable().default(null),
  cta: ctaConfigSchema.nullable().default(null),
})

// Backward compatibility
/** @deprecated Use shareReadyConfigSchema instead */
export const shareConfigSchema = shareReadyConfigSchema
```

#### Default Values

```typescript
export const DEFAULT_SHARE_READY: ShareReadyConfig = {
  title: null,
  description: null,
  cta: null,
}

// Backward compatibility
/** @deprecated Use DEFAULT_SHARE_READY instead */
export const DEFAULT_SHARE = DEFAULT_SHARE_READY
```

#### Relationships

- **Parent**: `ProjectConfig` (top-level field: `draftConfig.shareReady`)
- **Sibling**: `ShareLoadingConfig`
- **Child**: `CtaConfig` (nested object)

#### Migration Notes

**Firestore Field Rename**:
- Old path: `projects/{projectId}/draftConfig.share`
- New path: `projects/{projectId}/draftConfig.shareReady`
- **Migration required**: Run data migration script to rename field
- **Timeline**: Migration before feature deployment

**Code Migration**:
- Old imports continue working (deprecated aliases exported)
- Update imports gradually in separate PRs
- Remove aliases after all imports updated

---

### 3. ProjectConfig (UPDATED)

**Description**: Top-level configuration object for a project. Contains all editor settings including share screen states.

#### Changes

**Added Fields**:
- `shareLoading` (ShareLoadingConfig | null): Loading state configuration
- `shareReady` (ShareReadyConfig | null): Ready state configuration (renamed from `share`)

**Schema Update**:
```typescript
export const projectConfigSchema = z.looseObject({
  schemaVersion: z.number().default(CURRENT_CONFIG_VERSION),
  overlays: overlaysConfigSchema,
  shareReady: shareReadyConfigSchema.nullable().default(null),     // ← Renamed from share
  shareLoading: shareLoadingConfigSchema.nullable().default(null),  // ← New
  shareOptions: shareOptionsConfigSchema.nullable().default(null),
  welcome: welcomeConfigSchema.nullable().default(null),
  theme: themeSchema.nullable().default(null),
  experiences: experiencesConfigSchema.nullable().default(null),
})
```

#### Firestore Storage

**Document Path**: `projects/{projectId}`

**Full Structure** (relevant fields only):
```typescript
{
  id: string,
  name: string,
  workspaceId: string,
  createdAt: Timestamp,
  updatedAt: Timestamp,

  // Configuration (this feature focuses here)
  draftConfig: {
    schemaVersion: number,
    shareReady: ShareReadyConfig | null,    // ← Renamed
    shareLoading: ShareLoadingConfig | null, // ← New
    shareOptions: ShareOptionsConfig | null,
    // ... other config fields
  },
  draftVersion: number, // Incremented on any draftConfig update

  publishedConfig: ProjectConfig | null,
  publishedVersion: number,
}
```

#### Version Management

**Draft Version Incrementing**:
- Every `draftConfig` update increments `draftVersion`
- Enables optimistic locking and conflict detection
- Used by auto-save to detect concurrent edits

**Update Pattern**:
```typescript
// Firestore transaction
await projectRef.update({
  'draftConfig.shareLoading': newShareLoading,
  draftVersion: firebase.firestore.FieldValue.increment(1),
  updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
})
```

---

## Entity Relationships

```
ProjectConfig
├── shareReady: ShareReadyConfig (formerly share)
│   └── cta: CtaConfig
├── shareLoading: ShareLoadingConfig (new)
├── shareOptions: ShareOptionsConfig
└── theme: ThemeConfig
```

**Relationship Type**: Composition (parent owns children, children don't exist independently)

**Cardinality**:
- ProjectConfig → ShareReadyConfig: 1:0..1 (optional)
- ProjectConfig → ShareLoadingConfig: 1:0..1 (optional)
- ShareReadyConfig → CtaConfig: 1:0..1 (optional)

---

## State Transitions

**N/A** - This feature involves simple configuration objects with no state machines.

**Display State Transition** (guest experience, not data model):
1. Guest submits photo → Loading state displayed (uses `shareLoading` config)
2. AI completes → Ready state displayed (uses `shareReady` config)

**Configuration State**:
- Admins can edit both configs independently
- No sequential dependency (can configure loading without ready, vice versa)
- Changes take effect immediately (no approval workflow)

---

## Storage Patterns

### Read Operations

**Query Project Config** (TanStack Query):
```typescript
const { data: project } = useProject(projectId)
const shareLoading = project?.draftConfig?.shareLoading ?? DEFAULT_SHARE_LOADING
const shareReady = project?.draftConfig?.shareReady ?? DEFAULT_SHARE_READY
```

**Real-time Subscription** (existing pattern):
```typescript
// TanStack Query with Firestore onSnapshot
onSnapshot(doc(firestore, 'projects', projectId), (snapshot) => {
  const data = snapshot.data()
  queryClient.setQueryData(['project', projectId], data)
})
```

### Write Operations

**Update Loading Config**:
```typescript
// Via updateProjectConfigField utility
await updateProjectConfigField(projectId, {
  shareLoading: {
    title: 'Hang tight!',
    description: 'Your masterpiece is being created...',
  }
})
```

**Update Ready Config**:
```typescript
await updateProjectConfigField(projectId, {
  shareReady: {
    title: 'Your Experience',
    description: 'Share your creation!',
    cta: { label: 'Learn More', url: 'https://example.com' },
  }
})
```

**Atomic Transaction** (handled by utility):
```typescript
// updateProjectConfigField wraps in transaction
await runTransaction(firestore, async (transaction) => {
  const docRef = doc(firestore, 'projects', projectId)
  const docSnap = await transaction.get(docRef)

  if (!docSnap.exists()) throw new Error('Project not found')

  transaction.update(docRef, {
    'draftConfig.shareLoading': updates.shareLoading,
    draftVersion: increment(1),
    updatedAt: serverTimestamp(),
  })
})
```

---

## Null Handling Strategy

### Storage
- Store `null` for empty/unset fields (not empty strings or undefined)
- Firestore accepts null as valid field value
- Zod schema `.nullable()` enforces type safety

### Display
- Apply defaults at display time (not storage time)
- Pattern: `value || DEFAULT_VALUE`
- Example: `shareLoading.title || 'Creating your experience...'`

### Form Inputs
- Empty textarea → `''` (native HTML behavior)
- onChange handler → convert `''` to `null`
- Pattern: `value || null` before saving

### Auto-Save Normalization
- `useAutoSave` normalizes empty strings to null automatically
- Consistent behavior across all config editors
- No special handling needed

---

## Schema Versioning

### Current Schema Version
```typescript
export const CURRENT_CONFIG_VERSION = 1
```

### Schema Evolution
- `schemaVersion` field tracks config schema version
- Enables future migrations (e.g., adding new required fields)
- Current feature: No version bump needed (additive change)

### Backward Compatibility
- New fields are optional (nullable with null default)
- Existing projects without `shareLoading` → returns null
- Existing projects with `share` → continue working (still supported)
- Migration script will rename `share` → `shareReady` gradually

---

## Security Rules

### Firestore Security Rules

**Read Access**:
```javascript
// Allow project members to read config
match /projects/{projectId} {
  allow read: if isProjectMember(projectId);
}
```

**Write Access**:
```javascript
// Allow project admins to update draft config
match /projects/{projectId} {
  allow update: if isProjectAdmin(projectId) &&
                   onlyUpdatingFields(['draftConfig', 'draftVersion', 'updatedAt']);
}
```

**Field-Level Validation** (future):
```javascript
// Validate shareLoading structure if present
function validShareLoading(data) {
  return data.shareLoading == null || (
    data.shareLoading.keys().hasAll(['title', 'description']) &&
    (data.shareLoading.title is string || data.shareLoading.title == null) &&
    (data.shareLoading.description is string || data.shareLoading.description == null)
  );
}
```

### Client-Side Validation
- Zod schema validation before Firestore write
- Type safety via TypeScript strict mode
- No XSS risk (admin-only input, not guest-generated)

---

## Migration Plan

### Phase 1: Add New Fields (This Feature)
1. Add `shareLoadingConfigSchema` to shared package
2. Add `shareLoading` field to `projectConfigSchema` (nullable)
3. Deploy schema changes (non-breaking)
4. Deploy UI changes (editor can create `shareLoading` configs)

### Phase 2: Rename Existing Fields (Future)
1. Export both `share` and `shareReady` in schema (backward compat)
2. Update all code imports to use `shareReady`
3. Run data migration script to rename Firestore fields
4. Remove deprecated `share` exports

### Phase 3: Cleanup (Future)
1. Verify all projects have `shareReady` field
2. Remove `share` field support
3. Update security rules to reference `shareReady`

**Rollback Plan**:
- Phase 1: Simply stop using `shareLoading` (no data cleanup needed)
- Phase 2: Revert migration script, restore `share` field
- Phase 3: Keep both fields for backward compatibility

---

## Summary

**New Entities**:
- `ShareLoadingConfig`: 2 nullable string fields (title, description)

**Updated Entities**:
- `ShareReadyConfig`: Renamed from ShareConfig (structure unchanged)
- `ProjectConfig`: Added `shareLoading`, renamed `share` → `shareReady`

**Storage**:
- Firestore path: `projects/{projectId}/draftConfig.{shareReady|shareLoading}`
- Atomic updates via transactions
- Version management via `draftVersion` increment

**Validation**:
- Client-side Zod validation
- Type-safe via TypeScript
- Null-safe via nullable schema fields

**Migration**:
- Additive changes (non-breaking)
- Gradual migration for renames
- Backward compatibility preserved
