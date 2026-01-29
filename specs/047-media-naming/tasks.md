# Tasks: Preserve Original Media File Names

**Feature**: 047-media-naming
**Branch**: `047-media-naming`
**Generated**: 2026-01-29

## Overview

This document provides the implementation task breakdown for preserving original media filenames. Tasks are organized by user story to enable independent implementation and testing, allowing for incremental delivery.

**Estimated Total Time**: 2-3 hours
**Total Tasks**: 19 tasks across 6 phases

## Implementation Strategy

**MVP Scope** (User Story 1 - P1):
- Phase 1: Setup (dependencies and validation)
- Phase 2: Foundational changes (schemas and utilities)
- Phase 3: User Story 1 implementation (upload flow with display names)

This delivers immediate value: users see their original filenames after upload.

**Incremental Delivery**:
- **Sprint 1** (MVP): US1 - Upload media with original filename
- **Sprint 2**: US2 - Storage collision prevention (validation)
- **Sprint 3**: US3 - Media reference integration (consuming code updates)
- **Sprint 4**: US4 - Legacy media migration (backward compatibility testing)

## User Story Summary

From [spec.md](./spec.md):

| Story | Priority | Goal | Independent Test |
|-------|----------|------|------------------|
| **US1** | P1 | Upload media with original filename | Upload "My Photo.jpg", verify it displays in media library |
| **US2** | P1 | Storage collision prevention | Upload two files named "logo.png", verify both stored with unique paths |
| **US3** | P2 | Media reference integration | Upload file, set as background, verify config shows filename |
| **US4** | P3 | Legacy media migration | Load legacy assets, verify they display "Untitled" |

## Phase 1: Setup

**Goal**: Prepare development environment and validate dependencies

**Tasks**:

- [X] T001 Verify monorepo dependencies are installed (pnpm 10.18.1, Node 18+)
- [X] T002 Checkout branch 047-media-naming and pull latest changes
- [X] T003 Run `pnpm install` to ensure all dependencies are available
- [X] T004 Verify TypeScript strict mode is enabled in tsconfig.json files
- [X] T005 Run initial validation: `pnpm app:type-check` and `pnpm --filter @clementine/shared type-check`

**Success Criteria**: All type checks pass, development environment ready

---

## Phase 2: Foundational - Schema Updates

**Goal**: Update shared schemas to support displayName field (blocking prerequisite for all user stories)

**Why Foundational**: All user stories depend on these schema changes. Must be completed before any story-specific work.

**Tasks**:

- [X] T006 [P] Add displayName field to MediaAsset schema in packages/shared/src/schemas/media/media-asset.schema.ts
- [X] T007 [P] Add displayName field to MediaReference schema in packages/shared/src/schemas/media/media-reference.schema.ts
- [X] T008 Build shared package with `pnpm --filter @clementine/shared build`
- [X] T009 Verify schema changes with `pnpm --filter @clementine/shared type-check`
- [X] T010 Remove "overlay-" prefix from generateFileName function in apps/clementine-app/src/domains/media-library/utils/upload.utils.ts

**Success Criteria**:
- Both schemas include displayName with `.default('Untitled')`
- Shared package builds successfully
- Type checks pass
- generateFileName returns `{nanoid}.{ext}` format (no prefix)

**Independent Test**: Load legacy media asset, verify it gets "Untitled" as default displayName

---

## Phase 3: User Story 1 - Upload Media with Original Filename (P1)

**Story Goal**: When users upload media files, they see the original filename (e.g., "Beach Sunset.jpg") instead of system-generated names.

**Independent Test**: Upload a file named "My Photo.jpg" and verify the media library displays "My Photo.jpg" as the filename.

**Dependencies**: Phase 2 (schemas must be updated first)

**Tasks**:

- [X] T011 [US1] Update uploadMediaAsset service to capture displayName from file.name in apps/clementine-app/src/domains/media-library/services/upload-media-asset.service.ts
- [X] T012 [US1] Update UploadMediaAssetResult interface to include displayName field in apps/clementine-app/src/domains/media-library/services/upload-media-asset.service.ts
- [X] T013 [US1] Include displayName in Firestore document creation in uploadMediaAsset service in apps/clementine-app/src/domains/media-library/services/upload-media-asset.service.ts
- [X] T014 [US1] Return displayName in uploadMediaAsset service result in apps/clementine-app/src/domains/media-library/services/upload-media-asset.service.ts
- [X] T015 [US1] Run type-check to verify useUploadMediaAsset hook return type includes displayName automatically via inference

**Success Criteria**:
- Upload service captures original filename as displayName
- Upload service returns MediaReference-compatible object with displayName
- TypeScript types include displayName (string, not nullable)
- Manual test: Upload "Company Logo.png", verify Firestore document has displayName field

**Acceptance Test**:
1. Upload file named "Company Logo.png"
2. Check Firestore: mediaAssets document should have `displayName: "Company Logo.png"`
3. Check Firebase Storage: file stored as `{nanoid}.png` (not "overlay-...")
4. Verify media library UI displays "Company Logo.png"

---

## Phase 4: User Story 2 - Storage Collision Prevention (P1)

**Story Goal**: Multiple users can upload files with identical names without conflicts. Storage filenames are unique while display names can be duplicated.

**Independent Test**: Upload two different files both named "logo.png" and verify both are stored with unique storage paths while both display "logo.png".

**Dependencies**: Phase 3 (upload flow must include displayName)

**Tasks**:

- [ ] T016 [US2] Write test to verify nanoid generates unique storage filenames for files with identical display names in apps/clementine-app/src/domains/media-library/utils/upload.utils.test.ts
- [ ] T017 [US2] Run manual test: upload two different files with same name, verify unique storage paths in Firebase console

**Success Criteria**:
- Two files with same display name get different storage filenames
- Zero collision errors occur
- Both files accessible via their unique storage paths

**Acceptance Test**:
1. Upload file "logo.png" (image A)
2. Upload different file "logo.png" (image B)
3. Check Firebase Storage: two files exist with different paths (e.g., "abc123.png", "def456.png")
4. Check Firestore: two documents with same displayName but different fileName and filePath
5. Both images render correctly when accessed via URL

---

## Phase 5: User Story 3 - Media Reference Integration (P2)

**Story Goal**: When media assets are referenced in projects (overlays, backgrounds), the references include display names for easy identification.

**Independent Test**: Upload file "Hero Image.png", set it as project background, verify project config shows "Hero Image.png".

**Dependencies**: Phase 3 (upload must return displayName in result)

**Tasks**:

- [X] T018 [P] [US3] Update useUploadAndUpdateBackground to destructure and return displayName in apps/clementine-app/src/domains/project-config/theme/hooks/useUploadAndUpdateBackground.ts
- [X] T019 [P] [US3] Update useUploadAndUpdateOverlays to destructure and pass displayName to updateOverlays mutation in apps/clementine-app/src/domains/project-config/settings/hooks/useUploadAndUpdateOverlays.ts
- [X] T020 [P] [US3] Search for other upload mutation usages and update to handle displayName: `cd apps/clementine-app && grep -r "uploadAsset.mutateAsync" src/`
- [X] T021 [US3] Fix import path in useRuntime hook to use @clementine/shared in apps/clementine-app/src/domains/experience/runtime/hooks/useRuntime.ts
- [X] T022 [US3] Fix import path in runtime.types to use @clementine/shared in apps/clementine-app/src/domains/experience/shared/types/runtime.types.ts
- [X] T023 [US3] Delete app-specific re-export file: apps/clementine-app/src/shared/theming/schemas/media-reference.schema.ts
- [X] T024 [US3] Remove re-export line from apps/clementine-app/src/shared/theming/schemas/index.ts
- [X] T025 [US3] Verify no remaining imports from @/shared/theming/schemas/media-reference with grep

**Success Criteria**:
- All consuming hooks updated to handle displayName
- Import paths use @clementine/shared directly
- App-specific re-export deleted
- Type checks pass with no errors

**Acceptance Test**:
1. Upload file "Summer Background.jpg"
2. Set as event overlay via project settings
3. Check project config document: overlay reference includes `displayName: "Summer Background.jpg"`
4. View settings UI: overlay selection displays "Summer Background.jpg"

---

## Phase 6: User Story 4 - Legacy Media Migration (P3)

**Story Goal**: Existing media assets without displayName field work correctly, displaying "Untitled" as default.

**Independent Test**: Load media library containing pre-existing assets and verify they display "Untitled" instead of causing errors.

**Dependencies**: Phase 3 (schemas must have .default('Untitled'))

**Tasks**:

- [ ] T026 [US4] Test legacy MediaAsset parsing: verify document without displayName gets "Untitled" after Zod parse
- [ ] T027 [US4] Test legacy MediaReference parsing: verify reference without displayName gets "Untitled" after Zod parse
- [ ] T028 [US4] Manual test: Load production Firestore data, verify legacy assets display "Untitled" in UI without errors

**Success Criteria**:
- Legacy assets parse correctly with Zod schemas
- Legacy assets display "Untitled" in media library UI
- No console errors or null pointer exceptions
- New uploads still show original filenames

**Acceptance Test**:
1. Find legacy media asset in Firestore (uploaded before this feature)
2. Load in media library UI
3. Verify displays "Untitled" (not error or empty)
4. Upload new file "New Photo.jpg"
5. Verify new file displays "New Photo.jpg"
6. Verify legacy asset still displays "Untitled"

---

## Phase 7: Validation & Polish

**Goal**: Ensure all changes are validated and production-ready

**Tasks**:

- [X] T029 Run full type check: `pnpm app:type-check` and `pnpm --filter @clementine/shared type-check`
- [X] T030 Run linting and formatting: `pnpm app:check`
- [X] T031 Run tests if any were written: `pnpm app:test`
- [ ] T032 Manual smoke test: Upload file with special characters (e.g., "Photo #1 - Final (2).jpg"), verify preserved
- [ ] T033 Manual smoke test: Upload file with Unicode characters (e.g., "照片.jpg"), verify preserved
- [ ] T034 Review applicable standards: standards/global/zod-validation.md and standards/backend/firestore.md
- [ ] T035 Final validation: Verify all acceptance tests from spec.md pass

**Success Criteria**:
- Zero TypeScript errors
- All linting checks pass
- All formatting checks pass
- All manual tests pass
- Standards compliance verified

---

## Dependencies & Execution Order

### Story Dependency Graph

```
Phase 1: Setup
    ↓
Phase 2: Foundational (schemas + utilities)
    ↓
    ├─→ Phase 3: US1 (upload flow) [P1] ← MVP DELIVERABLE
    │      ↓
    │      ├─→ Phase 4: US2 (collision prevention) [P1]
    │      │
    │      └─→ Phase 5: US3 (media references) [P2]
    │
    └─→ Phase 6: US4 (legacy migration) [P3] ← Can run in parallel with US2/US3

All phases → Phase 7: Validation & Polish
```

### Story Independence

- **US1 (P1)**: Fully independent after foundational phase. Can deploy alone as MVP.
- **US2 (P1)**: Depends on US1 (needs upload flow with displayName). Adds validation.
- **US3 (P2)**: Depends on US1 (needs upload to return displayName). Updates consuming code.
- **US4 (P3)**: Independent of other stories (only needs schemas). Can run in parallel with US2/US3.

### MVP Delivery

**Minimum Viable Product** = Phase 1 + Phase 2 + Phase 3 (US1)

This delivers:
- ✅ Users see original filenames after upload
- ✅ Storage filenames are unique (collision-free by design via nanoid)
- ✅ Backward compatible (legacy assets get "Untitled")

**Incremental delivery after MVP**:
- Sprint 2: Add US2 (collision validation tests)
- Sprint 3: Add US3 (update consuming code for references)
- Sprint 4: Add US4 (comprehensive legacy testing)

## Parallel Execution Opportunities

### Phase 2: Foundational
**Parallel Tasks** (T006, T007): Both schema updates can be done simultaneously (different files)

### Phase 5: US3
**Parallel Tasks** (T018, T019, T021, T022): All hook updates and import fixes can be done simultaneously (different files, no dependencies)

### Between Stories
**US4 can run in parallel with US2 and US3** - Legacy migration testing is independent

## Task Checklist Format Reference

All tasks follow this format:
- `- [ ] T###` - Task ID (sequential)
- `[P]` - Parallelizable marker (optional)
- `[US#]` - User Story label (required for story phases)
- Description with exact file path

Examples:
- `- [ ] T006 [P] Add displayName field to MediaAsset schema in packages/shared/src/schemas/media/media-asset.schema.ts`
- `- [ ] T011 [US1] Update uploadMediaAsset service to capture displayName from file.name in apps/clementine-app/src/domains/media-library/services/upload-media-asset.service.ts`

## File Changes Summary

**Files to Modify** (9 files):
1. `packages/shared/src/schemas/media/media-asset.schema.ts` - Add displayName field
2. `packages/shared/src/schemas/media/media-reference.schema.ts` - Add displayName field
3. `apps/clementine-app/src/domains/media-library/utils/upload.utils.ts` - Remove "overlay-" prefix
4. `apps/clementine-app/src/domains/media-library/services/upload-media-asset.service.ts` - Capture & return displayName
5. `apps/clementine-app/src/domains/project-config/theme/hooks/useUploadAndUpdateBackground.ts` - Handle displayName
6. `apps/clementine-app/src/domains/project-config/settings/hooks/useUploadAndUpdateOverlays.ts` - Handle displayName
7. `apps/clementine-app/src/domains/experience/runtime/hooks/useRuntime.ts` - Fix import
8. `apps/clementine-app/src/domains/experience/shared/types/runtime.types.ts` - Fix import
9. `apps/clementine-app/src/shared/theming/schemas/index.ts` - Remove re-export

**Files to Delete** (1 file):
1. `apps/clementine-app/src/shared/theming/schemas/media-reference.schema.ts` - Remove re-export

**Test Files to Create** (if writing tests):
1. `apps/clementine-app/src/domains/media-library/utils/upload.utils.test.ts` - Unit tests for generateFileName

## Success Metrics

From [spec.md](./spec.md) Success Criteria:

- **SC-001**: Users see exact original filename (100% preservation) ← Validated by US1 test
- **SC-002**: Zero storage collisions with duplicate names ← Validated by US2 test
- **SC-003**: Media references show human-readable filenames ← Validated by US3 test
- **SC-004**: New uploads include display names automatically ← Validated by US1 test
- **SC-005**: Legacy assets work with "Untitled" default ← Validated by US4 test
- **SC-006**: Upload performance unchanged ← Manual performance test

## Resources

- **Feature Specification**: [spec.md](./spec.md) - User stories and requirements
- **Implementation Plan**: [plan.md](./plan.md) - Technical context and architecture
- **Data Model**: [data-model.md](./data-model.md) - Schema definitions
- **Quickstart Guide**: [quickstart.md](./quickstart.md) - Step-by-step implementation
- **Research**: [research.md](./research.md) - Zod pattern decisions
- **Constitution**: `.specify/memory/constitution.md` - Development standards

## Notes

- **No UI changes**: This feature only updates backend schemas and services. UI automatically benefits from displayName field.
- **Backward compatible**: No database migration required. Zod `.default()` handles legacy data.
- **Type-safe**: Full TypeScript strict mode with Zod runtime validation.
- **Performance**: No impact - displayName is captured during upload (no extra queries).
