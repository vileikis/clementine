# Implementation Plan: Experience Editor & AI Playground

**Branch**: `004-exp-editor` | **Date**: 2025-11-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-exp-editor/spec.md`

## Summary

Implement a dedicated Experience Editor route (`/events/{eventId}/design/experiences/{experienceId}`) with a split-screen workspace. The left panel provides AI configuration (model selector, prompt editor), while the right panel provides a playground for testing AI transformations in real-time. Builds on existing experiences module architecture using discriminated unions and Server Actions pattern.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Node.js 18+
**Primary Dependencies**: Next.js 16, React 19, Tailwind CSS v4, shadcn/ui, Zod 4.x, Firebase (Firestore + Storage)
**Storage**: Firestore `/experiences/{experienceId}` collection, Firebase Storage for temporary test images
**Testing**: Jest unit tests, React Testing Library for components
**Target Platform**: Web (mobile-first 320px-768px, desktop 1024px+)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: Editor loads <3s, AI transformation <60s, save operations <2s
**Constraints**: Mobile-first responsive, touch targets ≥44x44px, 10MB max image upload
**Scale/Scope**: Single experience editor page, photo experience type only (video/gif out of scope)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Verify compliance with Clementine Constitution (`.specify/memory/constitution.md`):

- [x] **Mobile-First Responsive Design**: Split-screen stacks vertically on mobile, touch targets ≥44x44px, typography ≥14px
- [x] **Clean Code & Simplicity**: Extends existing ExperienceEditor pattern, no new abstractions needed
- [x] **Type-Safe Development**: Uses existing Zod schemas, TypeScript strict mode maintained
- [x] **Minimal Testing Strategy**: Unit tests for playground upload/generate logic, existing editor patterns already tested
- [x] **Validation Loop Discipline**: Plan includes lint, type-check, test tasks before completion
- [x] **Firebase Architecture Standards**: Server Actions for saves, existing aiPhotoConfig schema, schemas in `web/src/lib/schemas/`
- [x] **Technical Standards**: Follows established patterns in experiences module

**Complexity Violations**: None - this feature follows existing patterns and adds no new architectural complexity.

## Project Structure

### Documentation (this feature)

```text
specs/004-exp-editor/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
web/
├── src/
│   ├── app/
│   │   └── (dashboard)/
│   │       └── events/
│   │           └── [eventId]/
│   │               └── (studio)/
│   │                   └── design/
│   │                       └── experiences/
│   │                           └── [experienceId]/
│   │                               └── page.tsx    # Editor route (enhance existing)
│   ├── features/
│   │   └── experiences/
│   │       ├── components/
│   │       │   ├── ExperienceEditor.tsx           # Wrapper (existing)
│   │       │   ├── PhotoExperienceEditor.tsx      # Photo editor (enhance)
│   │       │   ├── AIPlayground.tsx               # NEW: Playground panel
│   │       │   └── AITransformSettings.tsx        # Existing AI config
│   │       ├── actions/
│   │       │   └── photo-update.ts                # Existing update action
│   │       └── schemas/
│   │           └── experiences.schemas.ts         # Existing schemas
│   ├── lib/
│   │   └── ai/
│   │       ├── index.ts                           # AI client exports
│   │       └── providers/                         # Google AI, n8n, mock
│   └── components/
│       └── shared/
│           └── ImageUploadField.tsx               # Existing upload component
└── tests/
    └── unit/
        └── experiences/
            └── AIPlayground.test.tsx              # NEW: Playground tests
```

**Structure Decision**: Extends existing experiences module structure. Only new component needed is `AIPlayground.tsx`.

## Complexity Tracking

> No violations - feature follows existing patterns.
