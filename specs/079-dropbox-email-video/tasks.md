# Tasks: Dropbox Video Export & Email Video Handling

**Input**: Design documents from `/specs/079-dropbox-email-video/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in the feature specification. Test tasks are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Verify current state compiles before making changes

- [X] T001 Verify current builds pass: run `pnpm --filter @clementine/shared build` and `pnpm functions:build` to confirm clean baseline

---

## Phase 2: Foundational (Shared Schema Changes)

**Purpose**: Extend the shared email payload schema — MUST complete before US2 email work begins

**CRITICAL**: The shared package must be rebuilt after schema changes so functions can import updated types

- [X] T002 Add `format`, `thumbnailUrl`, and `resultPageUrl` fields to `sendSessionEmailPayloadSchema` in `packages/shared/src/schemas/email/email.schema.ts`. Add `format: z.enum(['image', 'gif', 'video']).default('image')` for backward compatibility. Add `thumbnailUrl: z.string().nullable().default(null)` and `resultPageUrl: z.string().nullable().default(null)`.
- [X] T003 Rebuild shared package: run `pnpm --filter @clementine/shared build` to make new types available to functions

**Checkpoint**: Shared schema updated and built — user story implementation can now begin

---

## Phase 3: User Story 1 — Reliable Video Export to Dropbox (Priority: P1)

**Goal**: Upload AI-generated video files up to 500MB to Dropbox using chunked upload sessions, with progress logging and size validation.

**Independent Test**: Trigger a video export for a completed AI video job (>150MB) and verify the file appears in Dropbox with correct name, size, and playable content. Check logs for chunk progress entries.

### Implementation for User Story 1

- [X] T004 [US1] Implement `uploadLargeFile()` function in `functions/src/services/export/dropbox.service.ts`. Use Dropbox Upload Session API: `upload_session/start` (first 8MB chunk) → `upload_session/append_v2` (repeated, 8MB chunks) → `upload_session/finish` (final chunk + commit). Use same HTTP pattern as existing `uploadFile()`. Log progress after each chunk (chunk N/total, percentage). Accept `accessToken`, `path`, `buffer`, and `totalSize` params. See `specs/079-dropbox-email-video/contracts/dropbox-chunked-upload.yaml` for API contracts.
- [X] T005 [US1] Add `sizeBytes` field to `DropboxExportPayload` schema and add upload routing in `functions/src/tasks/exportDropboxTask.ts`. Add `sizeBytes: z.number().int().positive()` to the payload schema. Add validation: reject with logged `ExportLog(status: 'failed', error: 'file_size_exceeded')` if `sizeBytes > 524_288_000` (500MB). After file download, route to `uploadLargeFile()` if `sizeBytes > 157_286_400` (150MB), otherwise use existing `uploadFile()`.
- [X] T006 [US1] Update `dispatchExportsTask` to include `sizeBytes` from `job.output.sizeBytes` in the Dropbox export task payload in `functions/src/tasks/dispatchExportsTask.ts`. Read job output to get `sizeBytes` and pass it through to `queueExportDropboxTask()`.

**Checkpoint**: Video files up to 500MB export to Dropbox via chunked upload. Files ≤150MB still use existing single upload.

---

## Phase 4: User Story 2 — Video-Aware Email Delivery (Priority: P1)

**Goal**: Result emails for video media types show a thumbnail preview with a "Watch Your Video" CTA linking to the hosted result page, instead of embedding video directly. Image/GIF emails remain unchanged.

**Independent Test**: Trigger a result email for a video-type job and verify email contains a thumbnail image and "Watch Your Video" CTA linking to the result page. Trigger an image-type job email and verify existing embed behavior is unchanged.

### Implementation for User Story 2

- [X] T007 [P] [US2] Update result email template in `functions/src/services/email/templates/resultEmail.ts`. Accept `format`, `thumbnailUrl`, and `resultPageUrl` params. When `format === 'video'`: display thumbnail image (or generic placeholder if `thumbnailUrl` is null — FR-012), set subheading to "Here's your AI-generated video", set CTA to "Watch Your Video" linking to `resultPageUrl`. When `format === 'image'` or `'gif'`: keep existing behavior (embed `resultMediaUrl` directly, "Here's your AI-generated photo", "View & Download" CTA). See `specs/079-dropbox-email-video/contracts/email-video-template.yaml` for template contracts.
- [X] T008 [P] [US2] Update `sendResultEmail()` in `functions/src/services/email/email.service.ts` to accept and pass `format`, `thumbnailUrl`, and `resultPageUrl` parameters to the template function.
- [X] T009 [US2] Update `sendSessionEmailTask` handler in `functions/src/tasks/sendSessionEmailTask.ts` to extract `format`, `thumbnailUrl`, and `resultPageUrl` from the validated payload and pass them to `sendResultEmail()`.
- [X] T010 [P] [US2] Update `transformPipelineTask` in `functions/src/tasks/transformPipelineTask.ts`. In `finalizeJobSuccess()`, when queuing the email task via `queueSendSessionEmail()`, include `format: output.format`, `thumbnailUrl: output.thumbnailUrl`, and build `resultPageUrl` from project ID and session ID (e.g., `https://{domain}/join/{projectId}/share?session={sessionId}`).
- [X] T011 [P] [US2] Update `submitGuestEmail` callable in `functions/src/callable/submitGuestEmail.ts`. When queuing the email task, read `job.output.format` and `job.output.thumbnailUrl` from the session/job data and include them along with the built `resultPageUrl` in the email payload.

**Checkpoint**: Video result emails show thumbnail + "Watch Your Video" CTA. Image/GIF emails are unchanged.

---

## Phase 5: User Story 3 — Graceful Handling of Export Failures (Priority: P2)

**Goal**: Ensure export failures for video uploads are detected early, classified by type (auth, rate limit, transient), and logged with enough detail to diagnose without additional investigation.

**Independent Test**: Simulate a permanent Dropbox failure (e.g., revoked token) and verify the failure is logged with job ID, error details, and error type classification. Attempt to export a file >500MB and verify it's rejected before download.

### Implementation for User Story 3

- [X] T012 [P] [US3] Add source file pre-validation in `functions/src/tasks/exportDropboxTask.ts`. Before downloading the file from Firebase Storage, validate the source file exists and has non-zero size using Storage metadata. If missing or zero-size, log `ExportLog(status: 'failed', error: 'source_file_missing')` and return without retrying.
- [X] T013 [P] [US3] Add error classification in `uploadLargeFile()` chunked upload methods in `functions/src/services/export/dropbox.service.ts`. Handle HTTP 401/400 auth errors (throw `DropboxInvalidGrantError` — same as existing single upload). Handle HTTP 429 rate limit (re-throw to trigger Cloud Task retry with backoff). Handle 409 `insufficient_space` (throw `DropboxInsufficientSpaceError`). Ensure all three chunked upload endpoints (start, append, finish) have consistent error handling matching the existing `uploadFile()` patterns.

**Checkpoint**: Video export failures are caught early, classified correctly, and logged with actionable detail.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate all changes build and pass quality gates

- [X] T014 Run full build validation: `pnpm --filter @clementine/shared build && pnpm functions:build` to verify all type-checks pass across shared package and functions
- [X] T015 Manual standards compliance review per Constitution Principle V: verify code against applicable backend standards (`backend/firestore.md`, `backend/firebase-functions.md`), global standards (`global/code-quality.md`, `global/security.md`), and Zod validation patterns (`global/zod-validation.md`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS US2 (email schema dependency)
- **US1 (Phase 3)**: Depends on Setup only — no shared schema changes needed for Dropbox payload
- **US2 (Phase 4)**: Depends on Foundational (Phase 2) — needs shared email schema built
- **US3 (Phase 5)**: Depends on US1 (Phase 3) — enhances the chunked upload built in US1
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Setup (Phase 1) — independent of email schema changes
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) — independent of US1
- **User Story 3 (P2)**: Must start after US1 (Phase 3) — adds error handling to chunked upload

### Within Each User Story

**US1** (sequential — pipeline modification):
T004 → T005 (needs uploadLargeFile import) → T006 (needs payload type)

**US2** (partially parallel):
T007 [P] + T008 [P] → T009 (needs updated service) → T010 [P] + T011 [P]

**US3** (parallel — different files):
T012 [P] + T013 [P]

### Parallel Opportunities

- **US1 and US2 can proceed in parallel** after Phase 2 completes (they modify different file sets)
- Within US2: T007 + T008 are parallel (template + service — different files)
- Within US2: T010 + T011 are parallel (transform pipeline + callable — different files)
- Within US3: T012 + T013 are parallel (task handler + service — different files)

---

## Parallel Example: User Story 2

```bash
# After Phase 2 (foundational schema) completes:

# Batch 1 — launch in parallel (different files):
Task T007: "Update result email template in functions/src/services/email/templates/resultEmail.ts"
Task T008: "Update sendResultEmail in functions/src/services/email/email.service.ts"

# Batch 2 — after T007+T008 complete:
Task T009: "Update sendSessionEmailTask handler in functions/src/tasks/sendSessionEmailTask.ts"

# Batch 3 — launch in parallel (different files):
Task T010: "Update transformPipelineTask in functions/src/tasks/transformPipelineTask.ts"
Task T011: "Update submitGuestEmail in functions/src/callable/submitGuestEmail.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (verify builds)
2. Complete Phase 3: User Story 1 (chunked upload)
3. **STOP and VALIDATE**: Test video export to Dropbox with a file >150MB
4. Deploy if ready — video exports are operational

### Incremental Delivery

1. Setup + Foundational → Schema ready
2. **US1** (chunked upload) → Test independently → Video exports work
3. **US2** (email branching) → Test independently → Video emails show thumbnail + CTA
4. **US3** (error handling) → Test independently → Failures are classified and logged
5. Polish → Build validation + standards review
6. Each story adds value without breaking previous stories

### Parallel Execution (Fastest Path)

1. Complete Phase 1 + Phase 2 together
2. Launch US1 and US2 in parallel (different file sets)
3. After US1 completes, start US3
4. After all stories complete, run Polish

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- US1 and US2 are both P1 priority but fully independent — can be worked in parallel
- US3 depends on US1 (enhances the chunked upload it builds)
- No new files are created — all tasks modify existing files
- FR-009 (thumbnail generation) is already handled by existing pipeline — no new task needed
- File naming convention (FR-003) uses existing pattern from 069-dropbox-export — no changes needed
