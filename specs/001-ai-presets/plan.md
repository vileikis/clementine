# Implementation Plan: AI Presets Refactor & Legacy Step Stabilization

**Branch**: `001-ai-presets` | **Date**: 2025-12-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-ai-presets/spec.md`

## Summary

Refactor the legacy `/experiences` Firestore collection to `/aiPresets` and rename the `web/src/features/experiences/` module to `web/src/features/ai-presets/`. Deprecate ExperiencePicker and Capture step types from the "Add Step" UI while maintaining full backward compatibility for existing journeys. This is a pure refactor—no new functionality or guest-facing behavior changes.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Next.js 16, React 19, Firebase (Firestore + Storage), Zod 4.x
**Storage**: Firebase Firestore (root collection: `/experiences` → `/aiPresets`)
**Testing**: Jest for unit tests
**Target Platform**: Web (pnpm monorepo - `web/` workspace)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: No degradation from current—queries must perform identically
**Constraints**: Zero breaking changes for existing flows, workspace route exclusion
**Scale/Scope**: ~14 files import from experiences feature, ~10 files reference ExperiencePicker/Capture steps

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Verify compliance with Clementine Constitution (`.specify/memory/constitution.md`):

- [x] **Mobile-First Responsive Design**: No new UI—existing mobile experiences unchanged (MFR-001)
- [x] **Clean Code & Simplicity**: Pure rename/refactor with no new abstractions; follows existing patterns
- [x] **Type-Safe Development**: TypeScript strict mode maintained; Zod schemas renamed (not restructured)
- [x] **Minimal Testing Strategy**: No new tests required—existing tests will be updated to use new naming
- [x] **Validation Loop Discipline**: Plan includes lint, type-check, build validation before completion
- [x] **Firebase Architecture Standards**: Admin SDK for migration script, schemas in `features/ai-presets/schemas/`
- [x] **Feature Module Architecture**: Module renamed from `experiences` to `ai-presets`, preserving vertical slice structure

**Complexity Violations**: None—this is a pure rename/deprecation refactor.

## Project Structure

### Documentation (this feature)

```text
specs/001-ai-presets/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # N/A - no new APIs
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code Changes

```text
web/src/features/
├── experiences/         # TO BE RENAMED → ai-presets/
│   ├── actions/
│   │   ├── duplicate.ts
│   │   ├── gif-create.ts
│   │   ├── gif-update.ts
│   │   ├── index.ts
│   │   ├── list.ts
│   │   ├── photo-create.ts
│   │   ├── photo-media.ts
│   │   ├── photo-update.ts
│   │   ├── playground-generate.ts
│   │   ├── shared.ts
│   │   ├── types.ts
│   │   └── utils.ts
│   ├── components/
│   │   ├── gif/
│   │   ├── photo/
│   │   ├── shared/
│   │   └── index.ts
│   ├── repositories/
│   │   ├── experiences.repository.ts → ai-presets.repository.ts
│   │   └── index.ts
│   ├── schemas/
│   │   ├── experiences.schemas.ts → ai-presets.schemas.ts
│   │   ├── experiences.schemas.test.ts → ai-presets.schemas.test.ts
│   │   └── index.ts
│   ├── types/
│   │   ├── experiences.types.ts → ai-presets.types.ts
│   │   └── index.ts
│   ├── constants.ts
│   └── index.ts
│
├── steps/
│   ├── constants.ts           # Add deprecated flag to step meta
│   ├── schemas/step.schemas.ts
│   └── components/
│       └── editors/           # Filter deprecated types from picker
│
└── journeys/
    └── components/editor/     # Filter deprecated types from step picker

web/src/app/
├── (public)/                  # OK to modify - guest flows
│   └── join/[eventId]/        # Update imports
└── (workspace)/               # DO NOT TOUCH - off-limits
```

**Structure Decision**: Rename existing `features/experiences/` to `features/ai-presets/` in place. Update all imports across the codebase. No structural changes to the feature module architecture.

## Implementation Phases

### Phase 1: Firestore Collection Migration

1. Create migration script using Admin SDK to:
   - Read all documents from `/experiences`
   - Write to `/aiPresets` with identical content
   - Verify document count matches
2. No need to delete old collection (can be cleaned up later)

### Phase 2: Feature Module Rename

1. Rename directory: `features/experiences/` → `features/ai-presets/`
2. Rename internal files following pattern:
   - `experiences.repository.ts` → `ai-presets.repository.ts`
   - `experiences.schemas.ts` → `ai-presets.schemas.ts`
   - `experiences.types.ts` → `ai-presets.types.ts`
3. Update collection name in repository: `"experiences"` → `"aiPresets"`
4. Rename types: `Experience` → `AiPreset`, `PhotoExperience` → `PhotoAiPreset`, etc.
5. Rename functions: `getExperience` → `getAiPreset`, `listExperiences` → `listAiPresets`, etc.

### Phase 3: Import Updates

1. Update all imports from `@/features/experiences` → `@/features/ai-presets`
2. Files to update (14 total):
   - App pages under `(public)/` (NOT workspace)
   - Feature modules: guest, journeys, sessions, steps
3. Update type references: `Experience` → `AiPreset`

### Phase 4: Step Deprecation

1. Add `deprecated: boolean` field to `StepTypeMeta` interface
2. Mark `experience-picker` and `capture` as `deprecated: true` in `STEP_TYPE_META`
3. Filter deprecated types from step type picker UI
4. Keep deprecated steps functional for existing journeys (editing allowed)

### Phase 5: Validation

1. Run `pnpm lint` - fix all errors
2. Run `pnpm type-check` - resolve all TypeScript errors
3. Run `pnpm build` - ensure production build succeeds
4. Verify zero references to old `/experiences` collection path
5. Verify zero references to old `experiences` feature module path

## Files Requiring Changes

### Feature Module (Rename)

| Current Path | New Path |
|-------------|----------|
| `features/experiences/` | `features/ai-presets/` |
| `repositories/experiences.repository.ts` | `repositories/ai-presets.repository.ts` |
| `schemas/experiences.schemas.ts` | `schemas/ai-presets.schemas.ts` |
| `types/experiences.types.ts` | `types/ai-presets.types.ts` |

### Import Updates Required

| File | Change Type |
|------|-------------|
| `app/(public)/join/[eventId]/page.tsx` | Import path |
| `features/guest/components/JourneyGuestContainer.tsx` | Import + types |
| `features/guest/components/JourneyStepRenderer.tsx` | Import + types |
| `features/journeys/components/editor/StepEditor.tsx` | Import + types |
| `features/journeys/components/editor/StepPreview.tsx` | Import + types |
| `features/journeys/hooks/useEventExperiences.ts` | Import + rename hook |
| `features/sessions/actions/sessions.actions.ts` | Import + types |
| `features/steps/components/editors/CaptureStepEditor.tsx` | Import + types |
| `features/steps/components/editors/ExperiencePickerEditor.tsx` | Import + types |
| `features/steps/components/preview/PreviewRuntime.tsx` | Import + types |
| `features/steps/components/preview/steps/CaptureStep.tsx` | Import + types |
| `features/steps/components/preview/steps/ExperiencePickerStep.tsx` | Import + types |
| `features/steps/types/playback.types.ts` | Import + types |

### Step Deprecation

| File | Change |
|------|--------|
| `features/steps/constants.ts` | Add `deprecated` to `StepTypeMeta`, mark types |
| `features/steps/types/step.types.ts` | Add `deprecated` field type |
| Journey editor step picker component | Filter out deprecated types |

## Migration Script

Location: `scripts/migrate-experiences-to-ai-presets.ts`

```typescript
// Pseudo-code for migration
import { getAdminDb } from '@/lib/firebase/admin'

async function migrateExperiencesToAiPresets() {
  const db = getAdminDb()
  const experiencesRef = db.collection('experiences')
  const aiPresetsRef = db.collection('aiPresets')

  const snapshot = await experiencesRef.get()
  const batch = db.batch()

  snapshot.docs.forEach(doc => {
    batch.set(aiPresetsRef.doc(doc.id), doc.data())
  })

  await batch.commit()
  console.log(`Migrated ${snapshot.size} documents`)
}
```

## Complexity Tracking

> No violations—this is a pure rename/deprecation refactor with no new abstractions.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |
