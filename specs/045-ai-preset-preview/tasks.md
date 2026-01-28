# Tasks: AI Preset Editor - Preview Panel

**Input**: Design documents from `/specs/045-ai-preset-preview/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md

**Tests**: NOT requested in specification - Test tasks excluded per spec guidelines

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This is a web application using TanStack Start. Paths follow the established structure:
- **Preview domain**: `apps/clementine-app/src/domains/ai-presets/preview/`
- **Editor domain** (existing): `apps/clementine-app/src/domains/ai-presets/editor/`
- **Shared utilities**: `apps/clementine-app/src/shared/`
- **Tests**: Colocated with source files (e.g., `*.test.ts` next to `*.ts`)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize preview domain structure and establish foundational files

- [ ] T001 Create preview domain directory structure at apps/clementine-app/src/domains/ai-presets/preview/ with subdirectories: components/, hooks/, lib/
- [ ] T002 [P] Create TypeScript types file at apps/clementine-app/src/domains/ai-presets/preview/types.ts with TestInputState, ResolvedPrompt, MediaReference, ValidationState interfaces
- [ ] T003 [P] Create barrel export file at apps/clementine-app/src/domains/ai-presets/preview/index.ts
- [ ] T004 Verify TypeScript strict mode configuration and Vitest test runner are working

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core utilities and hooks that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 [P] Implement prompt resolution utilities in apps/clementine-app/src/domains/ai-presets/preview/lib/prompt-resolution.ts with functions: resolvePrompt(), extractMediaReferences(), parseReferences()
- [ ] T006 [P] Create colocated unit tests in apps/clementine-app/src/domains/ai-presets/preview/lib/prompt-resolution.test.ts testing text substitution, value mappings, image placeholders, media placeholders
- [ ] T007 [P] Implement validation utilities in apps/clementine-app/src/domains/ai-presets/preview/lib/validation.ts with validatePresetInputs() function
- [ ] T008 [P] Create colocated unit tests in apps/clementine-app/src/domains/ai-presets/preview/lib/validation.test.ts testing missing inputs, undefined references, validation states
- [ ] T009 Implement useTestInputs hook in apps/clementine-app/src/domains/ai-presets/preview/hooks/useTestInputs.ts managing local state for test values with updateInput() and resetToDefaults() functions
- [ ] T010 [P] Create colocated unit tests in apps/clementine-app/src/domains/ai-presets/preview/hooks/useTestInputs.test.ts
- [ ] T011 Implement usePromptResolution hook in apps/clementine-app/src/domains/ai-presets/preview/hooks/usePromptResolution.ts using useMemo for computed resolution
- [ ] T012 [P] Create colocated unit tests in apps/clementine-app/src/domains/ai-presets/preview/hooks/usePromptResolution.test.ts
- [ ] T013 Implement usePresetValidation hook in apps/clementine-app/src/domains/ai-presets/preview/hooks/usePresetValidation.ts using useMemo for computed validation
- [ ] T014 [P] Create colocated unit tests in apps/clementine-app/src/domains/ai-presets/preview/hooks/usePresetValidation.test.ts
- [ ] T015 Run pnpm app:check to verify all foundational code passes linting, formatting, and type checking

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Test Variable Inputs (Priority: P1) 🎯 MVP

**Goal**: Enable preset creators to input test values for variables (text dropdowns/inputs, image uploads) and see the form pre-filled with defaults

**Independent Test**: Navigate to AI Preset editor, switch to Preview tab, verify dynamic form renders with correct input types (dropdowns for value-mapped text, text inputs for free text, upload zones for images), enter values, verify preview updates, click Reset to Defaults, verify inputs reset

### Implementation for User Story 1

- [ ] T016 [P] [US1] Create TestInputsForm component in apps/clementine-app/src/domains/ai-presets/preview/components/TestInputsForm.tsx rendering dynamic form based on variables array
- [ ] T017 [P] [US1] Implement text input field rendering in TestInputsForm for variables without value mappings using shadcn/ui Input component
- [ ] T018 [P] [US1] Implement dropdown field rendering in TestInputsForm for variables with value mappings using shadcn/ui Select component
- [ ] T019 [P] [US1] Implement image upload zone rendering in TestInputsForm for image variables reusing MediaPickerField component from shared/media/components/
- [ ] T020 [US1] Add default value initialization in TestInputsForm component using useTestInputs hook
- [ ] T021 [US1] Add Reset to Defaults button in TestInputsForm component calling resetToDefaults() from useTestInputs hook
- [ ] T022 [US1] Add onChange handlers to all input fields in TestInputsForm calling updateInput() from useTestInputs hook
- [ ] T023 [US1] Create AIPresetPreviewPanel container component in apps/clementine-app/src/domains/ai-presets/preview/components/AIPresetPreviewPanel.tsx integrating TestInputsForm with preset data from useAIPreset hook
- [ ] T024 [US1] Modify AIPresetEditorContent.tsx in apps/clementine-app/src/domains/ai-presets/editor/containers/ to add Preview tab and render AIPresetPreviewPanel when tab is active
- [ ] T025 [US1] Update barrel export in apps/clementine-app/src/domains/ai-presets/preview/index.ts to export AIPresetPreviewPanel
- [ ] T026 [US1] Apply responsive styling to TestInputsForm for mobile viewports (stack inputs vertically, touch-friendly targets ≥44px)
- [ ] T027 [US1] Add loading state to TestInputsForm while preset data is being fetched
- [ ] T028 [US1] Add error boundary around AIPresetPreviewPanel in AIPresetEditorContent to gracefully handle rendering errors

**Checkpoint**: At this point, User Story 1 should be fully functional - users can input test values and see form update

---

## Phase 4: User Story 2 - Live Prompt Resolution (Priority: P2)

**Goal**: Display fully resolved prompt text with all variable and media references substituted in real-time as test inputs change

**Independent Test**: After completing US1, enter test values in form, verify resolved prompt displays with substitutions (text values replace @{text:name}, "[Image: name]" replaces @{input:name}, "[Media: name]" replaces @{ref:name}), edit prompt template in Edit tab, switch back to Preview tab, verify resolved prompt updates within 300ms

### Implementation for User Story 2

- [ ] T029 [P] [US2] Create PromptPreview component in apps/clementine-app/src/domains/ai-presets/preview/components/PromptPreview.tsx displaying resolved prompt text using usePromptResolution hook
- [ ] T030 [P] [US2] Add character count display in PromptPreview component showing length of resolved text
- [ ] T031 [P] [US2] Add visual distinction in PromptPreview for unresolved references (red text/strikethrough for references that failed to resolve)
- [ ] T032 [P] [US2] Apply syntax highlighting or monospace font styling to PromptPreview for better readability
- [ ] T033 [US2] Integrate PromptPreview into AIPresetPreviewPanel component below TestInputsForm
- [ ] T034 [US2] Add useMemo optimization in PromptPreview to prevent unnecessary re-renders when resolved prompt hasn't changed
- [ ] T035 [US2] Add debouncing behavior (300ms) to prompt resolution using useMemo dependencies to match spec requirement
- [ ] T036 [US2] Add scrollable container to PromptPreview for long resolved prompts (10,000+ characters)
- [ ] T037 [US2] Add empty state to PromptPreview when prompt template has no content
- [ ] T038 [US2] Add copy-to-clipboard button to PromptPreview component for easy testing

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - users can input values and see resolved prompt update in real-time

---

## Phase 5: User Story 3 - Media Preview Grid (Priority: P3)

**Goal**: Display thumbnails of all images (from registry and test uploads) that will be sent to AI model, with usage indicators and hover tooltips

**Independent Test**: After completing US1 and US2, reference media in prompt template using @{ref:name} and @{input:name}, upload test image, verify media preview grid shows thumbnails for referenced media, hover over thumbnails to see reference names and sources, verify "X of Y media items used" counter displays correctly

### Implementation for User Story 3

- [ ] T039 [P] [US3] Create MediaPreviewGrid component in apps/clementine-app/src/domains/ai-presets/preview/components/MediaPreviewGrid.tsx displaying thumbnails in responsive grid layout
- [ ] T040 [P] [US3] Implement media reference extraction in MediaPreviewGrid using extractMediaReferences() from prompt-resolution.ts
- [ ] T041 [P] [US3] Add thumbnail rendering in MediaPreviewGrid for registry media (@{ref:name} references) showing media.url from mediaRegistry
- [ ] T042 [P] [US3] Add thumbnail rendering in MediaPreviewGrid for test uploads (@{input:name} references) creating blob URLs from File objects
- [ ] T043 [P] [US3] Add usage counter display in MediaPreviewGrid showing "X of Y media items used" where X is referenced count and Y is total registry count
- [ ] T044 [P] [US3] Add hover tooltips to thumbnails in MediaPreviewGrid using shadcn/ui Tooltip component showing reference name and source (registry vs. test)
- [ ] T045 [P] [US3] Add visual indication for unreferenced registry media in MediaPreviewGrid (grayed out or excluded from grid)
- [ ] T046 [US3] Integrate MediaPreviewGrid into AIPresetPreviewPanel component below PromptPreview
- [ ] T047 [US3] Add lazy loading to MediaPreviewGrid thumbnails using loading="lazy" attribute on img tags
- [ ] T048 [US3] Add empty state to MediaPreviewGrid when no media is referenced in prompt
- [ ] T049 [US3] Add error handling to MediaPreviewGrid for failed image loads (404, CORS errors)
- [ ] T050 [US3] Optimize MediaPreviewGrid re-renders using React.memo() for thumbnail components

**Checkpoint**: All core preview functionality (US1, US2, US3) should now work independently - full preview experience is functional

---

## Phase 6: User Story 4 - Validation Display (Priority: P4)

**Goal**: Display validation status (valid/invalid/incomplete) with clear error and warning messages for missing inputs and undefined references

**Independent Test**: After completing US1-US3, remove required variable inputs, verify validation display shows errors with red indicators, reference non-existent variable in prompt, verify warning shows "Undefined variable: @{text:varName}", provide all inputs, verify green "Valid" status indicator appears

### Implementation for User Story 4

- [ ] T051 [P] [US4] Create ValidationDisplay component in apps/clementine-app/src/domains/ai-presets/preview/components/ValidationDisplay.tsx using usePresetValidation hook for computed state
- [ ] T052 [P] [US4] Add status indicator in ValidationDisplay showing three states: valid (green), invalid (yellow), incomplete (red) using color-coded badges
- [ ] T053 [P] [US4] Add error list in ValidationDisplay for missing required inputs with field names and clear messages
- [ ] T054 [P] [US4] Add warning list in ValidationDisplay for undefined variables/media references with specific reference names
- [ ] T055 [P] [US4] Add expandable/collapsible sections in ValidationDisplay for errors and warnings using shadcn/ui Accordion component
- [ ] T056 [US4] Integrate ValidationDisplay into AIPresetPreviewPanel component below MediaPreviewGrid
- [ ] T057 [US4] Add auto-scroll behavior in ValidationDisplay to show first error when validation fails
- [ ] T058 [US4] Add click-to-focus functionality in ValidationDisplay error items to jump to corresponding input field in TestInputsForm
- [ ] T059 [US4] Add ARIA live region to ValidationDisplay for screen reader announcements when validation state changes
- [ ] T060 [US4] Style ValidationDisplay using theme tokens (bg-destructive for errors, bg-warning for warnings, bg-success for valid)

**Checkpoint**: Validation feedback is now complete - users get clear guidance on what needs to be fixed

---

## Phase 7: User Story 5 - Test Generation Button (Priority: P5)

**Goal**: Display UI placeholder button for future test generation with disabled state when validation fails and tooltip explaining why

**Independent Test**: After completing US1-US4, verify "Run Test Generation" button appears at bottom of preview panel, create validation errors by removing required inputs, verify button is disabled with tooltip explaining errors, fix all errors, verify button appears enabled (but does nothing when clicked per spec)

### Implementation for User Story 5

- [ ] T061 [P] [US5] Create TestGenerationButton component in apps/clementine-app/src/domains/ai-presets/preview/components/TestGenerationButton.tsx as placeholder UI
- [ ] T062 [P] [US5] Add disabled state logic in TestGenerationButton based on validation status from usePresetValidation hook
- [ ] T063 [P] [US5] Add tooltip to disabled TestGenerationButton using shadcn/ui Tooltip component explaining specific validation failures
- [ ] T064 [P] [US5] Add enabled state styling to TestGenerationButton when validation passes (primary button style)
- [ ] T065 [P] [US5] Add placeholder loading spinner UI in TestGenerationButton for future Phase 5 implementation
- [ ] T066 [P] [US5] Add placeholder result display area in TestGenerationButton component for future Phase 5 implementation
- [ ] T067 [US5] Integrate TestGenerationButton into AIPresetPreviewPanel component at bottom of panel
- [ ] T068 [US5] Add onClick handler to TestGenerationButton that does nothing (no-op for Phase 4, Phase 5 will implement)
- [ ] T069 [US5] Add button text "Run Test Generation" and appropriate icon using lucide-react icons
- [ ] T070 [US5] Add hover state to enabled TestGenerationButton showing it's clickable (but explaining Phase 5 implementation in tooltip)

**Checkpoint**: All user stories (US1-US5) are now complete and independently functional - full preview panel is ready

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements, optimization, and quality assurance across all user stories

- [ ] T071 [P] Add comprehensive JSDoc comments to all public functions in prompt-resolution.ts and validation.ts for maintainability
- [ ] T072 [P] Optimize performance across preview panel by adding React.memo() to TestInputsForm, PromptPreview, MediaPreviewGrid, ValidationDisplay components
- [ ] T073 [P] Add error boundary with user-friendly error message and retry button around entire preview panel in AIPresetPreviewPanel
- [ ] T074 [P] Review and ensure all colors use theme tokens (hsl(var(--primary))) not hard-coded hex values per design-system.md standards
- [ ] T075 [P] Review and ensure all touch targets are ≥44px per mobile-first design principle in constitution
- [ ] T076 [P] Add keyboard navigation support to TestInputsForm (Tab order, Enter to submit, Escape to reset)
- [ ] T077 [P] Add loading skeleton states to preview panel components while preset data is fetching
- [ ] T078 [P] Review accessibility: ARIA labels on all inputs, live regions for validation, proper heading hierarchy
- [ ] T079 Run comprehensive manual testing following quickstart.md test scenarios to verify all user stories work independently
- [ ] T080 Run pnpm app:check to verify final code passes all linting, formatting, and type checking
- [ ] T081 Test on mobile viewport (320px-768px) to verify responsive layout and touch-friendly interactions
- [ ] T082 Verify colocated tests all pass: pnpm app:test domains/ai-presets/preview
- [ ] T083 Update barrel export in preview/index.ts to export all public components and hooks
- [ ] T084 Add preview panel feature to workspace navigation or onboarding tooltips if applicable
- [ ] T085 Create git commit with message following convention: "Add AI preset preview panel for testing variable inputs (Phase 4)" with Co-Authored-By tag

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if multiple developers)
  - Or sequentially in priority order (P1 → P2 → P3 → P4 → P5)
- **Polish (Phase 8)**: Depends on all user stories (Phase 3-7) being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Reuses TestInputsForm from US1 but can be implemented independently
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Reuses prompt resolution from US2 but can be implemented independently
- **User Story 4 (P4)**: Can start after Foundational (Phase 2) - Reuses all previous components but can be implemented independently
- **User Story 5 (P5)**: Can start after Foundational (Phase 2) - Reuses validation from US4 but can be implemented independently

**Note**: While stories can be implemented in parallel, they are designed to be **integrated sequentially** in the AIPresetPreviewPanel container (US1 first, then US2, then US3, etc.). Each story adds a new section to the preview panel.

### Within Each User Story

- Components marked [P] can be created in parallel (different files)
- Integration tasks must wait for their component dependencies
- Styling and optimization tasks come after core functionality
- US1 must complete T016-T022 (form components) before T023 (container integration)
- US2 must complete T029-T032 (preview component) before T033 (integration)
- US3 must complete T039-T045 (grid component) before T046 (integration)
- US4 must complete T051-T055 (validation component) before T056 (integration)
- US5 must complete T061-T066 (button component) before T067 (integration)

### Parallel Opportunities

**Setup Phase (Phase 1)**:
- T002 (types) and T003 (barrel export) can run in parallel

**Foundational Phase (Phase 2)**:
- T005+T006 (resolution utils), T007+T008 (validation utils), T010 (useTestInputs test), T012 (usePromptResolution test), T014 (usePresetValidation test) can all run in parallel
- T009 (useTestInputs) must complete before T011 (usePromptResolution) and T013 (usePresetValidation) since they depend on understanding the input state pattern

**User Story 1 (P1)**:
- T016-T019 (all form field components) can run in parallel
- T026-T028 (styling, loading, error boundary) can run in parallel after integration

**User Story 2 (P2)**:
- T029-T032 (PromptPreview component features) can run in parallel
- T034-T040 (optimization, styling, edge cases) can run in parallel after integration

**User Story 3 (P3)**:
- T039-T045 (MediaPreviewGrid features) can run in parallel
- T047-T050 (optimization, empty state, error handling) can run in parallel after integration

**User Story 4 (P4)**:
- T051-T055 (ValidationDisplay features) can run in parallel
- T057-T060 (UX improvements) can run in parallel after integration

**User Story 5 (P5)**:
- T061-T066 (TestGenerationButton features) can run in parallel
- T068-T070 (interaction logic) can run in parallel after integration

**Polish Phase (Phase 8)**:
- T071-T078 (all polish tasks) can run in parallel
- T079-T085 (testing and finalization) must run sequentially

---

## Parallel Example: User Story 1

```bash
# Launch all form component tasks together:
Task: "Create TestInputsForm component in apps/clementine-app/src/domains/ai-presets/preview/components/TestInputsForm.tsx"
Task: "Implement text input field rendering in TestInputsForm for variables without value mappings"
Task: "Implement dropdown field rendering in TestInputsForm for variables with value mappings"
Task: "Implement image upload zone rendering in TestInputsForm for image variables"

# After form components complete, launch styling tasks together:
Task: "Apply responsive styling to TestInputsForm for mobile viewports"
Task: "Add loading state to TestInputsForm while preset data is being fetched"
Task: "Add error boundary around AIPresetPreviewPanel"
```

## Parallel Example: User Story 2

```bash
# Launch all PromptPreview component tasks together:
Task: "Create PromptPreview component displaying resolved prompt text"
Task: "Add character count display in PromptPreview component"
Task: "Add visual distinction in PromptPreview for unresolved references"
Task: "Apply syntax highlighting or monospace font styling to PromptPreview"

# After core component complete, launch optimization tasks together:
Task: "Add useMemo optimization in PromptPreview"
Task: "Add scrollable container to PromptPreview for long resolved prompts"
Task: "Add empty state to PromptPreview when prompt template has no content"
Task: "Add copy-to-clipboard button to PromptPreview component"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T015) - CRITICAL - blocks all stories
3. Complete Phase 3: User Story 1 (T016-T028)
4. **STOP and VALIDATE**: Test User Story 1 independently
   - Navigate to AI Preset editor in browser
   - Switch to Preview tab
   - Verify dynamic form renders correctly
   - Test all input types (text, dropdown, image upload)
   - Verify default values pre-fill
   - Test Reset to Defaults button
   - Verify form is responsive on mobile (320px width)
5. If User Story 1 works, this is a viable MVP checkpoint

### Incremental Delivery

1. **Foundation First** (Phase 1-2): Complete Setup + Foundational → Foundation ready
2. **MVP Increment** (Phase 3): Add User Story 1 → Test independently → Ship preview panel with basic input testing
3. **Enhanced Preview** (Phase 4): Add User Story 2 → Test independently → Ship with live prompt resolution
4. **Visual Confidence** (Phase 5): Add User Story 3 → Test independently → Ship with media preview grid
5. **Quality Assurance** (Phase 6): Add User Story 4 → Test independently → Ship with validation feedback
6. **Future Readiness** (Phase 7): Add User Story 5 → Test independently → Ship with placeholder for Phase 5
7. **Production Ready** (Phase 8): Polish → Ship production-ready feature

Each increment adds value without breaking previous stories. Each can be deployed and demoed independently.

### Parallel Team Strategy

With multiple developers:

1. **Team completes Setup + Foundational together** (everyone on Phase 1-2)
2. **Once Foundational is done**:
   - Developer A: User Story 1 (T016-T028)
   - Developer B: User Story 2 (T029-T038) - can start components in parallel with A
   - Developer C: User Story 3 (T039-T050) - can start components in parallel with A/B
3. **Sequential Integration**: Even though components are built in parallel, they integrate into AIPresetPreviewPanel sequentially (US1 first, then US2, then US3...)
4. Stories complete and integrate independently

### Recommended Approach for Solo Developer

1. **Week 1**: Setup + Foundational (Phase 1-2) → Foundation complete
2. **Week 2**: User Story 1 (Phase 3) → MVP deployed
3. **Week 3**: User Story 2 (Phase 4) → Enhanced preview deployed
4. **Week 4**: User Stories 3-5 (Phase 5-7) → Full feature deployed
5. **Week 5**: Polish (Phase 8) → Production ready

---

## Task Count Summary

**Total Tasks**: 85 tasks
- **Setup (Phase 1)**: 4 tasks
- **Foundational (Phase 2)**: 11 tasks (includes colocated tests)
- **User Story 1 (Phase 3)**: 13 tasks
- **User Story 2 (Phase 4)**: 10 tasks
- **User Story 3 (Phase 5)**: 12 tasks
- **User Story 4 (Phase 6)**: 10 tasks
- **User Story 5 (Phase 7)**: 10 tasks
- **Polish (Phase 8)**: 15 tasks

**Parallel Opportunities**: 42 tasks marked [P] can run in parallel (49% of tasks)

**Independent Test Criteria**:
- **US1**: Dynamic form with correct input types, default values, reset functionality
- **US2**: Resolved prompt displays with substitutions, updates within 300ms
- **US3**: Media grid shows referenced images, usage counter, hover tooltips
- **US4**: Validation status indicator, error/warning lists, clear messaging
- **US5**: Test generation button with disabled state and tooltips

**Suggested MVP Scope**: Phase 1-3 (Setup + Foundational + User Story 1) = 28 tasks (~33% of feature)

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label (US1-US5) maps task to specific user story for traceability
- Each user story is independently completable and testable per spec requirements
- Tests are colocated with source files (no separate test directory)
- No test tasks for components (only for utility functions per spec)
- Commit after each user story phase completion for clean git history
- Stop at any checkpoint to validate story independently before proceeding
- Follow mobile-first design: test all stories on 320px viewport
- Use theme tokens only: no hard-coded colors (grep for hex values before committing)
- All touch targets ≥44px per constitution mobile-first principle
- Run pnpm app:check before each commit to ensure code quality
