# Implementation Plan: Media Assets Shared Schema

**Branch**: `040-media-assets-shared` | **Date**: 2026-01-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/040-media-assets-shared/spec.md`

## Summary

Centralize media assets schemas in `@clementine/shared` package and unify the 4 duplicated media reference patterns (`mediaReferenceSchema`, `overlayReferenceSchema`, `experienceMediaSchema`, `experienceMediaAssetSchema`) into a single source of truth. Add `filePath` field (nullable) to enable direct storage access in cloud functions. Refactor app and functions to import from shared package. Extract upload logic from React hook into reusable service.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode, ES2020 target)
**Primary Dependencies**: Zod 4.1.12, Firebase SDK 12.x (client), Firebase Admin SDK 13.x (functions)
**Storage**: Firebase Firestore (media assets subcollection), Firebase Storage (file storage)
**Testing**: Vitest (shared package, app), Jest (functions)
**Target Platform**: Web (TanStack Start app), Node.js (Firebase Cloud Functions)
**Project Type**: Monorepo (pnpm workspaces)
**Performance Goals**: Zero-downtime migration, backward compatible with existing documents
**Constraints**: No data migration required, existing documents must parse successfully
**Scale/Scope**: 3 workspaces affected (packages/shared, apps/clementine-app, functions)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | N/A | Schema-only changes, no UI |
| II. Clean Code & Simplicity | ✅ PASS | Consolidating 4 duplicates into 1 reduces complexity |
| III. Type-Safe Development | ✅ PASS | Zod schemas with strict TypeScript |
| IV. Minimal Testing Strategy | ✅ PASS | Unit tests for schema validation |
| V. Validation Gates | ✅ PASS | Standard validation workflow applies |
| VI. Frontend Architecture | ✅ PASS | Client-first pattern maintained |
| VII. Backend & Firebase | ✅ PASS | Follows existing Firestore patterns |
| VIII. Project Structure | ✅ PASS | Domain-driven schema organization |

**Gate Result**: ✅ PASSED - No violations

### Post-Design Re-Check

| Principle | Status | Notes |
|-----------|--------|-------|
| II. Clean Code & Simplicity | ✅ PASS | Design consolidates duplicates, follows DRY |
| III. Type-Safe Development | ✅ PASS | All schemas use Zod with strict TypeScript |
| VII. Backend & Firebase | ✅ PASS | looseObject pattern, nullable defaults |
| VIII. Project Structure | ✅ PASS | New media/ domain follows existing patterns |

**Post-Design Gate Result**: ✅ PASSED

## Project Structure

### Documentation (this feature)

```text
specs/040-media-assets-shared/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # N/A (no API endpoints)
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
packages/shared/src/schemas/
├── index.ts                         # Add media domain export
└── media/                           # NEW: Media domain
    ├── index.ts                     # Barrel exports
    ├── media-reference.schema.ts    # Unified media reference (moved from theme/)
    ├── media-asset.schema.ts        # Full MediaAsset document schema
    ├── image-mime-type.schema.ts    # MIME type enum
    ├── media-asset-type.schema.ts   # Asset type enum (overlay, logo, other)
    └── media-asset.schema.test.ts   # Validation tests

packages/shared/src/schemas/theme/
├── media-reference.schema.ts        # DELETE (moved to media/)
└── index.ts                         # Update: re-export from media/

packages/shared/src/schemas/event/
└── project-event-config.schema.ts   # Refactor: use mediaReferenceSchema

packages/shared/src/schemas/experience/
├── experience.schema.ts             # Refactor: use mediaReferenceSchema
└── steps/
    └── info.schema.ts               # Refactor: use mediaReferenceSchema

apps/clementine-app/src/domains/media-library/
├── schemas/                         # DELETE (moved to shared)
│   ├── media-asset.schema.ts
│   └── image-mime-type.schema.ts
├── services/                        # NEW
│   └── upload-media-asset.service.ts
└── hooks/
    └── useUploadMediaAsset.ts       # Refactor: use service

functions/src/
└── (various files importing media schemas) # Update imports
```

**Structure Decision**: Following existing domain-driven schema organization in `packages/shared/`. Creating new `media/` domain folder. Refactoring existing schemas to import from central location.

## Complexity Tracking

> No violations - feature reduces complexity by consolidating duplicates.

## Files to Modify

### packages/shared/ (Schema Centralization)

| File | Action | Description |
|------|--------|-------------|
| `src/schemas/media/index.ts` | CREATE | Barrel exports for media domain |
| `src/schemas/media/image-mime-type.schema.ts` | CREATE | MIME type enum (from app) |
| `src/schemas/media/media-asset-type.schema.ts` | CREATE | Asset type enum |
| `src/schemas/media/media-reference.schema.ts` | CREATE | Unified reference with filePath |
| `src/schemas/media/media-asset.schema.ts` | CREATE | Full document schema (from app) |
| `src/schemas/media/media-asset.schema.test.ts` | CREATE | Validation tests |
| `src/schemas/index.ts` | MODIFY | Add media domain export |
| `src/schemas/theme/index.ts` | MODIFY | Re-export from media/ for backward compat |
| `src/schemas/theme/media-reference.schema.ts` | DELETE | Moved to media/ |
| `src/schemas/event/project-event-config.schema.ts` | MODIFY | Use unified mediaReferenceSchema |
| `src/schemas/experience/experience.schema.ts` | MODIFY | Use unified mediaReferenceSchema |
| `src/schemas/experience/steps/info.schema.ts` | MODIFY | Use unified mediaReferenceSchema |
| `README.md` | MODIFY | Add Media domain documentation |

### apps/clementine-app/ (App Refactoring)

| File | Action | Description |
|------|--------|-------------|
| `src/domains/media-library/schemas/media-asset.schema.ts` | DELETE | Moved to shared |
| `src/domains/media-library/schemas/image-mime-type.schema.ts` | DELETE | Moved to shared |
| `src/domains/media-library/schemas/index.ts` | MODIFY | Re-export from shared |
| `src/domains/media-library/services/upload-media-asset.service.ts` | CREATE | Extracted upload logic |
| `src/domains/media-library/hooks/useUploadMediaAsset.ts` | MODIFY | Use service |
| Various components using MediaAsset types | MODIFY | Update imports |

### functions/ (Cloud Functions Refactoring)

| File | Action | Description |
|------|--------|-------------|
| Files importing media types | MODIFY | Update to import from @clementine/shared |

## Migration Strategy

1. **Create new schemas** in `packages/shared/src/schemas/media/`
2. **Update barrel exports** to expose new schemas
3. **Refactor existing shared schemas** to import from media/
4. **Update theme/ exports** to re-export for backward compatibility
5. **Delete app-level schemas** and update imports
6. **Extract upload service** from hook
7. **Update cloud functions** imports
8. **Run full validation** (lint, type-check, tests)

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Breaking existing imports | Re-export from theme/ for backward compat |
| Breaking existing Firestore docs | filePath nullable with default null |
| Type mismatches across workspaces | Single source of truth in shared |
| Build failures | Incremental changes with validation at each step |
