# Contract: Session Document — New Fields

**Feature**: 078-share-screen-video

## Overview

No new API endpoints are introduced. This feature modifies an existing Firestore document (session) by adding two fields. The "contract" is the Firestore document shape read by the frontend.

## Session Document (Firestore)

**Path**: `projects/{projectId}/sessions/{sessionId}`

### New Fields

```typescript
// Added to existing session document
{
  // ... existing fields unchanged ...

  resultMediaFormat: 'image' | 'gif' | 'video' | null,  // NEW
  resultMediaThumbnailUrl: string | null,                 // NEW (valid URL when present)
}
```

### Write Contract (Backend → Firestore)

**When**: Job completes successfully in `transformPipelineTask.ts`
**Writer**: Firebase Admin SDK (server-side only)

```typescript
// Existing write (unchanged):
await updateSessionResultMedia(projectId, sessionId, {
  mediaAssetId: output.assetId,
  url: output.url,
  filePath: output.filePath,
  displayName: 'Result',
})

// New write (added):
await updateSessionResultMediaFormat(projectId, sessionId, {
  resultMediaFormat: output.format,          // 'image' | 'gif' | 'video'
  resultMediaThumbnailUrl: output.thumbnailUrl, // string | null
})
```

### Read Contract (Firestore → Frontend)

**When**: Guest opens share screen
**Reader**: `useSubscribeSession` hook (real-time Firestore listener)

```typescript
// Available on session object:
const format = session.resultMediaFormat   // 'image' | 'gif' | 'video' | null
const thumbnail = session.resultMediaThumbnailUrl  // string | null

// Rendering decision:
if (format === 'video') → render <video> player
else → render <img> (existing behavior, includes null fallback)
```

## Component Props Contract

### ShareReadyRenderer (modified)

```typescript
interface ShareReadyRendererProps {
  // Existing props (unchanged):
  share: ShareReadyConfig
  shareOptions: ShareOptionsConfig
  mode?: 'edit' | 'run'
  mediaUrl?: string | null
  onShare?: (platform: keyof ShareOptionsConfig) => void
  onCta?: () => void
  onStartOver?: () => void

  // New props:
  mediaFormat?: 'image' | 'gif' | 'video' | null   // NEW
  mediaThumbnailUrl?: string | null                  // NEW
}
```

### useShareActions (modified)

```typescript
interface UseShareActionsParams {
  media: MediaReference | null    // Existing
  mediaFormat?: 'image' | 'gif' | 'video' | null  // NEW — for file extension
}
```

## Format-to-Extension Mapping

```typescript
const FORMAT_MAP = {
  image: { ext: '.jpg', mime: 'image/jpeg' },
  gif:   { ext: '.gif', mime: 'image/gif' },
  video: { ext: '.mp4', mime: 'video/mp4' },
} as const
```
