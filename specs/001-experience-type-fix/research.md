# Research: Experience Type System Consolidation

**Branch**: `001-experience-type-fix`
**Date**: 2025-11-20
**Phase**: Phase 0 - Research & Discovery

## Overview

This document captures research findings for consolidating Experience type definitions by removing legacy types and migration code, establishing `schemas.ts` as the single source of truth.

## R1: Audit Current Type Usage

**Goal**: Identify all files importing from `experience.types.ts` vs `schemas.ts` to ensure complete migration coverage.

### Findings

#### Files Importing from `types/experience.types.ts` (Legacy)

Total: **10 files** using legacy types

1. **`web/src/features/experiences/index.ts:59`**
   - Exports: `Experience`, `ExperienceType`, `PreviewType`, `AspectRatio`, `ExperienceItem`, `SurveyStep`, `SurveyStepType`
   - Impact: Barrel export re-exports legacy types to public API
   - Action: Update to export from `schemas.ts`

2. **`web/src/features/experiences/lib/repository.ts:4`**
   - Import: `Experience` type
   - Impact: Repository functions return legacy `Experience` type
   - Action: Change to `PhotoExperience` from `schemas.ts`, add validation

3. **`web/src/features/experiences/actions/legacy.ts:19`**
   - Import: `ExperienceType`, `PreviewType`, `AspectRatio`
   - Impact: Already marked for deprecation
   - Action: Add prominent deprecation notice, plan future removal

4. **`web/src/features/experiences/components/shared/ExperiencesList.tsx:6`**
   - Import: `Experience` type
   - Impact: Component props type
   - Action: Update to `PhotoExperience` from `schemas.ts`

5. **`web/src/features/experiences/components/shared/ExperienceEditor.tsx:16`**
   - Import: `Experience`, `PreviewType`, `AspectRatio`
   - Also imports: `PhotoExperience` from `schemas.ts` (dual-type handling)
   - Impact: Component has type guards checking for new vs legacy schema
   - Action: Remove dual-type handling, use only `PhotoExperience`

6. **`web/src/features/experiences/components/shared/ExperienceEditorWrapper.tsx:15`**
   - Import: `Experience` type
   - Impact: Component props type
   - Action: Update to `PhotoExperience` from `schemas.ts`

7. **`web/src/features/experiences/components/shared/ExperienceTypeSelector.tsx:11`**
   - Import: `ExperienceType`
   - Impact: Type selector enum
   - Action: Update to import from `schemas.ts`

8. **`web/src/features/experiences/components/shared/PreviewMediaUpload.tsx:8`**
   - Import: `PreviewType`
   - Impact: Preview type validation
   - Action: Update to import from `schemas.ts`

9. **`web/src/features/experiences/components/photo/AITransformSettings.tsx:10`**
   - Import: `AspectRatio`
   - Impact: AI settings aspect ratio type
   - Action: Update to import from `schemas.ts`

10. **`web/src/features/experiences/components/shared/ExperienceEditor.test.tsx:3`**
    - Import: `Experience` type
    - Impact: Test file type
    - Action: Update to `PhotoExperience` from `schemas.ts`

#### Files Importing from `lib/schemas.ts` (New)

Total: **9 files** already using new schema types

1. `web/src/features/experiences/index.ts:81` - Exports schemas to public API
2. `web/src/features/experiences/lib/migration.ts:8` - Migration utilities (to be deleted)
3. `web/src/features/experiences/lib/migration.test.ts:6` - Migration tests (to be deleted)
4. `web/src/features/experiences/lib/schemas.test.ts:15` - Schema validation tests (keep)
5. `web/src/features/experiences/actions/photo-create.ts:24` - Uses new schema
6. `web/src/features/experiences/actions/photo-update.ts:27` - Uses new schema with migration logic
7. `web/src/features/experiences/actions/photo-media.ts:18` - Uses `PreviewType` from schemas
8. `web/src/features/experiences/components/shared/CreateExperienceForm.tsx:27` - Uses new schema
9. `web/src/features/experiences/components/shared/ExperienceEditor.tsx:17` - Dual imports (legacy + new)

#### Indirect Imports Through Barrel Export

The `index.ts` barrel export (line 51-59) re-exports legacy types to the public API. This means any file importing from `@/features/experiences` gets legacy types. After consolidation, this barrel export must be updated to export types from `schemas.ts` instead.

### Decision

**Complete migration scope**: 10 files need type import updates + 1 barrel export update = **11 total files** to modify.

**Priority order**:
1. Delete migration files first (remove dependency on dual-type system)
2. Update barrel export (`index.ts`) to export from schemas
3. Update repository to use and validate `PhotoExperience`
4. Update all component imports
5. Verify with type-check

## R2: Verify Firestore Data Structure

**Goal**: Confirm current Firestore Experience documents structure and validate clean slate approach.

### Findings

#### Current Schema Structure

From `lib/schemas.ts`, the new **PhotoExperience** schema structure is:

```typescript
{
  // Base fields
  id: string,
  eventId: string,
  type: "photo",
  label: string,
  enabled: boolean,
  hidden: boolean,

  // Nested config object
  config: {
    countdown: number,           // 0 = disabled, 1-10 = seconds
    overlayFramePath: string | null
  },

  // Nested aiConfig object
  aiConfig: {
    enabled: boolean,
    model: string | null,
    prompt: string | null,
    referenceImagePaths: string[] | null,
    aspectRatio: "1:1" | "3:4" | "4:5" | "9:16" | "16:9"
  },

  // Optional preview
  previewPath?: string,
  previewType?: "image" | "gif" | "video",

  // Audit
  createdAt: number,
  updatedAt: number
}
```

#### Legacy Structure (from `repository.ts` and legacy actions)

The legacy structure was flat with fields like:
- `countdownEnabled`, `countdownSeconds` (now: `config.countdown`)
- `aiEnabled`, `aiModel`, `aiPrompt` (now: nested in `aiConfig`)
- `allowCamera`, `allowLibrary` (no longer used)

#### Migration Safety Assessment

**Assumption A-002 from spec**: "All existing Firestore Experience data can be safely deleted and recreated"

**Validation**:
- Project is in development stage (no production users)
- Clean slate approach is documented in spec
- No backward compatibility required

**Recommendation**: Safe to proceed with data wipe approach. Before implementation:
1. Document any test data structure for easy recreation
2. Verify no critical event configurations exist in Firestore
3. Clear all `/events/{eventId}/experiences` subcollections

### Decision

**Clean slate approach confirmed**: Wipe all Experience documents before code migration. No migration utilities needed in production code.

## R3: Identify Repository Validation Patterns

**Goal**: Determine best practices for adding Zod validation to repository read operations.

### Findings

#### Current Validation Patterns in Codebase

Analyzed existing repositories to identify validation patterns:

1. **Company Repository** (`features/companies/repositories/companies.ts:78, 96`)
   ```typescript
   return companySchema.parse({ id: doc.id, ...data });
   ```
   - Validates at repository layer when reading documents
   - Throws Zod error if validation fails
   - Ensures type safety before returning to callers

2. **Event Repository** (`features/events/repositories/events.ts:55`)
   ```typescript
   return eventSchema.parse({ id: doc.id, ...doc.data() });
   ```
   - Same pattern: validate on read
   - Applied to both single document reads and list operations

3. **Session Repository** (`features/sessions/lib/repository.ts:80`)
   ```typescript
   return sessionSchema.parse({ id: doc.id, ...doc.data() });
   ```
   - Consistent pattern across all repositories

4. **Server Actions** (`features/events/actions/events.ts:56`)
   ```typescript
   const validated = createEventInput.parse(input);
   ```
   - Validates input at action entry point
   - Separate validation for inputs vs data model

#### Validation Strategy

**Where to validate**:
- **Repository layer**: Validate data on read using `photoExperienceSchema.parse()`
- **Action layer**: Already validates inputs using `createPhotoExperienceSchema.parse()` and `updatePhotoExperienceSchema.parse()`

**Error handling**:
- Zod validation throws `ZodError` with detailed error messages
- Repository functions should let errors propagate (caller handles)
- Server Actions catch errors and return `ActionResponse<T>` with error details

**Performance impact**:
- Zod parsing is fast (~1-5ms per document for typical schemas)
- Acceptable overhead for type safety guarantee
- Only applies to repository reads, not writes (writes validated before save)

#### Example Implementation Pattern

For Experience repository (based on existing patterns):

```typescript
// Before (no validation)
export async function getExperience(
  eventId: string,
  experienceId: string
): Promise<Experience | null> {
  const doc = await db
    .collection("events")
    .doc(eventId)
    .collection("experiences")
    .doc(experienceId)
    .get();

  if (!doc.exists) {
    return null;
  }

  return {
    id: doc.id,
    ...doc.data(),
  } as Experience;  // ❌ Type assertion, no validation
}

// After (with validation)
export async function getExperience(
  eventId: string,
  experienceId: string
): Promise<PhotoExperience | null> {
  const doc = await db
    .collection("events")
    .doc(eventId)
    .collection("experiences")
    .doc(experienceId)
    .get();

  if (!doc.exists) {
    return null;
  }

  // ✅ Validate with Zod schema
  return photoExperienceSchema.parse({
    id: doc.id,
    ...doc.data(),
  });
}
```

### Decision

**Validation strategy**:
1. Add `photoExperienceSchema.parse()` to repository reads (`getExperience`, `listExperiences`)
2. Replace legacy `Experience` type with `PhotoExperience` in return types
3. Let Zod errors propagate to callers (Server Actions handle via try-catch)
4. Performance impact negligible (<10ms per document)

**Error handling**:
- Repository: Throw Zod errors (with detailed validation messages)
- Server Actions: Catch errors and return `ActionResponse` with user-friendly error
- Logs: Zod errors include field-level details for debugging

## Summary & Recommendations

### Migration Checklist

1. **Pre-Migration**
   - [ ] Document current test data (if any exists in Firestore)
   - [ ] Verify no production users or critical data
   - [ ] Review all 11 files identified in R1 findings

2. **Code Migration Order**
   - [ ] Delete `lib/migration.ts` and `lib/migration.test.ts`
   - [ ] Delete `types/experience.types.ts`
   - [ ] Update barrel export (`index.ts`) to export from `schemas.ts`
   - [ ] Update repository to use `PhotoExperience` and add validation
   - [ ] Update Server Actions to remove migration logic
   - [ ] Update all component imports (7 components + 1 test)
   - [ ] Run `pnpm type-check` and fix errors
   - [ ] Manual test CRUD operations

3. **Data Migration**
   - [ ] Wipe all `/events/{eventId}/experiences` subcollections (if any exist)
   - [ ] Verify Firestore is empty of Experience documents
   - [ ] Test creating new Experience with new schema

4. **Validation**
   - [ ] TypeScript type-check passes with zero errors
   - [ ] ESLint passes with zero warnings
   - [ ] Codebase search for `experience.types.ts` returns zero results
   - [ ] Codebase search for `migration.ts` returns zero results
   - [ ] Manual test: Create/Read/Update/Delete Experience
   - [ ] Firestore console: Verify document structure matches new schema

### Risk Assessment

**Risks**: Low
- No production data to migrate
- Clean slate approach eliminates backward compatibility concerns
- Validation ensures runtime type safety
- Type-check ensures compile-time type safety

**Mitigation**:
- Keep feature branch separate until validation complete
- Document rollback plan (git revert + Firestore restore if needed)
- Test all CRUD operations before merging

### Next Steps

Proceed to **Phase 1: Design & Contracts** to document:
1. PhotoExperience data model (from `schemas.ts`)
2. Repository contract changes (return types)
3. Migration quickstart guide

## Alternatives Considered

### Alternative 1: Gradual Migration with Backward Compatibility

**Description**: Keep both legacy and new types, add runtime detection and conversion.

**Rejected because**:
- Adds unnecessary complexity (violates Constitution Principle II: Clean Code & Simplicity)
- No production data exists to migrate
- Dual-type handling increases cognitive load and maintenance burden
- Clean slate is simpler, faster, and safer in development stage

### Alternative 2: Keep Migration Code for Future Use

**Description**: Retain `migration.ts` as reference for future migrations.

**Rejected because**:
- YAGNI principle (Constitution Principle II) - don't build for hypothetical future needs
- Git history preserves migration code if needed later
- Migration patterns are well-documented in this research file
- Keeping unused code adds confusion ("Is this still used?")

### Alternative 3: Validate at Action Layer Only

**Description**: Skip repository validation, only validate in Server Actions.

**Rejected because**:
- Violates "Defense in Depth" principle
- Repository is lower layer and should enforce data integrity
- Existing pattern in codebase validates at repository layer (Company, Event, Session repos)
- Consistency with established patterns is important (Constitution: Technical Standards)
