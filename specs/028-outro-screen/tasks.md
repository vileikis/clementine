# Tasks: Event Outro & Share Configuration

**Input**: Design documents from `/specs/028-outro-screen/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/server-actions.md

**Tests**: Not explicitly requested - no test tasks included (following minimal testing strategy per constitution).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `web/src/` (Next.js monorepo structure)
- **Features**: `web/src/features/[domain]/`
- **Routes**: `web/src/app/(workspace)/[companySlug]/[projectId]/[eventId]/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Extend existing data layer with new types, schemas, and constants

- [ ] T001 [P] Add EventOutro interface to `web/src/features/events/types/event.types.ts`
- [ ] T002 [P] Add EventShareOptions interface to `web/src/features/events/types/event.types.ts`
- [ ] T003 Update Event interface to include optional outro and shareOptions fields in `web/src/features/events/types/event.types.ts`
- [ ] T004 [P] Add eventOutroSchema to `web/src/features/events/schemas/event.schemas.ts`
- [ ] T005 [P] Add eventShareOptionsSchema to `web/src/features/events/schemas/event.schemas.ts`
- [ ] T006 [P] Add partialEventOutroSchema for updates in `web/src/features/events/schemas/event.schemas.ts`
- [ ] T007 [P] Add partialEventShareOptionsSchema for updates in `web/src/features/events/schemas/event.schemas.ts`
- [ ] T008 [P] Add DEFAULT_EVENT_OUTRO constant to `web/src/features/events/constants.ts`
- [ ] T009 [P] Add DEFAULT_EVENT_SHARE_OPTIONS constant to `web/src/features/events/constants.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Repository methods and server actions that all user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [ ] T010 Add updateEventOutro method to `web/src/features/events/repositories/events.repository.ts`
- [ ] T011 Add updateEventShareOptions method to `web/src/features/events/repositories/events.repository.ts`
- [ ] T012 [P] Add updateEventOutroAction server action to `web/src/features/events/actions/events.actions.ts`
- [ ] T013 [P] Add updateEventShareOptionsAction server action to `web/src/features/events/actions/events.actions.ts`
- [ ] T014 Create outro components directory with barrel export at `web/src/features/events/components/outro/index.ts`
- [ ] T015 Create guest outro components directory with barrel export at `web/src/features/guest/components/outro/index.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Configure Outro Message (Priority: P1) MVP

**Goal**: Event organizers can configure end-of-experience message (title, description, CTA) with live preview

**Independent Test**: Configure outro fields and verify they appear correctly in the preview. Form should autosave on blur.

### Implementation for User Story 1

- [ ] T016 [US1] Create OutroSection form component in `web/src/features/events/components/outro/OutroSection.tsx`
  - Title input (max 100 chars, character counter)
  - Description textarea (max 500 chars, character counter)
  - CTA Label input (max 50 chars)
  - CTA URL input with URL validation
- [ ] T017 [US1] Create OutroPreview component in `web/src/features/events/components/outro/OutroPreview.tsx`
  - Wrap with PreviewShell + ThemeProvider + ThemedBackground
  - Display placeholder image for result
  - Show title, description, CTA button based on form values
  - Apply event theme styling
- [ ] T018 [US1] Create OutroContent guest component in `web/src/features/guest/components/outro/OutroContent.tsx`
  - Render outro text content (title, description)
  - Render themed CTA button when ctaLabel and ctaUrl provided
  - Handle empty outro gracefully (show only result + share)
- [ ] T019 [US1] Create outro page route at `web/src/app/(workspace)/[companySlug]/[projectId]/[eventId]/outro/page.tsx`
  - Two-column layout (form left, preview right on desktop)
  - Stacked layout on mobile
  - Load event data
  - Initialize react-hook-form with eventOutroSchema resolver
  - Integrate useAutoSave hook with handleBlur pattern
  - Pass watched values to OutroPreview
- [ ] T020 [US1] Update outro barrel export to include OutroSection and OutroPreview in `web/src/features/events/components/outro/index.ts`
- [ ] T021 [US1] Update guest outro barrel export to include OutroContent in `web/src/features/guest/components/outro/index.ts`

**Checkpoint**: User Story 1 complete - organizers can configure and preview outro message content

---

## Phase 4: User Story 2 - Configure Sharing Options (Priority: P2)

**Goal**: Event organizers can control which sharing options are available to guests

**Independent Test**: Toggle share options (download, system share, email, social platforms) and verify only enabled options appear in preview.

### Implementation for User Story 2

- [ ] T022 [US2] Create ShareOptionsSection form component in `web/src/features/events/components/outro/ShareOptionsSection.tsx`
  - Switch toggle for allowDownload
  - Switch toggle for allowSystemShare
  - Switch toggle for allowEmail
  - Social platform multi-select (instagram, facebook, twitter, linkedin, tiktok, whatsapp)
- [ ] T023 [US2] Update OutroPreview to display share options based on form values in `web/src/features/events/components/outro/OutroPreview.tsx`
  - Show/hide download button
  - Show/hide system share button
  - Show/hide email button
  - Show enabled social platform icons
  - Hide share section entirely when all options disabled
- [ ] T024 [US2] Update OutroContent to render share buttons based on shareOptions in `web/src/features/guest/components/outro/OutroContent.tsx`
  - Download button (functional, downloads result image)
  - System share button (uses Web Share API)
  - Email share button
  - Social platform share buttons
  - Hide share section when all options disabled
- [ ] T025 [US2] Update outro page to include ShareOptionsSection in `web/src/app/(workspace)/[companySlug]/[projectId]/[eventId]/outro/page.tsx`
  - Extend form schema to include shareOptions fields
  - Integrate shareOptions with useAutoSave
  - Pass share option values to preview
- [ ] T026 [US2] Update outro barrel export to include ShareOptionsSection in `web/src/features/events/components/outro/index.ts`

**Checkpoint**: User Story 2 complete - organizers can configure all sharing options

---

## Phase 5: User Story 3 - Live Preview with Theme (Priority: P3)

**Goal**: Preview reflects event theme (colors, typography, backgrounds) and updates in real-time

**Independent Test**: Change form values and theme settings, verify preview updates instantly (<100ms) with correct styling.

### Implementation for User Story 3

- [ ] T027 [US3] Enhance OutroPreview with full theme support in `web/src/features/events/components/outro/OutroPreview.tsx`
  - Use useEventTheme hook for all styled elements
  - Apply theme.text.color to title and description
  - Apply theme.text.alignment to content
  - Apply theme.button styles (backgroundColor, textColor, radius) to CTA button
  - Apply theme.background (color, image, overlay) via ThemedBackground
  - Apply theme.fontFamily to preview content
- [ ] T028 [US3] Ensure real-time preview updates in `web/src/app/(workspace)/[companySlug]/[projectId]/[eventId]/outro/page.tsx`
  - Use useWatch for all form fields
  - Verify preview re-renders on every keystroke
  - Ensure no Firebase reads required for preview updates
- [ ] T029 [US3] Add viewport switching and fullscreen to OutroPreview in `web/src/features/events/components/outro/OutroPreview.tsx`
  - Enable PreviewShell viewport switcher (mobile/desktop)
  - Enable PreviewShell fullscreen mode

**Checkpoint**: User Story 3 complete - preview is fully themed and updates in real-time

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Navigation integration, final adjustments, validation

- [ ] T030 [P] Add outro route to event navigation/sidebar (if applicable)
- [ ] T031 Handle edge cases in OutroContent: long text truncation, missing theme defaults
- [ ] T032 Ensure mobile responsiveness: stacked layout, touch targets ≥44x44px, readable typography

### Validation Loop (REQUIRED - Constitution Principle V)

**Purpose**: Ensure code quality and correctness before merge

- [ ] T033 Run `pnpm lint` and fix all errors/warnings
- [ ] T034 Run `pnpm type-check` and resolve all TypeScript errors
- [ ] T035 Verify feature in local dev server (`pnpm dev`)
- [ ] T036 Test on mobile viewport (320px-768px)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion
- **User Story 2 (Phase 4)**: Depends on Foundational phase completion (can run parallel with US1 if needed)
- **User Story 3 (Phase 5)**: Depends on US1 preview component existing
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - Creates base OutroPreview and OutroContent
- **User Story 2 (P2)**: Can start after Foundational - Extends OutroPreview and OutroContent with share options
- **User Story 3 (P3)**: Depends on US1 OutroPreview existing - Enhances theme support

### Within Each User Story

- Form components before preview integration
- Preview components before page route integration
- Core implementation before barrel export updates

### Parallel Opportunities

**Phase 1 (all can run in parallel):**
- T001, T002 (types)
- T004, T005, T006, T007 (schemas)
- T008, T009 (constants)

**Phase 2:**
- T012, T013 (server actions - after repository methods)

**Phase 6:**
- T030, T031, T032 (polish tasks)

---

## Parallel Example: Phase 1 Setup

```bash
# Launch all type additions together:
Task: "Add EventOutro interface to web/src/features/events/types/event.types.ts"
Task: "Add EventShareOptions interface to web/src/features/events/types/event.types.ts"

# Launch all schema additions together:
Task: "Add eventOutroSchema to web/src/features/events/schemas/event.schemas.ts"
Task: "Add eventShareOptionsSchema to web/src/features/events/schemas/event.schemas.ts"

# Launch all constants together:
Task: "Add DEFAULT_EVENT_OUTRO constant to web/src/features/events/constants.ts"
Task: "Add DEFAULT_EVENT_SHARE_OPTIONS constant to web/src/features/events/constants.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (types, schemas, constants)
2. Complete Phase 2: Foundational (repository, actions, directories)
3. Complete Phase 3: User Story 1 (outro message config + preview)
4. **STOP and VALIDATE**: Test outro config independently
5. Deploy/demo if ready - organizers can configure outro messages

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy (MVP!)
3. Add User Story 2 → Test independently → Deploy (adds sharing controls)
4. Add User Story 3 → Test independently → Deploy (enhances preview)
5. Polish phase → Final validation → Merge

### Recommended Execution Order

1. T001-T009 (Setup - parallel where marked)
2. T010-T015 (Foundational - sequential then parallel)
3. T016-T021 (US1 - sequential)
4. T022-T026 (US2 - sequential)
5. T027-T029 (US3 - sequential)
6. T030-T036 (Polish + Validation)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Follow existing Welcome screen patterns for consistency
