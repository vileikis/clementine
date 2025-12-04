# Implementation Plan: AI Transform Step Playground

**Branch**: `019-ai-transform-playground` | **Date**: 2024-12-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/019-ai-transform-playground/spec.md`

## Summary

Add an AI Playground test panel to the AI Transform step editor, enabling experience creators to test AI transformations with sample images directly within the Experience Editor. The implementation adapts the existing `AIPlayground` component from the deprecated `ai-presets` module, creating a new server action that uses step configuration instead of AI preset configuration.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Next.js 16, React 19, shadcn/ui, react-hook-form, Zod 4.x
**Storage**: Firebase Firestore (step config), Firebase Storage (temp images)
**Testing**: Jest (unit tests, co-located)
**Target Platform**: Web (mobile-first, 320px-768px primary)
**Project Type**: Web application (Next.js monorepo)
**Performance Goals**: Dialog loads < 1s, AI generation < 60s (per constitution)
**Constraints**: 10MB max image size, 2-minute generation timeout
**Scale/Scope**: Single feature addition to existing Experience Editor

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Verify compliance with Clementine Constitution (`.specify/memory/constitution.md`):

- [x] **Mobile-First Responsive Design**: Dialog stacks vertically on mobile (< md), horizontal on desktop; touch targets ≥44x44px; readable typography
- [x] **Clean Code & Simplicity**: Adapts existing `AIPlayground` pattern; no new abstractions; single responsibility maintained
- [x] **Type-Safe Development**: TypeScript strict mode; Zod validation for server action inputs; no `any` escapes
- [x] **Minimal Testing Strategy**: Jest unit tests for server action validation logic; component tests co-located
- [x] **Validation Loop Discipline**: Implementation includes lint, type-check, test tasks before completion
- [x] **Firebase Architecture Standards**: Admin SDK for AI generation server action; temp storage with cleanup metadata; schemas in `features/steps/schemas/`
- [x] **Feature Module Architecture**: All new code in `features/steps/` module; barrel exports; feature-local schemas
- [x] **Technical Standards**: Follows existing patterns from `ai-presets` playground implementation

**Complexity Violations**: None. This feature reuses existing patterns and adds no new architectural complexity.

## Project Structure

### Documentation (this feature)

```text
specs/019-ai-transform-playground/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── step-playground.ts  # Server action contract
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
web/src/features/steps/
├── actions/
│   ├── index.ts                    # Export new action
│   ├── types.ts                    # Add AI_GENERATION_FAILED error code
│   └── step-playground.ts          # NEW: Server action for playground
├── components/
│   ├── editors/
│   │   └── AiTransformEditor.tsx   # MODIFY: Add Test button + dialog state
│   └── playground/                 # NEW: Playground components folder
│       ├── index.ts                  # Barrel export
│       ├── StepPlaygroundDialog.tsx  # NEW: Dialog wrapper
│       └── StepAIPlayground.tsx      # NEW: Playground UI (horizontal layout)
└── schemas/
    ├── index.ts                    # Export new schemas
    └── step-playground.schemas.ts  # NEW: Input/output schemas
```

### Reference Implementation (patterns to adapt)

```text
web/src/features/ai-presets/
├── actions/
│   └── playground-generate.ts      # Reference: server action pattern
├── components/shared/
│   └── AIPlayground.tsx            # Reference: UI component pattern
└── schemas/
    └── ai-presets.schemas.ts       # Reference: playgroundGenerateInputSchema
```

**Structure Decision**: All new code lives within the existing `features/steps/` module following Feature Module Architecture (Constitution VII). No new directories created at the feature level.

## Complexity Tracking

> No violations - feature reuses established patterns.

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| N/A       | N/A        | N/A                                  |

## Post-Design Constitution Re-Check

_Re-verified after Phase 1 design completion._

All constitution principles remain satisfied:

- [x] **Mobile-First**: Horizontal layout with `md:` breakpoint responsive classes confirmed in quickstart.md
- [x] **Simplicity**: No new patterns introduced; adapts existing `AIPlayground` component
- [x] **Type-Safety**: Zod schemas defined in contracts/step-playground.ts
- [x] **Testing**: Test tasks included in quickstart manual testing checklist
- [x] **Validation Loop**: pnpm lint, type-check, test commands documented
- [x] **Firebase Standards**: Admin SDK via Server Action; feature-local schemas
- [x] **Feature Modules**: All code in `features/steps/`; barrel exports planned

## Generated Artifacts

| Artifact | Path | Status |
|----------|------|--------|
| Research | `specs/019-ai-transform-playground/research.md` | Complete |
| Data Model | `specs/019-ai-transform-playground/data-model.md` | Complete |
| Contracts | `specs/019-ai-transform-playground/contracts/step-playground.ts` | Complete |
| Quickstart | `specs/019-ai-transform-playground/quickstart.md` | Complete |

## Next Steps

Run `/speckit.tasks` to generate actionable implementation tasks from this plan.
