# Implementation Plan: Step Schema Unification

**Branch**: `036-transform-foundation` | **Date**: 2026-01-21 | **Parent**: [plan.md](./plan.md)
**Context**: Follow-up to initial shared kernel consolidation

> **Status: IMPLEMENTED** (2026-01-21)
> All phases completed successfully. Validation results:
> - `pnpm shared:build` - passes
> - `pnpm shared:test` - 115 tests pass
> - `pnpm app:type-check` - passes
> - `pnpm app:test` - 315 tests pass
> - `pnpm app:build` - passes

## Summary

Unify step schemas by moving the discriminated union `stepSchema` and all step-specific config schemas from the app to the shared kernel. This eliminates unsafe type casts and establishes a single source of truth for step validation across app and functions.

**Goals**:
1. Move step config schemas to shared kernel with unified naming
2. Update `experienceConfigSchema` to use typed `ExperienceStep[]` instead of loose `BaseStep[]`
3. Delete legacy/stale step type definitions from app
4. Enable type-safe step handling without casts

## Problem Statement

### Current Issues

```typescript
// ExperienceDesignerPage.tsx - UNSAFE CAST required
const [steps, setSteps] = useState<Step[]>(() =>
  ensureAllStepsHaveNames(
    (experience.draft.steps ?? []) as unknown as Step[]  // ← Type mismatch
  )
)
```

**Root cause**: `Experience.draft.steps` is typed as `BaseStep[]` (loose), but the app needs `Step[]` (strict discriminated union).

### Current State (Messy)

| Location | File | Status |
|----------|------|--------|
| Shared Kernel | `baseStepSchema` → `BaseStep` | Loose: `{id, type: string, config: Record}` |
| App | `steps/schemas/step.schema.ts` | **ACTIVE**: Discriminated union by `type` |
| App | `steps/schemas/*.schema.ts` | **ACTIVE**: Real config schemas (8 types) |
| App | `shared/schemas/step-registry.schema.ts` | **STALE**: Placeholder `z.looseObject({})` |
| App | `shared/types/step.types.ts` | **LEGACY**: Old interfaces with `category` discriminator |

## Solution

Move the discriminated union and config schemas to shared kernel with consistent `Experience*` naming prefix.

### Target State

```typescript
// ExperienceDesignerPage.tsx - NO CAST NEEDED
const [steps, setSteps] = useState<ExperienceStep[]>(() =>
  ensureAllStepsHaveNames(experience.draft.steps ?? [])  // Already ExperienceStep[]
)
```

---

## Naming Convention

| Current (App) | New (Shared Kernel) |
|---------------|---------------------|
| `baseStepSchema` → `BaseStep` | `experienceStepBaseSchema` → `ExperienceStepBase` |
| `stepSchema` → `Step` | `experienceStepSchema` → `ExperienceStep` |
| `stepTypeSchema` → `StepType` | `experienceStepTypeSchema` → `ExperienceStepType` |
| `stepCategorySchema` → `StepCategory` | `experienceStepCategorySchema` → `ExperienceStepCategory` |
| `stepNameSchema` | `experienceStepNameSchema` |
| `infoStepSchema` | `experienceInfoStepSchema` |
| `InfoStepConfig` | `ExperienceInfoStepConfig` |
| `capturePhotoStepConfigSchema` | `experienceCapturePhotoStepConfigSchema` |
| `CapturePhotoStepConfig` | `ExperienceCapturePhotoStepConfig` |

**Pattern**: All step-related types prefixed with `Experience` to avoid generic names like `Step`, `StepType`.

---

## Project Structure

### Shared Kernel (Target)

```text
packages/shared/src/schemas/experience/
├── index.ts                              # Barrel export
├── experience.schema.ts                  # Uses experienceStepSchema
├── transform.schema.ts                   # Existing
├── step.schema.ts                        # Base + discriminated union + name
└── steps/
    ├── index.ts                          # Barrel for step configs
    ├── info.schema.ts                    # ExperienceInfoStepConfig
    ├── input-scale.schema.ts             # ExperienceInputScaleStepConfig
    ├── input-yes-no.schema.ts            # ExperienceInputYesNoStepConfig
    ├── input-multi-select.schema.ts      # ExperienceInputMultiSelectStepConfig
    ├── input-short-text.schema.ts        # ExperienceInputShortTextStepConfig
    ├── input-long-text.schema.ts         # ExperienceInputLongTextStepConfig
    ├── capture-photo.schema.ts           # ExperienceCapturePhotoStepConfig
    └── transform-pipeline.schema.ts      # ExperienceTransformPipelineStepConfig
```

### App (After Migration)

```text
apps/clementine-app/src/domains/experience/
├── shared/
│   ├── schemas/
│   │   ├── index.ts                      # Re-export from @clementine/shared
│   │   └── experience.input.schemas.ts   # App-specific WRITE schemas (keep)
│   └── types/
│       ├── index.ts                      # Updated exports
│       ├── profile.types.ts              # Uses ExperienceStepCategory from shared
│       └── runtime.types.ts              # Keep as-is
│
└── steps/
    ├── registry/
    │   └── step-registry.ts              # KEEP: UI metadata (icons, labels, defaultConfig)
    ├── renderers/                        # KEEP: React components
    ├── config-panels/                    # KEEP: React components
    └── schemas/                          # DELETE: Moved to shared
```

---

## Implementation Phases

### Phase 1: Create Step Schemas in Shared Kernel

**Scope**: Add new files to shared kernel without breaking existing app code.

**Tasks**:
1. Create `packages/shared/src/schemas/experience/steps/` directory
2. Create step config schemas with new naming:
   - `info.schema.ts` → `experienceInfoStepConfigSchema`, `ExperienceInfoStepConfig`
   - `input-scale.schema.ts` → `experienceInputScaleStepConfigSchema`
   - `input-yes-no.schema.ts` → `experienceInputYesNoStepConfigSchema`
   - `input-multi-select.schema.ts` → `experienceInputMultiSelectStepConfigSchema`
   - `input-short-text.schema.ts` → `experienceInputShortTextStepConfigSchema`
   - `input-long-text.schema.ts` → `experienceInputLongTextStepConfigSchema`
   - `capture-photo.schema.ts` → `experienceCapturePhotoStepConfigSchema`
   - `transform-pipeline.schema.ts` → `experienceTransformPipelineStepConfigSchema`
3. Create barrel export `packages/shared/src/schemas/experience/steps/index.ts`
4. Update `packages/shared/src/schemas/experience/step.schema.ts`:
   - Rename `baseStepSchema` → `experienceStepBaseSchema`
   - Add `experienceStepNameSchema` (with `.trim()`)
   - Add `experienceStepTypeSchema` (enum)
   - Add `experienceStepCategorySchema` (enum)
   - Add individual step schemas (`experienceInfoStepSchema`, etc.)
   - Add `experienceStepSchema` (discriminated union)
5. Update `packages/shared/src/schemas/experience/experience.schema.ts`:
   - Change `steps: z.array(baseStepSchema)` → `steps: z.array(experienceStepSchema)`
6. Update `packages/shared/src/schemas/experience/index.ts` with new exports
7. Run `pnpm shared:build` and `pnpm shared:test` to verify

**Deliverable**: Shared kernel has complete step schemas, existing app still works (no breaking changes yet).

---

### Phase 2: Update App Imports

**Scope**: Update app to use shared kernel schemas, maintaining backward compatibility temporarily.

**Tasks**:
1. Update `apps/.../experience/shared/schemas/index.ts`:
   - Add re-exports for all new step types from `@clementine/shared`
   - Create aliases for old names → new names (temporary compatibility)
2. Update `apps/.../experience/shared/types/profile.types.ts`:
   - Import `ExperienceStepCategory` from shared instead of local `StepCategory`
3. Update `apps/.../experience/steps/registry/step-registry.ts`:
   - Import config schemas from `@clementine/shared` instead of local `./schemas/`
   - Update type imports to use new names
4. Update step renderers and config panels:
   - Update config type imports to new names
5. Update `ExperienceDesignerPage.tsx`:
   - Remove unsafe cast, use `ExperienceStep[]` directly
6. Run `pnpm app:type-check` to find and fix remaining import issues
7. Run `pnpm app:test` to verify functionality

**Deliverable**: App uses shared kernel schemas with new naming, all type-checks pass.

---

### Phase 3: Delete Legacy Files

**Scope**: Remove stale/legacy files and compatibility aliases.

**Files to Delete**:

| File | Reason |
|------|--------|
| `app/.../shared/schemas/step-registry.schema.ts` | Placeholder schemas, never used for real validation |
| `app/.../shared/types/step.types.ts` | Legacy interfaces with `category` discriminator |
| `app/.../steps/schemas/step.schema.ts` | Moved to shared kernel |
| `app/.../steps/schemas/info.schema.ts` | Moved to shared kernel |
| `app/.../steps/schemas/input-scale.schema.ts` | Moved to shared kernel |
| `app/.../steps/schemas/input-yes-no.schema.ts` | Moved to shared kernel |
| `app/.../steps/schemas/input-multi-select.schema.ts` | Moved to shared kernel |
| `app/.../steps/schemas/input-short-text.schema.ts` | Moved to shared kernel |
| `app/.../steps/schemas/input-long-text.schema.ts` | Moved to shared kernel |
| `app/.../steps/schemas/capture-photo.schema.ts` | Moved to shared kernel |
| `app/.../steps/schemas/transform-pipeline.schema.ts` | Moved to shared kernel |

**Tasks**:
1. Delete files listed above
2. Remove `app/.../steps/schemas/` directory (should be empty)
3. Update any remaining imports that referenced deleted files
4. Remove compatibility aliases from Phase 2
5. Clean up barrel exports
6. Run full validation:
   - `pnpm shared:build && pnpm shared:test`
   - `pnpm app:type-check && pnpm app:test`
   - `pnpm app:build`

**Deliverable**: Clean codebase with single source of truth in shared kernel.

---

## Files Summary

### Files to Create (Phase 1)

| File | Description |
|------|-------------|
| `packages/shared/src/schemas/experience/steps/index.ts` | Barrel export |
| `packages/shared/src/schemas/experience/steps/info.schema.ts` | Info step config |
| `packages/shared/src/schemas/experience/steps/input-scale.schema.ts` | Input scale config |
| `packages/shared/src/schemas/experience/steps/input-yes-no.schema.ts` | Input yes/no config |
| `packages/shared/src/schemas/experience/steps/input-multi-select.schema.ts` | Input multi-select config |
| `packages/shared/src/schemas/experience/steps/input-short-text.schema.ts` | Input short text config |
| `packages/shared/src/schemas/experience/steps/input-long-text.schema.ts` | Input long text config |
| `packages/shared/src/schemas/experience/steps/capture-photo.schema.ts` | Capture photo config |
| `packages/shared/src/schemas/experience/steps/transform-pipeline.schema.ts` | Transform pipeline config |

### Files to Modify (Phase 1-2)

| File | Changes |
|------|---------|
| `packages/shared/src/schemas/experience/step.schema.ts` | Add discriminated union, rename types |
| `packages/shared/src/schemas/experience/experience.schema.ts` | Use `experienceStepSchema` |
| `packages/shared/src/schemas/experience/index.ts` | Export new types |
| `apps/.../experience/shared/schemas/index.ts` | Re-export from shared |
| `apps/.../experience/shared/types/profile.types.ts` | Use `ExperienceStepCategory` |
| `apps/.../experience/steps/registry/step-registry.ts` | Import from shared |
| `apps/.../experience/designer/containers/ExperienceDesignerPage.tsx` | Remove cast |

### Files to Delete (Phase 3)

| File | Reason |
|------|--------|
| `app/.../shared/schemas/step-registry.schema.ts` | Stale placeholder |
| `app/.../shared/types/step.types.ts` | Legacy types |
| `app/.../steps/schemas/*.ts` (all 9 files) | Moved to shared |

---

## Validation Checklist

After each phase:

- [x] `pnpm shared:build` passes
- [x] `pnpm shared:test` passes
- [x] `pnpm app:type-check` passes
- [x] `pnpm app:test` passes
- [x] `pnpm app:build` passes

Final validation:

- [x] No `as unknown as` casts for step types
- [x] `Experience.draft.steps` is `ExperienceStep[]`
- [x] All step config types use `Experience*` prefix
- [x] No duplicate schema definitions
- [x] Step registry (icons, labels) still works in app

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Breaking existing functionality | Phase 1 is additive only, no deletions |
| Import path confusion | Phase 2 adds compatibility aliases before Phase 3 removes them |
| Missing type updates | Run `pnpm app:type-check` after each file change |
| Test failures | Run tests after each phase before proceeding |

---

## Out of Scope

- Step registry UI metadata (icons, labels, defaultConfig factories) - stays in app
- Step renderers and config panels - React components stay in app
- Runtime step execution logic - stays in app
- Adding new step types - separate feature
