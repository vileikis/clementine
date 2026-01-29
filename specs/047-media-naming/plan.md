# Implementation Plan: Preserve Original Media File Names

**Branch**: `047-media-naming` | **Date**: 2026-01-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/047-media-naming/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Update the media upload system to preserve original user-uploaded filenames for display purposes while maintaining unique storage identifiers. This involves:
1. Adding a `displayName` field to MediaAsset and MediaReference schemas
2. Removing the "overlay-" prefix from generated storage filenames
3. Updating the upload service to capture and return display names
4. Ensuring backward compatibility with legacy assets (default to "Untitled")
5. Cleaning up import paths to use shared package directly

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode, ES2022 target)
**Primary Dependencies**:
- Zod 4.1.12 (schema validation)
- nanoid (unique ID generation)
- Firebase SDK 12.5.0 (Firestore client, Storage)
- TanStack Query 5.66.5 (data fetching/mutations)

**Storage**: Firebase Firestore (document DB) + Firebase Storage (media files)
**Testing**: Vitest (unit tests), Testing Library (component tests)
**Target Platform**: Web (TanStack Start app) - Mobile-first responsive design
**Project Type**: Monorepo - `packages/shared/` (schemas) + `apps/clementine-app/` (frontend)
**Performance Goals**: Upload operations complete with same performance as before (no measurable degradation)
**Constraints**:
- Backward compatibility required (legacy assets without displayName must work)
- Zero storage collisions (100% collision prevention)
- File extension must be preserved in storage names
**Scale/Scope**:
- 2 schema files modified (MediaAsset, MediaReference)
- 1 utility function updated (generateFileName)
- 1 service updated (uploadMediaAsset)
- 2 import path fixes (useRuntime, runtime.types)
- 1 file removal (app-specific schema re-export)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Mobile-First Design
✅ **PASS** - No UI changes in this feature (backend schema/service updates only)
- Display name will be shown in existing media library UI (already mobile-optimized)

### Principle II: Clean Code & Simplicity
✅ **PASS** - Simplifies naming logic
- Removes hardcoded "overlay-" prefix (reduces complexity)
- Adds single field to schemas (minimal addition)
- Clear separation of concerns (storage vs display)

### Principle III: Type-Safe Development
✅ **PASS** - Full TypeScript strict mode
- Zod schemas enforce runtime validation
- MediaAsset and MediaReference schemas updated with typed displayName field
- No `any` types introduced

### Principle IV: Minimal Testing Strategy
✅ **PASS** - Pragmatic testing approach
- Unit tests for generateFileName utility (critical path)
- Integration test for upload service (critical user flow)
- Schema validation tests (Zod runtime checks)

### Principle V: Validation Gates
✅ **PASS** - Standard validation workflow
- Run `pnpm app:check` before commit (lint + format)
- Type-check with `pnpm app:type-check`
- Review applicable standards: `global/zod-validation.md`, `backend/firestore.md`

### Principle VI: Frontend Architecture
✅ **PASS** - Client-first pattern maintained
- Upload service uses Firebase client SDK (Storage, Firestore)
- No server-side rendering changes
- TanStack Query mutation pattern preserved

### Principle VII: Backend & Firebase
✅ **PASS** - Firebase client SDK for uploads
- Firestore client SDK for document creation
- Storage client SDK for file upload
- Public URLs stored in Firestore (existing pattern)

### Principle VIII: Project Structure
✅ **PASS** - Follows vertical slice architecture
- Shared schemas in `packages/shared/src/schemas/media/`
- Upload logic in `apps/clementine-app/src/domains/media-library/`
- Proper barrel exports maintained

**Constitution Check Result**: ✅ ALL GATES PASS - No violations, no complexity justification needed

---

**Post-Design Re-evaluation** (after Phase 1):

All constitution gates still pass after design phase:

- ✅ **Mobile-First**: No UI changes in this feature
- ✅ **Clean Code**: Implementation simplifies logic (removes prefix, adds single field)
- ✅ **Type-Safe**: Full Zod validation, strict TypeScript, no `any` types
- ✅ **Testing**: Unit tests for utilities, integration tests for service
- ✅ **Validation Gates**: Standard workflow (lint, format, type-check)
- ✅ **Frontend Architecture**: Client-first pattern maintained
- ✅ **Backend & Firebase**: Uses client SDK appropriately
- ✅ **Project Structure**: Follows vertical slice architecture

No new complexity introduced during design phase.

## Project Structure

### Documentation (this feature)

```text
specs/047-media-naming/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command) - N/A for this feature
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Monorepo structure
packages/shared/
└── src/
    └── schemas/
        └── media/
            ├── media-asset.schema.ts       # UPDATE: Add displayName field
            ├── media-reference.schema.ts   # UPDATE: Add displayName field
            └── index.ts                    # Exports schemas

apps/clementine-app/
└── src/
    ├── domains/
    │   ├── media-library/
    │   │   ├── utils/
    │   │   │   └── upload.utils.ts        # UPDATE: Remove "overlay-" prefix in generateFileName
    │   │   ├── services/
    │   │   │   └── upload-media-asset.service.ts  # UPDATE: Capture displayName, return MediaReference
    │   │   └── hooks/
    │   │       └── useUploadMediaAsset.ts # UPDATE: Return type includes displayName
    │   └── experience/
    │       ├── runtime/
    │       │   └── hooks/
    │       │       └── useRuntime.ts      # UPDATE: Import from @clementine/shared
    │       └── shared/
    │           └── types/
    │               └── runtime.types.ts   # UPDATE: Import from @clementine/shared
    └── shared/
        └── theming/
            └── schemas/
                └── media-reference.schema.ts  # DELETE: Remove app-specific re-export
```

**Structure Decision**: This feature follows the established monorepo pattern with shared schemas in `packages/shared/` and app-specific logic in `apps/clementine-app/`. Changes are localized to media-related modules following vertical slice architecture. No new directories needed - all modifications are within existing structure.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

N/A - All constitution checks pass. No complexity violations.

---

## Phase Summary

### Phase 0: Research ✅

**Completed**: Research on Zod schema patterns for displayName field
- **Decision**: Use `.default('Untitled')` pattern
- **Rationale**: Matches existing Clementine patterns, provides better DX, ensures backward compatibility
- **Output**: [research.md](./research.md)

### Phase 1: Design ✅

**Completed**: Data model design and implementation guide
- **Data Model**: MediaAsset and MediaReference schemas updated with displayName field
- **Service Changes**: Upload service captures and returns displayName
- **Utility Changes**: Filename generation simplified (remove "overlay-" prefix)
- **Outputs**:
  - [data-model.md](./data-model.md) - Complete entity definitions and relationships
  - [quickstart.md](./quickstart.md) - Step-by-step implementation guide

### Phase 2: Tasks (Next Step)

**Not yet started** - Run `/speckit.tasks` to generate task breakdown

This plan document provides the foundation for task generation.

---

## Implementation Readiness

**Status**: ✅ Ready for `/speckit.tasks`

All planning phases complete:
- ✅ Technical context defined
- ✅ Constitution gates verified (all pass)
- ✅ Research completed (Zod pattern decided)
- ✅ Data model documented
- ✅ Implementation guide created (quickstart.md)
- ✅ Agent context updated

**Next Command**: `/speckit.tasks` to generate detailed task breakdown
