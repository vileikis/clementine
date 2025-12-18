# Tasks: Media Processing Pipeline (Stage 1)

**Input**: Design documents from `/specs/028-media-processing-pipeline/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Not requested in feature specification - no test tasks included

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **functions/** - Cloud Functions workspace
- **web/** - Next.js web app (future integration point)
- All backend implementation in `functions/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize Cloud Functions workspace and install dependencies

- [X] T001 Install FFmpeg dependencies in functions/package.json (fluent-ffmpeg@^2.1.2, ffmpeg-static@^5.2.0, tmp@^0.2.3)
- [X] T002 [P] Create Firebase Admin SDK initialization in functions/src/lib/firebase-admin.ts
- [X] T003 [P] Create Zod validation schemas in functions/src/lib/schemas/media-pipeline.schema.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Create media-pipeline service structure in functions/src/services/media-pipeline/
- [X] T005 [P] Implement pipeline configuration logic in functions/src/services/media-pipeline/config.ts (aspect ratio mapping, format detection)
- [X] T006 [P] Implement Storage operations in functions/src/services/media-pipeline/storage.ts (download inputAssets, upload outputs with public URLs)
- [X] T007 [P] Implement session state management in functions/src/services/media-pipeline/session.ts (fetch, mark pending/running/failed, update outputs, cleanup processing field)
- [X] T008 Create FFmpeg wrapper with error handling in functions/src/services/media-pipeline/ffmpeg.ts (promise wrapper, timeout, categorized errors, temp file management)
- [X] T009 Create HTTP Cloud Function endpoint in functions/src/http/processMedia.ts (validate request, check session exists, check not already processing, queue Cloud Task)
- [X] T010 Create Cloud Task handler in functions/src/tasks/processMediaJob.ts (extract payload, mark session running, orchestrate pipeline, handle errors)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Process Single Photo (Priority: P1) 🎯 MVP

**Goal**: Accept single photo and return properly formatted output image matching aspect ratio configuration (square or story format)

**Independent Test**: Submit one photo via POST /processMedia with outputFormat="image" and aspectRatio="square", verify returned image is 1080x1080px and accessible via primaryUrl

### Implementation for User Story 1

- [X] T011 [US1] Implement single image scaling with center-crop in functions/src/services/media-pipeline/ffmpeg.ts (scale to 1080x1080 or 1080x1920, Lanczos algorithm, quality settings)
- [X] T012 [US1] Implement thumbnail generation in functions/src/services/media-pipeline/ffmpeg.ts (300px width, maintain aspect ratio, Lanczos scaling, quality 2)
- [X] T013 [US1] Implement single image pipeline orchestration in functions/src/services/media-pipeline/image.pipeline.ts (download input, scale image, generate thumbnail, upload outputs, return session outputs)
- [X] T014 [US1] Add validation for single image processing in functions/src/services/media-pipeline/image.pipeline.ts (check inputAssets.length >= 1, validate file access)
- [X] T015 [US1] Add error handling and cleanup in functions/src/services/media-pipeline/image.pipeline.ts (try-finally for temp files, categorized error responses, logging)
- [X] T016 [US1] Create public exports in functions/src/services/media-pipeline/index.ts (export pipeline functions, types, config)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Process Photo Burst into GIF (Priority: P2)

**Goal**: Accept multiple photos in sequence and return animated GIF that loops through all frames at consistent frame rate with proper aspect ratio

**Independent Test**: Submit 4 photos via POST /processMedia with outputFormat="gif" and aspectRatio="square", verify returned GIF animates all frames in sequence and matches 1080x1080px

### Implementation for User Story 2

- [ ] T017 [US2] Implement palette generation for GIF in functions/src/services/media-pipeline/ffmpeg.ts (palettegen with stats_mode=diff, max_colors=256)
- [ ] T018 [US2] Implement GIF creation with palette in functions/src/services/media-pipeline/ffmpeg.ts (paletteuse with Bayer dithering, 2fps, infinite loop, scale and crop frames)
- [ ] T019 [US2] Implement multi-frame GIF pipeline orchestration in functions/src/services/media-pipeline/pipeline.ts (download all frames, generate palette, create GIF, generate thumbnail from first frame, upload outputs, update session)
- [ ] T020 [US2] Add validation for GIF processing in functions/src/services/media-pipeline/pipeline.ts (check inputAssets.length > 1, validate all frame access)
- [ ] T021 [US2] Update pipeline router logic in functions/src/services/media-pipeline/pipeline.ts (if outputFormat="gif" OR (outputFormat="image" AND frames>1) then GIF, else continue to single image)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Process Photo Burst into Video (Priority: P3)

**Goal**: Accept multiple photos in sequence and return MP4 video that plays through all frames at consistent frame rate, optimized for web streaming and mobile playback

**Independent Test**: Submit 4 photos via POST /processMedia with outputFormat="video" and aspectRatio="square", verify returned MP4 plays smoothly on web and mobile devices

### Implementation for User Story 3

- [ ] T022 [US3] Implement MP4 video creation in functions/src/services/media-pipeline/ffmpeg.ts (H.264 codec, yuv420p pixel format, 5fps, CRF 22, medium preset, baseline profile, faststart flag)
- [ ] T023 [US3] Implement frame sequence input handling in functions/src/services/media-pipeline/ffmpeg.ts (framerate input option, pattern_type glob for frame-*.jpg)
- [ ] T024 [US3] Implement multi-frame video pipeline orchestration in functions/src/services/media-pipeline/pipeline.ts (download all frames, create MP4, generate thumbnail from first frame, upload outputs, update session)
- [ ] T025 [US3] Add validation for video processing in functions/src/services/media-pipeline/pipeline.ts (check inputAssets.length > 1, validate all frame access)
- [ ] T026 [US3] Update pipeline router logic in functions/src/services/media-pipeline/pipeline.ts (if outputFormat="video" then video, else check GIF/image)

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T027 [P] Add structured logging throughout pipeline in functions/src/services/media-pipeline/pipeline.ts (sessionId, state, step, timing, errors with context)
- [ ] T028 [P] Add timeout configuration by operation type in functions/src/services/media-pipeline/config.ts (image_scale: 30s, thumbnail: 15s, gif_small: 45s, gif_large: 90s, mp4_short: 60s, mp4_long: 120s)
- [ ] T029 [P] Implement retry logic for transient errors in functions/src/services/media-pipeline/pipeline.ts (max 3 attempts via Cloud Tasks, 30s min backoff)
- [ ] T030 Add comprehensive error categorization in functions/src/services/media-pipeline/ffmpeg.ts (validation, timeout, codec, filesystem, memory errors)
- [ ] T031 [P] Add performance metrics logging in functions/src/services/media-pipeline/pipeline.ts (processing duration, file sizes, success/failure rates)
- [ ] T032 [P] Update CLAUDE.md active technologies section with FFmpeg, Cloud Tasks, media pipeline details

### Validation Loop (REQUIRED - Constitution Principle V)

**Purpose**: Ensure code quality and correctness before merge

- [ ] T033 Run `pnpm --filter functions lint` and fix all errors/warnings
- [ ] T034 Run `pnpm --filter functions type-check` and resolve all TypeScript errors
- [ ] T035 Verify feature using quickstart.md test scenarios (single image, GIF, video)
- [ ] T036 Verify output URLs are publicly accessible without authentication
- [ ] T037 Verify processing state cleanup (processing field deleted on completion)
- [ ] T038 Commit only after validation loop passes cleanly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Shares FFmpeg infrastructure with US1, independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Shares FFmpeg infrastructure with US1/US2, independently testable

### Within Each User Story

- Core FFmpeg operations before pipeline orchestration
- Pipeline orchestration before validation
- Validation before router logic updates

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T002, T003)
- All Foundational tasks marked [P] can run in parallel (T005, T006, T007)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- Implementation tasks within each user story are sequential (FFmpeg → orchestration → validation → router)
- Different user stories can be worked on in parallel by different team members
- All Polish tasks marked [P] can run in parallel (T027, T028, T029, T031, T032)

---

## Parallel Example: Foundational Phase

```bash
# Launch foundational infrastructure tasks together:
Task: "Implement pipeline configuration logic in functions/src/services/media-pipeline/config.ts"
Task: "Implement Storage operations in functions/src/services/media-pipeline/storage.ts"
Task: "Implement session state management in functions/src/services/media-pipeline/session.ts"
```

---

## Parallel Example: User Stories After Foundation

```bash
# Once Phase 2 completes, launch all user stories in parallel (3 developers):
Task: "US1 - Implement single image scaling with center-crop"
Task: "US2 - Implement palette generation for GIF"
Task: "US3 - Implement MP4 video creation"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T010) - CRITICAL - blocks all stories
3. Complete Phase 3: User Story 1 (T011-T016)
4. **STOP and VALIDATE**: Test single image processing independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP! - Single image processing)
3. Add User Story 2 → Test independently → Deploy/Demo (GIF support added)
4. Add User Story 3 → Test independently → Deploy/Demo (Video support added)
5. Add Polish → Test all scenarios → Deploy/Demo (Production-ready)
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001-T010)
2. Once Foundational is done:
   - Developer A: User Story 1 (T011-T016) - Single image processing
   - Developer B: User Story 2 (T017-T021) - GIF processing
   - Developer C: User Story 3 (T022-T026) - Video processing
3. Stories complete and integrate independently
4. Team completes Polish together (T027-T038)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- No tests included per feature specification - validation via quickstart.md scenarios
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All processing logic isolated in `functions/src/services/media-pipeline/` module
- HTTP endpoint and Cloud Task handler are thin wrappers that delegate to pipeline service
- Temp files managed with tmp-promise package, cleaned up in try-finally blocks
- Error handling uses categorized FFmpeg errors (validation, timeout, codec, filesystem, memory)
- Storage outputs use public URLs for instant rendering without auth
- Processing state stored in temporary `processing` field (deleted on completion)
