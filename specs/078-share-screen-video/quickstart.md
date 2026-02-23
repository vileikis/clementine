# Quickstart: Share Screen Video Support

**Feature**: 078-share-screen-video
**Date**: 2026-02-23

## Prerequisites

- pnpm 10.18.1 installed
- Firebase emulators (optional — can test with prod data)
- A video result in Firestore (or manually set `resultMediaFormat: 'video'` on a session)

## Setup

```bash
# From monorepo root
pnpm install

# Start the app
pnpm app:dev
```

## Files to Modify

### Backend (functions/)

| File | Change |
| ---- | ------ |
| `functions/src/tasks/transformPipelineTask.ts` | Write `resultMediaFormat` + `resultMediaThumbnailUrl` to session alongside `resultMedia` |
| `functions/src/repositories/session.ts` | Add helper to write new fields (or extend `updateSessionResultMedia`) |

### Shared Schema (packages/shared/)

| File | Change |
| ---- | ------ |
| `packages/shared/src/schemas/session/session.schema.ts` | Add `resultMediaFormat` and `resultMediaThumbnailUrl` fields |

### Frontend (apps/clementine-app/)

| File | Change |
| ---- | ------ |
| `src/domains/guest/containers/SharePage.tsx` | Extract `resultMediaFormat` + `resultMediaThumbnailUrl` from session, pass to renderer |
| `src/domains/project-config/share/components/ShareReadyRenderer.tsx` | Accept new props, conditionally render `<video>` or `<img>` |
| `src/domains/project-config/share/components/ShareVideoPlayer.tsx` | **NEW** — Minimal video player with custom play/pause overlay |
| `src/domains/guest/hooks/useShareActions.ts` | Accept `mediaFormat`, use for file extension and MIME type |

## Testing

```bash
# Type check
pnpm app:type-check

# Lint + format
pnpm app:check

# Run tests
pnpm app:test

# Build shared package (if schema changed)
pnpm --filter @clementine/shared build
```

## Manual Testing

1. Create an experience with video output type
2. Run a guest session to generate a video result
3. Open the share screen URL
4. Verify: video autoplays muted, play/pause works, layout fits, CTA visible
5. Test download on desktop (correct .mp4 extension)
6. Test share on mobile (native share sheet with video file)
7. Verify image results still render correctly (no regression)
