# Implementation Plan: Event-Experience Integration

**Branch**: `025-event-exp-integration` | **Date**: 2026-01-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/025-event-exp-integration/spec.md`

## Summary

Enable event admins to connect workspace experiences to events via a slide-over drawer UI. Experiences are assigned to three slots (main array, pregate single, preshare single) with profile-based filtering. The implementation extends the existing event config schema and integrates with the Welcome and Settings tabs using established patterns (2-column layout, @dnd-kit for drag-and-drop, Sheet component for drawers).

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode, ES2022 target)
**Primary Dependencies**: TanStack Start 1.132.0, TanStack Query 5.66.5, TanStack Router 1.132.0, React 19.2.0, Zod 4.1.12, @dnd-kit/core, @dnd-kit/sortable, shadcn/ui (Sheet component)
**Storage**: Firebase Firestore (client SDK) - extends `projectEventConfigSchema` with `experiences` field
**Testing**: Vitest (unit tests, 70%+ coverage target)
**Target Platform**: Web application (mobile-first, 320px-768px primary viewport)
**Project Type**: Web application (TanStack Start monorepo)
**Performance Goals**: Search filtering < 500ms, drag-and-drop immediate feedback, preview updates < 100ms
**Constraints**: Mobile-first design (44x44px touch targets), real-time preview updates
**Scale/Scope**: Part of event designer, integrates with existing Welcome and Settings tabs

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | PASS | Touch targets (44x44px), responsive drawer, mobile-optimized list items |
| II. Clean Code & Simplicity | PASS | Follows existing patterns (2-column layout, @dnd-kit, Sheet component) |
| III. Type-Safe Development | PASS | Zod schemas for experience references, TypeScript strict mode |
| IV. Minimal Testing Strategy | PASS | Unit tests for schema validation and slot filtering logic |
| V. Validation Gates | PASS | Will run `pnpm app:check` before commits |
| VI. Frontend Architecture | PASS | Client-first pattern, Firebase client SDK, TanStack Query |
| VII. Backend & Firebase | PASS | Extends existing Firestore schema with `experiences` field |
| VIII. Project Structure | PASS | New `domains/event/experiences/` vertical slice |

## Project Structure

### Documentation (this feature)

```text
specs/025-event-exp-integration/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (internal component contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
apps/clementine-app/src/
├── domains/event/
│   ├── experiences/                    # NEW - Experience integration module
│   │   ├── components/
│   │   │   ├── ExperienceSlotManager.tsx
│   │   │   ├── ExperienceSlotItem.tsx
│   │   │   ├── ConnectExperienceDrawer.tsx
│   │   │   └── ExperienceCard.tsx
│   │   ├── hooks/
│   │   │   ├── useExperiencesForSlot.ts
│   │   │   ├── useExperiencesForSlot.test.ts   # Colocated test
│   │   │   ├── useUpdateEventExperiences.ts
│   │   │   └── useUpdateEventExperiences.test.ts  # Colocated test
│   │   ├── schemas/
│   │   │   ├── event-experiences.schema.ts
│   │   │   └── event-experiences.schema.test.ts  # Colocated test
│   │   └── index.ts
│   ├── welcome/
│   │   └── components/
│   │       └── WelcomeConfigPanel.tsx  # MODIFIED - Add experiences section
│   ├── settings/
│   │   └── containers/
│   │       └── EventSettingsPage.tsx   # MODIFIED - Add Guest Flow section
│   └── shared/
│       └── schemas/
│           └── project-event-config.schema.ts  # MODIFIED - Add experiences field
```

**Structure Decision**: Follows existing vertical slice architecture. New `experiences` module under `domains/event/` aligns with existing Welcome, Share, Theme, Settings subdomains. Tests are colocated with implementation files.

## Complexity Tracking

> No constitution violations - implementation follows established patterns.

| Aspect | Approach | Rationale |
|--------|----------|-----------|
| Drawer component | Use existing Sheet from shadcn/ui | Reuse over rebuild |
| Drag-and-drop | Use existing @dnd-kit patterns | Consistent with StepList |
| Schema extension | Add to projectEventConfigSchema | Follows existing pattern |
| Profile filtering | Simple enum comparison | No complex logic needed |
