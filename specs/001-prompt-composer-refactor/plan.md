# Implementation Plan: PromptComposer Refactor

**Branch**: `001-prompt-composer-refactor` | **Date**: 2026-02-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-prompt-composer-refactor/spec.md`

## Summary

Refactor the PromptComposer component from a 19-prop flat interface to a modality-driven architecture using React Context. A `ModalityDefinition` config object declares what features each generation type supports (reference media, duration, aspect ratio, etc.), and a `PromptComposerContext` distributes this configuration to child components — eliminating prop drilling through ControlRow and ReferenceMediaStrip. The top-level API shrinks to ~8 props. Adding a new modality requires only a new definition constant and a consumer form — zero changes to PromptComposer internals.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode, ES2022 target)
**Primary Dependencies**: React 19.2.0, TanStack Start 1.132.0, shadcn/ui + Radix UI, Lexical (rich text editor)
**Storage**: N/A (pure frontend refactor, no backend/database changes)
**Testing**: Vitest (unit tests), manual regression testing for all 3 consumers
**Target Platform**: Web (mobile-first, 320px-768px primary viewport)
**Project Type**: Web application (monorepo — `apps/clementine-app/`)
**Performance Goals**: No regression — page interactions remain instant
**Constraints**: Zero behavioral changes for end users. All 3 existing consumers must work identically post-refactor.
**Scale/Scope**: ~8 files modified, ~2 new files, 3 consumer forms updated

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Research Gate

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | PASS | No UI changes — existing mobile-first layout preserved |
| II. Clean Code & Simplicity | PASS | Refactor reduces complexity (19 props → 8). Context pattern already established in codebase. No new abstractions beyond what's needed. |
| III. Type-Safe Development | PASS | All new types will be strict TypeScript. ModalityDefinition is compile-time validated. |
| IV. Minimal Testing Strategy | PASS | Unit tests for modality rendering logic. Manual regression for all consumers. |
| V. Validation Gates | PASS | Will run `pnpm app:check` + `pnpm app:type-check` before completion. Standards compliance review planned. |
| VI. Frontend Architecture | PASS | Client-first pattern preserved. No SSR changes. |
| VII. Backend & Firebase | N/A | No backend changes |
| VIII. Project Structure | PASS | New files follow vertical slice architecture within `experience/create` domain. Barrel exports maintained. |

### Post-Design Gate

| Principle | Status | Notes |
|-----------|--------|-------|
| II. Clean Code & Simplicity | PASS | React Context is the simplest pattern for tree-scoped state distribution. No factory patterns, no class hierarchies, no generic abstractions. Spread operator for overrides — no complex override mechanism. |
| III. Type-Safe Development | PASS | ModalityDefinition fully typed. Context value fully typed. No `any` or `unknown` needed. |
| VIII. Project Structure | PASS | 2 new files (`PromptComposerContext.tsx`, `modality-definitions.ts`) follow existing naming conventions. Co-located with PromptComposer. Barrel export updated. |

## Project Structure

### Documentation (this feature)

```text
specs/001-prompt-composer-refactor/
├── plan.md              # This file
├── research.md          # Phase 0 output - design decisions
├── data-model.md        # Phase 1 output - type definitions
├── quickstart.md        # Phase 1 output - usage guide
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
apps/clementine-app/src/domains/experience/create/
├── components/
│   ├── PromptComposer/
│   │   ├── PromptComposer.tsx              # MODIFIED - accepts new props, creates context provider
│   │   ├── PromptComposerContext.tsx        # NEW - context definition, provider, usePromptComposerContext hook
│   │   ├── ControlRow.tsx                  # MODIFIED - reads from context instead of props
│   │   ├── ReferenceMediaStrip.tsx         # MODIFIED - reads from context instead of props
│   │   ├── AddMediaButton.tsx              # MODIFIED - reads from context for disabled/canAddMore
│   │   ├── ReferenceMediaItem.tsx          # UNCHANGED
│   │   ├── LexicalPromptInput.tsx          # UNCHANGED (already clean interface)
│   │   └── index.ts                        # MODIFIED - export new types + modality definitions
│   ├── ai-image-config/
│   │   └── AIImageConfigForm.tsx           # MODIFIED - use new PromptComposer API
│   └── ai-video-config/
│       ├── AIVideoConfigForm.tsx           # MODIFIED - use new PromptComposer API + modality variants
│       └── FrameGenerationSection.tsx      # MODIFIED - use new PromptComposer API
├── hooks/
│   └── useRefMediaUpload.ts               # UNCHANGED
├── lexical/                                # UNCHANGED (entire directory)
└── lib/
    ├── model-options.ts                    # UNCHANGED (constants stay here)
    └── modality-definitions.ts             # NEW - ModalityDefinition type + IMAGE_MODALITY, VIDEO_MODALITY presets
```

**Structure Decision**: All changes are within the existing `experience/create` domain following vertical slice architecture. No new directories needed — just new files within existing folders. The PromptComposer directory gains one new file (context), and `lib/` gains one new file (modality definitions).

## Design Decisions

### D-001: React Context for modality distribution

Child components (ControlRow, ReferenceMediaStrip, AddMediaButton) will consume modality configuration and runtime state via `usePromptComposerContext()` instead of receiving props. PromptComposer creates the context provider internally — consumers don't see the Provider.

**See**: [research.md#R-001](./research.md) for full rationale.

### D-002: Static ModalityDefinition objects

Predefined constants (`IMAGE_MODALITY`, `VIDEO_MODALITY`) declare each modality's capabilities. Consumers create task-specific variants via spread operator (e.g., video remix with locked duration).

**See**: [research.md#R-002](./research.md) for alternatives considered.

### D-003: Grouped props for related concerns

- `controls?: ModalityControlValues` groups aspectRatio + duration + their callbacks
- `refMedia?: RefMediaState` groups all 6 reference media props into one object

This reduces top-level prop count from 19 to ~8 while keeping the API explicit.

**See**: [research.md#R-003](./research.md) for prop mapping table.

### D-004: In-place migration (no parallel component)

All 3 consumers are in the same domain. The refactor updates PromptComposer in place and migrates all consumers in the same change set. No adapter layer or deprecation period.

**See**: [research.md#R-004](./research.md) for migration approach.

### D-005: LexicalPromptInput stays unchanged

The Lexical editor already has a clean 5-prop interface (`value`, `onChange`, `steps`, `media`, `disabled`). It's modality-agnostic and doesn't benefit from context. Keeping it prop-based follows the principle of only changing what needs changing.

## Applicable Standards

Before implementation, review these standards:

- `standards/frontend/state-management.md` — Context patterns, when to use Context vs Zustand
- `standards/frontend/component-libraries.md` — shadcn/ui component usage in ControlRow
- `standards/frontend/design-system.md` — Theme token compliance for any UI changes
- `standards/global/project-structure.md` — File naming, barrel exports, vertical slice architecture
- `standards/global/code-quality.md` — Validation workflows, linting
- `standards/global/coding-style.md` — Naming conventions (PascalCase components, camelCase functions)
