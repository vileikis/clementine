# Implementation Plan: Step List Naming

**Branch**: `031-step-list-naming` | **Date**: 2026-01-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/031-step-list-naming/spec.md`

## Summary

Modify the StepListItem component to display custom step titles when available, falling back to default step type labels when no title is configured. This improves step identification in the designer sidebar by showing meaningful, user-defined titles instead of generic type labels.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode, ES2022 target)
**Primary Dependencies**: React 19.2.0, TanStack Start 1.132.0, Zod 4.1.12, shadcn/ui
**Storage**: N/A (no data model changes - display logic only)
**Testing**: Vitest 3.0.5 with Testing Library
**Target Platform**: Web (TanStack Start SSR application)
**Project Type**: Web application (monorepo)
**Performance Goals**: No measurable impact (simple display logic)
**Constraints**: Must not break existing step list functionality (drag-drop, selection, deletion)
**Scale/Scope**: Single component modification (StepListItem.tsx)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | PASS | No UI layout changes - existing truncation handles mobile |
| II. Clean Code & Simplicity | PASS | Simple conditional display logic, no new abstractions |
| III. Type-Safe Development | PASS | TypeScript strict mode, type-safe config access |
| IV. Minimal Testing Strategy | PASS | Unit tests for display logic only |
| V. Validation Gates | PASS | Will run pnpm app:check before completion |
| VI. Frontend Architecture | PASS | Client-side display logic only, no data fetching changes |
| VII. Backend & Firebase | N/A | No backend changes |
| VIII. Project Structure | PASS | Modifying existing component, no new files needed |

**Standards Compliance**:
- `frontend/design-system.md`: No styling changes required
- `frontend/component-libraries.md`: Using existing shadcn/ui patterns
- `global/code-quality.md`: Simple, focused change

## Project Structure

### Documentation (this feature)

```text
specs/031-step-list-naming/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (N/A - no data changes)
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
apps/clementine-app/src/domains/experience/
├── designer/
│   └── components/
│       ├── StepList.tsx           # Parent component (no changes needed)
│       └── StepListItem.tsx       # TARGET: Add title display logic
└── steps/
    ├── registry/
    │   ├── step-registry.ts       # StepDefinition with default labels
    │   └── step-utils.ts          # getStepDefinition utility
    └── schemas/
        └── *.schema.ts            # Step config schemas with title field
```

**Structure Decision**: Modifying existing StepListItem component. No new files required.

## Complexity Tracking

> No violations. This is a minimal change following existing patterns.

N/A - Simple display logic modification with no architectural changes.
