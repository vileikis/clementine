# Implementation Plan: Step System & Experience Editor

**Branch**: `022-step-system-editor` | **Date**: 2026-01-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/022-step-system-editor/spec.md`

## Summary

Build a 3-column experience editor enabling admins to add, configure, reorder, and preview steps within experiences. Includes step registry with 8 MVP step types, edit-mode renderers for visual preview, type-specific configuration panels, auto-save to draft, and publish workflow with validation.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode, ES2022 target)
**Primary Dependencies**: TanStack Start 1.132.0, TanStack Query 5.66.5, TanStack Router 1.132.0, React 19.2.0, Zustand 5.0.9, Zod 4.1.12, @dnd-kit (drag-and-drop)
**Storage**: Firebase Firestore (client SDK) - `/workspaces/{workspaceId}/experiences/{experienceId}` with draft/published structure
**Testing**: Vitest with Testing Library
**Target Platform**: Web (mobile-first responsive design)
**Project Type**: Web application (TanStack Start monorepo)
**Performance Goals**: Preview update <100ms, auto-save <2s, experience creation <10 minutes for 5 steps
**Constraints**: 2s debounce for auto-save, mobile-first UI (44px touch targets)
**Scale/Scope**: 8 step types, 3 profiles, 3-column responsive layout

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | PASS | Phone-frame preview, responsive 3-column layout, 44px touch targets |
| II. Clean Code & Simplicity | PASS | Following existing patterns (WelcomeEditor, EditorControls), no over-engineering |
| III. Type-Safe Development | PASS | Zod schemas for all step configs, TypeScript strict mode, runtime validation |
| IV. Minimal Testing Strategy | PASS | Focus on critical paths (step creation, auto-save, publish) |
| V. Validation Gates | PASS | Will run `pnpm app:check` before commits, standards compliance review |
| VI. Frontend Architecture | PASS | Client-first with Firebase client SDK, TanStack Query for state |
| VII. Backend & Firebase | PASS | Client SDK for reads, Firestore rules for security |
| VIII. Project Structure | PASS | Vertical slice in `domains/experience/`, following established patterns |

**Applicable Standards**:
- `frontend/design-system.md` - Theme tokens, no hard-coded colors
- `frontend/component-libraries.md` - shadcn/ui components, EditorControls
- `frontend/state-management.md` - TanStack Query + Zustand patterns
- `global/project-structure.md` - Vertical slice architecture
- `global/zod-validation.md` - Step config validation

## Project Structure

### Documentation (this feature)

```text
specs/022-step-system-editor/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api.md           # Internal API contracts
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
apps/clementine-app/src/
├── domains/experience/
│   ├── designer/                    # E2: Step System & Editor
│   │   ├── components/
│   │   │   ├── StepList.tsx         # Left column - step list with DnD
│   │   │   ├── StepListItem.tsx     # Individual step in list
│   │   │   ├── StepPreview.tsx      # Center column - preview shell wrapper
│   │   │   ├── StepConfigPanel.tsx  # Right column - config panel router
│   │   │   ├── AddStepDialog.tsx    # Modal for adding new steps
│   │   │   └── index.ts
│   │   ├── containers/
│   │   │   ├── ExperienceDesignerLayout.tsx  # (existing - enhance)
│   │   │   ├── ExperienceDesignerPage.tsx    # (existing - implement)
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── useStepSelection.ts           # URL-synced selection state
│   │   │   ├── useUpdateExperienceDraft.ts   # Draft mutation with auto-save
│   │   │   ├── usePublishExperience.ts       # Publish mutation with validation
│   │   │   └── index.ts
│   │   ├── stores/
│   │   │   └── useExperienceDesignerStore.ts # (existing - Zustand store)
│   │   └── index.ts
│   ├── steps/                       # E2: Step Registry & Renderers
│   │   ├── registry/
│   │   │   ├── step-registry.ts     # Central registry with all step definitions
│   │   │   ├── step-utils.ts        # Profile filtering, step creation helpers
│   │   │   └── index.ts
│   │   ├── schemas/
│   │   │   ├── info.schema.ts       # Info step config schema
│   │   │   ├── input-scale.schema.ts
│   │   │   ├── input-yes-no.schema.ts
│   │   │   ├── input-multi-select.schema.ts
│   │   │   ├── input-short-text.schema.ts
│   │   │   ├── input-long-text.schema.ts
│   │   │   ├── capture-photo.schema.ts
│   │   │   ├── transform-pipeline.schema.ts
│   │   │   └── index.ts
│   │   ├── renderers/               # Edit-mode step previews
│   │   │   ├── InfoStepRenderer.tsx
│   │   │   ├── InputScaleRenderer.tsx
│   │   │   ├── InputYesNoRenderer.tsx
│   │   │   ├── InputMultiSelectRenderer.tsx
│   │   │   ├── InputShortTextRenderer.tsx
│   │   │   ├── InputLongTextRenderer.tsx
│   │   │   ├── CapturePhotoRenderer.tsx
│   │   │   ├── TransformPipelineRenderer.tsx
│   │   │   └── index.ts
│   │   ├── config-panels/           # Step configuration forms
│   │   │   ├── InfoStepConfigPanel.tsx
│   │   │   ├── InputScaleConfigPanel.tsx
│   │   │   ├── InputYesNoConfigPanel.tsx
│   │   │   ├── InputMultiSelectConfigPanel.tsx
│   │   │   ├── InputShortTextConfigPanel.tsx
│   │   │   ├── InputLongTextConfigPanel.tsx
│   │   │   ├── CapturePhotoConfigPanel.tsx
│   │   │   ├── TransformPipelineConfigPanel.tsx
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── shared/                      # (existing - E1 foundation)
│   │   ├── schemas/
│   │   │   ├── experience.schema.ts # (existing)
│   │   │   └── step-registry.schema.ts # (existing - base types)
│   │   ├── types/
│   │   │   └── step.types.ts        # (existing - base interfaces)
│   │   ├── queries/
│   │   │   └── experience.query.ts  # (existing)
│   │   └── hooks/
│   │       └── useUpdateExperience.ts # (existing - base mutation)
│   └── index.ts
└── shared/
    ├── editor-controls/             # (existing - reuse)
    ├── editor-status/               # (existing - reuse)
    ├── forms/hooks/useAutoSave.ts   # (existing - reuse)
    └── preview-shell/               # (existing - reuse)
```

**Structure Decision**: Follows vertical slice architecture within `domains/experience/`. Step-related code (registry, schemas, renderers, config-panels) organized under `steps/` subdomain. Editor orchestration in `designer/`. Leverages existing shared utilities (EditorControls, PreviewShell, useAutoSave).

## Complexity Tracking

> No complexity violations anticipated. Feature follows established patterns.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |
