# Tasks: Theme Editor

**Input**: Design documents from `/specs/003-theme-editor/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: Tests are NOT explicitly requested. Existing ThemeEditor component has comprehensive test coverage (556 lines). No new tests required.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**Key Finding**: The core components are **already fully implemented** (ThemeEditor, PreviewPanel, ImageUploadField, server actions, validation schemas). This task list covers only the remaining integration work.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app (Next.js)**: `web/src/` at repository root
- Route files: `web/src/app/(dashboard)/events/[eventId]/(studio)/design/`
- Feature components: `web/src/features/events/components/`

---

## Phase 1: Setup (Route Rename)

**Purpose**: Rename the route directory from "branding" to "theme" per PRD specification

- [ ] T001 Rename route directory from `web/src/app/(dashboard)/events/[eventId]/(studio)/design/branding/` to `theme/`

---

## Phase 2: User Story 1 - Configure Event Theme (Priority: P1) 🎯 MVP

**Goal**: Event creators can access the Theme page and configure their event's visual appearance

**Independent Test**: Navigate to `/events/{eventId}/design/theme`, modify theme properties, save, and verify changes persist after page refresh

### Implementation for User Story 1

- [ ] T002 [US1] Update page component in `web/src/app/(dashboard)/events/[eventId]/(studio)/design/theme/page.tsx` - Replace placeholder with server component that fetches event and renders ThemeEditor
- [ ] T003 [US1] Update navigation label in `web/src/features/events/components/shared/DesignSubTabs.tsx` - Change "Branding" to "Theme" and update href from `/design/branding` to `/design/theme`

**Checkpoint**: At this point, User Story 1 should be fully functional - creators can navigate to Design → Theme, see the editor, modify all settings, and save

---

## Phase 3: User Story 2 - Preview Theme Changes in Real-Time (Priority: P2)

**Goal**: Creators see instant preview of theme changes in mobile device frame before saving

**Independent Test**: Open Theme page, modify each property, verify preview panel updates instantly

### Implementation for User Story 2

**Note**: Preview functionality is already implemented in ThemeEditor component. No additional tasks required.

**Checkpoint**: Preview functionality verified as part of User Story 1 integration

---

## Phase 4: User Story 3 - Upload Brand Assets (Priority: P3)

**Goal**: Creators can upload logo and background images

**Independent Test**: Upload logo image, verify it appears in preview, save, confirm URL persisted

### Implementation for User Story 3

**Note**: Image upload functionality is already implemented via ImageUploadField component. No additional tasks required.

**Checkpoint**: Image upload functionality verified as part of User Story 1 integration

---

## Phase 5: Polish & Validation Loop

**Purpose**: Ensure code quality and feature works end-to-end

### Validation Loop (REQUIRED - Constitution Principle V)

- [ ] T004 Run `pnpm lint` and fix all errors/warnings
- [ ] T005 Run `pnpm type-check` and resolve all TypeScript errors
- [ ] T006 Run `pnpm test` and ensure all tests pass
- [ ] T007 Verify feature in local dev server (`pnpm dev`) - Navigate to Design → Theme, test all sections, save changes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - can start immediately
- **Phase 2 (User Story 1)**: Depends on Phase 1 route rename
- **Phase 3 (User Story 2)**: Already implemented - verify as part of User Story 1 testing
- **Phase 4 (User Story 3)**: Already implemented - verify as part of User Story 1 testing
- **Phase 5 (Polish)**: Depends on Phase 2 completion

### Task Dependencies

```
T001 (rename route)
  └── T002 (update page component)
  └── T003 (update navigation) [can run in parallel with T002]
        └── T004, T005, T006 (lint, type-check, test) [can run in parallel]
              └── T007 (manual verification)
```

### Parallel Opportunities

- T002 and T003 can run in parallel (different files)
- T004, T005, and T006 can run in parallel (independent commands)

---

## Parallel Example: Phase 2

```bash
# After T001 completes, launch T002 and T003 together:
Task: "Update page component in web/src/app/(dashboard)/events/[eventId]/(studio)/design/theme/page.tsx"
Task: "Update navigation label in web/src/features/events/components/shared/DesignSubTabs.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Route rename
2. Complete Phase 2: Page and navigation updates
3. **STOP and VALIDATE**: Run validation loop
4. Feature complete

### Expected Implementation Time

This is a minimal integration task - estimated 15-30 minutes for all tasks.

### What's Already Done (No Tasks Needed)

| Component | Location | Status |
|-----------|----------|--------|
| ThemeEditor UI | `features/events/components/designer/ThemeEditor.tsx` | Complete |
| PreviewPanel | `features/events/components/designer/PreviewPanel.tsx` | Complete |
| ImageUploadField | `components/shared/ImageUploadField.tsx` | Complete |
| updateEventTheme action | `features/events/actions/events.ts` | Complete |
| Validation schemas | `features/events/schemas/events.schemas.ts` | Complete |
| Type definitions | `features/events/types/event.types.ts` | Complete |
| Keyboard shortcuts | `hooks/useKeyboardShortcuts.ts` | Complete |
| Design layout | `app/(dashboard)/events/[eventId]/(studio)/design/layout.tsx` | Complete |

---

## Notes

- This feature is 95% implemented - only route/navigation wiring remains
- ThemeEditor has 556 lines of existing test coverage
- No new tests required as existing tests cover all functionality
- All user stories share the same page component - implementing US1 enables US2 and US3 automatically
