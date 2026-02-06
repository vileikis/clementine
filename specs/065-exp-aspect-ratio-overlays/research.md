# Research: Experience-Level Aspect Ratio & Overlay System

**Feature**: 065-exp-aspect-ratio-overlays
**Date**: 2026-02-06

## Executive Summary

This research documents the current state of aspect ratio and overlay handling in Clementine, identifies the gaps between current implementation and target state, and provides technical decisions for the implementation.

---

## 1. Current State Analysis

### 1.1 Aspect Ratio Definitions (Fragmented)

Currently, aspect ratios are defined in **three separate locations** with different supported values:

| Context | Schema File | Supported Values |
|---------|------------|------------------|
| Capture Step | `capture-photo.schema.ts` | `1:1`, `9:16`, `3:2`, `2:3` |
| AI Generation | `outcome.schema.ts` | `1:1`, `3:2`, `2:3`, `9:16`, `16:9` |
| Overlays | `project-config.schema.ts` | `1:1`, `9:16` only |

**Problem**: No single source of truth. AI generation supports 5 ratios but overlays only support 2.

### 1.2 Current Overlay Storage Structure

```typescript
// packages/shared/src/schemas/project/project-config.schema.ts
overlaysConfigSchema = z.object({
  '1:1': overlayReferenceSchema.nullable().default(null),
  '9:16': overlayReferenceSchema.nullable().default(null),
}).nullable().default(null)
```

**Overlay Reference** (MediaReference type):
- `mediaAssetId`: Firestore document ID
- `url`: Public URL for immediate rendering
- `filePath`: Optional storage path
- `displayName`: Human-readable name

### 1.3 Current Job Snapshot Structure

```typescript
// packages/shared/src/schemas/job/job.schema.ts
projectContextSnapshotSchema = z.looseObject({
  overlay: overlayReferenceSchema.nullable(),      // deprecated
  applyOverlay: z.boolean(),                       // deprecated
  overlays: overlaysConfigSchema.nullable(),       // full map
  experienceRef: mainExperienceReferenceSchema.nullable(),
})
```

**Problems**:
- Nested `projectContext` adds unnecessary complexity
- Full overlays map stored but resolution happens at execution time
- Deprecated fields still present

### 1.4 Current Overlay Resolution (Backend)

```typescript
// functions/src/services/transform/operations/applyOverlay.ts
export function getOverlayForAspectRatio(
  overlays: OverlaysConfig | null,
  aspectRatio: string
): MediaReference | null {
  if (!overlays) return null
  return overlays[aspectRatio as keyof OverlaysConfig] ?? null
}
```

**Current Behavior**:
- Resolution happens at job execution time
- No fallback to default overlay
- Returns `null` if not found

---

## 2. Technical Decisions

### 2.1 Canonical Aspect Ratio Schema (in media/ folder)

**Decision**: Create canonical schema in `packages/shared/src/schemas/media/aspect-ratio.schema.ts`

**Rationale**:
- Aspect ratio is fundamentally about media dimensions
- Keeps related schemas together (`media-reference`, `aspect-ratio`)
- Reduces directory sprawl vs separate `aspect-ratio/` folder

**Implementation**:

```typescript
// media/aspect-ratio.schema.ts

import { z } from 'zod'

// Canonical aspect ratios supported by the platform
export const aspectRatioSchema = z.enum(['1:1', '3:2', '2:3', '9:16'])

// Overlay configuration keys (includes default fallback)
export const overlayKeySchema = z.enum(['1:1', '3:2', '2:3', '9:16', 'default'])

// Media-type-specific subsets
export const imageAspectRatioSchema = aspectRatioSchema // All 4 ratios
export const videoAspectRatioSchema = z.enum(['9:16', '1:1']) // Subset

// Type exports
export type AspectRatio = z.infer<typeof aspectRatioSchema>
export type OverlayKey = z.infer<typeof overlayKeySchema>
```

**Note**: Removing `16:9` from AI generation options as it's not in the PRD spec.

### 2.2 Extended Overlay Configuration

**Decision**: Extend `overlaysConfigSchema` to support all aspect ratios plus default

**Implementation**:

```typescript
// project-config.schema.ts
export const overlaysConfigSchema = z.object({
  '1:1': overlayReferenceSchema.nullable().default(null),
  '3:2': overlayReferenceSchema.nullable().default(null),
  '2:3': overlayReferenceSchema.nullable().default(null),
  '9:16': overlayReferenceSchema.nullable().default(null),
  'default': overlayReferenceSchema.nullable().default(null),
}).nullable().default(null)
```

### 2.3 Overlay Resolution at Job Creation (Key Change)

**Decision**: Resolve overlay choice in `startTransformPipeline.ts` at job creation, not at execution

**Rationale**:
- Job becomes fully self-contained
- Single point of resolution logic
- Simpler backend transform code
- No need to fetch project config at execution time

**Implementation in `startTransformPipeline.ts`**:

```typescript
// Fetch project for overlay resolution
const project = await fetchProject(session.workspaceId, projectId)

// Get aspect ratio from outcome config
const aspectRatio = outcome.imageGeneration?.aspectRatio ?? '1:1'

// Resolve overlay choice
const overlayChoice = resolveOverlayChoice(
  project?.config?.overlays,
  experienceRef?.applyOverlay ?? false,
  aspectRatio
)

// Build snapshot with resolved overlay
const snapshot = buildJobSnapshot(session, experience, configSource, {
  overlayChoice,
  experienceRef,
})
```

**Resolution Logic**:

```typescript
function resolveOverlayChoice(
  overlays: OverlaysConfig | null,
  applyOverlay: boolean,
  aspectRatio: AspectRatio
): MediaReference | null {
  // 1. Check if experience wants overlay
  if (!applyOverlay) return null

  // 2. No overlays configured
  if (!overlays) return null

  // 3. Try exact aspect ratio match
  const exactMatch = overlays[aspectRatio]
  if (exactMatch) return exactMatch

  // 4. Fall back to default overlay
  return overlays['default'] ?? null
}
```

### 2.4 Flattened Job Snapshot Schema (Remove projectContext)

**Decision**: Remove `projectContext` wrapper, add `overlayChoice` directly to `jobSnapshotSchema`

**Rationale**:
- Pre-production, no backward compatibility needed
- Cleaner, flatter schema
- `overlayChoice` is the resolved value, not raw config

**Implementation**:

```typescript
// job.schema.ts
export const jobSnapshotSchema = z.object({
  /** Session responses at job creation */
  sessionResponses: z.array(sessionResponseSchema).default([]),

  /** Experience version at time of job creation */
  experienceVersion: z.number().int().positive(),

  /** Outcome configuration */
  outcome: outcomeSchema.nullable().default(null),

  /** Resolved overlay to apply (null = no overlay) */
  overlayChoice: overlayReferenceSchema.nullable().default(null),

  /** Experience reference for audit trail */
  experienceRef: mainExperienceReferenceSchema.nullable().default(null),
})
```

**Removed**:
- `projectContext` wrapper
- `projectContextSnapshotSchema`
- `eventContextSnapshotSchema` (deprecated alias)
- `overlay` and `applyOverlay` deprecated fields

### 2.5 Simplified Backend Transform

**Decision**: Backend uses `snapshot.overlayChoice` directly, no resolution logic

**Implementation**:

```typescript
// imageOutcome.ts - simplified
const overlay = job.snapshot.overlayChoice
if (overlay) {
  logger.info('Applying overlay', { displayName: overlay.displayName })
  outputPath = await applyOverlay(outputPath, overlay, tmpDir)
} else {
  logger.info('No overlay to apply')
}
```

**Removed from applyOverlay.ts**:
- `getOverlayForAspectRatio()` function (no longer needed)

---

## 3. Migration Strategy

### 3.1 Schema Migration

**Approach**: Clean replacement (pre-production)

- Remove `projectContext` entirely
- Add `overlayChoice` and `experienceRef` at top level
- No backward compatibility shims needed

### 3.2 UI Migration

**Approach**: Component update, no feature flags

- OverlaySection updated to render all 5 slots
- Existing overlays remain functional
- Project Owners can add new overlays at their pace

### 3.3 Backend Migration

**Approach**: Update callable and simplify transform

- `startTransformPipeline.ts`: Add project fetch and overlay resolution
- `job.ts`: Update `buildJobSnapshot` signature
- `imageOutcome.ts`: Simplify to use `overlayChoice` directly
- `applyOverlay.ts`: Remove `getOverlayForAspectRatio` helper

---

## 4. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Existing jobs fail after schema change | Low | Low | Pre-production; no existing jobs to worry about |
| Project Owners confused by more overlay slots | Low | Low | Clear labels, tooltips, documentation |
| Default overlay scaling issues | Medium | Medium | Document that default may be scaled; recommend specific dimensions |
| Performance impact from project fetch | Low | Low | Single additional read at job creation; negligible |

---

## 5. File Changes Summary

### packages/shared/ (New + Updates)

| File | Action | Description |
|------|--------|-------------|
| `schemas/media/aspect-ratio.schema.ts` | CREATE | Canonical aspect ratio definitions |
| `schemas/media/index.ts` | UPDATE | Export aspect-ratio module |
| `schemas/index.ts` | UPDATE | Export from media module |
| `schemas/project/project-config.schema.ts` | UPDATE | Extend overlays to 5 keys |
| `schemas/experience/steps/capture-photo.schema.ts` | UPDATE | Import from media/aspect-ratio |
| `schemas/experience/outcome.schema.ts` | UPDATE | Import from media/aspect-ratio, remove 16:9 |
| `schemas/job/job.schema.ts` | UPDATE | Flatten with overlayChoice, remove projectContext |

### apps/clementine-app/ (Updates)

| File | Action | Description |
|------|--------|-------------|
| `domains/project-config/settings/components/OverlaySection.tsx` | UPDATE | Render 5 overlay slots |
| `domains/project-config/settings/components/OverlayFrame.tsx` | UPDATE | Support default variant styling |
| `domains/project-config/settings/hooks/useUpdateOverlays.ts` | UPDATE | Handle new aspect ratio keys |
| `domains/experience/create/lib/model-options.ts` | UPDATE | Import from canonical schema |

### functions/ (Updates)

| File | Action | Description |
|------|--------|-------------|
| `callable/startTransformPipeline.ts` | UPDATE | Add project fetch, resolve overlayChoice |
| `repositories/job.ts` | UPDATE | buildJobSnapshot accepts overlayChoice |
| `repositories/project.ts` | CREATE | fetchProject helper |
| `services/transform/operations/applyOverlay.ts` | SIMPLIFY | Remove getOverlayForAspectRatio |
| `services/transform/outcomes/imageOutcome.ts` | SIMPLIFY | Use snapshot.overlayChoice directly |

---

## 6. Open Questions (Resolved)

| Question | Resolution |
|----------|------------|
| Should 16:9 be supported? | No - PRD explicitly lists only 1:1, 3:2, 2:3, 9:16 for images |
| Where to put aspect-ratio schema? | In `media/` folder alongside media-reference |
| When to resolve overlay? | At job creation in callable, not at execution |
| Keep projectContext for backward compat? | No - pre-production, clean removal |
| How should default overlay be scaled? | Scaled to fit output dimensions; documented as potential quality tradeoff |
