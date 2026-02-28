# Data Model: Video Overlay Engine

**Feature**: 084-video-overlay-engine | **Date**: 2026-02-28

## Overview

No new data entities are required. This feature reuses existing data model components from Feature 065 (Overlay Pre-Resolution). Changes are purely in the processing layer (FFmpeg + transform pipeline).

## Existing Entities (No Changes)

### MediaReference (shared schema)

Used for `overlayChoice` in job snapshots. No changes needed.

```typescript
type MediaReference = {
  mediaAssetId: string
  displayName: string
  url: string
  filePath: string | null
}
```

### JobSnapshot.overlayChoice

Already resolved at job creation for all outcome types (photo, ai.image, ai.video). No changes needed — `aiVideoOutcome` already receives `overlayChoice`, it just doesn't use it yet.

### OverlaysConfig (project config)

Already supports all relevant aspect ratios including `9:16` and `1:1`. No changes needed.

```typescript
type OverlaysConfig = {
  '1:1': MediaReference | null
  '3:2': MediaReference | null
  '2:3': MediaReference | null
  '9:16': MediaReference | null
  '16:9': MediaReference | null
  default: MediaReference | null
}
```

## New Types

### hasAudioStream return (probe.ts)

Simple boolean return — no new type needed. Added to existing `probe.ts` module.

```typescript
// New function, no new type
async function hasAudioStream(filePath: string): Promise<boolean>
```

## State Transitions

No state changes. The job lifecycle (pending → processing → completed/failed) is unchanged. Overlay application is a synchronous step within the existing processing pipeline.
