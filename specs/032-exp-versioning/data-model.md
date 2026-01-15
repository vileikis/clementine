# Data Model: Experience Designer Draft & Publish Versioning

**Feature**: 030-exp-versioning
**Date**: 2026-01-15

## Entity Changes

### Experience (Modified)

**Firestore Path**: `/workspaces/{workspaceId}/experiences/{experienceId}`

#### New Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `draftVersion` | `number` | `1` | Increments atomically on every draft modification |
| `publishedVersion` | `number \| null` | `null` | Set to `draftVersion` value on publish; null until first publish |

#### Schema Definition (New Fields Only)

```typescript
// Added to experienceSchema in experience.schema.ts
{
  /**
   * VERSIONING
   */

  /** Draft version number (starts at 1, increments on each edit) */
  draftVersion: z.number().default(1),

  /** Published version number (syncs with draftVersion on publish) */
  publishedVersion: z.number().nullable().default(null),
}
```

#### Complete Experience Schema (After Changes)

```typescript
experienceSchema = z.looseObject({
  // IDENTITY
  id: z.string(),
  name: z.string().min(1).max(100),

  // METADATA
  status: experienceStatusSchema.default('active'),
  profile: experienceProfileSchema,
  media: experienceMediaSchema.default(null),
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.number().nullable().default(null),

  // CONFIGURATION
  draft: experienceConfigSchema,
  published: experienceConfigSchema.nullable().default(null),

  // VERSIONING (NEW)
  draftVersion: z.number().default(1),
  publishedVersion: z.number().nullable().default(null),

  // PUBLISH TRACKING
  publishedAt: z.number().nullable().default(null),
  publishedBy: z.string().nullable().default(null),
})
```

## State Transitions

### Version States

```
┌─────────────────────────────────────────────────────────────────┐
│                    Experience Version States                     │
└─────────────────────────────────────────────────────────────────┘

State 1: Never Published
┌──────────────────────────────┐
│  draftVersion: 1+            │
│  publishedVersion: null      │
│  published: null             │
└──────────────────────────────┘
   ↓ PUBLISH

State 2: Synced (No Changes)
┌──────────────────────────────┐
│  draftVersion: N             │
│  publishedVersion: N         │  (equal)
│  published: {...}            │
└──────────────────────────────┘
   ↓ EDIT DRAFT

State 3: Has Unpublished Changes
┌──────────────────────────────┐
│  draftVersion: N+1           │
│  publishedVersion: N         │  (draft > published)
│  published: {...}            │
└──────────────────────────────┘
   ↓ PUBLISH

   → Returns to State 2 (Synced)
```

### Version Increment Rules

| Operation | draftVersion | publishedVersion |
|-----------|--------------|------------------|
| Create experience | `1` | `null` |
| Edit draft (add/remove/modify step) | `increment(1)` | unchanged |
| Edit metadata (name, media) | unchanged | unchanged |
| Publish | unchanged | set to current `draftVersion` |

## Validation Rules

### Draft Version

- **Type**: Positive integer
- **Minimum**: 1 (never 0)
- **Increment**: Always by exactly 1
- **Source**: Firestore `increment(1)` operation

### Published Version

- **Type**: Positive integer or null
- **Null meaning**: Never published
- **Value after publish**: Always equals `draftVersion` at time of publish
- **Invariant**: `publishedVersion <= draftVersion` (when both non-null)

### Change Detection Logic

```typescript
function hasUnpublishedChanges(experience: Experience): boolean {
  if (experience.publishedVersion === null) {
    return true  // Never published
  }
  return experience.draftVersion > experience.publishedVersion
}
```

## Backward Compatibility

### Existing Documents (No Version Fields)

When parsing existing experiences without version fields:

1. Zod's `.default()` provides fallback values
2. `draftVersion` defaults to `1`
3. `publishedVersion` defaults to `null`

### Migration Strategy

- **No migration required**: Zod defaults handle missing fields
- **First edit**: Increments `draftVersion` from 1 to 2
- **First publish**: Sets `publishedVersion` to current `draftVersion`

### Example: Existing Experience Parse

```typescript
// Firestore document (no version fields)
{
  id: "abc123",
  name: "My Experience",
  draft: { steps: [...] },
  published: { steps: [...] },
  // draftVersion: undefined
  // publishedVersion: undefined
}

// After experienceSchema.parse()
{
  id: "abc123",
  name: "My Experience",
  draft: { steps: [...] },
  published: { steps: [...] },
  draftVersion: 1,        // Default applied
  publishedVersion: null, // Default applied
}
```

## TypeScript Types

```typescript
// Updated Experience type (from schema inference)
type Experience = {
  // ... existing fields ...
  draftVersion: number
  publishedVersion: number | null
}

// Version info interface (for EditorChangesBadge)
interface VersionInfo {
  draftVersion: number | null
  publishedVersion: number | null
}
```

## Firestore Update Patterns

### Draft Update (With Version Increment)

```typescript
// Using dot-notation for partial update
const updateData = {
  'draft.steps': newSteps,          // Partial update
  draftVersion: increment(1),        // Atomic increment
  updatedAt: serverTimestamp(),
}
transaction.update(experienceRef, updateData)
```

### Publish (Version Sync)

```typescript
const currentExperience = await transaction.get(experienceRef)
const data = currentExperience.data()

transaction.update(experienceRef, {
  published: data.draft,
  publishedVersion: data.draftVersion,  // Sync to current draft version
  publishedAt: serverTimestamp(),
  publishedBy: userId,
  updatedAt: serverTimestamp(),
})
```
