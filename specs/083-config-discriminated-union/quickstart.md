# Quickstart: Experience Config Discriminated Union

**Feature**: 083-config-discriminated-union
**Date**: 2026-02-27

## Overview

This refactor changes `ExperienceConfig` from a flat object with nullable type-specific fields to a Zod discriminated union keyed on `type`. It removes `experience.type` (top-level) and replaces it with `draftType` (denormalized query field) plus self-describing configs (`draft.type`, `published.type`).

## Implementation Order

```
1. Schema changes (packages/shared)
   └── 2. Migration script (functions/scripts)
       └── 3. App write paths (create, switch, duplicate)
           └── 4. App read paths (library, designer, create tab)
               └── 5. Validation simplification (outcome-validation)
                   └── 6. Publish flow update
                       └── 7. Cloud functions update
                           └── 8. Firestore index update
```

## Key Files to Modify

### Shared Package (schema changes)
- `packages/shared/src/schemas/experience/experience.schema.ts` — Discriminated union + remove `type`, add `draftType`
- `packages/shared/src/schemas/experience/experience-config.schema.ts` — Export individual config variants

### Migration
- `functions/scripts/migrations/083-config-discriminated-union.ts` — **NEW**: One-time migration script

### App Write Paths
- `apps/clementine-app/src/domains/experience/shared/hooks/useCreateExperience.ts` — Set `draftType`, build discriminated draft
- `apps/clementine-app/src/domains/experience/shared/lib/switchExperienceType.ts` — Replace draft with new variant, set `draftType`
- `apps/clementine-app/src/domains/experience/shared/hooks/useDuplicateExperience.ts` — Set `draftType`, remove `type`

### App Read Paths
- `apps/clementine-app/src/domains/experience/library/containers/ExperiencesPage.tsx` — Read `draftType` for filter
- `apps/clementine-app/src/domains/experience/library/components/ExperienceListItem.tsx` — Read `draftType` for badge
- `apps/clementine-app/src/domains/experience/shared/hooks/useWorkspaceExperiences.ts` — Query on `draftType`
- `apps/clementine-app/src/domains/experience/shared/queries/experience.query.ts` — Update query keys
- `apps/clementine-app/src/domains/experience/create/components/CreateTabForm.tsx` — Read `draft.type`
- `apps/clementine-app/src/domains/experience/create/components/ExperienceTypeSwitch.tsx` — Read/write `draft.type`
- `apps/clementine-app/src/domains/experience/designer/containers/StepConfigPanelContainer.tsx` — Narrow config via `draft.type`
- `apps/clementine-app/src/domains/experience/shared/utils/hasTransformConfig.ts` → **Rename to `config-checks.ts`**, `hasOutcome()` → `hasTypeConfig()`. With the discriminated union this simplifies to `config.type !== 'survey'`.
- `apps/clementine-app/src/domains/experience/steps/registry/step-utils.ts` — Accept type from config

### Validation
- `apps/clementine-app/src/domains/experience/shared/lib/outcome-validation.ts` → **Rename to `config-validation.ts`**, `validateOutcome()` → `validateConfig()`. Remove structural checks, accept config directly.
- `apps/clementine-app/src/domains/experience/designer/hooks/usePublishExperience.ts` — Read type from `draft.type`, pass config to validation

### Cloud Functions
- `functions/src/callable/startTransformPipeline.ts` — Read from `published.type`
- `functions/src/repositories/job.ts` — Read from published config

### Firestore Index
- `firebase/firestore.indexes.json` — Replace `type` → `draftType` in composite index

## Type Narrowing Example

```typescript
// Before (nullable fields, manual checks)
const type = experience.type
const config = experience.draft
if (type === 'photo' && config.photo) {
  const ar = config.photo.aspectRatio // Required null-check
}

// After (discriminated union, automatic narrowing)
const config = experience.draft
if (config.type === 'photo') {
  const ar = config.photo.aspectRatio // TypeScript knows photo exists
}
```

## Consumer Guide

| Context | Before | After |
|---------|--------|-------|
| Admin UI editing | `experience.type` | `experience.draft.type` |
| Library badge/filter | `experience.type` | `experience.draftType` |
| Firestore query | `where('type', '==', ...)` | `where('draftType', '==', ...)` |
| Guest runtime | `experience.type` | `experience.published.type` |
| Cloud functions | `experience.type` | `experience.published.type` |
| Validation | `validateOutcome(type, config, steps)` | `validateConfig(config, steps)` |
