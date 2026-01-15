# Tasks: Themed Experience Cards

**Input**: Design documents from `/specs/027-themed-exp-cards/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/components.md

**Tests**: Not explicitly requested in specification. Tests omitted per Minimal Testing Strategy (Constitution Principle IV).

**Organization**: Tasks organized by user story for independent implementation. This is a single-component refactor - all stories share the same file.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `apps/clementine-app/src/` (TanStack Start application)
- Primary file: `apps/clementine-app/src/domains/event/experiences/components/ExperienceCard.tsx`

---

## Phase 1: Setup

**Purpose**: Prepare component for refactoring

- [X] T001 Read current ExperienceCard implementation in `apps/clementine-app/src/domains/event/experiences/components/ExperienceCard.tsx`
- [X] T002 Verify theming dependencies are available by checking exports in `apps/clementine-app/src/shared/theming/index.ts`

**Checkpoint**: Ready to begin implementation

---

## Phase 2: Foundational (Interface & Imports)

**Purpose**: Update component interface and imports before modifying implementation

- [X] T003 Add `Theme` type import from `@/shared/theming` in `apps/clementine-app/src/domains/event/experiences/components/ExperienceCard.tsx`
- [X] T004 Add `useThemeWithOverride` hook import from `@/shared/theming` in `apps/clementine-app/src/domains/event/experiences/components/ExperienceCard.tsx`
- [X] T005 Add optional `theme?: Theme` prop to `ExperienceCardProps` interface in `apps/clementine-app/src/domains/event/experiences/components/ExperienceCard.tsx`
- [X] T006 Remove `ProfileBadge` import from `apps/clementine-app/src/domains/event/experiences/components/ExperienceCard.tsx`

**Checkpoint**: Interface updated, ready for implementation changes

---

## Phase 3: User Story 1 - Themed Card Styling (Priority: P1) 🎯 MVP

**Goal**: Experience cards display with theme-derived colors (background, border, text) instead of hardcoded design system tokens

**Independent Test**: Configure custom theme colors in event editor, verify ExperienceCard in WelcomePreview reflects those colors

### Implementation for User Story 1

- [X] T007 [US1] Add `useThemeWithOverride(themeOverride)` hook call at start of component function, destructuring `theme` prop in `apps/clementine-app/src/domains/event/experiences/components/ExperienceCard.tsx`
- [X] T008 [US1] Create `cardStyle: CSSProperties` object with themed background using `color-mix(in srgb, ${theme.text.color} 8%, transparent)` in `apps/clementine-app/src/domains/event/experiences/components/ExperienceCard.tsx`
- [X] T009 [US1] Add themed border styles to `cardStyle` with `borderWidth: '1px'`, `borderStyle: 'solid'`, `borderColor` using `color-mix(in srgb, ${theme.text.color} 15%, transparent)` in `apps/clementine-app/src/domains/event/experiences/components/ExperienceCard.tsx`
- [X] T010 [US1] Add `fontFamily: theme.fontFamily ?? undefined` to `cardStyle` in `apps/clementine-app/src/domains/event/experiences/components/ExperienceCard.tsx`
- [X] T011 [US1] Replace hardcoded `bg-card text-card-foreground` classes with `style={cardStyle}` prop on card container element in `apps/clementine-app/src/domains/event/experiences/components/ExperienceCard.tsx`
- [X] T012 [US1] Update placeholder div styling to use themed colors: `backgroundColor: color-mix(in srgb, ${theme.text.color} 5%, transparent)` and `color: color-mix(in srgb, ${theme.text.color} 40%, transparent)` in `apps/clementine-app/src/domains/event/experiences/components/ExperienceCard.tsx`
- [X] T013 [US1] Apply `theme.text.color` to experience name text element (either via style prop or by using ThemedText component) in `apps/clementine-app/src/domains/event/experiences/components/ExperienceCard.tsx`
- [X] T014 [US1] Add focus ring styling using theme primary color for run mode: `focus:ring-[${theme.primaryColor}]` or equivalent inline style in `apps/clementine-app/src/domains/event/experiences/components/ExperienceCard.tsx`

**Checkpoint**: Cards display with theme-derived colors - verify in WelcomePreview with custom theme

---

## Phase 4: User Story 2 - Simplified Content Display (Priority: P1)

**Goal**: Cards show only media thumbnail and experience name - no ProfileBadge or metadata

**Independent Test**: Add experiences to event, verify WelcomePreview cards show only media and name

### Implementation for User Story 2

- [X] T015 [US2] Remove `<ProfileBadge profile={experience.profile} />` JSX from card content in `apps/clementine-app/src/domains/event/experiences/components/ExperienceCard.tsx`
- [X] T016 [US2] Add fallback for empty experience name: `const displayName = experience.name || 'Untitled Experience'` in `apps/clementine-app/src/domains/event/experiences/components/ExperienceCard.tsx`
- [X] T017 [US2] Update name rendering to use `displayName` variable instead of `experience.name` directly in `apps/clementine-app/src/domains/event/experiences/components/ExperienceCard.tsx`
- [X] T018 [US2] Ensure name text has `truncate` class for single-line ellipsis truncation in `apps/clementine-app/src/domains/event/experiences/components/ExperienceCard.tsx`

**Checkpoint**: Cards show only media + name with fallback text - no ProfileBadge visible

---

## Phase 5: User Story 3 - Consistent Theming Across Layouts (Priority: P2)

**Goal**: Both list and grid layouts display themed styling correctly

**Independent Test**: Toggle between list and grid layouts in welcome editor, verify themed styling persists in both

### Implementation for User Story 3

- [X] T019 [US3] Verify `cardStyle` is applied regardless of `layout` prop value (list or grid) in `apps/clementine-app/src/domains/event/experiences/components/ExperienceCard.tsx`
- [X] T020 [US3] Ensure thumbnail placeholder uses themed styles in both layouts in `apps/clementine-app/src/domains/event/experiences/components/ExperienceCard.tsx`
- [X] T021 [US3] Verify interactive hover state uses themed styling (slightly increased opacity) for run mode in both layouts in `apps/clementine-app/src/domains/event/experiences/components/ExperienceCard.tsx`

**Checkpoint**: Both list and grid layouts display consistent themed appearance

---

## Phase 6: Polish & Accessibility

**Purpose**: Final cleanup and accessibility verification

- [X] T022 Ensure `min-h-[44px]` class is on card container for touch target compliance (Constitution Principle I) in `apps/clementine-app/src/domains/event/experiences/components/ExperienceCard.tsx`
- [X] T023 Verify keyboard navigation still works in run mode (Enter/Space triggers onClick) in `apps/clementine-app/src/domains/event/experiences/components/ExperienceCard.tsx`
- [X] T024 Run `pnpm app:check` to verify linting and formatting pass
- [X] T025 Run `pnpm app:type-check` to verify TypeScript compilation succeeds
- [ ] T026 Manually test in WelcomePreview: verify themed cards with custom colors, default colors, both layouts, with/without media
- [X] T027 Remove any unused imports or dead code from `apps/clementine-app/src/domains/event/experiences/components/ExperienceCard.tsx`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on Foundational completion (can parallel with US1 but same file)
- **User Story 3 (Phase 5)**: Depends on US1 completion (needs themed styles to exist)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 3 (P2)**: Depends on US1 (needs themed styles to verify across layouts)

### Within-File Sequencing

Since all implementation tasks modify the same file (`ExperienceCard.tsx`), tasks should be executed sequentially within each phase to avoid conflicts.

### Parallel Opportunities

- **Phase 1**: T001 and T002 can run in parallel (different files)
- **Phase 2**: T003-T006 should run sequentially (same file)
- **Phase 3-5**: Execute sequentially (same file)
- **Phase 6**: T024 and T025 can run in parallel (different commands)

---

## Parallel Example: Setup Phase

```bash
# Launch setup tasks in parallel (different files):
Task: "Read current ExperienceCard implementation in apps/clementine-app/src/domains/event/experiences/components/ExperienceCard.tsx"
Task: "Verify theming dependencies are available in apps/clementine-app/src/shared/theming/index.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup (read files)
2. Complete Phase 2: Foundational (update interface/imports)
3. Complete Phase 3: User Story 1 (themed styling)
4. Complete Phase 4: User Story 2 (simplified content)
5. **STOP and VALIDATE**: Test in WelcomePreview with custom theme
6. Deploy/demo if ready

### Full Implementation

1. Complete MVP (US1 + US2)
2. Add Phase 5: User Story 3 (layout consistency verification)
3. Complete Phase 6: Polish & Accessibility
4. Final validation with `pnpm app:check` and `pnpm app:type-check`

---

## Notes

- All implementation tasks modify single file: `ExperienceCard.tsx`
- No parallel opportunities within user story phases (same file)
- Commit after each phase for clean git history
- US1 and US2 are both P1 priority - implement together for MVP
- US3 is verification/polish - can be quick pass if US1 done correctly
