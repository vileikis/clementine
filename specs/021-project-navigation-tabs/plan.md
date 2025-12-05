# Implementation Plan: Project Navigation Tabs

**Branch**: `021-project-navigation-tabs` | **Date**: 2025-12-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/021-project-navigation-tabs/spec.md`

## Summary

Update the project layout navigation to display inline tabs within the header component (matching ExperienceTabs pattern), ensure navigation persists when viewing nested event pages, and constrain content to a centered, readable width on large viewports. Create a reusable InlineTabs component that can be shared between Project and Experience layouts.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Next.js 16, React 19, Tailwind CSS v4, shadcn/ui
**Storage**: N/A (UI-only feature, no data changes)
**Testing**: Jest + React Testing Library (unit tests for component)
**Target Platform**: Web (mobile-first: 320px-768px primary, desktop: 1024px+)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: No performance impact - purely presentational changes
**Constraints**: Touch targets ≥44x44px, readable typography (≥14px)
**Scale/Scope**: 3 components modified, 1 new shared component

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Verify compliance with Clementine Constitution (`.specify/memory/constitution.md`):

- [x] **Mobile-First Responsive Design**: Tabs designed mobile-first, touch targets ≥44x44px (`min-h-[44px]`), readable typography (14px)
- [x] **Clean Code & Simplicity**: Reusing existing ExperienceTabs pattern, single-purpose InlineTabs component, no premature abstraction
- [x] **Type-Safe Development**: TypeScript strict mode, strongly typed props interface, no external inputs requiring Zod
- [x] **Minimal Testing Strategy**: Jest unit test for InlineTabs component, co-located with source
- [x] **Validation Loop Discipline**: Plan includes lint, type-check before completion
- [x] **Firebase Architecture Standards**: N/A - UI-only feature, no Firebase interaction
- [x] **Feature Module Architecture**: InlineTabs placed in `components/shared/` as it's cross-feature; no new feature module needed
- [x] **Technical Standards**: Follows `standards/frontend/components.md`, `standards/frontend/css.md`, `standards/frontend/responsive.md`

**Complexity Violations**: None - this feature follows existing patterns with no new abstractions.

## Project Structure

### Documentation (this feature)

```text
specs/021-project-navigation-tabs/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # N/A - UI-only feature
├── quickstart.md        # Phase 1 output
├── contracts/           # N/A - no API contracts
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
web/src/
├── components/
│   └── shared/
│       ├── InlineTabs.tsx           # NEW: Reusable inline tabs component
│       ├── InlineTabs.test.tsx      # NEW: Unit tests for InlineTabs
│       └── index.ts                 # UPDATE: Export InlineTabs
├── features/
│   ├── projects/
│   │   └── components/
│   │       └── ProjectDetailsHeader.tsx  # UPDATE: Add InlineTabs integration
│   └── experiences/
│       └── components/
│           └── editor/
│               └── ExperienceTabs.tsx    # REFACTOR: Use InlineTabs internally
└── app/
    └── (workspace)/
        └── [companySlug]/
            └── [projectId]/
                └── layout.tsx            # UPDATE: Remove inline tabs, add content container
```

**Structure Decision**: UI-only feature modifying existing components. New shared component in `components/shared/` following existing `NavTabs.tsx` pattern. No new feature modules required.

## Complexity Tracking

> No violations - feature follows existing patterns.
