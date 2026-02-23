# Tasks: Share Screen Video Support

**Input**: Design documents from `/specs/078-share-screen-video/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/session-fields.md

**Tests**: Not requested in feature specification — no test tasks included.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: Schema and backend changes that MUST be complete before any frontend work. The frontend reads `resultMediaFormat` from the session subscription — without the schema update and backend write, there is no format data to render against.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T001 [P] Add `resultMediaFormat` (`z.enum(['image', 'gif', 'video']).nullable().default(null)`) and `resultMediaThumbnailUrl` (`z.url().nullable().default(null)`) fields to the session schema in `packages/shared/src/schemas/session/session.schema.ts`. Place them after the existing `resultMedia` field. Build the shared package with `pnpm --filter @clementine/shared build` to verify types compile.

- [ ] T002 [P] Update the backend to write `resultMediaFormat` and `resultMediaThumbnailUrl` to the session document when a job completes. In `functions/src/repositories/session.ts`, extend `updateSessionResultMedia` to accept `format` and `thumbnailUrl` params and include them in the Firestore update. In `functions/src/tasks/transformPipelineTask.ts`, pass `output.format` and `output.thumbnailUrl` to the updated repository function at the existing `updateSessionResultMedia` call site (~line 198). Build functions with `pnpm functions:build` to verify.

**Checkpoint**: Schema defines new fields, backend writes them at job completion. Frontend can now read `session.resultMediaFormat` and `session.resultMediaThumbnailUrl` via the existing `useSubscribeSession` hook.

---

## Phase 2: User Story 1 — Guest Views Video Result (Priority: P1) 🎯 MVP

**Goal**: When a guest opens the share screen for a video result, the video plays automatically (muted, looping) with a custom play/pause overlay. Layout constrains media to ~50vh so the CTA stays visible. Image results continue rendering as before.

**Independent Test**: Generate a video result, visit the share URL. Video should autoplay muted within the media container, play/pause toggle works, aspect ratio preserved, CTA visible without scrolling. Then verify an image result still renders correctly.

### Implementation for User Story 1

- [ ] T003 [US1] Create `ShareVideoPlayer` component in `apps/clementine-app/src/domains/project-config/share/components/ShareVideoPlayer.tsx`. Render a `<video>` element with `autoplay muted loop playsInline` attributes (no native `controls` attribute). Add a custom play/pause overlay: clicking/tapping the video area toggles playback via `videoRef.play()`/`videoRef.pause()` with a centered Play/Pause icon (use `lucide-react` `Play` and `Pause` icons). Overlay icon should be 44x44px minimum touch target. Accept props: `src: string`, `posterUrl?: string | null`, `className?: string`. Apply `max-h-[50vh] w-full object-contain rounded-lg` to the video element to constrain height and preserve aspect ratio.

- [ ] T004 [US1] Update `ShareReadyRenderer` props interface to add `mediaFormat?: 'image' | 'gif' | 'video' | null` and `mediaThumbnailUrl?: string | null` in `apps/clementine-app/src/domains/project-config/share/components/ShareReadyRenderer.tsx`. In the render body, replace the current `<img>` rendering with a conditional: when `mediaFormat === 'video'` and `mediaUrl` exists, render `<ShareVideoPlayer src={mediaUrl} posterUrl={mediaThumbnailUrl} />`. Otherwise render the existing `<img>` tag. Add `max-h-[50vh] object-contain` to the existing `<img>` className to match the video constraint. Keep the edit-mode placeholder and loading skeleton branches unchanged.

- [ ] T005 [US1] Update `SharePage` container in `apps/clementine-app/src/domains/guest/containers/SharePage.tsx` to extract `resultMediaFormat` and `resultMediaThumbnailUrl` from the session object (already available via `useSubscribeSession`). Pass them as `mediaFormat` and `mediaThumbnailUrl` props to `ShareReadyRenderer`.

**Checkpoint**: Video results autoplay muted on the share screen with play/pause control. Image results render unchanged. CTA stays above fold for all aspect ratios.

---

## Phase 3: User Story 2 — Guest Downloads or Shares a Video Result (Priority: P1)

**Goal**: When a guest downloads a video result, the file has the correct `.mp4` extension and MIME type. On mobile, the native share sheet correctly identifies the file as a video. Image downloads continue working as before with `.jpg`.

**Independent Test**: Click the download button for a video result on desktop — verify the file downloads as `.mp4`. On mobile, tap share — verify the native share sheet opens with the video file. Then verify an image download still works as `.jpg`.

### Implementation for User Story 2

- [ ] T006 [US2] Update `useShareActions` hook in `apps/clementine-app/src/domains/guest/hooks/useShareActions.ts`. Add `mediaFormat?: 'image' | 'gif' | 'video' | null` to `UseShareActionsParams`. Add a `FORMAT_MAP` constant mapping each format to its file extension and MIME type: `image` → `{ ext: '.jpg', mime: 'image/jpeg' }`, `gif` → `{ ext: '.gif', mime: 'image/gif' }`, `video` → `{ ext: '.mp4', mime: 'video/mp4' }`. In the download handler, replace the hardcoded `clementine-result-${Date.now()}.jpg` filename with `clementine-result-${Date.now()}${FORMAT_MAP[mediaFormat ?? 'image'].ext}`. Update the `File` constructor MIME type to use `FORMAT_MAP[mediaFormat ?? 'image'].mime` instead of the hardcoded value.

- [ ] T007 [US2] Wire `resultMediaFormat` from session to `useShareActions` in `apps/clementine-app/src/domains/guest/containers/SharePage.tsx`. Pass `mediaFormat: resultMediaFormat` (already extracted in T005) to the `useShareActions` call.

**Checkpoint**: Video downloads have `.mp4` extension. Mobile share sheet receives correct MIME type. Image downloads unchanged.

---

## Phase 4: User Story 3 — Video Loads Performantly with Thumbnail Preview (Priority: P2)

**Goal**: Before the video fully loads, the guest sees a thumbnail poster image and a loading spinner. If the video fails to load, a user-friendly error message with retry appears instead of a broken player.

**Independent Test**: Throttle network speed in browser DevTools, load a video share page. Thumbnail should appear immediately as poster, a loading indicator should be visible while buffering, and the video should begin playing once ready. Disconnect network — error state should appear with retry button.

### Implementation for User Story 3

- [ ] T008 [US3] Add loading/buffering state to `ShareVideoPlayer` in `apps/clementine-app/src/domains/project-config/share/components/ShareVideoPlayer.tsx`. Track buffering state via `onWaiting` (set loading true) and `onCanPlay`/`onPlaying` (set loading false) video events. When loading, display a centered spinner overlay (use a simple `animate-spin` Tailwind animation on a `Loader2` icon from `lucide-react`) positioned over the video/poster. The poster image (via `<video poster={posterUrl}>`) already displays while the video loads — ensure it remains visible under the spinner.

- [ ] T009 [US3] Add error state to `ShareVideoPlayer` in `apps/clementine-app/src/domains/project-config/share/components/ShareVideoPlayer.tsx`. Track error state via the `onError` video event. When an error occurs, hide the `<video>` element and display a fallback: a `bg-muted rounded-lg` container with a centered error message ("Video failed to load") and a retry `Button` (from `@/ui-kit/ui/button`) that resets the error state and reloads the video by resetting the `src` attribute via `videoRef.current.load()`.

**Checkpoint**: Slow connections show thumbnail + spinner. Failed loads show error with retry. Fast connections show seamless autoplay.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Validate everything works together and passes quality gates.

- [ ] T010 Build and validate shared package: `pnpm --filter @clementine/shared build`
- [ ] T011 Run validation gates: `pnpm app:check` (format + lint) and `pnpm app:type-check` (TypeScript)
- [ ] T012 Run manual testing walkthrough per `specs/078-share-screen-video/quickstart.md`: verify video autoplay, play/pause toggle, download with correct extension, mobile share sheet, image result regression, layout across aspect ratios (1:1, 9:16, 16:9)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — can start immediately. T001 and T002 are parallel (different workspaces).
- **US1 (Phase 2)**: Depends on Phase 1 completion. T003 → T004 → T005 (sequential within phase).
- **US2 (Phase 3)**: Depends on Phase 1 completion. Can run in parallel with US1 since it touches different files. T006 → T007 (sequential within phase).
- **US3 (Phase 4)**: Depends on T003 (ShareVideoPlayer must exist). T008 and T009 are parallel (independent state handlers in same file but no conflicts).
- **Polish (Phase 5)**: Depends on all user stories being complete. T010 → T011 → T012 (sequential).

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational — no dependencies on other stories
- **US2 (P1)**: Can start after Foundational — independent of US1 (different files: `useShareActions` vs `ShareReadyRenderer`)
- **US3 (P2)**: Depends on T003 from US1 (ShareVideoPlayer component must exist to add loading/error states)

### Parallel Opportunities

```
Phase 1 (parallel):
  T001 (shared schema)  ║  T002 (backend write)
                         ↓
Phase 2 + 3 (parallel user stories):
  US1: T003 → T004 → T005    ║    US2: T006 → T007
                               ↓
Phase 4 (parallel within US3):
  T008 (loading state)  ║  T009 (error state)
                         ↓
Phase 5 (sequential):
  T010 → T011 → T012
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Foundational (schema + backend)
2. Complete Phase 2: US1 (video rendering)
3. **STOP and VALIDATE**: Video plays on share screen, images still work
4. Deploy/demo if ready — this alone delivers the core value

### Incremental Delivery

1. Phase 1 → Foundation ready
2. US1 → Video renders and plays → Deploy (MVP!)
3. US2 → Download works with correct format → Deploy
4. US3 → Loading polish + error handling → Deploy
5. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files/workspaces, no dependencies
- [Story] label maps task to specific user story for traceability
- Backward compatible: `resultMediaFormat: null` falls back to image rendering
- No data migration needed — new fields only populated for future job completions
- Total: 12 tasks across 5 phases
