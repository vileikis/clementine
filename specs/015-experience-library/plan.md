# Implementation Plan: Experience Library

**Branch**: `015-experience-library` | **Date**: 2025-12-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/015-experience-library/spec.md`

## Summary

Transform the legacy Journeys feature module into a company-scoped Experiences module with a new top-level `/experiences` Firestore collection. The existing `journeys` module code serves as the foundation - refactoring and renaming rather than rewriting. The Experience Library provides a company-scoped UI for viewing, creating, editing, and renaming experiences, with the ExperienceEditor (renamed from JourneyEditor) as the core editing interface.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Next.js 16, React 19, Firebase Firestore, Zod 4.x, react-hook-form, @dnd-kit/core, shadcn/ui
**Storage**: Firebase Firestore (`/experiences/{experienceId}`, `/experiences/{experienceId}/steps/{stepId}`)
**Testing**: Jest + React Testing Library (70%+ coverage goal)
**Target Platform**: Web (mobile-first: 320px-768px primary, tablet/desktop enhancement)
**Project Type**: pnpm monorepo (`web/` workspace)
**Performance Goals**: Library load < 2s, editor load < 3s, step operations < 2s
**Constraints**: Mobile touch targets ≥ 44x44px, no migration required (fresh start)
**Scale/Scope**: Company-scoped experiences, ~4 screens (list, detail/editor, create dialog, rename dialog)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Verify compliance with Clementine Constitution (`.specify/memory/constitution.md`):

- [x] **Mobile-First Responsive Design**: Experience list uses card grid (responsive), editor uses existing 3-panel layout (collapses on mobile), touch targets ≥ 44x44px
- [x] **Clean Code & Simplicity**: Refactoring existing journeys module (proven patterns), no new abstraction layers, YAGNI applied
- [x] **Type-Safe Development**: TypeScript strict mode, Zod schemas for Experience/Step validation, no `any` escapes
- [x] **Minimal Testing Strategy**: Jest unit tests for critical paths (CRUD operations, validation), co-located with source
- [x] **Validation Loop Discipline**: Plan includes lint, type-check, test validation before completion
- [x] **Firebase Architecture Standards**: Admin SDK for write operations via Server Actions, Client SDK for real-time list subscriptions, schemas in `features/experiences/schemas/`
- [x] **Technical Standards**: Following existing journeys module patterns, `standards/global/feature-modules.md` for module structure

**Complexity Violations**: None - leveraging existing patterns from journeys module.

## Project Structure

### Documentation (this feature)

```text
specs/015-experience-library/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
web/src/
├── features/
│   ├── experiences/                    # NEW - Refactored from journeys
│   │   ├── types/
│   │   │   ├── experiences.types.ts    # Experience interface
│   │   │   └── index.ts
│   │   ├── schemas/
│   │   │   ├── experiences.schemas.ts  # Zod validation
│   │   │   └── index.ts
│   │   ├── repositories/
│   │   │   ├── experiences.repository.ts
│   │   │   └── index.ts
│   │   ├── actions/
│   │   │   ├── experiences.ts          # Server actions
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── useExperiences.ts       # Real-time subscription
│   │   │   ├── useSteps.ts             # Refactored from journeys
│   │   │   ├── useStepMutations.ts
│   │   │   ├── useSelectedStep.ts
│   │   │   └── index.ts
│   │   ├── components/
│   │   │   ├── ExperienceList.tsx
│   │   │   ├── ExperienceCard.tsx
│   │   │   ├── CreateExperienceDialog.tsx
│   │   │   ├── RenameExperienceDialog.tsx
│   │   │   ├── DeleteExperienceDialog.tsx
│   │   │   ├── editor/
│   │   │   │   ├── ExperienceEditor.tsx
│   │   │   │   ├── ExperienceEditorHeader.tsx
│   │   │   │   ├── StepList.tsx
│   │   │   │   ├── StepListItem.tsx
│   │   │   │   ├── StepEditor.tsx
│   │   │   │   ├── StepPreview.tsx
│   │   │   │   ├── StepTypeSelector.tsx
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── constants.ts
│   │   └── index.ts
│   └── steps/                          # EXISTING - Minor updates
│       ├── constants.ts                # Hide deprecated step types
│       └── ...                         # Rest unchanged
├── app/(workspace)/[companySlug]/
│   └── exps/
│       ├── page.tsx                    # Experience list (replace placeholder)
│       └── [expId]/
│           └── page.tsx                # Experience editor (replace placeholder)
└── lib/firebase/
    └── admin.ts                        # Admin SDK (existing)
```

**Structure Decision**: Following existing feature module pattern from journeys. The experiences module is a refactored copy of journeys with:
- Collection path changed from `/events/{eventId}/journeys` → `/experiences`
- Steps path changed from `/events/{eventId}/steps` → `/experiences/{experienceId}/steps`
- Added `companyId` field for company scoping
- Removed `eventId` dependency

## Complexity Tracking

> No violations - leveraging existing proven patterns from journeys module.

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| N/A       | N/A        | N/A                                  |
