# Implementation Plan: AI Image Node Settings

**Branch**: `053-ai-image-node-settings` | **Date**: 2026-01-31 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/053-ai-image-node-settings/spec.md`

## Summary

Implement a PromptComposer component for configuring AI Image transform nodes within the existing transform pipeline editor. The component provides a unified bordered container with:
- Multiline prompt input with placeholder syntax support (`@{step:name}`, `@{ref:mediaAssetId}`)
- Model and aspect ratio selectors (unlabeled dropdowns in bottom control row)
- Reference media strip with thumbnails, display names, and remove controls
- Support for adding reference images via file picker (multi-select) and drag-and-drop (multi-file)
- Maximum of 10 reference images with deduplication by `mediaAssetId`

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode)
**Primary Dependencies**: React 19, TanStack Start 1.132, shadcn/ui, Radix UI, @dnd-kit, Zod 4.1.12
**Storage**: Firebase Firestore (client SDK) via existing `useUpdateTransformConfig` hook
**Testing**: Vitest (unit tests)
**Target Platform**: Web (desktop + mobile responsive)
**Project Type**: Web application (TanStack Start monorepo)
**Performance Goals**: Instant UI feedback, <100ms save latency perception (optimistic updates)
**Constraints**: Mobile-first design (44px touch targets), client-first architecture
**Scale/Scope**: Single component replacing placeholder sections in AIImageNodeSettings

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | ✅ PASS | 44px touch targets for all controls, responsive layout |
| II. Clean Code & Simplicity | ✅ PASS | Single focused component, reuses existing patterns |
| III. Type-Safe Development | ✅ PASS | TypeScript strict, Zod schemas for config validation |
| IV. Minimal Testing Strategy | ✅ PASS | Unit tests for transform operations, component behavior |
| V. Validation Gates | ✅ PASS | Run `pnpm app:check` before commits |
| VI. Frontend Architecture | ✅ PASS | Client-first with Firebase client SDK |
| VII. Backend & Firebase | ✅ PASS | Uses existing mutation hook pattern |
| VIII. Project Structure | ✅ PASS | Extends existing generate domain structure |

**Standards to Review Before Implementation**:
- `frontend/design-system.md` - Theme tokens, color usage
- `frontend/component-libraries.md` - shadcn/ui patterns
- `frontend/accessibility.md` - Keyboard navigation, ARIA

## Project Structure

### Documentation (this feature)

```text
specs/053-ai-image-node-settings/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (Firestore update contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
apps/clementine-app/src/
├── domains/experience/generate/
│   ├── components/
│   │   ├── NodeListItem/
│   │   │   ├── AIImageNode.tsx           # UPDATE: Wire PromptComposer
│   │   │   └── ...
│   │   ├── PromptComposer/               # NEW: Main component directory
│   │   │   ├── PromptComposer.tsx        # Container component (drop zone)
│   │   │   ├── PromptInput.tsx           # Multiline textarea
│   │   │   ├── ControlRow.tsx            # Model, aspect ratio, plus button
│   │   │   ├── ReferenceMediaStrip.tsx   # Thumbnail strip (includes uploading items)
│   │   │   ├── ReferenceMediaItem.tsx    # Single thumbnail with remove
│   │   │   ├── AddMediaButton.tsx        # Plus button with native file input
│   │   │   └── index.ts                  # Barrel export
│   │   └── index.ts                      # UPDATE: Export PromptComposer
│   ├── lib/
│   │   └── transform-operations.ts       # UPDATE: Add refMedia operations
│   └── hooks/
│       └── useUpdateTransformConfig.ts   # EXISTING: Reuse for mutations
├── domains/media-library/
│   └── hooks/
│       └── useUploadMediaAsset.ts        # EXISTING: Reuse for file uploads
└── ui-kit/
    └── components/                       # EXISTING: shadcn/ui components
```

**Structure Decision**: Extend the existing `generate` domain with a new `PromptComposer` component directory. Use simple native file input (multi-select) instead of heavy MediaPickerField. Leverage `useUploadMediaAsset` from media-library domain for uploads. Follow the composition hook pattern for upload + config update.

## Complexity Tracking

> No constitution violations. Feature follows established patterns.

*No entries needed - implementation aligns with all principles.*
