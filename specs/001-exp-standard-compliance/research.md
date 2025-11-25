# Research: Experiences Feature Standards Compliance

**Feature**: 001-exp-standard-compliance
**Date**: 2025-11-25
**Purpose**: Document current state analysis and migration strategy

## Current State Analysis

### File Count & Structure

| Folder | Current Files | Lines of Code | Status |
|--------|---------------|---------------|--------|
| `actions/` | 10 files | ~1,816 lines | Compliant (needs legacy.ts removal) |
| `components/` | 33 files | ~4,074 lines | Needs cleanup (duplicate, missing barrels) |
| `lib/` | 4 files | ~874 lines | Non-compliant (migrate & delete) |
| `hooks/` | 0 files | 0 lines | Empty folder (delete) |
| `index.ts` | 1 file | ~101 lines | Needs updates |
| **Total** | **38 files** | **~6,764 lines** | |

### Standards Compliance Score

| Standard | Current Score | Target | Gap |
|----------|---------------|--------|-----|
| Structure (feature-modules.md) | 6/10 | 10/10 | `lib/` folder, missing `types/` |
| Naming (feature-modules.md) | 7/10 | 10/10 | Files not using `[domain].[purpose].ts` |
| Export patterns (feature-modules.md) | 9/10 | 10/10 | Minor cleanup needed |
| Validation (validation.md) | 8/10 | 10/10 | Constants in wrong location |

## Migration Strategy

### Decision 1: File Move vs Copy-and-Delete

**Decision**: Use git mv for file moves to preserve git history.

**Rationale**: Git mv maintains file history which is valuable for understanding code evolution and debugging. Copy-and-delete would lose commit history.

**Alternatives Considered**:
- Copy-and-delete: Simpler but loses history
- Create new files from scratch: Not needed, existing code is correct

### Decision 2: Import Path Update Strategy

**Decision**: Update all imports in a single commit per migration phase.

**Rationale**: Incremental updates could leave the codebase in broken intermediate states. Batch updates per phase ensure each commit is buildable.

**Alternatives Considered**:
- File-by-file updates: Higher risk of broken builds
- Shim/re-export approach: Adds unnecessary complexity

### Decision 3: Handling Duplicate AITransformSettings

**Decision**: Delete `components/photo/AITransformSettings.tsx` and its test, update imports to use shared version.

**Rationale**: Analysis shows the photo-specific version (199 lines) has no photo-specific logic compared to shared version (202 lines). They are essentially identical.

**Alternatives Considered**:
- Keep both and differentiate: No current need for differentiation
- Merge manually: Shared version is already complete

### Decision 4: Empty hooks/ Folder

**Decision**: Delete the empty folder.

**Rationale**: No hooks currently exist. Per YAGNI, don't keep empty scaffolding. Can be recreated if hooks are needed later.

**Alternatives Considered**:
- Add placeholder hooks: Violates YAGNI, no current need
- Keep empty folder: Clutters structure with no value

### Decision 5: Barrel Export Naming

**Decision**: Use `index.ts` barrel exports in every folder with explicit re-exports.

**Rationale**: Standards require every folder to have an `index.ts`. Explicit re-exports make the public API clear.

**Pattern Example**:
```typescript
// schemas/index.ts
export * from './experiences.schemas';
```

## Import Dependency Analysis

### External Dependencies (files outside experiences feature)

| File | Current Import | New Import | Priority |
|------|----------------|------------|----------|
| `design/experiences/[experienceId]/page.tsx` | `@/features/experiences/lib/repository` | `@/features/experiences/repositories` | High |
| `design/experiences/layout.tsx` | `@/features/experiences` | No change | N/A |
| `design/experiences/create/page.tsx` | `@/features/experiences` | No change | N/A |
| `legacy-features/events/components/designer/DesignSidebar.tsx` | `@/features/experiences` | No change | N/A |

### Internal Dependencies (within experiences feature)

| File | Current Import | New Import |
|------|----------------|------------|
| `actions/photo-create.ts` | `../lib/schemas` | `../schemas` |
| `actions/photo-update.ts` | `../lib/schemas` | `../schemas` |
| `actions/gif-create.ts` | `../lib/schemas` | `../schemas` |
| `actions/gif-update.ts` | `../lib/schemas` | `../schemas` |
| `actions/photo-media.ts` | `../lib/schemas` | `../schemas` |
| `actions/legacy.ts` | `../lib/schemas` | DELETE FILE |
| `lib/repository.ts` | `./schemas` | `../schemas` (after move) |
| `lib/schemas.test.ts` | `./schemas` | `./experiences.schemas` (after move) |
| `index.ts` | `./lib/constants`, `./lib/schemas` | `./constants`, `./schemas` |

## File Migration Map

### Phase 1: Create New Folders & Move Files

```
CREATE: repositories/
  MOVE: lib/repository.ts → repositories/experiences.repository.ts
  CREATE: repositories/index.ts

CREATE: schemas/
  MOVE: lib/schemas.ts → schemas/experiences.schemas.ts
  MOVE: lib/schemas.test.ts → schemas/experiences.schemas.test.ts
  CREATE: schemas/index.ts

CREATE: types/
  CREATE: types/experiences.types.ts (extract from schemas)
  CREATE: types/index.ts

MOVE: lib/constants.ts → constants.ts
```

### Phase 2: Update Imports

```
UPDATE: actions/photo-create.ts
UPDATE: actions/photo-update.ts
UPDATE: actions/gif-create.ts
UPDATE: actions/gif-update.ts
UPDATE: actions/photo-media.ts
UPDATE: repositories/experiences.repository.ts
UPDATE: schemas/experiences.schemas.test.ts
UPDATE: index.ts
UPDATE: app/.../[experienceId]/page.tsx
```

### Phase 3: Cleanup

```
DELETE: lib/ (entire folder after verification)
DELETE: hooks/ (empty folder)
DELETE: actions/legacy.ts
DELETE: components/photo/AITransformSettings.tsx
DELETE: components/photo/AITransformSettings.test.tsx
```

### Phase 4: Add Missing Barrel Exports

```
CREATE: components/gif/index.ts
CREATE: components/photo/index.ts
CREATE: components/shared/index.ts (if missing)
UPDATE: components/index.ts (re-export from subfolders)
```

## Validation Compliance Analysis

### Schema Naming Convention Check

| Schema | Current Name | Standard (camelCase) | Status |
|--------|--------------|----------------------|--------|
| Photo Experience | `photoExperienceSchema` | `photoExperienceSchema` | ✅ Compliant |
| GIF Experience | `gifExperienceSchema` | `gifExperienceSchema` | ✅ Compliant |
| Experience (union) | `experienceSchema` | `experienceSchema` | ✅ Compliant |
| Create Photo | `createPhotoExperienceSchema` | `createPhotoExperienceSchema` | ✅ Compliant |
| Update Photo | `updatePhotoExperienceSchema` | `updatePhotoExperienceSchema` | ✅ Compliant |

### Firestore Optional Fields Check

Need to verify all optional fields use `.nullable().optional().default(null)` pattern. This will be checked during implementation.

### Constants Extraction Check

Current constants in `lib/constants.ts`:
- `AI_MODELS`: Array of AI model configurations
- `DEFAULT_AI_MODEL`: Default model string

Need to verify no magic numbers in schemas. This will be checked during implementation.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking imports | Medium | High | Run type-check after each phase |
| Missing barrel exports | Low | Medium | Verify all folders have index.ts |
| Test failures | Low | Medium | Run tests after each phase |
| Runtime behavior change | Very Low | High | No logic changes, only file moves |

## Success Criteria Verification

| Criterion | Verification Method |
|-----------|---------------------|
| SC-001: 30-second file discovery | Manual testing with folder navigation |
| SC-002: All tests pass | `pnpm test` |
| SC-003: Zero lint errors | `pnpm lint` |
| SC-004: Zero type errors | `pnpm type-check` |
| SC-005: Client import safety | Attempt import in client component |
| SC-006: File naming compliance | `ls -la` on feature directory |
| SC-007: No lib/ folder | `ls -d lib/` should fail |
| SC-008: No duplicate components | Single `AITransformSettings.tsx` in shared/ |
