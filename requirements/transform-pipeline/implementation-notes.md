# Transform Pipeline - Implementation Notes

This document captures the actual scope of implementation for each phase, noting where implementation expanded beyond or diverged from original planning.

---

## Phase 1: Foundation & Schema

**Completed**: 2026-01-21
**Implementation Spec**: [/specs/036-transform-foundation/](/specs/036-transform-foundation/)

### Original Scope vs Actual Implementation

The original Phase 1 scope was minimal schema additions. The actual implementation expanded significantly to establish a **shared kernel architecture** for cross-package schema reuse.

### What Was Actually Implemented

#### 1. Shared Kernel Package (`packages/shared/`)

A new shared package was created/expanded to serve as the single source of truth for Zod schemas used by both the frontend app and Firebase functions:

**New Schema Domains Created**:
- `schemas/session/` - Guest session schemas with job tracking
- `schemas/job/` - Transform job execution tracking
- `schemas/experience/` - Experience configuration and step schemas
- `schemas/event/` - Project event configuration
- `schemas/project/` - Project schemas
- `schemas/workspace/` - Workspace schemas
- `schemas/theme/` - Theme and media reference schemas

#### 2. Step Schema Unification

The most significant expansion was unifying step schemas. Previously:
- App had `Step[]` (strict discriminated union)
- Shared had `BaseStep[]` (loose typing)
- Required unsafe type casts: `as unknown as Step[]`

After implementation:
- Single `ExperienceStep` discriminated union in shared kernel
- All 8 step config schemas moved to shared
- Type-safe step handling without casts
- Consistent `Experience*` naming prefix

**Step schemas moved to shared**:
- `experienceInfoStepSchema`
- `experienceInputScaleStepSchema`
- `experienceInputYesNoStepSchema`
- `experienceInputMultiSelectStepSchema`
- `experienceInputShortTextStepSchema`
- `experienceInputLongTextStepSchema`
- `experienceCapturePhotoStepSchema`
- `experienceTransformPipelineStepSchema`

#### 3. Event Schema Consolidation

Event-related schemas were consolidated into the shared kernel:
- `themeSchema` - Theme configuration
- `mediaReferenceSchema` - Media asset references
- `experiencesConfigSchema` - Experience configuration within events
- `projectEventConfigSchema` - Full event configuration

This enables the job schema to access `applyOverlay` from experience config for tracking.

#### 4. Schema Migration from App

Duplicate schemas were removed from the app and replaced with re-exports from `@clementine/shared`:
- Overlay schemas
- Share/share options schemas
- Welcome config schemas
- Theme schemas
- Step schemas

**Design Principle Established**:
- **Shared package** = READ schemas (permissive, for Firestore document parsing)
- **App** = WRITE schemas (strict validation with limits for mutations)

### Implementation Phases (Detailed)

The implementation was broken into 9 phases (see [tasks.md](/specs/036-transform-foundation/tasks.md)):

| Phase | Purpose |
|-------|---------|
| 1 | Setup - Create shared kernel directory structure |
| 2 | Foundational - Migrate existing schemas to shared kernel |
| 3 | US1 - Step names (add `name` field to all steps) |
| 4 | US2 - Transform configuration slot in experience |
| 5 | US3 - Job tracking schema |
| 6 | US4 - Session job status tracking |
| 7 | US5 - Firestore security rules for jobs |
| 8 | Polish & Validation |
| 9 | Shared kernel consolidation (event/theme schemas) |

### Validation Results

All validation passed:
- `pnpm shared:build` - passes
- `pnpm shared:test` - 115 tests pass
- `pnpm app:type-check` - passes
- `pnpm app:test` - 315 tests pass
- `pnpm app:build` - passes
- `pnpm functions:build` - passes

### Impact on Future Phases

This expanded foundation provides benefits for later phases:
- **Phase 2** (Backend Infrastructure): Functions can import job/session schemas directly from shared
- **Phase 4** (Runtime Integration): Type-safe step handling without casts
- **All phases**: Single source of truth reduces schema drift risk

### Additional Documentation

- [step-schema-unification-plan.md](/specs/036-transform-foundation/step-schema-unification-plan.md) - Detailed plan for step schema consolidation
- [tasks.md](/specs/036-transform-foundation/tasks.md) - Complete task breakdown with dependencies
- [packages/shared/README.md](/packages/shared/README.md) - Shared package documentation

---

## Future Phases

Implementation notes for subsequent phases will be added as they are completed.
