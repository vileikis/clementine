# Tasks: Share Screen Editor

**Input**: Design documents from `/specs/024-share-editor/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: No test tasks included (not explicitly requested in feature specification).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app (TanStack Start monorepo)**: `apps/clementine-app/src/`
- All paths are relative to repository root unless specified otherwise

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create directory structure and foundational files for the share domain

- [ ] T001 Create share domain directory structure at `apps/clementine-app/src/domains/event/share/` with subdirectories: `containers/`, `components/`, `hooks/`, `constants/`
- [ ] T002 [P] Create barrel export file at `apps/clementine-app/src/domains/event/share/index.ts`
- [ ] T003 [P] Create component barrel export file at `apps/clementine-app/src/domains/event/share/components/index.ts`
- [ ] T004 [P] Create hooks barrel export file at `apps/clementine-app/src/domains/event/share/hooks/index.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema changes, shared component, and tab registration that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Schema Updates

- [ ] T005 Rename `sharingConfigSchema` to `shareOptionsConfigSchema` in `apps/clementine-app/src/domains/event/shared/schemas/project-event-config.schema.ts`
- [ ] T006 Rename `sharing` field to `shareOptions` in `projectEventConfigSchema` in `apps/clementine-app/src/domains/event/shared/schemas/project-event-config.schema.ts`
- [ ] T007 Update `SharingConfig` type export to `ShareOptionsConfig` in `apps/clementine-app/src/domains/event/shared/schemas/project-event-config.schema.ts`
- [ ] T008 Add `ctaConfigSchema` to `apps/clementine-app/src/domains/event/shared/schemas/project-event-config.schema.ts` with label and url fields (nullable with defaults)
- [ ] T009 Add `shareConfigSchema` to `apps/clementine-app/src/domains/event/shared/schemas/project-event-config.schema.ts` with title, description, and cta fields (nullable with defaults)
- [ ] T010 Add `share` field to `projectEventConfigSchema` in `apps/clementine-app/src/domains/event/shared/schemas/project-event-config.schema.ts`
- [ ] T011 Export `ShareConfig` and `CtaConfig` types from `apps/clementine-app/src/domains/event/shared/schemas/project-event-config.schema.ts`

### Update Existing Components for Schema Rename

- [ ] T012 Update `useUpdateShareOptions` hook to use `shareOptions` prefix instead of `sharing` in `apps/clementine-app/src/domains/event/settings/hooks/useUpdateShareOptions.ts`
- [ ] T013 Update `SharingSection` to read from `event.draftConfig?.shareOptions` instead of `sharing` in `apps/clementine-app/src/domains/event/settings/components/SharingSection.tsx`
- [ ] T014 Update schema import in `apps/clementine-app/src/domains/event/settings/schemas/update-sharing.schema.ts` if it references old type name

### Shared Component

- [ ] T015 Create `SelectOptionCard` component in `apps/clementine-app/src/shared/editor-controls/components/SelectOptionCard.tsx` - compact toggle card optimized for narrow ConfigPanel sidebars (inspired by SharingOptionCard but smaller)
- [ ] T016 Export `SelectOptionCard` from `apps/clementine-app/src/shared/editor-controls/index.ts` barrel

### Tab Registration & Route

- [ ] T017 Create default values constant `DEFAULT_SHARE` in `apps/clementine-app/src/domains/event/share/constants/defaults.ts`
- [ ] T018 Add Share tab to `eventDesignerTabs` array in `apps/clementine-app/src/domains/event/designer/containers/EventDesignerLayout.tsx` (insert between Theme and Settings)
- [ ] T019 Create route file at `apps/clementine-app/src/app/workspace/$workspaceSlug.projects/$projectId.events/$eventId.share.tsx` following existing tab route pattern
- [ ] T020 Create `useUpdateShare` mutation hook in `apps/clementine-app/src/domains/event/share/hooks/useUpdateShare.ts` following useUpdateWelcome pattern

**Checkpoint**: Foundation ready - Schema updated, SelectOptionCard created, tab registered, routes created

---

## Phase 3: User Story 1 - Configure Share Screen Content (Priority: P1) 🎯 MVP

**Goal**: Admins can customize share screen title and description with live preview updates

**Independent Test**: Access Share tab, enter custom title and description, verify preview updates immediately

### Implementation for User Story 1

- [ ] T021 [US1] Create `ShareConfigPanel` component shell in `apps/clementine-app/src/domains/event/share/components/ShareConfigPanel.tsx` with sections for content and share options
- [ ] T022 [US1] Implement title text input with label "Title" and placeholder in ShareConfigPanel using shadcn Input component
- [ ] T023 [US1] Implement description textarea with label "Description" in ShareConfigPanel using shadcn Textarea component
- [ ] T024 [P] [US1] Create `SharePreview` component in `apps/clementine-app/src/domains/event/share/components/SharePreview.tsx` with two-zone layout (scrollable content + fixed footer)
- [ ] T025 [US1] Implement media placeholder in SharePreview scrollable zone with aspect-square container and Lucide Image icon
- [ ] T026 [US1] Implement conditional title display in SharePreview (hidden when null, visible when has value)
- [ ] T027 [US1] Implement conditional description display in SharePreview (hidden when null, visible when has value)
- [ ] T028 [US1] Create `ShareEditorPage` container in `apps/clementine-app/src/domains/event/share/containers/ShareEditorPage.tsx` with 2-column layout following WelcomeEditorPage pattern
- [ ] T029 [US1] Integrate react-hook-form in ShareEditorPage with useForm and useWatch for live preview
- [ ] T030 [US1] Integrate useAutoSave hook in ShareEditorPage with 2000ms debounce and useUpdateShare mutation
- [ ] T031 [US1] Wire ShareConfigPanel to form state with handleUpdate callback for title and description fields
- [ ] T032 [US1] Wire SharePreview to watched form values and wrap with PreviewShell and ThemeProvider

**Checkpoint**: User Story 1 complete - Title and description can be configured with live preview and auto-save

---

## Phase 4: User Story 2 - Configure Share Options (Priority: P2)

**Goal**: Admins can toggle share options (download, copy link, social platforms) in Share tab with live preview

**Independent Test**: Toggle share options in Share tab, verify icons update in preview immediately

### Implementation for User Story 2

- [ ] T033 [US2] Add share options section to ShareConfigPanel with "Main Options" and "Social Media" groups
- [ ] T034 [US2] Implement share option toggles using SelectOptionCard in ShareConfigPanel for Download and Copy Link
- [ ] T035 [US2] Implement share option toggles using SelectOptionCard in ShareConfigPanel for Email, Instagram, Facebook, LinkedIn, Twitter, TikTok, Telegram
- [ ] T036 [US2] Import and integrate `useUpdateShareOptions` hook in ShareEditorPage for share options mutations
- [ ] T037 [US2] Wire share options toggles to useUpdateShareOptions with auto-save (300ms debounce like SharingSection)
- [ ] T038 [US2] Implement share icons row in SharePreview fixed footer zone based on enabled share options
- [ ] T039 [US2] Create platform-to-icon mapping for share icons (Download→Download, CopyLink→Link, Email→Mail, etc.) using Lucide icons and react-icons
- [ ] T040 [US2] Implement "Start over" button in SharePreview fixed footer (always visible, disabled in preview)
- [ ] T041 [US2] Style share icons with appropriate sizing (44px touch targets) and spacing per mobile-first design

**Checkpoint**: User Story 2 complete - Share options toggleable in Share tab with live preview

---

## Phase 5: User Story 3 - Configure Call to Action Button (Priority: P3)

**Goal**: Admins can add custom CTA button with label and URL, with validation

**Independent Test**: Enter CTA label and URL, verify button appears in preview; clear label, verify button hides

### Implementation for User Story 3

- [ ] T042 [US3] Add CTA section to ShareConfigPanel with label input and URL input fields
- [ ] T043 [US3] Implement CTA label input with character limit (50 chars) and validation
- [ ] T044 [US3] Implement CTA URL input with URL format validation on blur
- [ ] T045 [US3] Implement conditional validation: URL required when label is provided (refine validation)
- [ ] T046 [US3] Display validation error messages for invalid URL and missing URL when label provided
- [ ] T047 [US3] Implement conditional CTA button display in SharePreview fixed footer (hidden when label is null/empty)
- [ ] T048 [US3] Style CTA button as primary button in SharePreview with full width

**Checkpoint**: User Story 3 complete - CTA button configurable with validation, displays in preview when configured

---

## Phase 6: User Story 4 - Preview Share Screen in Edit Mode (Priority: P4)

**Goal**: Complete phone-frame preview with all elements and immediate updates

**Independent Test**: Make changes to any config field, observe preview updates within 500ms without page refresh

### Implementation for User Story 4

- [ ] T049 [US4] Verify PreviewShell integration with viewport switcher (mobile/desktop) in ShareEditorPage
- [ ] T050 [US4] Verify fullscreen mode works correctly with SharePreview
- [ ] T051 [US4] Ensure ThemeProvider applies current event theme to SharePreview for consistent styling
- [ ] T052 [US4] Add scrollable content zone overflow handling for long descriptions in SharePreview
- [ ] T053 [US4] Verify fixed footer zone stays pinned at bottom regardless of content length
- [ ] T054 [US4] Performance check: ensure preview updates within 500ms of input (no additional debounce on preview)

**Checkpoint**: User Story 4 complete - Full preview functionality with viewport switching, fullscreen, and immediate updates

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup and validation

- [ ] T055 [P] Update barrel exports in `apps/clementine-app/src/domains/event/share/index.ts` to export ShareEditorPage
- [ ] T056 [P] Verify all barrel exports are correctly configured for components and hooks
- [ ] T057 Run `pnpm app:check` (format + lint) and fix any issues
- [ ] T058 Run `pnpm app:type-check` and fix any TypeScript errors
- [ ] T059 Manual testing: Complete share screen configuration workflow end-to-end
- [ ] T060 Verify auto-save indicator shows during save operations in TopNavBar
- [ ] T061 Verify share options sync between Share tab and Settings tab (changes in one reflect in other)
- [ ] T062 Run quickstart.md validation checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User Story 1 (P1): Depends only on Foundational - creates core components
  - User Story 2 (P2): Depends on US1 - extends ShareConfigPanel and SharePreview
  - User Story 3 (P3): Depends on US1 - extends ShareConfigPanel and SharePreview
  - User Story 4 (P4): Depends on US1-3 - final preview polish
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - Creates core components
- **User Story 2 (P2)**: Depends on US1 - Extends ShareConfigPanel with share options
- **User Story 3 (P3)**: Depends on US1 - Extends ShareConfigPanel with CTA fields
- **User Story 4 (P4)**: Depends on US1-3 - Final preview polish

### Within Each User Story

- Components before containers
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

**Phase 1 (Setup)**:
```
T002 + T003 + T004 (all barrel exports in parallel)
```

**Phase 2 (Foundational)**:
```
T005 → T006 → T007 (schema rename sequential)
T008 → T009 → T010 → T011 (new schema sequential)
T012 + T013 + T014 (update existing components - parallel)
T015 → T016 (SelectOptionCard)
T017 + T018 + T019 + T020 (defaults, tab, route, hook - parallel after schema)
```

**Phase 3 (US1)**:
```
T021-T023 (ShareConfigPanel) || T024-T027 (SharePreview)
Then T028-T032 (ShareEditorPage integration)
```

**Phase 4 (US2)**:
```
T033-T037 (ShareConfigPanel share options) || T038-T041 (SharePreview icons)
```

---

## Parallel Example: Phase 2 Foundational

```bash
# After schema rename (T005-T007), run in parallel:
Task: T012 "Update useUpdateShareOptions hook prefix"
Task: T013 "Update SharingSection to read from shareOptions"
Task: T014 "Update schema import if needed"

# After SelectOptionCard created, run in parallel:
Task: T017 "Create DEFAULT_SHARE constant"
Task: T018 "Add Share tab to eventDesignerTabs"
Task: T019 "Create route file"
Task: T020 "Create useUpdateShare mutation hook"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (4 tasks)
2. Complete Phase 2: Foundational (16 tasks)
3. Complete Phase 3: User Story 1 (12 tasks)
4. **STOP and VALIDATE**: Test title/description configuration end-to-end
5. Deploy/demo if ready - admins can already customize share screen content

### Incremental Delivery

1. Setup + Foundational → Foundation ready (includes schema rename, SelectOptionCard)
2. User Story 1 → Test independently → **MVP Ready!** (basic share screen config)
3. User Story 2 → Test independently → Share options with live preview
4. User Story 3 → Test independently → CTA button configurable
5. User Story 4 → Test independently → Complete preview polish
6. Polish → Final validation → **Feature Complete!**

### Recommended Order

Execute in priority order (P1 → P2 → P3 → P4) as user stories have dependencies. This feature is best implemented sequentially due to component dependencies.

---

## Summary

| Phase | User Story | Tasks | Files Created/Modified |
|-------|-----------|-------|----------------------|
| 1 | Setup | 4 | Directory structure, barrel exports |
| 2 | Foundational | 16 | Schema rename, SelectOptionCard, tab, route, hooks |
| 3 | US1 (P1) | 12 | ShareConfigPanel, SharePreview, ShareEditorPage |
| 4 | US2 (P2) | 9 | Share options toggles in Share tab |
| 5 | US3 (P3) | 7 | CTA configuration and validation |
| 6 | US4 (P4) | 6 | Preview polish and performance |
| 7 | Polish | 8 | Exports, validation, testing, sync verification |
| **Total** | | **62** | |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- No test tasks included (not explicitly requested)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All file paths are relative to repository root
- Schema rename (`sharing` → `shareOptions`) is non-breaking - existing data handled with defaults
- `SelectOptionCard` is a new shared component for compact toggles in narrow sidebars
- Share options editable in BOTH Share tab and Settings tab (same `useUpdateShareOptions` hook)
