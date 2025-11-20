# Quickstart: Experience Type Migration

**Branch**: `001-experience-type-fix`
**Date**: 2025-11-20
**Phase**: Phase 1 - Design & Contracts

## Overview

This guide provides step-by-step instructions for consolidating Experience type definitions by removing legacy types and migration code. Follow these steps in order to ensure a clean, safe migration.

## Prerequisites

- [ ] On feature branch `001-experience-type-fix`
- [ ] Read `research.md`, `data-model.md`, and `contracts/repository-contracts.md`
- [ ] Confirmed no production users or critical data (development stage)
- [ ] TypeScript type-check currently passing (`pnpm type-check`)

## Migration Strategy

**Approach**: Clean slate - wipe Firestore data and remove all migration code.

**Why this works**:
- No production users or real data
- Can delete and recreate all Firestore documents
- Eliminates complexity from dual-type system
- One source of truth for types

## Phase 1: Preparation

### Step 1.1: Document Current State (Optional)

If you have test data you want to recreate later:

```bash
# Export current event/experience structure for reference
# (Manual: Screenshot Firestore console or note down test data)
```

**Purpose**: Create reference for rebuilding test data after migration.

**Skip if**: No meaningful test data exists.

### Step 1.2: Verify Clean Slate Approach

```bash
# Check current Experience documents in Firestore
# (Manual: Open Firebase Console → Firestore → events collection → experiences subcollection)
```

**Verify**:
- [ ] No production events exist
- [ ] All data is test/development data
- [ ] Safe to wipe all Experience documents

## Phase 2: Remove Migration Code

### Step 2.1: Delete Migration Files

```bash
cd /Users/iggyvileikis/Projects/@attempt-n2/clementine

# Delete migration utilities
rm web/src/features/experiences/lib/migration.ts
rm web/src/features/experiences/lib/migration.test.ts
```

**Verify**: Files no longer exist

```bash
ls web/src/features/experiences/lib/
# Should NOT show: migration.ts, migration.test.ts
```

### Step 2.2: Delete Legacy Types File

```bash
# Delete legacy Experience type definition
rm web/src/features/experiences/types/experience.types.ts
```

**Verify**: File no longer exists

```bash
ls web/src/features/experiences/types/
# Should show empty directory (or remove directory if empty)
```

**Note**: This will cause TypeScript errors in files importing from `experience.types.ts`. This is expected - we'll fix them in Phase 3.

## Phase 3: Update Repository

### Step 3.1: Update Repository Imports

**File**: `web/src/features/experiences/lib/repository.ts`

**Change line 4** (import statement):

```diff
- import type { Experience } from "../types/experience.types";
+ import { photoExperienceSchema, type PhotoExperience } from "./schemas";
```

### Step 3.2: Update `createExperience` Function

**File**: `web/src/features/experiences/lib/repository.ts`

**Update function signature and implementation** (lines 10-57):

```typescript
export async function createExperience(
  eventId: string,
  data: {
    label: string;
    type: "photo";  // Literal type
    enabled: boolean;
  }
): Promise<string> {
  const experienceRef = db
    .collection("events")
    .doc(eventId)
    .collection("experiences")
    .doc();

  const now = Date.now();

  const experience = {
    id: experienceRef.id,
    eventId,
    label: data.label,
    type: "photo",
    enabled: data.enabled,
    hidden: false,

    // Nested config object
    config: {
      countdown: 3,
      overlayFramePath: null,
    },

    // Nested aiConfig object
    aiConfig: {
      enabled: false,
      model: null,
      prompt: null,
      referenceImagePaths: null,
      aspectRatio: "1:1",
    },

    createdAt: now,
    updatedAt: now,
  };

  await experienceRef.set(experience);

  // Increment experiencesCount on parent event
  await db
    .collection("events")
    .doc(eventId)
    .update({
      experiencesCount: FieldValue.increment(1),
      updatedAt: now,
    });

  return experienceRef.id;
}
```

### Step 3.3: Update `updateExperience` Function

**File**: `web/src/features/experiences/lib/repository.ts`

**Update parameter type** (line 65):

```diff
  export async function updateExperience(
    eventId: string,
    experienceId: string,
-   data: Partial<Experience>
+   data: Partial<PhotoExperience>
  ): Promise<void>
```

### Step 3.4: Add Validation to `getExperience` Function

**File**: `web/src/features/experiences/lib/repository.ts`

**Update return type and add validation** (lines 114-133):

```diff
  export async function getExperience(
    eventId: string,
    experienceId: string
- ): Promise<Experience | null> {
+ ): Promise<PhotoExperience | null> {
    const doc = await db
      .collection("events")
      .doc(eventId)
      .collection("experiences")
      .doc(experienceId)
      .get();

    if (!doc.exists) {
      return null;
    }

-   return {
+   return photoExperienceSchema.parse({
      id: doc.id,
      ...doc.data(),
-   } as Experience;
+   });
  }
```

### Step 3.5: Add Validation to `listExperiences` Function

**File**: `web/src/features/experiences/lib/repository.ts`

**Update return type and add validation** (lines 138-150):

```diff
- export async function listExperiences(eventId: string): Promise<Experience[]> {
+ export async function listExperiences(eventId: string): Promise<PhotoExperience[]> {
    const snapshot = await db
      .collection("events")
      .doc(eventId)
      .collection("experiences")
      .orderBy("createdAt", "asc")
      .get();

-   return snapshot.docs.map((doc) => ({
+   return snapshot.docs.map((doc) =>
+     photoExperienceSchema.parse({
        id: doc.id,
        ...doc.data(),
-     })) as Experience[];
+     })
+   );
  }
```

## Phase 4: Update Server Actions

### Step 4.1: Simplify `photo-update.ts`

**File**: `web/src/features/experiences/actions/photo-update.ts`

**Remove migration logic** (around lines 82-93, 125-128):

1. Find and remove the migration check:
```typescript
// ❌ REMOVE THIS BLOCK
// Migrate legacy flat structure to new nested structure
if (!hasNewSchema) {
  const migrated = migrateToPhotoExperience(existing);
  // ...
}
```

2. Find and remove `stripLegacyFields` call:
```typescript
// ❌ REMOVE THIS LINE
const cleanedData = stripLegacyFields(updateData);
```

3. Use `updateData` directly without stripping fields

**Result**: Action should validate input, merge with existing, and update directly without migration logic.

### Step 4.2: Review `photo-create.ts`

**File**: `web/src/features/experiences/actions/photo-create.ts`

**Verify**: Already uses new schema structure (no changes needed).

Check that it calls `createExperience` with correct signature:
```typescript
const experienceId = await createExperience(eventId, {
  label: validated.label,
  type: "photo",
  enabled: true,
});
```

### Step 4.3: Mark `legacy.ts` as Deprecated

**File**: `web/src/features/experiences/actions/legacy.ts`

**Add deprecation notice at top of file** (after imports):

```typescript
/**
 * @deprecated This file contains legacy Experience type handling and is
 * scheduled for removal. Use photo-create.ts and photo-update.ts instead.
 *
 * DO NOT use these functions in new code. They are maintained only for
 * backward compatibility during migration period.
 *
 * Removal planned: After Experience type consolidation is complete.
 */
```

## Phase 5: Update UI Components

### Step 5.1: Update Barrel Export

**File**: `web/src/features/experiences/index.ts`

**Update type exports** (lines 51-59):

```diff
  // ============================================================================
  // Types (compile-time only)
  // ============================================================================
  export type {
-   Experience,
+   PhotoExperience,
    ExperienceType,
    PreviewType,
    AspectRatio,
-   ExperienceItem,
-   SurveyStep,
-   SurveyStepType,
- } from "./types/experience.types";
+ } from "./lib/schemas";
```

### Step 5.2: Update Component Imports

Update imports in each of these files:

**File 1**: `web/src/features/experiences/components/shared/ExperiencesList.tsx`

```diff
- import type { Experience } from "../../types/experience.types";
+ import type { PhotoExperience } from "../../lib/schemas";

  // Update component props
- experiences: Experience[]
+ experiences: PhotoExperience[]
```

**File 2**: `web/src/features/experiences/components/shared/ExperienceEditor.tsx`

```diff
- import type { Experience, PreviewType, AspectRatio } from "../../types/experience.types";
- import type { PhotoExperience } from "../../lib/schemas";
+ import type { PhotoExperience, PreviewType, AspectRatio } from "../../lib/schemas";

  // Update component props
- experience: Experience | PhotoExperience
+ experience: PhotoExperience
```

**Remove type guard** (lines 49-51):
```diff
- const hasNewSchema =
-   "config" in experience && typeof experience.config === "object";
```

**Simplify state initialization** (lines 54-90):
```typescript
// ✅ AFTER: Simple initialization (no fallbacks)
const [label, setLabel] = useState(experience.label);
const [enabled, setEnabled] = useState(experience.enabled);
const [countdown, setCountdown] = useState(experience.config.countdown);
const [aiEnabled, setAiEnabled] = useState(experience.aiConfig.enabled);
// ... etc (no conditional logic)
```

**File 3**: `web/src/features/experiences/components/shared/ExperienceEditorWrapper.tsx`

```diff
- import type { Experience } from "../../types/experience.types";
+ import type { PhotoExperience } from "../../lib/schemas";

  // Update component props
- experience: Experience
+ experience: PhotoExperience
```

**File 4**: `web/src/features/experiences/components/shared/ExperienceTypeSelector.tsx`

```diff
- import type { ExperienceType } from "../../types/experience.types";
+ import type { ExperienceType } from "../../lib/schemas";
```

**File 5**: `web/src/features/experiences/components/shared/PreviewMediaUpload.tsx`

```diff
- import type { PreviewType } from "../../types/experience.types";
+ import type { PreviewType } from "../../lib/schemas";
```

**File 6**: `web/src/features/experiences/components/photo/AITransformSettings.tsx`

```diff
- import type { AspectRatio } from "../../types/experience.types";
+ import type { AspectRatio } from "../../lib/schemas";
```

**File 7**: `web/src/features/experiences/components/shared/ExperienceEditor.test.tsx`

```diff
- import type { Experience } from "../../types/experience.types";
+ import type { PhotoExperience } from "../../lib/schemas";

  // Update test data to use new schema structure
```

## Phase 6: Validation

### Step 6.1: TypeScript Type Check

```bash
cd /Users/iggyvileikis/Projects/@attempt-n2/clementine
pnpm type-check
```

**Expected**: Zero TypeScript errors

**If errors occur**:
1. Review error messages for remaining `experience.types.ts` imports
2. Check for type mismatches (flat vs nested structure)
3. Fix any missed files from Phase 5

### Step 6.2: ESLint

```bash
pnpm lint
```

**Expected**: Zero warnings/errors

**If errors occur**: Fix unused imports or formatting issues

### Step 6.3: Search for Legacy References

```bash
# Search for any remaining imports from experience.types.ts
grep -r "experience.types" web/src/
# Expected: No results

# Search for any remaining migration references
grep -r "migration" web/src/features/experiences/
# Expected: No results (except this grep command itself)
```

## Phase 7: Manual Testing

### Step 7.1: Start Dev Server

```bash
pnpm dev
```

Wait for server to start on `http://localhost:3000`

### Step 7.2: Wipe Firestore Data (if needed)

**Manual**: Open Firebase Console → Firestore

1. Navigate to `/events` collection
2. For each event document:
   - Open `experiences` subcollection
   - Delete all experience documents
3. Verify all experiences are deleted

**Alternative** (if safe to wipe all events):
- Delete all documents in `/events` collection (includes all subcollections)

### Step 7.3: Test Create Experience

1. Navigate to an event in the app
2. Create new photo experience
3. Open Firestore Console
4. Verify experience document structure:
   - Has nested `config` object with `countdown`, `overlayFramePath`
   - Has nested `aiConfig` object with all fields
   - No flat legacy fields (`countdownEnabled`, `aiEnabled`, etc.)

**Expected structure**:
```json
{
  "id": "exp_...",
  "eventId": "evt_...",
  "type": "photo",
  "label": "Test Experience",
  "enabled": true,
  "hidden": false,
  "config": {
    "countdown": 3,
    "overlayFramePath": null
  },
  "aiConfig": {
    "enabled": false,
    "model": null,
    "prompt": null,
    "referenceImagePaths": null,
    "aspectRatio": "1:1"
  },
  "createdAt": 1700000000000,
  "updatedAt": 1700000000000
}
```

### Step 7.4: Test Read Experience

1. Refresh page with experience list
2. Verify experience displays correctly
3. Check browser console for errors

**Expected**: No validation errors, experience renders correctly

### Step 7.5: Test Update Experience

1. Click edit on experience
2. Update label, countdown, AI settings
3. Save changes
4. Verify Firestore document updated with nested structure
5. Refresh page and verify changes persisted

**Expected**: Updates save correctly with nested `config` and `aiConfig`

### Step 7.6: Test Delete Experience

1. Delete experience
2. Verify removed from list
3. Check Firestore Console - document deleted

**Expected**: Clean deletion, no errors

## Phase 8: Cleanup

### Step 8.1: Remove Unused Imports

Search for unused imports:

```bash
# Run ESLint (should catch unused imports)
pnpm lint
```

Fix any unused import warnings.

### Step 8.2: Remove Empty Directories

```bash
# If types/ directory is empty, remove it
rmdir web/src/features/experiences/types/
```

## Rollback Plan

If issues arise:

### Option 1: Revert Code Changes

```bash
# Revert all commits in feature branch
git log --oneline  # Find commit before migration started
git revert <commit-hash>..HEAD
```

### Option 2: Restore Firestore Backup

If you created a backup in Step 1.1:
1. Open Firebase Console
2. Import backup data
3. Verify data restored

### Option 3: Document Issues

If partial rollback needed:
1. Document what went wrong
2. Identify specific problem files
3. Reassess approach
4. Consider gradual migration instead of clean slate

## Success Checklist

After completing all phases, verify:

- [ ] TypeScript type-check passes (`pnpm type-check`)
- [ ] ESLint passes (`pnpm lint`)
- [ ] No references to `experience.types.ts` in codebase
- [ ] No references to `migration.ts` in codebase
- [ ] Repository returns `PhotoExperience` types
- [ ] Repository validates with Zod on reads
- [ ] All components import from `schemas.ts`
- [ ] Manual testing: Create experience works (nested structure in Firestore)
- [ ] Manual testing: Read experience works (no validation errors)
- [ ] Manual testing: Update experience works (nested structure preserved)
- [ ] Manual testing: Delete experience works
- [ ] Firestore documents match `PhotoExperience` schema
- [ ] No TypeScript errors
- [ ] No runtime errors in browser console

## Next Steps

After migration complete:

1. Run `/speckit.tasks` command to generate task breakdown
2. Commit changes with descriptive message
3. Create pull request with migration summary
4. Update documentation if needed
5. Consider removing `legacy.ts` in future cleanup

## Notes

- This is a one-way migration (no going back to legacy types)
- Future schema changes should be additive (don't break existing structure)
- Keep `schemas.ts` as single source of truth for all Experience types
- If you need migration in production later, refer to deleted `migration.ts` in git history

## References

- **Spec**: `specs/001-experience-type-fix/spec.md`
- **Plan**: `specs/001-experience-type-fix/plan.md`
- **Research**: `specs/001-experience-type-fix/research.md`
- **Data Model**: `specs/001-experience-type-fix/data-model.md`
- **Contracts**: `specs/001-experience-type-fix/contracts/repository-contracts.md`
