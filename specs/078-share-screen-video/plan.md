# Implementation Plan: Share Screen Video Support

**Branch**: `078-share-screen-video` | **Date**: 2026-02-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/078-share-screen-video/spec.md`

## Summary

Add video support to the guest share screen so that AI-generated video results render inline with autoplay (muted), custom play/pause controls, and correct download/share behavior. The backend writes `resultMediaFormat` and `resultMediaThumbnailUrl` to the session document at job completion, enabling the frontend to detect media type without additional Firestore reads. Backward compatible — existing image results render unchanged.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode)
**Primary Dependencies**: TanStack Start 1.132.0, React 19, Firebase SDK 12.5.0, Tailwind CSS v4, Zod 4.1.12
**Storage**: Firebase Firestore (session documents), Firebase Storage (media files)
**Testing**: Vitest
**Target Platform**: Web — mobile-first (320px–768px primary), desktop secondary
**Project Type**: pnpm monorepo (apps/clementine-app + functions + packages/shared)
**Performance Goals**: Video playback within 3 seconds, page load < 2 seconds on 4G
**Constraints**: Guest share screen is public (no auth), Firestore job docs are admin-only read
**Scale/Scope**: Single share page, ~6 files modified, 1 new component

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
| --------- | ------ | ----- |
| I. Mobile-First | PASS | Video player designed mobile-first with `playsinline`, touch-friendly controls (44x44px), responsive layout |
| II. Clean Code & Simplicity | PASS | Minimal changes (~6 files), no new abstractions, one small component |
| III. Type-Safe Development | PASS | Zod schema updated, strict TypeScript types for new fields, format enum typed |
| IV. Minimal Testing | PASS | Test critical path (format detection, file extension mapping) |
| V. Validation Gates | PASS | Run `pnpm app:check` + `pnpm app:type-check` before commit |
| VI. Frontend Architecture | PASS | Client-first: reads from existing Firestore session subscription, no new server functions |
| VII. Backend & Firebase | PASS | Admin SDK writes new fields to session doc, existing security rules unchanged |
| VIII. Project Structure | PASS | New component in existing share domain, follows vertical slice |

**Post-Phase 1 re-check**: All principles still pass. No complexity violations.

## Project Structure

### Documentation (this feature)

```text
specs/078-share-screen-video/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 research output
├── data-model.md        # Phase 1 data model
├── quickstart.md        # Phase 1 quickstart
├── contracts/           # Phase 1 contracts
│   └── session-fields.md
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
packages/shared/src/schemas/session/
└── session.schema.ts                    # Add resultMediaFormat + resultMediaThumbnailUrl

functions/src/
├── tasks/transformPipelineTask.ts       # Write new fields at job completion
└── repositories/session.ts             # Extend updateSessionResultMedia

apps/clementine-app/src/
├── domains/guest/
│   ├── containers/SharePage.tsx         # Pass format + thumbnail to renderer
│   └── hooks/useShareActions.ts         # Use format for file extension + MIME
└── domains/project-config/share/
    └── components/
        ├── ShareReadyRenderer.tsx        # Conditional video/image rendering
        └── ShareVideoPlayer.tsx          # NEW: Minimal video player component
```

**Structure Decision**: All changes fit within existing domain structure. The new `ShareVideoPlayer` component belongs in the share domain (`project-config/share/components/`) alongside `ShareReadyRenderer` since it's specific to the share screen rendering.

## Design Decisions

### D1: Format data on session (not job query)

Firestore rules restrict job reads to admins. Rather than loosening security rules or inferring format from URLs, we write `resultMediaFormat` and `resultMediaThumbnailUrl` to the session document at job completion. This uses the existing real-time session subscription with zero additional reads.

See [research.md](./research.md) — Research Question 1.

### D2: Custom play/pause overlay (not native controls)

Native browser `controls` attribute cannot selectively hide scrub bar, volume, and download button across all browsers. A custom overlay with a single centered play/pause button provides the exact UX required by the spec.

See [research.md](./research.md) — Research Question 3.

### D3: Backward compatibility via null fallback

Sessions created before this change will have `resultMediaFormat: null`. The share screen treats `null` as `image` (current behavior), ensuring zero regressions without data migration.

### D4: Format-to-extension mapping

A simple constant map converts format to file extension and MIME type for download:
- `image` → `.jpg` / `image/jpeg`
- `gif` → `.gif` / `image/gif`
- `video` → `.mp4` / `video/mp4`

This replaces the hardcoded `.jpg` in `useShareActions`.

## Implementation Phases

### Phase A: Schema + Backend (foundation)

1. **Update session schema** (`packages/shared`) — add `resultMediaFormat` and `resultMediaThumbnailUrl`
2. **Update backend** (`functions/`) — write new fields when job completes in `transformPipelineTask.ts`
3. Build shared package to verify types

### Phase B: Video rendering (core feature)

4. **Create ShareVideoPlayer** — `<video>` element with autoplay/muted/loop/playsinline, custom play/pause overlay, poster thumbnail, loading state
5. **Update ShareReadyRenderer** — accept `mediaFormat` + `mediaThumbnailUrl` props, conditionally render `ShareVideoPlayer` or `<img>`
6. **Update SharePage container** — extract new fields from session, pass to renderer

### Phase C: Download + share (complete flow)

7. **Update useShareActions** — accept `mediaFormat`, derive file extension and MIME type from format map, fix hardcoded `.jpg`

### Phase D: Layout + polish

8. **Media container constraint** — ensure `max-h-[50vh]` + `object-contain` on both `<img>` and `<video>` elements
9. **Error states** — handle video load failure with retry option
10. **Validation** — run `pnpm app:check`, `pnpm app:type-check`, `pnpm --filter @clementine/shared build`
