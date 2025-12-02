# Quickstart: AI Presets Refactor

**Branch**: `001-ai-presets` | **Date**: 2025-12-02

## Overview

This guide provides quick reference for implementing the experiences → aiPresets refactor.

## Prerequisites

- Firebase Admin SDK credentials configured
- Access to Firestore production/staging database
- Local development environment running (`pnpm dev`)

## Implementation Steps

### Step 1: Run Firestore Migration

```bash
# From project root
cd scripts
npx ts-node migrate-experiences-to-ai-presets.ts
```

Expected output:
```
Starting migration from /experiences to /aiPresets...
Migrated 42 documents
Verification: 42 documents in /aiPresets ✓
Migration complete!
```

### Step 2: Rename Feature Module

```bash
# From web/src/features/
mv experiences ai-presets
```

### Step 3: Rename Internal Files

```bash
cd web/src/features/ai-presets

# Repository
mv repositories/experiences.repository.ts repositories/ai-presets.repository.ts

# Schemas
mv schemas/experiences.schemas.ts schemas/ai-presets.schemas.ts
mv schemas/experiences.schemas.test.ts schemas/ai-presets.schemas.test.ts

# Types
mv types/experiences.types.ts types/ai-presets.types.ts
```

### Step 4: Update Collection Reference

In `ai-presets.repository.ts`:

```typescript
// BEFORE
const experiencesRef = db.collection("experiences")

// AFTER
const aiPresetsRef = db.collection("aiPresets")
```

### Step 5: Rename Types

Use IDE rename refactoring (F2 in VS Code) on each type:

| Old | New |
|-----|-----|
| `Experience` | `AiPreset` |
| `PhotoExperience` | `PhotoAiPreset` |
| `VideoExperience` | `VideoAiPreset` |
| `GifExperience` | `GifAiPreset` |
| `ExperienceType` | `AiPresetType` |

### Step 6: Rename Functions

In repository and actions:

```typescript
// BEFORE
export async function getExperience(id: string)
export async function listExperiences(companyId: string)

// AFTER
export async function getAiPreset(id: string)
export async function listAiPresets(companyId: string)
```

### Step 7: Update Imports

Find and replace in IDE:
```
@/features/experiences → @/features/ai-presets
```

### Step 8: Add Step Deprecation

In `features/steps/constants.ts`:

```typescript
export interface StepTypeMeta {
  type: StepType;
  label: string;
  description: string;
  category: "navigation" | "capture" | "input" | "completion";
  deprecated?: boolean;  // ADD THIS
}

// Update STEP_TYPE_META entries
{
  type: "experience-picker",
  label: "Experience Picker",
  description: "Choose an AI experience",
  category: "navigation",
  deprecated: true,  // ADD THIS
},
{
  type: "capture",
  label: "Capture",
  description: "Take a photo or video",
  category: "capture",
  deprecated: true,  // ADD THIS
},
```

### Step 9: Filter Deprecated Steps in UI

In step type picker component:

```typescript
const availableStepTypes = STEP_TYPE_META.filter(
  (meta) => !meta.deprecated
);
```

### Step 10: Validate

```bash
# Run all checks
pnpm lint
pnpm type-check
pnpm build

# Verify no old references remain
grep -r "@/features/experiences" web/src/
grep -r '"experiences"' web/src/features/
```

## Verification Checklist

- [ ] Migration script ran successfully
- [ ] Document count matches in `/aiPresets`
- [ ] Feature module renamed to `ai-presets/`
- [ ] All types renamed to `AiPreset*`
- [ ] All functions renamed to `*AiPreset*`
- [ ] All imports updated
- [ ] Step types marked deprecated
- [ ] Deprecated steps hidden from UI
- [ ] `pnpm lint` passes
- [ ] `pnpm type-check` passes
- [ ] `pnpm build` passes
- [ ] No grep matches for old patterns

## Rollback Plan

If issues arise:

1. **Revert code changes**: `git checkout main`
2. **Keep `/aiPresets` collection** (contains valid data copy)
3. **Old code still works** with original `/experiences` collection

## Common Issues

### Issue: TypeScript errors after rename

**Solution**: Run `pnpm type-check` and fix all errors before proceeding. Common causes:
- Missed import updates
- Missed type reference updates
- Index file not updated

### Issue: Runtime errors in guest flow

**Solution**: Check that:
1. Migration completed successfully
2. Collection name updated in repository (`"aiPresets"` not `"experiences"`)
3. Document IDs preserved during migration

### Issue: Deprecated steps still visible

**Solution**: Check that:
1. `deprecated: true` added to step meta
2. Filter applied in step type picker component
3. Browser cache cleared / hard refresh

## Files Changed Summary

| Category | Files |
|----------|-------|
| Migration script | 1 |
| Feature module | ~20 (rename + content) |
| Import updates | 14 |
| Step deprecation | 3 |
| **Total** | ~38 files |
