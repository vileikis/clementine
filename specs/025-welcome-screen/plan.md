# Implementation Plan: Welcome Screen Customization

**Branch**: `025-welcome-screen` | **Date**: 2024-12-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/025-welcome-screen/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Enable event creators to customize the guest welcome/landing screen with personalized content (title, description, hero media) and flexible experience display layouts (list/grid). The feature extends the Event General tab with a Welcome Section, leverages existing preview-shell and theming modules for live preview, and implements autosave with debounced persistence.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), React 19, Next.js 16
**Primary Dependencies**: React 19, Next.js 16, Tailwind CSS v4, shadcn/ui, Zod 4.x, Firebase (Client SDK + Admin SDK), sonner (toasts)
**Storage**: Firebase Firestore (events subcollection), Firebase Storage (media uploads)
**Testing**: Jest unit tests (co-located with source)
**Target Platform**: Web (mobile-first 320px-768px, responsive to desktop)
**Project Type**: Web application (Next.js App Router monorepo)
**Performance Goals**: Preview updates <200ms, autosave completes <2 seconds, media uploads <10 seconds for 50MB files
**Constraints**: Mobile-first responsive, touch targets ≥44x44px, TypeScript strict mode, no `any` escapes
**Scale/Scope**: Single feature extending existing Event General tab

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Verify compliance with Clementine Constitution (`.specify/memory/constitution.md`):

- [x] **Mobile-First Responsive Design**: Feature designed mobile-first (320px-768px), touch targets ≥44x44px, readable typography (≥14px)
- [x] **Clean Code & Simplicity**: No premature optimization, YAGNI applied, single responsibility maintained
- [x] **Type-Safe Development**: TypeScript strict mode, no `any` escapes, Zod validation for external inputs
- [x] **Minimal Testing Strategy**: Jest unit tests for critical paths (70%+ coverage goal), tests co-located with source
- [x] **Validation Loop Discipline**: Plan includes validation tasks (lint, type-check, test) before completion
- [x] **Firebase Architecture Standards**: Admin SDK for writes/server-side, Client SDK for real-time reads, schemas in `features/events/schemas/`, public images stored as full URLs
- [x] **Feature Module Architecture**: All code in `features/events/` vertical slice, barrel exports, feature-local schemas
- [x] **Technical Standards**: Applicable standards from `standards/` reviewed and referenced

**Complexity Violations**: None. Feature reuses existing infrastructure (preview-shell, theming, media upload) without introducing new architectural patterns.

## Project Structure

### Documentation (this feature)

```text
specs/025-welcome-screen/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── welcome-api.md   # Server action contracts
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
web/src/features/events/
├── actions/
│   ├── index.ts                        # Re-exports all actions
│   └── events.actions.ts               # ADD: updateEventWelcomeAction
├── components/
│   ├── index.ts                        # Re-exports all components
│   ├── EventGeneralTab.tsx             # MODIFY: Two-column layout, owns form state
│   ├── welcome/                        # NEW: Welcome-related components
│   │   ├── index.ts                    # Re-exports welcome components
│   │   ├── WelcomeSection.tsx          # NEW: Form fields (receives form prop)
│   │   ├── WelcomePreview.tsx          # NEW: Preview (receives welcome + event)
│   │   └── ExperienceCards.tsx         # NEW: Card list/grid for preview
│   └── general/                        # Existing sections
│       ├── ExperiencesSection.tsx
│       └── ExtrasSection.tsx
├── hooks/
│   └── index.ts                        # Existing hooks (useEvent, etc.)
├── repositories/
│   ├── index.ts                        # Re-exports repositories
│   └── events.repository.ts            # ADD: updateEventWelcome function
├── schemas/
│   ├── index.ts                        # Re-exports schemas
│   └── events.schemas.ts               # ADD: eventWelcomeSchema
└── types/
    ├── index.ts                        # Re-exports types
    └── events.types.ts                 # ADD: EventWelcome, ExperienceLayout

web/src/features/preview-shell/        # REUSE: PreviewShell, DeviceFrame
web/src/features/theming/               # REUSE: ThemeProvider, ThemedBackground
web/src/components/shared/
└── ImageUploadField.tsx               # REUSE: Media upload component
web/src/hooks/
└── useAutoSave.ts                     # REUSE: Autosave hook
```

**Structure Decision**: Extend existing `features/events/` vertical slice following Feature Module Architecture (Constitution Principle VII). Welcome components grouped in `components/welcome/` subfolder. EventGeneralTab owns form state and renders two-column layout (left: sections, right: preview). Reuse preview-shell, theming modules, and useAutoSave hook via imports.

## Complexity Tracking

> No complexity violations identified. Feature uses existing patterns and infrastructure.

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| None      | N/A        | N/A                                  |
