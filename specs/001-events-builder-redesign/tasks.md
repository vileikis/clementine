# Tasks: Events Builder Redesign

**Input**: Design documents from `/specs/001-events-builder-redesign/`
**Prerequisites**: plan.md, spec.md, research.md, quickstart.md, contracts/server-actions.md

**Tests**: No tests requested for this feature - UI validation will be done manually in dev server

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US0, US1, US2)
- Include exact file paths in descriptions

## Path Conventions

This is a monorepo with web/ and functions/ workspaces. All paths below use `web/src/` prefix for the Next.js application.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Data model setup and basic type infrastructure

- [x] T001 [P] Add Experience type to web/src/lib/types/firestore.ts
- [x] T002 [P] Add SurveyStep type to web/src/lib/types/firestore.ts
- [x] T003 [P] Add ExperienceItem type to web/src/lib/types/firestore.ts (documented but out of scope for implementation)
- [x] T004 Extend Event interface with welcome fields (welcomeTitle, welcomeDescription, welcomeCtaLabel, welcomeBackgroundImagePath, welcomeBackgroundColorHex) in web/src/lib/types/firestore.ts
- [x] T005 Extend Event interface with ending fields (endHeadline, endBody, endCtaLabel, endCtaUrl) in web/src/lib/types/firestore.ts
- [x] T006 Extend Event interface with share fields (shareAllowDownload, shareAllowSystemShare, shareAllowEmail, shareSocials) in web/src/lib/types/firestore.ts
- [x] T007 Extend Event interface with survey fields (surveyEnabled, surveyRequired, surveyStepsCount, surveyStepsOrder, surveyVersion) in web/src/lib/types/firestore.ts
- [x] T008 Extend Event interface with counter fields (experiencesCount, sessionsCount, readyCount, sharesCount) in web/src/lib/types/firestore.ts
- [x] T009 [P] Add experienceSchema to web/src/lib/schemas/firestore.ts
- [x] T010 [P] Add surveyStepSchema to web/src/lib/schemas/firestore.ts
- [x] T011 Run pnpm type-check to validate all new types

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T012 Create stub Server Actions file web/src/lib/actions/events.ts with updateEventWelcome, updateEventEnding, updateEventSurveyConfig
- [x] T013 [P] Create stub Server Actions file web/src/lib/actions/experiences.ts with createExperience, updateExperience, deleteExperience
- [x] T014 [P] Create stub Server Actions file web/src/lib/actions/survey.ts with createSurveyStep, updateSurveyStep, deleteSurveyStep
- [x] T015 [P] Create stub Server Actions file web/src/lib/actions/storage.ts with uploadImage
- [x] T016 Run pnpm type-check to validate all Server Actions signatures

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 0 - Base Events UI Navigation Shell (Priority: P0) 🎯 FOUNDATIONAL

**Goal**: Custom event navigation interface (breadcrumb, tabs, copy link button, status dropdown) that replaces default app navigation

**Independent Test**: Navigate to an event page and verify the custom navigation renders correctly with all required elements (breadcrumb, event name, tabs, copy link, status), even if tabs show WIP/placeholder content

### Implementation for User Story 0

- [x] T017 [P] [US0] Create EventBreadcrumb component in web/src/components/organizer/EventBreadcrumb.tsx
- [x] T018 [P] [US0] Create EventTabs component in web/src/components/organizer/EventTabs.tsx
- [x] T019 [P] [US0] Create EditableEventName component in web/src/components/organizer/EditableEventName.tsx
- [x] T020 [P] [US0] Create EventStatusSwitcher component in web/src/components/organizer/EventStatusSwitcher.tsx
- [x] T021 [P] [US0] Create CopyLinkButton component in web/src/components/organizer/CopyLinkButton.tsx
- [x] T022 [US0] Update event layout in web/src/app/(event-builder)/events/[eventId]/layout.tsx to include breadcrumb, tabs, and action buttons
- [x] T023 [P] [US0] Create results page with placeholder analytics in web/src/app/(event-builder)/events/[eventId]/results/page.tsx
- [x] T024 [US0] Verify layout renders correctly in dev server and tabs navigate properly

**Checkpoint**: At this point, User Story 0 should be fully functional - event pages show custom navigation with working tabs

---

## Phase 4: User Story 1 - Content Tab Layout Infrastructure (Priority: P1) 🎯 MVP FOUNDATION

**Goal**: Content tab with left sidebar (Welcome, Experiences, Survey, Ending sections) and main content area

**Independent Test**: Navigate to Content tab and verify layout renders with left sidebar containing four sections and a main content area, even if sections show placeholder content

### Implementation for User Story 1

- [x] T025 [P] [US1] Create BuilderSidebar component in web/src/components/organizer/builder/BuilderSidebar.tsx
- [x] T026 [P] [US1] Create BuilderContent component in web/src/components/organizer/builder/BuilderContent.tsx
- [x] T027 [P] [US1] Create PreviewPanel reusable component in web/src/components/organizer/builder/PreviewPanel.tsx
- [x] T028 [US1] Create content page in web/src/app/(event-builder)/events/[eventId]/content/page.tsx that uses BuilderSidebar and BuilderContent
- [x] T029 [US1] Add mobile-responsive behavior to BuilderSidebar (collapsible on mobile, fixed on desktop)
- [x] T030 [US1] Verify sidebar renders with static placeholders for Welcome, Experiences, Survey, Ending sections

**Checkpoint**: At this point, User Story 1 should be fully functional - Content tab shows sidebar with all sections

---

## Phase 5: User Story 2 - Configure Welcome Screen (Priority: P1) 🎯 MVP

**Goal**: Configure welcome screen (title, description, CTA, colors/background) with live preview

**Independent Test**: Click Welcome item in sidebar, configure welcome settings, and verify preview displays correctly

### Implementation for User Story 2

- [x] T031 [P] [US2] Create WelcomeEditor component in web/src/components/organizer/builder/WelcomeEditor.tsx with form controls
- [x] T032 [US2] Integrate WelcomeEditor into BuilderContent when Welcome is selected
- [x] T033 [US2] Add live preview panel to WelcomeEditor that updates in real-time
- [x] T034 [US2] Connect WelcomeEditor form to updateEventWelcome Server Action
- [x] T035 [US2] Implement full updateEventWelcome Server Action with Zod validation in web/src/lib/actions/events.ts
- [x] T036 [US2] Add image upload functionality for welcome background (integrate with uploadImage action)
- [x] T037 [US2] Verify welcome screen configuration and preview work correctly in dev server

**Checkpoint**: At this point, User Story 2 should be fully functional - Welcome screen can be configured with live preview

---

## Phase 6: User Story 3 - Manage Photo Experiences (Priority: P1) 🎯 MVP

**Goal**: Add and configure photo experiences (label, overlays, AI settings) with experience list and editor

**Independent Test**: Click + button in Experiences section, add a photo experience, configure its settings, and verify it appears in experiences list and can be edited

### Implementation for User Story 3

- [x] T038 [P] [US3] Create ExperienceTypeDialog component in web/src/components/organizer/builder/ExperienceTypeDialog.tsx
- [x] T039 [P] [US3] Create ExperiencesList component in web/src/components/organizer/builder/ExperiencesList.tsx
- [x] T040 [P] [US3] Create ExperienceEditor component in web/src/components/organizer/builder/ExperienceEditor.tsx
- [x] T041 [US3] Integrate ExperiencesList into BuilderSidebar with + button
- [x] T042 [US3] Implement ExperienceTypeDialog to show Photo (enabled), Video/GIF/Wheel (coming soon)
- [x] T043 [US3] Connect + button to ExperienceTypeDialog modal
- [x] T044 [US3] Implement full createExperience Server Action with Zod validation in web/src/lib/actions/experiences.ts
- [x] T045 [US3] Implement full updateExperience Server Action with Zod validation in web/src/lib/actions/experiences.ts
- [x] T046 [US3] Implement full deleteExperience Server Action in web/src/lib/actions/experiences.ts
- [x] T047 [US3] Add experience deletion with confirmation dialog
- [ ] T048 [US3] Add real-time experience list fetching from Firestore subcollection
- [ ] T049 [US3] Connect ExperienceEditor to updateExperience Server Action
- [x] T050 [US3] Add all photo experience controls (label, capture options, overlays, AI configuration) to ExperienceEditor
- [ ] T051 [US3] Verify experience creation, editing, and deletion work correctly in dev server

**Checkpoint**: At this point, User Story 3 should be fully functional - Photo experiences can be added, configured, and managed

---

## Phase 7: User Story 4 - Configure Event Survey (Priority: P2)

**Goal**: Add and configure survey steps with ordering, enable/disable toggles, and step editor

**Independent Test**: Add survey steps, configure their order and settings, enable/disable survey, and verify preview displays correctly

### Implementation for User Story 4

- [ ] T052 [P] [US4] Create SurveySection component in web/src/components/organizer/builder/SurveySection.tsx
- [ ] T053 [P] [US4] Create SurveyStepTypeDialog component in web/src/components/organizer/builder/SurveyStepTypeDialog.tsx
- [ ] T054 [P] [US4] Create SurveyStepEditor component in web/src/components/organizer/builder/SurveyStepEditor.tsx
- [ ] T055 [US4] Integrate SurveySection into BuilderSidebar with enable/required toggles and + button
- [ ] T056 [US4] Implement SurveyStepTypeDialog to show all step types (short_text, long_text, multiple_choice, opinion_scale, email, statement)
- [ ] T057 [US4] Connect + button to SurveyStepTypeDialog modal
- [ ] T058 [US4] Implement full createSurveyStep Server Action with Zod validation in web/src/lib/actions/survey.ts
- [ ] T059 [US4] Implement full updateSurveyStep Server Action with Zod validation in web/src/lib/actions/survey.ts
- [ ] T060 [US4] Implement full deleteSurveyStep Server Action in web/src/lib/actions/survey.ts
- [ ] T061 [US4] Add real-time survey steps list fetching from Firestore subcollection
- [ ] T062 [US4] Add drag-and-drop reordering for survey steps with GripVertical icon
- [ ] T063 [US4] Connect survey reordering to updateEventSurveyConfig Server Action
- [ ] T064 [US4] Implement full updateEventSurveyConfig Server Action with Zod validation in web/src/lib/actions/events.ts
- [ ] T065 [US4] Connect SurveyStepEditor to updateSurveyStep Server Action
- [ ] T066 [US4] Add type-specific controls to SurveyStepEditor (options for multiple_choice, scale for opinion_scale, etc.)
- [ ] T067 [US4] Add survey step preview panel to SurveyStepEditor
- [ ] T068 [US4] Verify survey steps creation, editing, ordering, and deletion work correctly in dev server

**Checkpoint**: At this point, User Story 4 should be fully functional - Survey can be configured with multiple steps

---

## Phase 8: User Story 5 - Configure Ending Screen (Priority: P2)

**Goal**: Configure ending screen (headline, body, CTA, share options) with preview

**Independent Test**: Configure ending screen settings and verify preview displays correctly with enabled share options

### Implementation for User Story 5

- [ ] T069 [P] [US5] Create EndingEditor component in web/src/components/organizer/builder/EndingEditor.tsx
- [ ] T070 [US5] Integrate EndingEditor into BuilderContent when Ending is selected
- [ ] T071 [US5] Add ending screen form controls (headline, body, CTA label, CTA URL)
- [ ] T072 [US5] Add share configuration toggles (download, email, system share, social platforms)
- [ ] T073 [US5] Add live preview panel to EndingEditor
- [ ] T074 [US5] Connect EndingEditor form to updateEventEnding Server Action
- [ ] T075 [US5] Implement full updateEventEnding Server Action with Zod validation in web/src/lib/actions/events.ts
- [ ] T076 [US5] Verify ending screen configuration and preview work correctly in dev server

**Checkpoint**: At this point, User Story 5 should be fully functional - Ending screen can be configured with share options

---

## Phase 9: User Story 6 - View Experience Types (Priority: P3)

**Goal**: Show all available experience types (photo, video, gif, wheel) with "coming soon" indicators for non-photo types

**Independent Test**: Open experience type selector and verify all types are listed with appropriate "coming soon" indicators

### Implementation for User Story 6

- [ ] T077 [US6] Add "Coming Soon" badges to Video, GIF, and Wheel types in ExperienceTypeDialog
- [ ] T078 [US6] Ensure non-photo types are disabled and show explanatory text
- [ ] T079 [US6] Verify type selector shows all types with correct states in dev server

**Checkpoint**: At this point, User Story 6 should be fully functional - All experience types are visible with correct availability states

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T080 [P] Add loading states to all Server Actions with React transitions
- [ ] T081 [P] Add error handling and toast notifications for all mutations
- [ ] T082 [P] Implement optimistic updates for better UX
- [ ] T083 [P] Add keyboard shortcuts for common actions
- [ ] T084 [P] Ensure all interactive elements meet 44x44px touch target minimum
- [ ] T085 [P] Verify mobile-responsive behavior across all builder sections
- [ ] T086 Code cleanup and refactoring across builder components
- [ ] T087 Performance optimization for real-time preview updates (<300ms)
- [ ] T088 Security review of Server Actions (ensure proper validation and auth checks)
- [ ] T089 Run quickstart.md validation workflow

### Validation Loop (REQUIRED - Constitution Principle V)

**Purpose**: Ensure code quality and correctness before merge

- [ ] T090 Run `pnpm lint` and fix all errors/warnings
- [ ] T091 Run `pnpm type-check` and resolve all TypeScript errors
- [ ] T092 Verify all features in local dev server (`pnpm dev`)
- [ ] T093 Test all user stories independently to ensure each works on its own
- [ ] T094 Commit only after validation loop passes cleanly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 0 (Phase 3)**: Depends on Foundational - BLOCKS content features (provides navigation shell)
- **User Story 1 (Phase 4)**: Depends on US0 - BLOCKS all content features (provides Content tab layout)
- **User Stories 2-6 (Phase 5-9)**: All depend on US0 and US1 completion
  - Can proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 10)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 0 (P0)**: FOUNDATIONAL - Must complete before US1
- **User Story 1 (P1)**: Depends on US0 - Must complete before US2, US3, US4, US5, US6
- **User Story 2 (P1)**: Depends on US0, US1 - Can run in parallel with US3
- **User Story 3 (P1)**: Depends on US0, US1 - Can run in parallel with US2
- **User Story 4 (P2)**: Depends on US0, US1 - Can run in parallel with US2, US3, US5, US6
- **User Story 5 (P2)**: Depends on US0, US1 - Can run in parallel with US2, US3, US4, US6
- **User Story 6 (P3)**: Depends on US3 (ExperienceTypeDialog) - Can run in parallel with US2, US4, US5

### Within Each User Story

- Component creation tasks (marked [P]) can run in parallel
- Server Actions implementation before integration
- Core implementation before verification
- Story complete before moving to next priority

### Parallel Opportunities

- **Phase 1**: T001, T002, T003 can run in parallel; T009, T010 can run in parallel after types are created
- **Phase 2**: T013, T014, T015 can run in parallel
- **Phase 3 (US0)**: T017, T018, T019, T020, T021 can run in parallel, T023 can run in parallel with T022
- **Phase 4 (US1)**: T025, T026, T027 can run in parallel
- **Phase 5 (US2)**: T031 can run while other stories are being implemented
- **Phase 6 (US3)**: T038, T039, T040 can run in parallel
- **Phase 7 (US4)**: T052, T053, T054 can run in parallel
- **Phase 8 (US5)**: T069 can run while other stories are being implemented
- **Phase 10**: T080, T081, T082, T083, T084, T085 can run in parallel
- **After US1 completes**: US2, US3 can be worked on in parallel
- **After US2, US3 complete**: US4, US5, US6 can be worked on in parallel

---

## Parallel Example: User Story 0

```bash
# Launch all component creation tasks for User Story 0 together:
Task: "Create EventBreadcrumb component in web/src/components/organizer/EventBreadcrumb.tsx"
Task: "Create EventTabs component in web/src/components/organizer/EventTabs.tsx"
Task: "Create EditableEventName component in web/src/components/organizer/EditableEventName.tsx"
Task: "Create EventStatusSwitcher component in web/src/components/organizer/EventStatusSwitcher.tsx"
Task: "Create CopyLinkButton component in web/src/components/organizer/CopyLinkButton.tsx"
```

---

## Parallel Example: User Story 3

```bash
# Launch all component creation tasks for User Story 3 together:
Task: "Create ExperienceTypeDialog component in web/src/components/organizer/builder/ExperienceTypeDialog.tsx"
Task: "Create ExperiencesList component in web/src/components/organizer/builder/ExperiencesList.tsx"
Task: "Create ExperienceEditor component in web/src/components/organizer/builder/ExperienceEditor.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 0, 1, 2, 3 Only)

1. Complete Phase 1: Setup (Types & Schemas)
2. Complete Phase 2: Foundational (Server Actions stubs)
3. Complete Phase 3: User Story 0 (Navigation shell)
4. Complete Phase 4: User Story 1 (Content tab layout)
5. Complete Phase 5: User Story 2 (Welcome screen)
6. Complete Phase 6: User Story 3 (Photo experiences)
7. **STOP and VALIDATE**: Test all features independently
8. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 0 → Test independently → Navigation shell works
3. Add User Story 1 → Test independently → Content tab layout works
4. Add User Story 2 → Test independently → Welcome configuration works (MVP!)
5. Add User Story 3 → Test independently → Photo experiences work (MVP!)
6. Add User Story 4 → Test independently → Survey configuration works
7. Add User Story 5 → Test independently → Ending configuration works
8. Add User Story 6 → Test independently → All experience types visible
9. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Team completes User Story 0 together (required for all content features)
3. Team completes User Story 1 together (required for all content features)
4. Once US0 and US1 are done:
   - Developer A: User Story 2 (Welcome)
   - Developer B: User Story 3 (Experiences)
5. After US2 and US3:
   - Developer A: User Story 4 (Survey)
   - Developer B: User Story 5 (Ending)
   - Developer C: User Story 6 (Experience types visibility)
6. Stories complete and integrate independently

---

## Summary

**Total Tasks**: 94

**Task Count by User Story**:

- Setup (Phase 1): 11 tasks
- Foundational (Phase 2): 5 tasks
- User Story 0 (P0): 8 tasks
- User Story 1 (P1): 6 tasks
- User Story 2 (P1): 7 tasks
- User Story 3 (P1): 14 tasks
- User Story 4 (P2): 17 tasks
- User Story 5 (P2): 8 tasks
- User Story 6 (P3): 3 tasks
- Polish & Validation: 15 tasks

**Parallel Opportunities Identified**:

- Phase 1: 5 parallel opportunities (types, schemas)
- Phase 2: 3 parallel opportunities (Server Actions files)
- Phase 3 (US0): 5 parallel opportunities (navigation components)
- Phase 4 (US1): 3 parallel opportunities (builder components)
- Phase 6 (US3): 3 parallel opportunities (experience components)
- Phase 7 (US4): 3 parallel opportunities (survey components)
- Phase 10: 6 parallel opportunities (polish tasks)

**Independent Test Criteria**:

- US0: Custom navigation renders with all elements
- US1: Content tab shows sidebar with four sections
- US2: Welcome screen configurable with live preview
- US3: Photo experiences can be added and configured
- US4: Survey steps can be added and reordered
- US5: Ending screen configurable with share options
- US6: All experience types visible with correct availability

**Suggested MVP Scope**: User Stories 0, 1, 2, 3 (Navigation + Content Tab + Welcome + Photo Experiences)

**Format Validation**: ✅ All tasks follow the checklist format with checkbox, ID, optional [P] marker, [Story] label (for user story phases), and file paths

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- No tests included as per feature specification requirements
- Focus is on UI structure first, business logic second (per quickstart.md)
- ExperienceItem, Session, Share, SurveyResponse, and Participant collections are documented but out of scope for implementation
