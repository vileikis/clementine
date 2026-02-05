# Implementation Plan: Admin Create Tab UX

**Branch**: `061-admin-create-ux` | **Date**: 2026-02-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/061-admin-create-ux/spec.md`

## Summary

Replace the existing node-based Transform Pipeline UI with a simplified Create tab form for configuring AI image generation outcomes. The implementation leverages existing reusable components (Lexical prompt editor, reference media upload, mention system) while building new components for outcome type selection, source image selection, AI toggle, and form validation. The feature follows the established client-first architecture pattern using TanStack Query for data fetching and direct Firestore client SDK mutations.

**Terminology Change**: This implementation renames "create outcome" to simply "outcome" throughout the codebase for clarity and conciseness.

## Technical Context

**Language/Version**: TypeScript 5.7 (strict mode)
**Primary Dependencies**: React 19, TanStack Start 1.132, TanStack Query 5.66, Zustand 5.x, Zod 4.1, shadcn/ui, Radix UI, Lexical
**Storage**: Firebase Firestore (client SDK), Firebase Storage (for media uploads)
**Testing**: Vitest
**Target Platform**: Web (mobile-first, 320px-768px primary)
**Project Type**: Monorepo web application (`apps/clementine-app/`)
**Performance Goals**: @mention autocomplete <500ms, form interactions responsive
**Constraints**: Touch targets 44x44px minimum, real-time draft autosave
**Scale/Scope**: Single form interface within experience designer

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | ✅ PASS | Form layout designed for mobile viewport, 44px touch targets |
| II. Clean Code & Simplicity | ✅ PASS | Reuses existing components, minimal new abstractions |
| III. Type-Safe Development | ✅ PASS | Zod schemas exist (`outcomeSchema`), TypeScript strict mode |
| IV. Minimal Testing Strategy | ✅ PASS | Focus on critical user flows (form save, validation) |
| V. Validation Gates | ✅ PASS | Will run lint/type-check/format before commits |
| VI. Frontend Architecture | ✅ PASS | Client-first, Firebase client SDK, TanStack Query |
| VII. Backend & Firebase | ✅ PASS | Client SDK for reads, existing mutation patterns |
| VIII. Project Structure | ✅ PASS | Vertical slice in `domains/experience/create/` |

**No violations requiring justification.**

## Prep Work: Schema Rename

Before implementing the Create tab UI, rename "create outcome" to "outcome" throughout the codebase.

### Schema Renames (packages/shared)

| Current | New |
|---------|-----|
| `create-outcome.schema.ts` | `outcome.schema.ts` |
| `createOutcomeSchema` | `outcomeSchema` |
| `CreateOutcome` | `Outcome` |
| `createOutcomeTypeSchema` | `outcomeTypeSchema` |
| `CreateOutcomeType` | `OutcomeType` |

### Field Renames (Experience Config)

| Current | New |
|---------|-----|
| `config.create` | `config.outcome` |

### Files to Update

```text
packages/shared/src/schemas/experience/
├── create-outcome.schema.ts    → outcome.schema.ts (rename file + contents)
├── experience.schema.ts        → Update field: create → outcome
└── index.ts                    → Update exports

apps/clementine-app/src/
└── (any files referencing CreateOutcome or config.create)
```

### Firestore Migration

Since this is a new field being introduced (replacing `transformNodes`), no data migration is needed. The field will be `config.outcome` from the start.

---

## Project Structure

### Documentation (this feature)

```text
specs/061-admin-create-ux/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A - no new API contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
apps/clementine-app/src/
├── domains/experience/create/
│   ├── components/
│   │   ├── PromptComposer/              # ✅ REUSE - Refactor props interface
│   │   │   ├── PromptComposer.tsx       # 🔄 REFACTOR - Decouple from node-based model
│   │   │   ├── LexicalPromptInput.tsx   # ✅ REUSE - No changes needed
│   │   │   ├── ControlRow.tsx           # 🔄 REFACTOR - Accept options via props
│   │   │   ├── ReferenceMediaStrip.tsx  # ✅ REUSE - No changes needed
│   │   │   ├── ReferenceMediaItem.tsx   # ✅ REUSE - No changes needed
│   │   │   └── AddMediaButton.tsx       # ✅ REUSE - No changes needed
│   │   ├── CreateTabForm/               # ✨ NEW - Main form container
│   │   │   ├── CreateTabForm.tsx        # Main form composing all fields
│   │   │   ├── OutcomeTypeSelector.tsx  # Image/GIF/Video toggle
│   │   │   ├── SourceImageSelector.tsx  # Capture step dropdown
│   │   │   ├── AIGenerationToggle.tsx   # Enable/disable AI toggle
│   │   │   ├── ValidationSummary.tsx    # Form validation errors display
│   │   │   └── index.ts                 # Barrel export
│   │   ├── NodeListItem/                # ❌ DELETE - Node-centric UI removed
│   │   └── index.ts                     # Update barrel exports
│   ├── containers/
│   │   ├── ExperienceCreatePage.tsx     # 🔄 REFACTOR - Replace TransformPipelineEditor
│   │   └── TransformPipelineEditor.tsx  # ❌ DELETE - Pipeline UI removed
│   ├── hooks/
│   │   ├── useRefMediaUpload.ts         # 🔄 REFACTOR - Work with outcome.imageGeneration
│   │   ├── useUpdateTransformNodes.ts   # ❌ DELETE - Replaced by new hook
│   │   ├── useUpdateOutcome.ts          # ✨ NEW - Mutation for outcome config
│   │   ├── useOutcomeValidation.ts      # ✨ NEW - Form validation hook
│   │   └── index.ts                     # Update barrel exports
│   ├── lexical/                         # ✅ REUSE - No changes needed
│   │   ├── nodes/
│   │   ├── plugins/
│   │   └── utils/
│   ├── lib/
│   │   ├── transform-operations.ts      # ❌ DELETE - Node operations removed
│   │   ├── outcome-operations.ts        # ✨ NEW - Outcome operations
│   │   ├── model-options.ts             # ✨ NEW - Model/aspect ratio constants
│   │   └── index.ts                     # Update barrel exports
│   └── index.ts                         # Update domain exports
└── packages/shared/src/schemas/experience/
    └── outcome.schema.ts                # 🔄 RENAME from create-outcome.schema.ts
```

**Structure Decision**: This feature extends the existing `domains/experience/create/` vertical slice. Reusable components (Lexical, media strip, upload hook) are preserved and refactored for flexibility. New components are added in a `CreateTabForm/` subdirectory. Node-based components and operations are deleted.

## Complexity Tracking

> No constitution violations requiring justification.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| *None* | - | - |
