# Tasks: Dropbox Export Integration

**Input**: Design documents from `/specs/069-dropbox-export/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in spec. No test tasks generated.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Shared schemas**: `packages/shared/src/schemas/`
- **Frontend app**: `apps/clementine-app/src/`
- **Cloud Functions**: `functions/src/`
- **Firebase config**: `firebase/`

---

## Phase 1: Setup

**Purpose**: Environment configuration and Dropbox app registration

- [ ] T001 Register Dropbox app in Dropbox Developer Console with App Folder access type and configure redirect URIs per `specs/069-dropbox-export/quickstart.md`
- [ ] T002 Add Dropbox environment variables (`VITE_DROPBOX_APP_KEY`, `DROPBOX_APP_SECRET`, `DROPBOX_TOKEN_ENCRYPTION_KEY`) to `apps/clementine-app/.env` and `functions/.env` per quickstart.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared schemas, encryption service, repositories, and Firestore rules that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 [P] Create workspace integration schema (dropboxIntegrationStatusSchema, dropboxIntegrationSchema, workspaceIntegrationsSchema) in `packages/shared/src/schemas/workspace/workspace-integration.schema.ts` per data-model.md
- [ ] T004 [P] Create project export config schema (dropboxExportConfigSchema, projectExportsSchema) in `packages/shared/src/schemas/project/project-exports.schema.ts` per data-model.md
- [ ] T005 [P] Create export log schema (exportLogSchema) in `packages/shared/src/schemas/export/export-log.schema.ts` per data-model.md
- [ ] T006 [P] Create Cloud Task payload schemas (dispatchExportsPayloadSchema, dropboxExportPayloadSchema) in `functions/src/schemas/export.schema.ts` per data-model.md
- [ ] T007 Re-export new schemas from barrel files: `packages/shared/src/schemas/workspace/index.ts`, `packages/shared/src/schemas/project/index.ts`, new `packages/shared/src/schemas/export/index.ts`, and `packages/shared/src/schemas/index.ts`
- [ ] T008 [P] Create encryption service with encrypt/decrypt functions (AES-256-GCM, key from env var `DROPBOX_TOKEN_ENCRYPTION_KEY`) in `functions/src/services/export/encryption.service.ts` per research.md R2
- [ ] T009 [P] Create workspace repository with fetchWorkspaceIntegration, updateWorkspaceIntegration functions in `functions/src/repositories/workspace.ts` — reads/writes `integrations.dropbox` field on workspace document
- [ ] T010 [P] Create export log repository with createExportLog function in `functions/src/repositories/export-log.ts` — writes to `projects/{projectId}/exportLogs/{logId}` subcollection
- [ ] T011 Add exportLogs subcollection security rules (admin read, server-only write) to `firebase/firestore.rules` under the existing `projects/{projectId}` match block per data-model.md
- [ ] T012 Create barrel export for export services in `functions/src/services/export/index.ts`

**Checkpoint**: Foundation ready — all schemas, repositories, encryption, and security rules in place

---

## Phase 3: User Story 1 — Connect Dropbox to Workspace (Priority: P1) MVP

**Goal**: Workspace Owner/Admin can connect a Dropbox account via OAuth from the Project Editor Connect tab

**Independent Test**: Click "Connect Dropbox" on Connect tab → complete Dropbox OAuth → see "Connected" status with email displayed

### Implementation for User Story 1

- [ ] T013 [P] [US1] Create `initiateDropboxOAuthFn` server function in `apps/clementine-app/src/domains/project/connect/server/functions.ts` — generates PKCE challenge, stores code verifier + context in session, returns Dropbox authorization URL per contract SF-001
- [ ] T014 [P] [US1] Create `handleDropboxCallbackFn` as a server-side route loader in `apps/clementine-app/src/app/workspace/$workspaceSlug.integrations.dropbox.callback.tsx` — validates state, exchanges code for tokens via Dropbox API, encrypts refresh token, writes integration to workspace doc via Firebase Admin SDK, redirects to Connect tab per contract SF-002
- [ ] T015 [US1] Extend session types to include Dropbox OAuth PKCE fields (codeVerifier, state, dropboxOAuthContext with workspaceId/projectId/workspaceSlug) in `apps/clementine-app/src/domains/auth/types/session.types.ts`
- [ ] T016 [P] [US1] Create `useDropboxConnection` hook in `apps/clementine-app/src/domains/project/connect/hooks/useDropboxConnection.ts` — reads workspace `integrations.dropbox` field from Firestore in real-time via onSnapshot, returns connection status and account info
- [ ] T017 [US1] Create `DropboxCard` component in `apps/clementine-app/src/domains/project/connect/components/DropboxCard.tsx` — renders "not connected" state with "Connect Dropbox" button (calls initiateDropboxOAuthFn then redirects) and "connected" state showing email and status per spec UX states A and B
- [ ] T018 [US1] Update `ConnectPage` container in `apps/clementine-app/src/domains/project/connect/containers/ConnectPage.tsx` — replace WipPlaceholder with centered layout rendering DropboxCard, pass workspace and project context from route params
- [ ] T019 [US1] Create barrel exports for hooks in `apps/clementine-app/src/domains/project/connect/hooks/index.ts`, components in `apps/clementine-app/src/domains/project/connect/components/index.ts`, server functions in `apps/clementine-app/src/domains/project/connect/server/index.ts`
- [ ] T020 [US1] Update domain barrel export in `apps/clementine-app/src/domains/project/connect/index.ts` to re-export new modules

**Checkpoint**: User Story 1 complete — Dropbox can be connected from the Connect tab. Verify OAuth flow works end-to-end and connected state displays.

---

## Phase 4: User Story 2 — Enable Dropbox Export on a Project (Priority: P1)

**Goal**: After Dropbox is connected, a Project Editor can toggle "Export to Dropbox" on/off per project

**Independent Test**: With Dropbox connected, toggle export ON → see destination path displayed. Toggle OFF → toggle shows OFF.

### Implementation for User Story 2

- [ ] T021 [P] [US2] Create `toggleDropboxExportFn` server function in `apps/clementine-app/src/domains/project/connect/server/functions.ts` — validates admin auth, writes `exports.dropbox` fields (enabled, enabledBy, enabledAt) to project document via Firebase Admin SDK per contract SF-004
- [ ] T022 [P] [US2] Create `useDropboxExport` hook in `apps/clementine-app/src/domains/project/connect/hooks/useDropboxExport.ts` — reads project `exports.dropbox` field from project document (already available via existing useProject hook), provides toggle callback using toggleDropboxExportFn
- [ ] T023 [US2] Update `DropboxCard` component in `apps/clementine-app/src/domains/project/connect/components/DropboxCard.tsx` — add export toggle switch (only visible when connected), display destination path `/Apps/Clementine/<ProjectName>/<ExperienceName>/` when enabled, implement UX states B (connected, export off) and C (connected, export on) per spec
- [ ] T024 [US2] Update barrel exports in `apps/clementine-app/src/domains/project/connect/hooks/index.ts` to include useDropboxExport

**Checkpoint**: User Story 2 complete — Export toggle works per project. Verify toggle persists and displays correct path.

---

## Phase 5: User Story 3 — Automatic Export of Generated Results (Priority: P1)

**Goal**: When a result is generated on a project with export enabled, the file is automatically uploaded to Dropbox at the correct path

**Independent Test**: Enable export on a project → run a guest experience → verify result file appears in Dropbox at `/Apps/Clementine/<ProjectName>/<ExperienceName>/<filename>` with correct naming convention

### Implementation for User Story 3

- [ ] T025 [P] [US3] Create Dropbox API service with `refreshAccessToken` (exchanges refresh token for access token) and `uploadFile` (uploads buffer to Dropbox path via `/files/upload` API with overwrite mode) functions in `functions/src/services/export/dropbox.service.ts`
- [ ] T026 [P] [US3] Create experience repository function `fetchExperience` (if not already available for export context) in `functions/src/repositories/experience.ts` — fetches experience name for folder path computation
- [ ] T027 [US3] Create `dispatchExports` Cloud Task handler in `functions/src/tasks/dispatchExports.ts` — validates payload, fetches project export config and session (for workspaceId/experienceId), if dropbox export enabled enqueues `dropboxExportWorker` task with full context per contract CT-001
- [ ] T028 [US3] Create `dropboxExportWorker` Cloud Task handler in `functions/src/tasks/dropboxExportWorker.ts` — validates payload, checks workspace connection + project export enabled (live config), decrypts refresh token, refreshes access token, downloads result from Firebase Storage, computes destination path (`/<ProjectName>/<ExperienceName>/<date>_<time>_session-<shortCode>_result.<ext>`), uploads to Dropbox, writes export log per contract CT-002
- [ ] T029 [US3] Hook export dispatch into transform pipeline: add `queueDispatchExports` call at the end of `finalizeJobSuccess` in `functions/src/tasks/transformPipelineJob.ts` (after line 203, after session job status updated to completed) — enqueues dispatchExports Cloud Task with jobId, projectId, sessionId, and resultMedia from output
- [ ] T030 [US3] Export new Cloud Task functions (dispatchExports, dropboxExportWorker) from `functions/src/index.ts`

**Checkpoint**: User Story 3 complete — End-to-end export works. Run experience → check Dropbox for file. Verify file naming, folder structure, and export log written.

---

## Phase 6: User Story 4 — Disconnect Dropbox from Workspace (Priority: P2)

**Goal**: Workspace Owner/Admin can disconnect Dropbox, revoking the token and stopping all exports

**Independent Test**: With Dropbox connected, click "Disconnect" → connection status resets to "not connected". Run experience → no export occurs.

### Implementation for User Story 4

- [ ] T031 [US4] Create `disconnectDropboxFn` server function in `apps/clementine-app/src/domains/project/connect/server/functions.ts` — validates admin auth, decrypts refresh token, revokes token via Dropbox API (`/2/auth/token/revoke`), sets `integrations.dropbox` to null on workspace document per contract SF-003
- [ ] T032 [US4] Update `DropboxCard` component in `apps/clementine-app/src/domains/project/connect/components/DropboxCard.tsx` — add "Disconnect" link (visible only for admins when connected), show confirmation prompt ("This will disconnect Dropbox for all projects in this workspace"), call disconnectDropboxFn on confirm

**Checkpoint**: User Story 4 complete — Disconnect works end-to-end. Verify token revoked, status resets, exports stop.

---

## Phase 7: User Story 5 — Handle Connection Failures Gracefully (Priority: P2)

**Goal**: When the Dropbox token becomes invalid, the system detects it during export, marks the connection as needing re-auth, and surfaces a reconnect prompt

**Independent Test**: Simulate a revoked token → trigger an export → verify Connect tab shows "Dropbox connection lost" with "Reconnect" button. Click Reconnect → complete OAuth → connection restored.

### Implementation for User Story 5

- [ ] T033 [US5] Add `needs_reauth` handling to `dropboxExportWorker` in `functions/src/tasks/dropboxExportWorker.ts` — when token refresh returns `invalid_grant`, update workspace `integrations.dropbox.status` to `needs_reauth` via workspace repository, write failed export log, and exit without retry
- [ ] T034 [US5] Update `DropboxCard` component in `apps/clementine-app/src/domains/project/connect/components/DropboxCard.tsx` — add error/needs_reauth state rendering: show "Dropbox connection lost — reconnect to resume exports" message with "Reconnect" button that re-initiates the OAuth flow (reuses initiateDropboxOAuthFn from US1)

**Checkpoint**: User Story 5 complete — Error state displays correctly and reconnect restores functionality.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Validation, cleanup, and standards compliance

- [ ] T035 Run `pnpm app:check` (format + lint fix) across the monorepo to ensure all new code passes validation gates
- [ ] T036 Run `pnpm app:type-check` to verify TypeScript strict mode compliance with no errors
- [ ] T037 Run `pnpm --filter @clementine/shared build` to verify shared package builds with new schemas
- [ ] T038 Run `pnpm functions:build` to verify Cloud Functions build with new tasks and services
- [ ] T039 Review all new code against applicable standards: `standards/global/project-structure.md` (barrel exports, file naming), `standards/global/code-quality.md`, `standards/backend/firebase-functions.md` (Cloud Task patterns), `standards/frontend/design-system.md` (DropboxCard styling)
- [ ] T040 Verify end-to-end flow per quickstart.md: connect Dropbox → enable export → run experience → verify file in Dropbox → disconnect → verify exports stop

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational phase — Connect Dropbox
- **US2 (Phase 4)**: Depends on US1 (workspace must be connectable to toggle export)
- **US3 (Phase 5)**: Depends on US1 + US2 (must be able to connect and enable export)
- **US4 (Phase 6)**: Depends on US1 (must be connected to disconnect). Can run in parallel with US2/US3
- **US5 (Phase 7)**: Depends on US3 (export must fail to trigger re-auth detection)
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational (Phase 2) — No dependencies on other stories
- **US2 (P1)**: Depends on US1 (workspace connection must exist for toggle to be meaningful)
- **US3 (P1)**: Depends on US1 + US2 (connection and export toggle must exist for export to trigger)
- **US4 (P2)**: Depends on US1 only — can start after US1 completes, in parallel with US2/US3
- **US5 (P2)**: Depends on US3 (needs the export worker to exist for error handling)

### Within Each User Story

- Server functions and hooks before UI components
- Core implementation before integration/polish
- Story complete before moving to next priority

### Parallel Opportunities

- T003, T004, T005, T006 (all schemas) can run in parallel
- T008, T009, T010 (encryption, repositories) can run in parallel
- T013, T014, T016 (US1 server functions + hook) can run in parallel
- T021, T022 (US2 server function + hook) can run in parallel
- T025, T026 (US3 Dropbox service + experience repo) can run in parallel
- US4 can run in parallel with US2/US3 after US1 completes

---

## Parallel Example: Foundational Phase

```bash
# Launch all schemas together:
Task: "Create workspace integration schema in packages/shared/src/schemas/workspace/workspace-integration.schema.ts"
Task: "Create project export config schema in packages/shared/src/schemas/project/project-exports.schema.ts"
Task: "Create export log schema in packages/shared/src/schemas/export/export-log.schema.ts"
Task: "Create Cloud Task payload schemas in functions/src/schemas/export.schema.ts"

# Then launch repositories + encryption together:
Task: "Create encryption service in functions/src/services/export/encryption.service.ts"
Task: "Create workspace repository in functions/src/repositories/workspace.ts"
Task: "Create export log repository in functions/src/repositories/export-log.ts"
```

## Parallel Example: User Story 1

```bash
# Launch server functions + hook together:
Task: "Create initiateDropboxOAuthFn in apps/clementine-app/src/domains/project/connect/server/functions.ts"
Task: "Create OAuth callback route in apps/clementine-app/src/app/workspace/$workspaceSlug.integrations.dropbox.callback.tsx"
Task: "Create useDropboxConnection hook in apps/clementine-app/src/domains/project/connect/hooks/useDropboxConnection.ts"

# Then: DropboxCard → ConnectPage (sequential, same component tree)
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 + 3)

1. Complete Phase 1: Setup (env vars, Dropbox app)
2. Complete Phase 2: Foundational (schemas, encryption, repositories, rules)
3. Complete Phase 3: US1 — Connect Dropbox
4. Complete Phase 4: US2 — Enable Export Toggle
5. Complete Phase 5: US3 — Automatic Export
6. **STOP and VALIDATE**: Test full export flow end-to-end
7. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → Test OAuth connect independently → Deployable checkpoint
3. Add US2 → Test toggle independently → Deployable checkpoint
4. Add US3 → Test full export flow → **Core MVP complete**
5. Add US4 → Test disconnect → Security controls in place
6. Add US5 → Test error recovery → Resilience complete
7. Polish → Standards compliance, final validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- The `workspaceSchema` and `projectSchema` use `looseObject()` so new fields don't require modifying the base schemas — existing code continues to work
- Server functions in the app use `createServerFn()` pattern with Firebase Admin SDK for mutations
- Cloud Tasks in functions use `onTaskDispatched()` pattern matching existing transform pipeline
