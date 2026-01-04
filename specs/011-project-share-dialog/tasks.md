# Tasks: Project Share Dialog

**Input**: Design documents from `/specs/011-project-share-dialog/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: This feature includes component tests as per the constitution's minimal testing strategy (Principle IV).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

This project uses TanStack Start monorepo structure:
- **Application code**: `apps/clementine-app/src/`
- **Domain modules**: `apps/clementine-app/src/domains/`
- **Routes**: `apps/clementine-app/src/app/`
- **Shared UI**: `apps/clementine-app/src/ui-kit/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and create domain structure

- [X] T001 Install react-qr-code dependency via pnpm
- [X] T002 Create domain directory structure at apps/clementine-app/src/domains/project/share/
- [X] T003 [P] Create subdirectories: components/, hooks/, utils/
- [X] T004 [P] Create placeholder files: types.ts, index.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core utilities and validation that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 [P] Create Zod validation schemas in apps/clementine-app/src/domains/project/share/utils/validation.ts
- [X] T006 [P] Implement guest URL generation utility in apps/clementine-app/src/domains/project/share/utils/shareUrl.utils.ts
- [X] T007 [P] Create TypeScript type definitions in apps/clementine-app/src/domains/project/share/types.ts
- [X] T008 [P] Write unit tests for validation schemas in apps/clementine-app/src/domains/project/share/utils/validation.test.ts
- [X] T009 [P] Write unit tests for URL generation in apps/clementine-app/src/domains/project/share/utils/shareUrl.utils.test.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Quick Link Sharing (Priority: P1) 🎯 MVP

**Goal**: Enable users to quickly copy a guest URL to share their project

**Independent Test**: Open share dialog from project page, click copy button, verify URL is copied to clipboard and toast notification appears

### Implementation for User Story 1

- [X] T010 [P] [US1] Create useCopyToClipboard hook in apps/clementine-app/src/domains/project/share/hooks/useCopyToClipboard.tsx
- [X] T011 [P] [US1] Create ShareLinkSection component in apps/clementine-app/src/domains/project/share/components/ShareLinkSection.tsx
- [X] T012 [US1] Create ShareDialog component skeleton in apps/clementine-app/src/domains/project/share/components/ShareDialog.tsx
- [X] T013 [US1] Integrate ShareLinkSection into ShareDialog
- [X] T014 [US1] Add Share button to project route TopNavActions in apps/clementine-app/src/app/workspace/$workspaceSlug.projects/$projectId.index.tsx
- [X] T015 [US1] Wire up dialog open/close state management
- [X] T016 [P] [US1] Write component test for ShareLinkSection in apps/clementine-app/src/domains/project/share/components/ShareLinkSection.test.tsx
- [X] T017 [P] [US1] Write hook test for useCopyToClipboard in apps/clementine-app/src/domains/project/share/hooks/useCopyToClipboard.test.tsx
- [X] T018 [P] [US1] Write component test for ShareDialog in apps/clementine-app/src/domains/project/share/components/ShareDialog.test.tsx

**Checkpoint**: At this point, users can open share dialog and copy guest link - US1 is fully functional and testable independently

---

## Phase 4: User Story 2 - QR Code Scanning (Priority: P2)

**Goal**: Display a QR code in the share dialog that encodes the guest URL for easy scanning at events

**Independent Test**: Open share dialog, verify QR code is displayed and renders correctly, scan QR code with mobile device and confirm it navigates to guest page

### Implementation for User Story 2

- [ ] T019 [P] [US2] Create useQRCodeGenerator hook (basic generation only) in apps/clementine-app/src/domains/project/share/hooks/useQRCodeGenerator.tsx
- [ ] T020 [P] [US2] Create QRCodeDisplay component (display only, no buttons yet) in apps/clementine-app/src/domains/project/share/components/QRCodeDisplay.tsx
- [ ] T021 [US2] Integrate QRCodeDisplay into ShareDialog component
- [ ] T022 [US2] Add QR code rendering with react-qr-code library
- [ ] T023 [US2] Ensure QR code displays at 256px in dialog (512px for download in US3)
- [ ] T024 [P] [US2] Write component test for QRCodeDisplay in apps/clementine-app/src/domains/project/share/components/QRCodeDisplay.test.tsx
- [ ] T025 [P] [US2] Write hook test for useQRCodeGenerator in apps/clementine-app/src/domains/project/share/hooks/useQRCodeGenerator.test.tsx

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - users can copy link and see/scan QR code

---

## Phase 5: User Story 3 - QR Code Management (Priority: P3)

**Goal**: Add regenerate and download buttons for QR code customization and promotional use

**Independent Test**: Click regenerate button and verify QR code visual changes (but same URL), click download and verify PNG file downloads with correct dimensions

### Implementation for User Story 3

- [ ] T026 [US3] Extend useQRCodeGenerator hook with regenerate logic in apps/clementine-app/src/domains/project/share/hooks/useQRCodeGenerator.tsx
- [ ] T027 [US3] Implement SVG-to-PNG conversion utility in apps/clementine-app/src/domains/project/share/utils/qrDownload.utils.ts
- [ ] T028 [US3] Add downloadQRCode function to useQRCodeGenerator hook
- [ ] T029 [US3] Add Regenerate button to QRCodeDisplay component
- [ ] T030 [US3] Add Download button to QRCodeDisplay component
- [ ] T031 [US3] Wire regenerate button to qrSeed state update
- [ ] T032 [US3] Wire download button to PNG conversion and download trigger
- [ ] T033 [US3] Add data-qr-code attribute to QRCodeSVG for DOM selection
- [ ] T034 [P] [US3] Write unit test for qrDownload utility in apps/clementine-app/src/domains/project/share/utils/qrDownload.utils.test.ts
- [ ] T035 [P] [US3] Update QRCodeDisplay tests for regenerate/download in apps/clementine-app/src/domains/project/share/components/QRCodeDisplay.test.tsx

**Checkpoint**: All core functionality complete - users can copy link, view QR code, regenerate QR, and download QR

---

## Phase 6: User Story 4 - Sharing Guidance (Priority: P3)

**Goal**: Display help instructions to guide users on how to use the share link and QR code

**Independent Test**: Open share dialog and verify help instructions are visible and readable without scrolling on desktop

### Implementation for User Story 4

- [ ] T036 [US4] Add help instructions section to ShareDialog component
- [ ] T037 [US4] Style help instructions with muted text styling
- [ ] T038 [US4] Ensure instructions fit in dialog without scrolling on 1920x1080 viewport
- [ ] T039 [US4] Update ShareDialog test to verify help instructions presence

**Checkpoint**: All user stories complete and independently functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T040 [P] Add barrel export in apps/clementine-app/src/domains/project/share/index.ts (export ShareDialog only)
- [ ] T041 [P] Verify mobile responsiveness (320px viewport) for all US1-US4
- [ ] T042 [P] Verify touch target sizes (44x44px minimum) for all buttons
- [ ] T043 [P] Add error boundary handling for validation failures
- [ ] T044 [P] Add aria-labels to all interactive elements for accessibility
- [ ] T045 Run validation loop: pnpm app:check && pnpm type-check && pnpm test
- [ ] T046 Review against design system standards (no hard-coded colors, theme tokens only)
- [ ] T047 Review against component libraries standards (shadcn/ui Dialog usage)
- [ ] T048 Review against project structure standards (vertical slice, barrel exports)
- [ ] T049 Manual QA testing per quickstart.md validation section
- [ ] T050 Update CLAUDE.md active technologies section with feature completion

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (US1 → US2 → US3 → US4)
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Integrates with US1 (ShareDialog) but independently testable
- **User Story 3 (P3)**: Depends on US2 (extends QRCodeDisplay) - Must complete US2 first
- **User Story 4 (P3)**: Can start after Foundational (Phase 2) - Integrates with US1 (ShareDialog) but independently testable

### Within Each User Story

- Hooks before components (hooks are dependencies for components)
- Utilities before hooks (utilities are dependencies for hooks)
- Core implementation before tests
- Tests can run in parallel (marked with [P])

### Parallel Opportunities

- **Phase 1**: All tasks marked [P] can run in parallel (T003, T004)
- **Phase 2**: All tasks marked [P] can run in parallel (T005-T009 - different files)
- **Once Foundational completes**: US1, US2, and US4 can start in parallel (US3 depends on US2)
- **Within US1**: T010, T011 can run in parallel; T016, T017, T018 can run in parallel
- **Within US2**: T019, T020 can run in parallel; T024, T025 can run in parallel
- **Within US3**: T034, T035 can run in parallel
- **Polish Phase**: T040-T044 can run in parallel (different concerns)

---

## Parallel Example: User Story 1

```bash
# Launch hooks and components in parallel (different files):
Task T010: "Create useCopyToClipboard hook in apps/clementine-app/src/domains/project/share/hooks/useCopyToClipboard.tsx"
Task T011: "Create ShareLinkSection component in apps/clementine-app/src/domains/project/share/components/ShareLinkSection.tsx"

# Launch all tests for User Story 1 in parallel (different files):
Task T016: "Component test for ShareLinkSection in apps/clementine-app/src/domains/project/share/components/ShareLinkSection.test.tsx"
Task T017: "Hook test for useCopyToClipboard in apps/clementine-app/src/domains/project/share/hooks/useCopyToClipboard.test.tsx"
Task T018: "Component test for ShareDialog in apps/clementine-app/src/domains/project/share/components/ShareDialog.test.tsx"
```

---

## Parallel Example: Foundational Phase

```bash
# Launch all foundational tasks in parallel (different files):
Task T005: "Create validation schemas in apps/clementine-app/src/domains/project/share/utils/validation.ts"
Task T006: "Create URL generation utility in apps/clementine-app/src/domains/project/share/utils/shareUrl.utils.ts"
Task T007: "Create TypeScript types in apps/clementine-app/src/domains/project/share/types.ts"
Task T008: "Write tests for validation in apps/clementine-app/src/domains/project/share/utils/validation.test.ts"
Task T009: "Write tests for URL generation in apps/clementine-app/src/domains/project/share/utils/shareUrl.utils.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently (copy link works)
5. Deploy/demo if ready (minimal viable feature: share link copy)

**Estimated Time**: ~2 hours (Setup + Foundational + US1)

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready (~1 hour)
2. Add User Story 1 → Test independently → MVP ready! (~1 hour)
3. Add User Story 2 → Test independently → QR codes enabled (~1.5 hours)
4. Add User Story 3 → Test independently → Download/regenerate enabled (~1.5 hours)
5. Add User Story 4 → Test independently → Help guidance added (~30 minutes)
6. Polish → Final validation → Production ready (~1 hour)

**Total Time**: ~6.5 hours (slightly more than quickstart estimate due to comprehensive testing)

### Parallel Team Strategy

With 2 developers:

1. Both complete Setup + Foundational together (~1 hour)
2. Once Foundational is done:
   - Developer A: User Story 1 + User Story 4 (independent)
   - Developer B: User Story 2 → User Story 3 (sequential, US3 depends on US2)
3. Both collaborate on Polish phase
4. Stories integrate cleanly via shared ShareDialog component

**Parallelized Time**: ~4 hours

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable EXCEPT US3 (depends on US2)
- Tests are included per constitution's minimal testing strategy
- Commit after each user story phase completion
- Stop at any checkpoint to validate story independently
- US1 is the MVP - can stop after US1 for minimal viable feature
- US2 adds significant value for event use cases
- US3 and US4 are nice-to-have enhancements

---

## Test Coverage Goals

Per constitution Principle IV (Minimal Testing Strategy):

- **Overall Coverage**: 70%+ across all modules
- **Critical Path Coverage**: 90%+ for copy link and QR code generation flows
- **Test Types**: Component tests + Hook tests + Utility tests (no E2E)
- **Focus**: Behavior testing (user actions and outcomes), not implementation details

### Critical Paths to Test

1. **Copy Link Flow** (US1 - CRITICAL):
   - User clicks copy button → Clipboard API succeeds → Toast shows success
   - User clicks copy button → Clipboard API fails → Fallback execCommand → Toast shows success/failure

2. **QR Code Display** (US2 - CRITICAL):
   - Dialog opens → QR code generates within 2 seconds → QR code renders visibly
   - Mobile device scans QR code → Navigates to correct guest URL

3. **QR Download** (US3):
   - User clicks download → SVG converts to PNG → Browser triggers download → File is 512x512

4. **Validation** (Foundational - CRITICAL):
   - Invalid projectId → Zod throws error → Error boundary catches
   - Valid projectId → URL generates correctly → QR encodes properly

---

## Checkpoints & Validation

### After Phase 2 (Foundational)

```bash
cd apps/clementine-app
pnpm test src/domains/project/share/utils
# Verify all utility tests pass (validation + URL generation)
```

### After Phase 3 (US1 - MVP)

```bash
# Run tests
pnpm test src/domains/project/share

# Manual validation
pnpm dev
# Navigate to /workspace/{slug}/projects/{projectId}
# Click Share button → Dialog opens
# Click Copy Link → Verify clipboard contains correct URL
# Verify success toast appears
```

### After Phase 4 (US2)

```bash
# Manual validation
# Open share dialog
# Verify QR code renders
# Scan QR code with phone → Verify navigates to guest page
```

### After Phase 5 (US3)

```bash
# Manual validation
# Click Regenerate → Verify QR visual changes
# Click Download → Verify PNG downloads (check file size ~20-50KB)
# Open downloaded PNG → Verify dimensions are 512x512
```

### After Phase 7 (Polish)

```bash
# Final validation loop
cd apps/clementine-app
pnpm check           # Auto-fix format and lint
pnpm type-check      # TypeScript strict mode
pnpm test            # All tests pass

# Mobile testing
# Open Chrome DevTools → Device toolbar → iPhone SE (320px)
# Verify dialog fits, buttons tappable, QR scales, no horizontal scroll

# Standards review
# ✓ Design system: No hard-coded colors?
# ✓ Component libraries: Using shadcn/ui Dialog correctly?
# ✓ Project structure: Vertical slice with barrel exports?
# ✓ Accessibility: All buttons have aria-labels?
```

---

## File Structure (Final State)

After all tasks complete, the domain structure will be:

```text
apps/clementine-app/src/domains/project/share/
├── components/
│   ├── ShareDialog.tsx              # Main dialog container (US1)
│   ├── ShareDialog.test.tsx         # Dialog tests (US1)
│   ├── ShareLinkSection.tsx         # Link copy section (US1)
│   ├── ShareLinkSection.test.tsx    # Link section tests (US1)
│   ├── QRCodeDisplay.tsx            # QR rendering + controls (US2, US3)
│   └── QRCodeDisplay.test.tsx       # QR display tests (US2, US3)
├── hooks/
│   ├── useCopyToClipboard.tsx       # Clipboard abstraction (US1)
│   ├── useCopyToClipboard.test.tsx  # Clipboard tests (US1)
│   ├── useQRCodeGenerator.tsx       # QR generation logic (US2, US3)
│   └── useQRCodeGenerator.test.tsx  # QR generator tests (US2, US3)
├── utils/
│   ├── validation.ts                # Zod schemas (Foundational)
│   ├── validation.test.ts           # Validation tests (Foundational)
│   ├── shareUrl.utils.ts            # URL generation (Foundational)
│   ├── shareUrl.utils.test.ts       # URL tests (Foundational)
│   ├── qrDownload.utils.ts          # SVG-to-PNG conversion (US3)
│   └── qrDownload.utils.test.ts     # Download tests (US3)
├── types.ts                         # TypeScript interfaces (Foundational)
└── index.ts                         # Barrel export (ShareDialog only)
```

Integration point:
```text
apps/clementine-app/src/app/workspace/$workspaceSlug.projects/
└── $projectId.tsx                   # Share button added to TopNavActions (US1)
```

---

## Success Criteria Mapping

### SC-001: Users can open the share dialog within 1 click
- **Verified by**: US1 - T014 (Share button in top nav)

### SC-002: Users can copy the guest link in under 3 seconds
- **Verified by**: US1 - T010, T011 (Copy button with clipboard API)

### SC-003: QR codes generated within 2 seconds
- **Verified by**: US2 - T022 (react-qr-code renders < 2s)

### SC-004: Downloaded QR codes are at least 512x512 pixels
- **Verified by**: US3 - T027, T032 (PNG conversion at 512x512)

### SC-005: 95% of users successfully copy link on first attempt
- **Verified by**: US1 - T010 (Clipboard API with fallback ensures high success rate)

### SC-006: QR codes scan successfully 99% of the time
- **Verified by**: US2 - T022 (react-qr-code with Medium error correction)

### SC-007: Users can regenerate QR code in under 2 seconds
- **Verified by**: US3 - T026, T031 (State update triggers instant re-render)

### SC-008: Downloaded QR codes maintain quality when printed
- **Verified by**: US3 - T027 (512x512 PNG sufficient for 24x36 inch posters)

### SC-009: Help instructions visible without scrolling
- **Verified by**: US4 - T038 (Responsive design check)

### SC-010: 90% of users share without support
- **Verified by**: US4 - T036, T037 (Clear help instructions reduce confusion)
