# Tasks: Lexical Prompt Editor with Mentions

**Input**: Design documents from `/specs/055-lexical-prompt-editor/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md

**Tests**: Not explicitly requested in specification. Serialization unit tests mentioned in constitution check but not as TDD requirement.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Base path: `apps/clementine-app/src/domains/experience/generate/`

---

## Phase 1: Setup (Lexical Infrastructure)

**Purpose**: Create the domain-specific Lexical infrastructure by copying and adapting from ai-presets

- [X] T001 Create lexical directory structure at `apps/clementine-app/src/domains/experience/generate/lexical/`
- [X] T002 [P] Create types file with StepOption and MediaOption interfaces in `lexical/utils/types.ts`
- [X] T003 [P] Create barrel export for utils in `lexical/utils/index.ts`
- [X] T004 [P] Create barrel export for nodes in `lexical/nodes/index.ts`
- [X] T005 [P] Create barrel export for plugins in `lexical/plugins/index.ts`
- [X] T006 Create main barrel export in `lexical/index.ts`

---

## Phase 2: Foundational (Core Nodes & Serialization)

**Purpose**: Implement the mention nodes and serialization that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T007 Create StepMentionNode adapted from VariableMentionNode in `lexical/nodes/StepMentionNode.tsx` (stores stepName, stepType, isInvalid; blue pill styling)
- [X] T008 Create MediaMentionNode adapted from ai-presets in `lexical/nodes/MediaMentionNode.tsx` (stores mediaName, isInvalid; green pill styling)
- [X] T009 Implement serializeToPlainText function in `lexical/utils/serialization.ts` (StepMentionNode → `@{step:name}`, MediaMentionNode → `@{ref:name}`)
- [X] T010 Implement deserializeFromPlainText function in `lexical/utils/serialization.ts` (parse `@{step:name}` and `@{ref:name}` patterns, create nodes with name matching)
- [X] T011 Update nodes barrel export to include StepMentionNode and MediaMentionNode in `lexical/nodes/index.ts`
- [X] T012 Update utils barrel export to include serialization functions in `lexical/utils/index.ts`

**Checkpoint**: Foundation ready - mention nodes can serialize/deserialize. User story implementation can now begin.

---

## Phase 3: User Story 1 - Type @ to Insert Step Mention (Priority: P1) 🎯 MVP

**Goal**: Experience creators can type "@" and select a step from autocomplete to insert a blue pill mention

**Independent Test**: Type "@" in prompt editor, select a step from autocomplete, verify blue pill appears with step name

### Implementation for User Story 1

- [X] T013 [US1] Create MentionsPlugin adapted from ai-presets in `lexical/plugins/MentionsPlugin.tsx` (trigger on "@", show steps with type icons, keyboard navigation)
- [X] T014 [US1] Add step type icon mapping function to MentionsPlugin (📝 for input steps, 📷 for capture steps)
- [X] T015 [US1] Implement step filtering in MentionsPlugin (exclude info steps, filter by search query)
- [X] T016 [US1] Create LexicalPromptInput component in `components/PromptComposer/LexicalPromptInput.tsx` (Lexical editor with step mention support)
- [X] T017 [US1] Add InitializePlugin to LexicalPromptInput for loading initial prompt value
- [X] T018 [US1] Add OnChangePlugin to LexicalPromptInput for serializing on changes
- [X] T019 [US1] Update PromptComposer to accept steps prop in `components/PromptComposer/PromptComposer.tsx`
- [X] T020 [US1] Update PromptComposer to convert ExperienceStep[] to StepOption[] with toStepOption adapter
- [X] T021 [US1] Replace PromptInput usage with LexicalPromptInput in PromptComposer
- [X] T022 [US1] Update AIImageNodeSettings to pass steps to PromptComposer in `components/NodeListItem/AIImageNode.tsx`
- [X] T023 [US1] Update PromptComposer barrel export in `components/PromptComposer/index.ts`
- [X] T024 [US1] Update plugins barrel export to include MentionsPlugin in `lexical/plugins/index.ts`

**Checkpoint**: User Story 1 complete - Can type "@", see steps in autocomplete, select to insert blue pill

---

## Phase 4: User Story 2 - Type @ to Insert Media Reference (Priority: P1)

**Goal**: Experience creators can select media from the same autocomplete to insert a green pill mention

**Independent Test**: Type "@" in prompt editor, select a media asset (with thumbnail) from autocomplete, verify green pill appears

### Implementation for User Story 2

- [ ] T025 [US2] Extend MentionsPlugin to show media options with thumbnails in `lexical/plugins/MentionsPlugin.tsx`
- [ ] T026 [US2] Add media section to autocomplete menu (Steps section first, then Media section)
- [ ] T027 [US2] Implement toMediaOption adapter function for converting refMedia to MediaOption[]
- [ ] T028 [US2] Update LexicalPromptInput to accept media prop in `components/PromptComposer/LexicalPromptInput.tsx`
- [ ] T029 [US2] Update PromptComposer to pass mediaOptions to LexicalPromptInput

**Checkpoint**: User Story 2 complete - Can insert both step and media mentions from unified autocomplete

---

## Phase 5: User Story 5 - Load Existing Prompt with Mentions (Priority: P1)

**Goal**: When opening an experience, prompts with `@{step:name}` and `@{ref:name}` syntax display as visual pills

**Independent Test**: Load a prompt containing `@{step:Pet Choice}`, verify it displays as "@Pet Choice" blue pill

### Implementation for User Story 5

- [ ] T030 [US5] Enhance deserializeFromPlainText to handle unmatched names (create invalid mention nodes)
- [ ] T031 [US5] Add invalid state styling to StepMentionNode (red background, strikethrough when isInvalid)
- [ ] T032 [US5] Add invalid state styling to MediaMentionNode (red background, strikethrough when isInvalid)
- [ ] T033 [US5] Create MentionValidationPlugin in `lexical/plugins/MentionValidationPlugin.tsx` (validate mentions against current steps/media, mark invalid)
- [ ] T034 [US5] Add MentionValidationPlugin to LexicalPromptInput
- [ ] T035 [US5] Update plugins barrel export to include MentionValidationPlugin in `lexical/plugins/index.ts`

**Checkpoint**: User Story 5 complete - Existing prompts load with visual pills, invalid mentions show error state

---

## Phase 6: User Story 3 - Navigate Autocomplete with Keyboard (Priority: P2)

**Goal**: Users can navigate autocomplete using arrow keys, Enter to select, Escape to dismiss

**Independent Test**: Trigger autocomplete, use arrow keys to navigate, Enter to select, Escape to close

### Implementation for User Story 3

- [ ] T036 [US3] Ensure MentionsPlugin handles ArrowUp/ArrowDown for navigation in `lexical/plugins/MentionsPlugin.tsx`
- [ ] T037 [US3] Ensure MentionsPlugin handles Enter for selection
- [ ] T038 [US3] Ensure MentionsPlugin handles Escape to close without selection
- [ ] T039 [US3] Add ARIA attributes for accessibility (role="listbox", role="option", aria-selected)
- [ ] T040 [US3] Add visual highlight for focused/selected item in autocomplete

**Checkpoint**: User Story 3 complete - Full keyboard navigation in autocomplete

---

## Phase 7: User Story 4 - Filter Autocomplete by Typing (Priority: P2)

**Goal**: Users can filter autocomplete results by typing after "@"

**Independent Test**: Type "@pet" and verify only items containing "pet" appear

### Implementation for User Story 4

- [ ] T041 [US4] Implement case-insensitive filter in MentionsPlugin based on search query
- [ ] T042 [US4] Add "No results" empty state when filter matches nothing
- [ ] T043 [US4] Ensure filter updates within 100ms (memoize filter results)
- [ ] T043a [US4] **Enhancement**: Allow spaces in search query (custom trigger function to replace `useBasicTypeaheadTriggerMatch`) - currently typing "@pet " closes menu, should stay open to search "Pet Choice"

**Checkpoint**: User Story 4 complete - Autocomplete filters as user types

---

## Phase 8: User Story 6 - Delete Mentions (Priority: P2)

**Goal**: Users can delete mentions as atomic units using Backspace/Delete

**Independent Test**: Position cursor after mention, press Backspace, verify entire pill is deleted

### Implementation for User Story 6

- [ ] T044 [US6] Ensure StepMentionNode extends TextNode with atomic selection behavior in `lexical/nodes/StepMentionNode.tsx`
- [ ] T045 [US6] Ensure MediaMentionNode extends TextNode with atomic selection behavior in `lexical/nodes/MediaMentionNode.tsx`
- [ ] T046 [US6] Verify canInsertTextBefore/After return false for atomic behavior
- [ ] T047 [US6] Test delete behavior with Backspace and Delete keys

**Checkpoint**: User Story 6 complete - Mentions delete as atomic units

---

## Phase 9: Edge Cases & Smart Paste

**Purpose**: Handle edge cases and smart paste functionality

- [ ] T048 Create SmartPastePlugin in `lexical/plugins/SmartPastePlugin.tsx` (detect `@{step:name}` and `@{ref:name}` in pasted text, convert to nodes)
- [ ] T049 Add SmartPastePlugin to LexicalPromptInput
- [ ] T050 Update plugins barrel export to include SmartPastePlugin in `lexical/plugins/index.ts`
- [ ] T051 Handle empty prompt (show placeholder text, save as empty string)
- [ ] T052 Handle "@" without selection (leave as literal text if no mention selected)

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup, validation, and quality checks

- [ ] T053 Run format, lint, type-check (`pnpm app:check`)
- [ ] T054 Verify mobile touch targets (44x44px minimum for autocomplete items)
- [ ] T055 Verify theme tokens for mention pill colors per design-system.md
- [ ] T056 Test manual scenarios from quickstart.md
- [ ] T057 Delete old PromptInput.tsx if no longer used
- [ ] T058 Final code review for unused imports and dead code

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - US1 (Phase 3) and US2 (Phase 4) can proceed in parallel after foundational
  - US5 (Phase 5) can proceed after US1/US2
  - US3, US4, US6 (Phases 6-8) can proceed in parallel after US1/US2
- **Edge Cases (Phase 9)**: Depends on US1, US2, US5
- **Polish (Phase 10)**: Depends on all user story phases being complete

### User Story Dependencies

| User Story | Priority | Dependencies | Can Start After |
|------------|----------|--------------|-----------------|
| US1 - Step Mentions | P1 | Foundational | Phase 2 |
| US2 - Media Mentions | P1 | Foundational | Phase 2 (parallel with US1) |
| US5 - Load Existing | P1 | US1, US2 | Phase 4 |
| US3 - Keyboard Nav | P2 | US1 | Phase 3 |
| US4 - Filter | P2 | US1 | Phase 3 |
| US6 - Delete | P2 | Foundational | Phase 2 |

### Parallel Opportunities

**Phase 1 (Setup):**
```
T002, T003, T004, T005 can run in parallel
```

**Phase 3+4 (US1 + US2):**
```
After foundational, US1 and US2 can start in parallel
US1 tasks T013-T024 are sequential (dependencies within story)
US2 tasks T025-T029 depend on MentionsPlugin from US1
```

**Phase 6+7+8 (US3 + US4 + US6):**
```
After US1 complete, US3, US4, US6 can proceed in parallel
Each is independently testable
```

---

## Parallel Example: Setup Phase

```bash
# Launch all barrel exports together:
Task: "Create barrel export for utils in lexical/utils/index.ts"
Task: "Create barrel export for nodes in lexical/nodes/index.ts"
Task: "Create barrel export for plugins in lexical/plugins/index.ts"
Task: "Create types file in lexical/utils/types.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 + 5)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (nodes + serialization)
3. Complete Phase 3: User Story 1 (step mentions)
4. Complete Phase 4: User Story 2 (media mentions)
5. Complete Phase 5: User Story 5 (load existing prompts)
6. **STOP and VALIDATE**: Test all P1 stories independently
7. Deploy/demo if ready

**MVP delivers**: Core mention functionality - insert steps, insert media, load saved prompts

### Incremental Delivery

1. Setup + Foundational → Infrastructure ready
2. Add US1 → Step mentions work → Demo
3. Add US2 → Media mentions work → Demo
4. Add US5 → Existing prompts load → Demo (MVP complete!)
5. Add US3, US4, US6 → Polish UX → Final release

### Single Developer Strategy

Follow phases in order:
1. Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 (MVP)
2. Then Phase 6 → Phase 7 → Phase 8 (P2 stories)
3. Then Phase 9 → Phase 10 (edge cases + polish)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All nodes extend TextNode (not DecoratorNode) for proper text selection
- Use existing ai-presets/lexical as reference but don't import from it
