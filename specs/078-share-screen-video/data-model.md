# Data Model: Share Screen Video Support

**Feature**: 078-share-screen-video
**Date**: 2026-02-23

## Entity Changes

### Session (modified)

Two new fields added to the session document for media format awareness on the share screen.

| Field | Type | Default | Description |
| ----- | ---- | ------- | ----------- |
| `resultMediaFormat` | `'image' \| 'gif' \| 'video'` | `null` | Format of the result media, set when job completes |
| `resultMediaThumbnailUrl` | `string (URL)` | `null` | Thumbnail URL for video poster image, set when job completes |

**Firestore path**: `projects/{projectId}/sessions/{sessionId}`

**Write location**: `functions/src/tasks/transformPipelineTask.ts` — added alongside existing `resultMedia` write at job completion.

**Read location**: `apps/clementine-app/src/domains/guest/containers/SharePage.tsx` — accessed via existing `useSubscribeSession` hook (real-time subscription).

### Session Schema Update (packages/shared)

```
sessionSchema (existing z.looseObject):
  + resultMediaFormat: z.enum(['image', 'gif', 'video']).nullable().default(null)
  + resultMediaThumbnailUrl: z.url().nullable().default(null)
```

### MediaReference (unchanged)

No changes to the MediaReference schema. Format is a session-level concern, not a generic media reference concern.

### JobOutput (unchanged)

No changes. `job.output.format` and `job.output.thumbnailUrl` remain the canonical source. The new session fields are derived from job output at write time.

## State Transitions

```
Job completes → Backend writes to session:
  - resultMedia: { mediaAssetId, url, filePath, displayName }  (existing)
  - resultMediaFormat: output.format                            (NEW)
  - resultMediaThumbnailUrl: output.thumbnailUrl                (NEW)
  - jobStatus: 'completed'                                      (existing)

Share screen subscribes to session → Reads:
  - resultMedia.url → media source URL
  - resultMediaFormat → determines image vs video rendering
  - resultMediaThumbnailUrl → video poster image
```

## Backward Compatibility

- Existing sessions without `resultMediaFormat` will have `null` (schema default)
- When `resultMediaFormat` is `null`, the share screen falls back to image rendering (current behavior)
- No migration needed — new fields only populated for future job completions
