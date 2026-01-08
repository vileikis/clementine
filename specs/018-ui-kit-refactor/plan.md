# Implementation Plan: UI Kit Refactor

**Branch**: `018-ui-kit-refactor` | **Date**: 2026-01-08 | **Spec**: [requirements/018-ui-kit-refactor.md](/requirements/018-ui-kit-refactor.md)
**Input**: Feature specification from `/requirements/018-ui-kit-refactor.md`

## Summary

Consolidate the ui-kit directory structure by merging duplicate components from `components/ui/` and `components/` into a unified `/ui` folder. Create barrel exports for all components and update ~42 imports across the codebase to use the new `@/ui-kit/ui` import path.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode, ES2022 target)
**Primary Dependencies**: React 19.2.0, shadcn/ui, Radix UI, class-variance-authority
**Storage**: N/A (pure refactoring, no data changes)
**Testing**: Vitest (no new tests needed - validate via type-check and build)
**Target Platform**: Web (TanStack Start application)
**Project Type**: Web application (monorepo workspace)
**Performance Goals**: N/A (no runtime changes)
**Constraints**: Must maintain backward compatibility during transition
**Scale/Scope**: ~42 import updates, 26 component files, 3 deletions

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | N/A | No UI changes |
| II. Clean Code & Simplicity | PASS | Reduces duplication, simplifies structure |
| III. Type-Safe Development | PASS | Maintains strict TypeScript |
| IV. Minimal Testing Strategy | PASS | Validates via type-check/build |
| V. Validation Gates | PASS | Will run pnpm type-check && pnpm build |
| VI. Frontend Architecture | N/A | No architectural changes |
| VII. Backend & Firebase | N/A | No backend changes |
| VIII. Project Structure | PASS | Follows barrel export principle |

**Standards Compliance:**
- `frontend/component-libraries.md`: PASS - maintains shadcn/ui patterns
- `frontend/design-system.md`: N/A - no design token changes
- `global/project-structure.md`: PASS - enforces barrel exports

## Project Structure

### Documentation (this feature)

```text
specs/018-ui-kit-refactor/
├── plan.md              # This file
├── research.md          # Phase 0 output (minimal - no unknowns)
├── data-model.md        # N/A - no data model
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
apps/clementine-app/src/ui-kit/
├── ui/                        # RENAMED from components/
│   ├── alert-dialog.tsx
│   ├── badge.tsx
│   ├── breadcrumb.tsx         # MOVED from components/ui/
│   ├── button.tsx
│   ├── card.tsx
│   ├── collapsible.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   ├── form.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── popover.tsx
│   ├── progress.tsx           # MOVED from components/ui/
│   ├── scroll-area.tsx
│   ├── select.tsx
│   ├── sheet.tsx
│   ├── skeleton.tsx
│   ├── slider.tsx
│   ├── sonner.tsx
│   ├── switch.tsx
│   ├── textarea.tsx           # MOVED from components/ui/
│   ├── toggle-group.tsx
│   ├── toggle.tsx
│   └── index.ts               # NEW - barrel export
├── theme/
│   └── styles.css
└── README.md                  # UPDATED
```

**Structure Decision**: Rename `components/` → `ui/` for cleaner imports aligned with shadcn/ui conventions.

## Complexity Tracking

> No violations - this is a simplification refactoring.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
