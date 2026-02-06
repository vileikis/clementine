# Data Model: Experience-Level Aspect Ratio & Overlay System

**Feature**: 065-exp-aspect-ratio-overlays
**Date**: 2026-02-06

## Entity Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   AspectRatio   │     │     Project     │     │   Experience    │
│   (Canonical)   │◄────┤                 │     │                 │
└─────────────────┘     │  config.overlays│     │ outcome.aspect  │
        │               └────────┬────────┘     └────────┬────────┘
        │                        │                       │
        ▼                        │                       │
┌─────────────────┐              │                       │
│   OverlayKey    │              │                       │
│ (with default)  │              │                       │
└─────────────────┘              │                       │
                                 │                       │
                    ┌────────────┴───────────────────────┘
                    │  resolveOverlayChoice()
                    │  (at job creation)
                    ▼
            ┌─────────────────┐
            │       Job       │
            │  overlayChoice  │◄──── MediaReference | null
            │  experienceRef  │
            └─────────────────┘
```

---

## 1. AspectRatio (Canonical)

**Purpose**: Single source of truth for all aspect ratio values across the platform.

**Schema Location**: `packages/shared/src/schemas/media/aspect-ratio.schema.ts`

### Values

| Value | Description | Supported Media Types |
|-------|-------------|----------------------|
| `1:1` | Square | Image, GIF, Video |
| `3:2` | Landscape | Image, GIF |
| `2:3` | Portrait (tall) | Image, GIF |
| `9:16` | Vertical (stories) | Image, GIF, Video |

### Derived Types

```typescript
// Base aspect ratio (4 values)
type AspectRatio = '1:1' | '3:2' | '2:3' | '9:16'

// Overlay configuration key (5 values, includes fallback)
type OverlayKey = '1:1' | '3:2' | '2:3' | '9:16' | 'default'

// Media-type subsets
type ImageAspectRatio = AspectRatio  // All 4
type VideoAspectRatio = '9:16' | '1:1'  // Subset of 2
```

### Validation Rules

- Must be one of the enumerated values
- No `16:9` (landscape video) - explicitly excluded per PRD
- No `auto` or dynamic values

---

## 2. OverlaysConfig (Extended)

**Purpose**: Project-level overlay storage, keyed by aspect ratio with fallback support.

**Schema Location**: `packages/shared/src/schemas/project/project-config.schema.ts`

### Structure

```typescript
type OverlaysConfig = {
  '1:1': MediaReference | null
  '3:2': MediaReference | null
  '2:3': MediaReference | null
  '9:16': MediaReference | null
  'default': MediaReference | null
} | null
```

### Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `1:1` | MediaReference \| null | No | null | Square overlay |
| `3:2` | MediaReference \| null | No | null | Landscape overlay |
| `2:3` | MediaReference \| null | No | null | Portrait overlay |
| `9:16` | MediaReference \| null | No | null | Vertical/stories overlay |
| `default` | MediaReference \| null | No | null | Fallback overlay (any ratio) |

### Storage Path

```
Firestore:
  workspaces/{workspaceId}/projects/{projectId}
    └── config
        └── overlays
            ├── '1:1': { mediaAssetId, url, displayName, filePath? }
            ├── '3:2': { mediaAssetId, url, displayName, filePath? }
            ├── '2:3': { mediaAssetId, url, displayName, filePath? }
            ├── '9:16': { mediaAssetId, url, displayName, filePath? }
            └── 'default': { mediaAssetId, url, displayName, filePath? }

Storage:
  /overlays/{projectId}/{aspectRatio}/{filename}
```

### Validation Rules

- Each slot is independently nullable
- Entire config can be null (no overlays configured)
- MediaReference must have valid `mediaAssetId` and `url`
- `displayName` max 100 characters

---

## 3. MediaReference (Existing)

**Purpose**: Reference to a media asset stored in Firebase Storage.

**Schema Location**: `packages/shared/src/schemas/media/media-reference.schema.ts`

### Structure (Unchanged)

```typescript
type MediaReference = {
  mediaAssetId: string      // Firestore document ID
  url: string               // Public URL (https://...)
  displayName: string       // Human-readable name
  filePath?: string         // Optional storage path
}
```

### Validation Rules

- `mediaAssetId` must be non-empty string
- `url` must be valid URL format
- `displayName` max 100 characters, alphanumeric + spaces + common punctuation

---

## 4. Experience Outcome (Update)

**Purpose**: AI generation configuration for an experience.

**Schema Location**: `packages/shared/src/schemas/experience/outcome.schema.ts`

### Relevant Fields

```typescript
type OutcomeConfig = {
  imageGeneration: {
    aspectRatio: AspectRatio  // UPDATED: References canonical schema
    // ... other generation fields
  }
  // ...
}
```

### Changes

- `aspectRatio` now imports from canonical `aspectRatioSchema`
- Removes `16:9` as valid option
- Maintains default of `1:1`

---

## 5. Job Snapshot (Flattened)

**Purpose**: Immutable capture of configuration at job creation time.

**Schema Location**: `packages/shared/src/schemas/job/job.schema.ts`

### Structure (Updated)

```typescript
export const jobSnapshotSchema = z.object({
  /** Session responses at job creation */
  sessionResponses: z.array(sessionResponseSchema).default([]),

  /** Experience version at time of job creation */
  experienceVersion: z.number().int().positive(),

  /** Outcome configuration */
  outcome: outcomeSchema.nullable().default(null),

  /** Resolved overlay to apply (null = no overlay) */
  overlayChoice: overlayReferenceSchema.nullable().default(null),
})

export type JobSnapshot = z.infer<typeof jobSnapshotSchema>
```

### Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `sessionResponses` | SessionResponse[] | No | [] | Captured responses at job creation |
| `experienceVersion` | number | Yes | - | Experience version for traceability |
| `outcome` | Outcome \| null | No | null | Full outcome config snapshot |
| `overlayChoice` | MediaReference \| null | No | null | **Resolved** overlay to apply |

### Removed Fields

| Field | Reason |
|-------|--------|
| `projectContext` | Flattened - wrapper no longer needed |
| `projectContext.overlay` | Deprecated, replaced by `overlayChoice` |
| `projectContext.applyOverlay` | Logic moved to resolution at job creation |
| `projectContext.overlays` | Full map no longer stored; resolved to single choice |
| `experienceRef` | Not used downstream; applyOverlay extracted at resolution time |

### Resolution Flow

```
Job Creation (startTransformPipeline.ts)
    │
    ├── Fetch project config (overlays map)
    ├── Get experience reference (applyOverlay flag)
    ├── Get aspect ratio from outcome config
    │
    ▼
resolveOverlayChoice(overlays, applyOverlay, aspectRatio)
    │
    ├── applyOverlay = false? → null
    ├── overlays[aspectRatio] exists? → return it
    ├── overlays['default'] exists? → return it
    └── else → null
    │
    ▼
Store result in job.snapshot.overlayChoice
```

---

## 6. Overlay Resolution Logic

**Location**: `functions/src/callable/startTransformPipeline.ts`

```typescript
function resolveOverlayChoice(
  overlays: OverlaysConfig | null,
  applyOverlay: boolean,
  aspectRatio: AspectRatio
): MediaReference | null {
  // 1. Experience doesn't want overlay
  if (!applyOverlay) return null

  // 2. No overlays configured at project level
  if (!overlays) return null

  // 3. Try exact aspect ratio match
  const exactMatch = overlays[aspectRatio]
  if (exactMatch) return exactMatch

  // 4. Fall back to default overlay
  return overlays['default'] ?? null
}
```

### Resolution Priority

1. **Experience flag**: If `experienceRef.applyOverlay === false`, no overlay
2. **Exact match**: `overlays[aspectRatio]` if configured
3. **Default fallback**: `overlays['default']` if configured
4. **No overlay**: `null` if nothing found

---

## 7. Relationships

| From | To | Relationship | Cardinality |
|------|-----|--------------|-------------|
| Project | OverlaysConfig | has one | 1:1 |
| OverlaysConfig | MediaReference | contains | 0..5 |
| Experience | AspectRatio | has one (output) | 1:1 |
| Job | overlayChoice | has one (resolved) | 1:0..1 |
| Job | experienceRef | references | 1:0..1 |
| MediaAsset | MediaReference | referenced by | 1:many |

---

## 8. Index Requirements

No new Firestore indexes required. Existing queries:
- Projects queried by workspace ID (existing index)
- Jobs queried by session ID (existing index)

Overlay lookup is by direct document path, not query.

---

## 9. Migration Notes

### Schema Migration

**Type**: Clean replacement (pre-production)

```typescript
// OLD schema (removed)
projectContextSnapshotSchema = z.looseObject({
  overlay: overlayReferenceSchema.nullable(),
  applyOverlay: z.boolean(),
  overlays: overlaysConfigSchema.nullable(),
  experienceRef: mainExperienceReferenceSchema.nullable(),
})

jobSnapshotSchema = z.looseObject({
  sessionResponses: ...,
  projectContext: projectContextSnapshotSchema,  // REMOVED
  experienceVersion: ...,
  outcome: ...,
})

// NEW schema (flattened)
jobSnapshotSchema = z.object({
  sessionResponses: ...,
  experienceVersion: ...,
  outcome: ...,
  overlayChoice: overlayReferenceSchema.nullable().default(null),  // NEW
  experienceRef: mainExperienceReferenceSchema.nullable().default(null),  // NEW (moved up)
})
```

### Data Migration

**Required**: None (pre-production)

- Existing job documents will be incompatible
- Clean slate approach for new schema

### Type Exports to Remove

```typescript
// Remove from job.schema.ts exports
- ProjectContextSnapshot
- EventContextSnapshot
- projectContextSnapshotSchema
- eventContextSnapshotSchema
```
