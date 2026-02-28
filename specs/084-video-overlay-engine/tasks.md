# Tasks: Video Overlay Engine

**Input**: Design documents from `/specs/084-video-overlay-engine/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not requested in feature specification. Manual testing only per quickstart.md.

**Organization**: Tasks grouped by user story. US1 = audio-safe overlay composition (FFmpeg + operation layer). US2 = wire overlay into AI video pipeline (outcome layer). FFmpeg version alignment is a blocking prerequisite (Phase 1).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

All paths relative to repository root. This feature modifies only the `functions/` workspace.

---

## Phase 1: FFmpeg Version Alignment (Blocking Prerequisite)

**Purpose**: Verify local and cloud FFmpeg versions match before implementing video overlay. Video compositing is sensitive to version differences (codec flags, filter behavior, audio stream handling). PRD gates all video overlay work on this.

**Key files**: `functions/package.json` (`ffmpeg-static` 5.3.0 → FFmpeg 6.1.1), `functions/src/services/ffmpeg/core.ts` (binary path resolution), `functions/esbuild.config.mjs` (`ffmpeg-static` marked external)

- [x] T001 Add FFmpeg version diagnostic log to `functions/src/services/ffmpeg/core.ts` — on module load (cold start), spawn `FFMPEG_PATH` with `-version` flag, log the resolved version string via `firebase-functions/v2` logger. This confirms whether Cloud Functions uses the `ffmpeg-static` 6.1.1 binary or the system FFmpeg 7.x.
- [x] T002 Deploy diagnostic to production and verify FFmpeg version — **Result: Local=FFmpeg 6.0, Cloud=FFmpeg 7.0.2-static (mismatch)** — run `pnpm functions:deploy`, trigger a cold start (invoke any function), check Cloud Logging for the FFmpeg version output. Document the result.
- [ ] T003 Resolve version mismatch (if any) — based on T002 results: if `ffmpeg-static` 6.1.1 loads correctly, no action needed (remove diagnostic log or keep as permanent telemetry). If system FFmpeg 7.x is used instead, choose standardization path per PRD: keep `ffmpeg-static` (fix loading), use system FFmpeg 7 (drop `ffmpeg-static`, update local dev), or vendor a pinned binary.

**Checkpoint**: FFmpeg version is confirmed identical in local dev and Cloud Functions. Gate passes — video overlay implementation can proceed.

---

## Phase 2: Foundational (Audio Stream Detection)

**Purpose**: Add `hasAudioStream()` probe function — required by overlay.ts before it can handle video audio passthrough

- [ ] T004 Add `hasAudioStream(filePath)` function to `functions/src/services/ffmpeg/probe.ts` — query ffprobe for audio stream `a:0`, return `Promise<boolean>`
- [ ] T005 Export `hasAudioStream` from `functions/src/services/ffmpeg/index.ts` barrel file

**Checkpoint**: `hasAudioStream` is available for import. `pnpm functions:build` passes.

---

## Phase 3: User Story 1 — Audio-Safe Overlay Composition (Priority: P1) 🎯 MVP

**Goal**: `applyOverlayToMedia` handles video inputs with correct audio passthrough, and `applyOverlay` outputs the correct file extension for videos.

**Independent Test**: Call `applyOverlayToMedia` with a video file (with and without audio) — output should preserve audio when present and use `-an` when absent. Call `applyOverlay` with an `.mp4` input — output path should end in `.mp4`.

### Implementation for User Story 1

- [ ] T006 [P] [US1] Update `applyOverlayToMedia` in `functions/src/services/ffmpeg/overlay.ts` — detect video input by extension, call `hasAudioStream`, add `-c:a copy` if audio exists or `-an` if not. Non-video inputs unchanged.
- [ ] T007 [P] [US1] Update `applyOverlay` in `functions/src/services/transform/operations/applyOverlay.ts` — derive output extension from `path.extname(inputPath)` (`.mp4` → `.mp4`, otherwise `.jpg`). Replace hardcoded `output-with-overlay.jpg`.

**Checkpoint**: FFmpeg overlay composition and operation layer both handle video inputs correctly. `pnpm functions:build` passes. Existing image overlay behavior is unchanged.

---

## Phase 4: User Story 2 — Wire Overlay into AI Video Pipeline (Priority: P2)

**Goal**: `aiVideoOutcome` applies overlay to generated video output (same pattern as `aiImageOutcome`), with overlay visible in both output video and thumbnail.

**Independent Test**: Trigger an AI video job with an overlay configured. Output video should have overlay applied. Thumbnail should show overlay. Audio should be preserved if present.

**Depends on**: US1 (T006, T007)

### Implementation for User Story 2

- [ ] T008 [US2] Wire overlay into `functions/src/services/transform/outcomes/aiVideoOutcome.ts` — replace "overlay not supported" warning (lines 69-78) with `applyOverlay` call. Apply overlay to `generatedVideo.localPath` before thumbnail extraction. Re-upload overlayed video to Storage and use new URL in output. Follow `aiImageOutcome.ts` lines 97-105 pattern. Import `applyOverlay` from `../operations/applyOverlay` and `uploadOutput` from `../operations/uploadOutput`.

**Checkpoint**: Full end-to-end video overlay works. AI video outcomes with overlay configured produce branded video output with correct thumbnail.

---

## Phase 5: Polish & Validation

**Purpose**: Build verification and final checks

- [ ] T009 Run `pnpm functions:build` to verify TypeScript compilation passes with no errors
- [ ] T010 Verify no regression to existing image overlay by reviewing unchanged `aiImageOutcome.ts` and `photoOutcome.ts` imports and usage

---

## Dependencies & Execution Order

### Phase Dependencies

- **FFmpeg Version Alignment (Phase 1)**: No dependencies — start immediately. **BLOCKS all subsequent phases.**
- **Foundational (Phase 2)**: Depends on Phase 1 gate passing
- **US1 (Phase 3)**: Depends on Phase 2 (T004, T005) — `hasAudioStream` must exist before overlay.ts can import it
- **US2 (Phase 4)**: Depends on Phase 3 (T006, T007) — overlay must handle video before outcome can call it
- **Polish (Phase 5)**: Depends on all previous phases

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational (Phase 2). No dependencies on US2.
- **US2 (P2)**: Depends on US1 completion. Cannot start until overlay.ts and applyOverlay.ts handle video correctly.

### Within Each User Story

- US1: T006 and T007 are independent ([P] — different files, no dependencies between them)
- US2: T008 is a single task

### Parallel Opportunities

- T006 and T007 can run in parallel (different files: `overlay.ts` vs `applyOverlay.ts`)

---

## Parallel Example: User Story 1

```bash
# Launch both US1 tasks together (different files, no dependencies):
Task: "Update applyOverlayToMedia in functions/src/services/ffmpeg/overlay.ts"
Task: "Update applyOverlay in functions/src/services/transform/operations/applyOverlay.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: FFmpeg Version Alignment (T001-T003) — **GATE: must pass**
2. Complete Phase 2: Foundational (T004-T005)
3. Complete Phase 3: US1 (T006-T007 in parallel)
4. **STOP and VALIDATE**: Build passes, overlay.ts handles video audio correctly
5. Proceed to US2

### Incremental Delivery

1. T001-T003 → FFmpeg version verified and aligned
2. T004-T005 → Audio detection ready
3. T006-T007 → Video overlay composition works (MVP!)
4. T008 → Full pipeline integration
5. T009-T010 → Validated and regression-free

---

## Notes

- Total tasks: 10
- FFmpeg version alignment: 3 (T001-T003) — blocking prerequisite
- Foundational: 2 (T004-T005)
- US1 tasks: 2 (T006, T007)
- US2 tasks: 1 (T008)
- Polish: 2 (T009, T010)
- Parallel opportunities: T006 + T007 (US1, different files)
- No test tasks generated (not requested in spec)
- All changes in existing files — no new files created
- Suggested MVP scope: Phase 1 (gate) + Phase 2 + Phase 3 (US1)
