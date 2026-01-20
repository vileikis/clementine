# Implementation Plan: Step List Styling Updates

**Branch**: `034-step-list-styling` | **Date**: 2026-01-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/034-step-list-styling/spec.md`

## Summary

Update the visual styling and interaction behavior of the StepList, StepListItem, and AddStepDialog components. The primary changes are:
1. Add category-based colored icon wrappers using design system tokens (muted/info/success/destructive)
2. Remove the dedicated drag handle and enable full-item dragging
3. Change cursor to pointer on hover with grabbing cursor during drag

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode, ES2022 target)
**Primary Dependencies**: React 19.2.0, TanStack Start 1.132.0, @dnd-kit/core 6.3.1, @dnd-kit/sortable 10.0.0, Tailwind CSS v4, shadcn/ui
**Storage**: N/A (UI-only changes)
**Testing**: Vitest (manual visual testing for this feature)
**Target Platform**: Web (mobile-first, 320px-768px primary)
**Project Type**: Web application (TanStack Start monorepo)
**Performance Goals**: No performance impact (styling changes only)
**Constraints**: Must use design system tokens (no hard-coded colors), maintain accessibility (ARIA attributes)
**Scale/Scope**: 3 component files to modify

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | ✅ PASS | Step list is already mobile-friendly, touch targets preserved |
| II. Clean Code & Simplicity | ✅ PASS | Simple styling changes, no over-engineering |
| III. Type-Safe Development | ✅ PASS | TypeScript strict mode, no changes to types needed |
| IV. Minimal Testing Strategy | ✅ PASS | UI styling - manual visual testing appropriate |
| V. Validation Gates | ✅ PASS | Will run `pnpm app:check` and verify design-system.md compliance |
| VI. Frontend Architecture | ✅ PASS | Client-only UI changes |
| VII. Backend & Firebase | N/A | No backend changes |
| VIII. Project Structure | ✅ PASS | Files already exist in correct domain structure |

**Standards Compliance**:
- `frontend/design-system.md`: Must use theme tokens (`muted`, `info`, `success`, `destructive`)
- `frontend/component-libraries.md`: Using existing shadcn/ui components
- `frontend/accessibility.md`: Preserve ARIA attributes, keyboard navigation

## Project Structure

### Documentation (this feature)

```text
specs/034-step-list-styling/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (minimal - UI-only feature)
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (files to modify)

```text
apps/clementine-app/src/domains/experience/
├── designer/
│   └── components/
│       ├── StepList.tsx         # Minor updates (remove GripVertical import if unused)
│       ├── StepListItem.tsx     # Major updates (colored icons, drag behavior)
│       └── AddStepDialog.tsx    # Updates (colored icon wrappers)
└── steps/
    └── registry/
        └── step-utils.ts        # Add getCategoryColorClasses utility function
```

**Structure Decision**: Modifying existing files in the experience domain. Adding a utility function for category-to-color mapping in step-utils.ts to centralize the logic for reuse across StepListItem and AddStepDialog.

## Complexity Tracking

> No violations - feature follows simplicity principle
