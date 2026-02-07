# Implementation Plan: Experience Layout Polish

**Branch**: `feature/exp-layout-polish` | **Date**: 2026-02-04 | **Spec**: [spec.md](../../requirements/exp-layout-polish/spec.md)
**Input**: Feature specification from `/requirements/exp-layout-polish/spec.md`

## Summary

Fix broken mobile scrolling behavior across guest-facing experience pages by restructuring the layout hierarchy. The current architecture has the scroll container (`overflow-auto`) in `ThemedBackground`, causing TopBar and background to scroll with content. The fix moves scroll responsibility to the correct level: `ExperienceRuntime` creates a scroll wrapper around content only (excluding TopBar), while `ThemedBackground` becomes a simple flex container with no scroll handling.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode)
**Primary Dependencies**: React 19.2.0, TanStack Start 1.132.0, Tailwind CSS v4
**Storage**: N/A (UI-only changes)
**Testing**: Vitest (manual testing primary for layout changes)
**Target Platform**: Web - Mobile-first (320px-768px primary), Desktop secondary
**Project Type**: Web application (monorepo - apps/clementine-app)
**Performance Goals**: No layout shift, smooth 60fps scrolling, <2s page load
**Constraints**: Must preserve existing visual appearance, no breaking changes to component APIs
**Scale/Scope**: ~12 component files affected, all guest-facing pages

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | PASS | Feature specifically fixes mobile scrolling behavior |
| II. Clean Code & Simplicity | PASS | Simplifies layout by removing overflow from ThemedBackground |
| III. Type-Safe Development | PASS | No type changes, TypeScript strict mode maintained |
| IV. Minimal Testing Strategy | PASS | Manual testing appropriate for layout changes |
| V. Validation Gates | PASS | Will run `pnpm app:check` before commit |
| VI. Frontend Architecture | PASS | Client-first pattern unchanged |
| VII. Backend & Firebase | N/A | No backend changes |
| VIII. Project Structure | PASS | Following vertical slice architecture |

**Standards to Review Before Completion**:
- `frontend/design-system.md` - Theme tokens preserved
- `frontend/responsive.md` - Mobile-first breakpoints maintained
- `frontend/component-libraries.md` - shadcn/ui patterns preserved

## Project Structure

### Documentation (this feature)

```text
specs/exp-layout-polish/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (component contracts)
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── components.md    # Component interface contracts
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
apps/clementine-app/src/
├── shared/theming/components/
│   └── ThemedBackground.tsx          # Remove overflow-auto
├── domains/experience/runtime/
│   ├── components/
│   │   └── RuntimeTopBar.tsx         # Add shrink-0
│   └── containers/
│       └── ExperienceRuntime.tsx     # Add flex wrapper + scroll container
├── domains/experience/steps/renderers/
│   └── StepLayout.tsx                # Add centering/padding
├── domains/project-config/welcome/components/
│   └── WelcomeRenderer.tsx           # Remove ThemedBackground, own scroll
├── domains/project-config/share/components/
│   ├── ShareLoadingRenderer.tsx      # Add scroll wrapper
│   └── ShareReadyRenderer.tsx        # Verify scroll zone
├── domains/guest/containers/
│   ├── WelcomeScreen.tsx             # Own ThemedBackground
│   ├── ExperiencePage.tsx            # Remove pt-20 from content
│   ├── PregatePage.tsx               # Remove pt-20 from content
│   └── PresharePage.tsx              # Remove pt-20 from content
└── domains/project-config/welcome/containers/
    └── WelcomeEditorPage.tsx         # Wrap with ThemedBackground
```

**Structure Decision**: Vertical slice architecture maintained. Changes span shared theming, experience domain, project-config domain, and guest domain. All changes are internal refactoring within existing component boundaries.

## Complexity Tracking

> No violations - all changes follow Clean Code & Simplicity principles.

N/A - This feature simplifies the existing layout by:
1. Removing scroll handling from `ThemedBackground` (simpler component)
2. Consolidating scroll logic in `ExperienceRuntime` (single responsibility)
3. Making renderers self-contained (each handles own scroll)
