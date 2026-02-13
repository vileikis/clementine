# Tasks: Email Result Delivery

**Input**: Design documents from `/specs/070-email-result/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested — test tasks omitted.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Install dependencies and configure secrets for email sending

- [X] T001 Install nodemailer and @types/nodemailer in functions workspace: `pnpm add nodemailer --filter @clementine/functions && pnpm add -D @types/nodemailer --filter @clementine/functions`
- [X] T002 Add SMTP_APP_PASSWORD secret definition to `functions/src/infra/params.ts` using `defineSecret('SMTP_APP_PASSWORD')` following the existing DROPBOX_APP_SECRET pattern

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema changes and infrastructure that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 [P] Add `guestEmail` (z.string().email().nullable().default(null)) and `emailSentAt` (z.number().nullable().default(null)) fields to session schema in `packages/shared/src/schemas/session/session.schema.ts` — follow existing nullable field pattern, add JSDoc noting guestEmail is PII
- [X] T004 [P] Add `emailCaptureConfigSchema` (enabled: boolean, heading: string nullable) and nest as `emailCapture` field in `shareLoadingConfigSchema` in `packages/shared/src/schemas/project/project-config.schema.ts` — export `EmailCaptureConfig` type, follow the nullable object pattern used by `cta` in `shareReadyConfigSchema`
- [X] T005 [P] Create email payload Zod schemas in `functions/src/schemas/email.schema.ts` — define `submitGuestEmailPayloadSchema` (projectId, sessionId, email) and `sendSessionEmailPayloadSchema` (projectId, sessionId, resultMedia) per contracts
- [X] T006 [P] Add `queueSendSessionEmail()` function to `functions/src/infra/task-queues.ts` — follow the existing `queueDropboxExportWorker()` pattern with `SendSessionEmailPayload` type
- [X] T007 [P] Add default `emailCapture` config (`{ enabled: false, heading: null }`) to `apps/clementine-app/src/domains/project-config/share/constants/defaults.ts` — add `DEFAULT_EMAIL_CAPTURE` constant
- [X] T008 Build shared package to propagate schema changes: `pnpm --filter @clementine/shared build`

**Checkpoint**: Schemas, infrastructure, and defaults ready — user story implementation can now begin

---

## Phase 3: User Story 1 — Guest Receives Result by Email (Priority: P1) 🎯 MVP

**Goal**: Guests enter their email on the loading screen and receive their AI result via email when processing completes. Handles both timing cases (email before result, result before email).

**Independent Test**: Submit a photo, enter email on loading screen, verify email arrives with result link after processing completes. Also test: submit email after result already ready → email sent immediately.

### Backend (Cloud Functions)

- [X] T009 [US1] Create `sendResultEmail()` utility in `functions/src/services/email/email.service.ts` — Nodemailer SMTP transporter (lazy, cached at module scope), sends HTML email with result image + share page link, uses SMTP_APP_PASSWORD secret, never logs guestEmail. See contract UT-001.
- [X] T010 [US1] Create `sendSessionEmail` Cloud Task handler in `functions/src/tasks/sendSessionEmail.ts` — validate payload with Zod, fetch session, check all 4 conditions (guestEmail, jobStatus=completed, resultMedia, emailSentAt=null), call sendResultEmail(), update emailSentAt on success, log errors without throwing. See contract CT-002. Depends on T009.
- [X] T011 [P] [US1] Create `submitGuestEmail` callable in `functions/src/callable/submitGuestEmail.ts` — validate payload with Zod, fetch session, verify guestEmail is null (prevent overwrite), write guestEmail to session, check if job completed + resultMedia exists → queue sendSessionEmail if so. See contract CF-001.
- [X] T012 [US1] Modify `finalizeJobSuccess()` in `functions/src/tasks/transformPipelineJob.ts` — add best-effort `queueSendSessionEmail()` call after existing `queueDispatchExports()`, same try/catch pattern with logger.warn on failure. Pass { projectId, sessionId, resultMedia: { url, filePath, displayName } }.
- [X] T013 [US1] Export `sendSessionEmail` and `submitGuestEmail` in `functions/src/index.ts` — add to new "Email Result" section following existing export pattern

### Frontend (TanStack Start App)

- [X] T014 [P] [US1] Create `useSubmitGuestEmail` mutation hook in `apps/clementine-app/src/domains/project-config/share/hooks/useSubmitGuestEmail.ts` — calls submitGuestEmail callable via Firebase httpsCallable, accepts { projectId, sessionId, email }, returns mutation state. Follow existing callable invocation patterns.
- [X] T015 [P] [US1] Create `EmailCaptureForm` component in `apps/clementine-app/src/domains/project-config/share/components/EmailCaptureForm.tsx` — email input + submit button, client-side validation (HTML type=email + inline error), isSubmitting/isSubmitted state, confirmation message replacing form after submit, mobile-first with 44x44px touch targets. Props: `onSubmit(email)`, `isSubmitted`, `submittedEmail`, `heading` (default: "Get your result by email").
- [X] T016 [US1] Modify `ShareLoadingRenderer` in `apps/clementine-app/src/domains/project-config/share/components/ShareLoadingRenderer.tsx` — add props: `session` (Session | null), `emailCaptureConfig` (EmailCaptureConfig | null), `onEmailSubmit` callback. Conditionally render EmailCaptureForm below title/description when `emailCaptureConfig?.enabled` is true and `mode === 'run'`. Pass heading from config. Show confirmation state when `session?.guestEmail` exists.
- [X] T017 [US1] Modify `SharePage` container in `apps/clementine-app/src/domains/guest/containers/SharePage.tsx` — extract `emailCapture` config from `project.publishedConfig?.shareLoading?.emailCapture`, create handleEmailSubmit callback using useSubmitGuestEmail, pass `session`, `emailCaptureConfig`, and `onEmailSubmit` props to ShareLoadingRenderer

**Checkpoint**: Guest can enter email on loading screen, receive result email when processing completes. Both timing cases work. This is the MVP.

---

## Phase 4: User Story 2 — Loading Screen Visual Improvements (Priority: P2)

**Goal**: Replace image skeleton with themed spinner and live elapsed time counter on the loading screen.

**Independent Test**: Trigger an AI transform, verify loading screen shows themed spinner (using primaryColor) and elapsed counter incrementing each second.

- [X] T018 [US2] Replace `<Skeleton>` with themed `<Loader2>` spinner in `ShareLoadingRenderer` in `apps/clementine-app/src/domains/project-config/share/components/ShareLoadingRenderer.tsx` — use `useThemeWithOverride()` to get theme.primaryColor, apply via inline style `{ color: theme.primaryColor }`, follow existing ThemedLoading pattern from `src/shared/theming/components/primitives/ThemedLoading.tsx`
- [X] T019 [US2] Add elapsed time counter to `ShareLoadingRenderer` in `apps/clementine-app/src/domains/project-config/share/components/ShareLoadingRenderer.tsx` — useState + useEffect with setInterval(1000ms), display below spinner as "0s", "1s", "2s"..., only show when `mode === 'run'`, cleanup interval on unmount

**Checkpoint**: Loading screen shows themed spinner + live counter. Previous email functionality still works.

---

## Phase 5: User Story 3 — Creator Configures Email Capture (Priority: P3)

**Goal**: Creators toggle email capture on/off and customize heading text from the Share Editor Loading tab.

**Independent Test**: Toggle email capture in Share Editor → verify loading screen shows/hides email form. Customize heading → verify guest sees custom heading.

- [X] T020 [US3] Modify `ShareLoadingConfigPanel` in `apps/clementine-app/src/domains/project-config/share/components/ShareLoadingConfigPanel.tsx` — add "Email Capture" section with: Switch toggle for `emailCapture.enabled` (label: "Get result by email"), Textarea for `emailCapture.heading` (placeholder: "Get your result by email", shown only when enabled). Wire to `onShareLoadingUpdate` callback with nested emailCapture object.
- [X] T021 [US3] Modify `useShareLoadingForm` in `apps/clementine-app/src/domains/project-config/share/hooks/useShareLoadingForm.ts` — add `emailCapture` to form state and `SHARE_LOADING_FIELDS_TO_COMPARE` array so changes auto-save via debounce. Handle nested emailCapture object in form values.

**Checkpoint**: Creators can configure email capture per project. Changes reflect on guest loading screen after publish.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation, barrel exports, and final verification

- [X] T022 Update barrel exports (`index.ts`) for any new components/hooks in `apps/clementine-app/src/domains/project-config/share/components/` and `apps/clementine-app/src/domains/project-config/share/hooks/` — export EmailCaptureForm and useSubmitGuestEmail
- [X] T023 Run validation gates: `pnpm --filter @clementine/shared build && pnpm --filter @clementine/shared test && pnpm functions:build && pnpm app:check && pnpm app:type-check`
- [ ] T024 Run quickstart.md verification steps — verify end-to-end flow works per `specs/070-email-result/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 — core MVP
- **US2 (Phase 4)**: Depends on Phase 2. Independent of US1 but both modify ShareLoadingRenderer — execute after US1 to avoid merge conflicts
- **US3 (Phase 5)**: Depends on Phase 2 (emailCapture schema). Independent of US1/US2 but builds on shared config — execute after US1
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2. No dependencies on other stories. **This is the MVP.**
- **US2 (P2)**: Can start after Phase 2. Independent of US1 but modifies same file (ShareLoadingRenderer) — recommend sequential after US1
- **US3 (P3)**: Can start after Phase 2. Independent of US1/US2. Modifies ShareLoadingConfigPanel + useShareLoadingForm (no overlap with US1/US2 files except shared schema)

### Within User Story 1

- Backend: T009 → T010 (task needs utility). T011 is parallel with T009 (different files). T012 is parallel with T009/T011. T013 after T010+T011+T012.
- Frontend: T014 and T015 are parallel (different files). T016 after T015 (renderer uses form). T017 after T016 (page uses renderer).

### Parallel Opportunities

**Phase 2** (all parallel — different files):
```
T003 (session.schema.ts) || T004 (project-config.schema.ts) || T005 (email.schema.ts) || T006 (task-queues.ts) || T007 (defaults.ts)
```

**Phase 3 Backend** (partial parallel):
```
T009 (email.service.ts) || T011 (submitGuestEmail.ts) || T012 (transformPipelineJob.ts)
→ then T010 (sendSessionEmail.ts) depends on T009
→ then T013 (index.ts) depends on T010+T011+T012
```

**Phase 3 Frontend** (partial parallel):
```
T014 (useSubmitGuestEmail.ts) || T015 (EmailCaptureForm.tsx)
→ then T016 (ShareLoadingRenderer.tsx) depends on T015
→ then T017 (SharePage.tsx) depends on T016
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (install deps, configure secret)
2. Complete Phase 2: Foundational (schemas, infrastructure)
3. Complete Phase 3: User Story 1 (backend + frontend)
4. **STOP and VALIDATE**: Test both timing cases (email-first, result-first)
5. Deploy/demo if ready — guests can now receive results by email

### Incremental Delivery

1. Phase 1 + 2 → Foundation ready
2. Add US1 (Phase 3) → Test independently → **Deploy (MVP!)**
3. Add US2 (Phase 4) → Test independently → Deploy (better loading UX)
4. Add US3 (Phase 5) → Test independently → Deploy (creator control)
5. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks in same phase
- [Story] label maps task to specific user story for traceability
- Both US1 and US2 modify ShareLoadingRenderer — execute US2 after US1 to avoid conflicts
- Guest email is PII — never log in Cloud Functions, store only on session document
- SMTP_APP_PASSWORD must be configured in functions/.secret.local (dev) and Firebase Secret Manager (prod)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
