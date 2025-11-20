# Experience Type Migration Plan

## Overview

Consolidate Experience type definitions by removing legacy types and migration code, keeping only the new discriminated union schema from `schemas.ts`.

**Context:** We're in development stage with no production data, so we can wipe existing Firestore data and start fresh without backward compatibility concerns.

## Current State

### Two Conflicting Type Definitions

1. **Legacy Type** (`types/experience.types.ts`)

   - Flat structure: `countdownEnabled`, `countdownSeconds`, `aiEnabled`, `aiModel`, etc.
   - Used by: UI components, repository, some actions
   - Lines 23-63 in `experience.types.ts`

2. **New Schema** (`lib/schemas.ts`)
   - Discriminated union with nested objects
   - Structure: `config.countdown`, `config.overlayFramePath`, `aiConfig.enabled`, etc.
   - Used by: Modern server actions, migration utilities
   - Lines 109-146 in `schemas.ts`

### Files Using Legacy Type

- `/lib/repository.ts` - Returns legacy `Experience` type
- `/components/shared/ExperiencesList.tsx`
- `/components/shared/ExperienceEditor.tsx` (imports BOTH types with type guard)
- `/components/shared/ExperienceEditorWrapper.tsx`
- `/components/shared/ExperienceTypeSelector.tsx`
- `/actions/legacy.ts`

### Files Using New Schema

- `/actions/photo-update.ts` - With migration logic
- `/actions/photo-create.ts`
- `/lib/migration.ts`
- `/lib/migration.test.ts`

## Migration Strategy

**Approach:** Clean slate - wipe data and remove all migration code.

### Why This Works

- ✅ No production users or real data
- ✅ Can delete and recreate all Firestore documents
- ✅ Eliminates complexity from dual-type system
- ✅ Cleaner, simpler codebase
- ✅ One source of truth for types

## Implementation Plan

### Phase 1: Preparation

1. **Backup current state** (optional, for reference)

   - Document current Firestore structure
   - Take note of any test data you want to recreate

2. **Wipe Firestore data**
   - Delete all documents in `/events` collection
   - Delete all subcollections (experiences, sessions, etc.)
   - Verify empty state

### Phase 2: Remove Migration Code

3. **Delete migration files**

   - `web/src/features/experiences/lib/migration.ts`
   - `web/src/features/experiences/lib/migration.test.ts`

4. **Delete legacy types file**
   - `web/src/features/experiences/types/experience.types.ts`

### Phase 3: Update Repository

5. **Update `lib/repository.ts`**

   - Change return types from `Experience` to `PhotoExperience`
   - Import types from `schemas.ts` instead of `experience.types.ts`
   - Add schema validation on read (use `photoExperienceSchema.parse()`)
   - Remove any migration logic

6. **Update `createExperience()` function**
   - Ensure it creates documents with new schema structure
   - Use `config` and `aiConfig` nested objects

### Phase 4: Update Server Actions

7. **Simplify `photo-update.ts`**

   - Remove migration logic (lines 82-93)
   - Remove `stripLegacyFields()` call (lines 125-128)
   - Direct update without migration

8. **Review `photo-create.ts`**

   - Ensure it creates new schema format
   - No migration needed

9. **Update `shared.ts`**

   - No changes needed (type-agnostic delete operation)

10. **Mark `legacy.ts` for removal**
    - Add prominent deprecation notice
    - Plan to remove in future cleanup

### Phase 5: Update UI Components

11. **Update component imports**

    - `ExperiencesList.tsx` - import `PhotoExperience` from schemas
    - `ExperienceEditor.tsx` - remove dual-type handling, import from schemas
    - `ExperienceEditorWrapper.tsx` - import from schemas
    - `ExperienceTypeSelector.tsx` - check if needs updates

12. **Remove type guards in `ExperienceEditor.tsx`**
    - Remove lines 49-51 (`hasNewSchema` check)
    - Simplify state initialization (lines 54-90)
    - Remove legacy field fallbacks

### Phase 6: Validation

13. **Type checking**

    - Run `pnpm type-check` from root
    - Fix any TypeScript errors
    - Ensure no references to old `Experience` type remain

14. **Update tests**

    - Remove migration tests
    - Update any component tests using old types
    - Add validation tests for new schema

15. **Manual testing**
    - Create new event
    - Add photo experience
    - Configure all settings (countdown, overlay, AI)
    - Save and verify data structure in Firestore
    - Edit experience and verify updates

### Phase 7: Cleanup

16. **Remove unused imports**

    - Search for any remaining imports from `experience.types.ts`
    - Clean up unused type definitions

17. **Update documentation**
    - Update CLAUDE.md if it references old types
    - Update any inline comments referencing migration

## Files to Modify

### Delete

- `/web/src/features/experiences/lib/migration.ts`
- `/web/src/features/experiences/lib/migration.test.ts`
- `/web/src/features/experiences/types/experience.types.ts`

### Update

- `/web/src/features/experiences/lib/repository.ts`
- `/web/src/features/experiences/actions/photo-update.ts`
- `/web/src/features/experiences/actions/photo-create.ts`
- `/web/src/features/experiences/components/shared/ExperiencesList.tsx`
- `/web/src/features/experiences/components/shared/ExperienceEditor.tsx`
- `/web/src/features/experiences/components/shared/ExperienceEditorWrapper.tsx`
- `/web/src/features/experiences/components/shared/ExperienceTypeSelector.tsx`

### Review (may need updates)

- `/web/src/features/experiences/actions/legacy.ts` (mark deprecated)
- `/web/src/features/experiences/components/shared/ExperienceEditor.test.tsx`

## Expected Outcome

### After Migration

- ✅ Single source of truth: `schemas.ts`
- ✅ No migration code or complexity
- ✅ All components use `PhotoExperience` type
- ✅ Repository returns validated schema types
- ✅ Clean, simple data flow: Firestore ↔ Schema Types ↔ UI
- ✅ Type safety throughout the stack

### Data Structure in Firestore

```typescript
// /events/{eventId}/experiences/{experienceId}
{
  id: "exp_123",
  eventId: "evt_456",
  type: "photo",
  label: "AI Headshots",
  enabled: true,
  hidden: false,

  // Nested config object
  config: {
    countdown: 3,                    // 0 = disabled, 1-10 = seconds
    overlayFramePath: "https://..." // null if no overlay
  },

  // Nested aiConfig object
  aiConfig: {
    enabled: true,
    model: "nanobanana",
    prompt: "Professional headshot...",
    referenceImagePaths: ["https://..."],
    aspectRatio: "1:1"
  },

  // Optional preview
  previewPath: "https://...",
  previewType: "image",

  // Audit
  createdAt: 1234567890,
  updatedAt: 1234567890
}
```

## Rollback Plan

If issues arise:

1. Revert all code changes via git
2. Restore Firestore backup (if created)
3. Document what went wrong
4. Reassess approach

## Notes

- This is a one-way migration (no going back to legacy types)
- Future schema changes should be additive (don't break existing structure)
- If you need migration in the future (post-production), refer to the existing `migration.ts` as a template
- Keep `schemas.ts` as the single source of truth for all Experience types
