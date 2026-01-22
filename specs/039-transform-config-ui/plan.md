# Implementation Plan: Transform Pipeline Creator Config UI

**Branch**: `039-transform-config-ui` | **Date**: 2026-01-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/039-transform-config-ui/spec.md`

## Summary

Enable experience creators to configure transform pipelines in the experience designer. This includes adding a Transform tab to the left panel (alongside Steps), managing pipeline nodes (add, remove, reorder), configuring variable mappings, and providing basic node configuration UI. The implementation follows existing patterns from the step list and config panel architecture.

## Technical Context

**Language/Version**: TypeScript 5.7, React 19, TanStack Start
**Primary Dependencies**: @dnd-kit (drag-and-drop), react-hook-form, Zod 4.1.12, shadcn/ui, Radix UI, TanStack Query
**Storage**: Firestore (experience.draft.transform field)
**Testing**: Vitest
**Target Platform**: Web (mobile-first, responsive)
**Project Type**: Web application (TanStack Start monorepo)
**Performance Goals**: Node operations persist correctly, UI responds instantly with optimistic updates
**Constraints**: Must integrate with existing experience designer, follow established save patterns (immediate for list ops, debounced for config)
**Scale/Scope**: ~15 new components, 4 node types, schemas update

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | ✅ Pass | Follow existing responsive patterns (sheets for mobile panels) |
| II. Clean Code & Simplicity | ✅ Pass | Reuse existing patterns (StepList, StepConfigPanel), no over-engineering |
| III. Type-Safe Development | ✅ Pass | Extend Zod schemas in shared package, strict TypeScript |
| IV. Minimal Testing Strategy | ✅ Pass | Focus on critical paths (node CRUD, save operations) |
| V. Validation Gates | ✅ Pass | Run `pnpm app:check` before commit, review design-system.md |
| VI. Frontend Architecture | ✅ Pass | Client-first with Firebase client SDK, existing mutation patterns |
| VII. Backend & Firebase | ✅ Pass | No backend changes needed - uses existing experience draft updates |
| VIII. Project Structure | ✅ Pass | New transform/ subdomain within experience/ domain |

**Standards to Review**:
- `frontend/design-system.md` - Theme tokens, no hard-coded colors
- `frontend/component-libraries.md` - shadcn/ui patterns
- `global/project-structure.md` - Vertical slice architecture

## Project Structure

### Documentation (this feature)

```text
specs/039-transform-config-ui/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A - no API contracts needed)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
packages/shared/src/schemas/experience/
├── transform.schema.ts           # UPDATE: Extend with detailed node schemas from PRD

apps/clementine-app/src/domains/experience/
├── designer/
│   ├── components/
│   │   ├── StepList.tsx              # MODIFY: Extract reusable drag-and-drop into shared
│   │   └── DesignerLeftPanel.tsx     # NEW: Tabs wrapper (Steps | Transform)
│   ├── containers/
│   │   └── ExperienceDesignerPage.tsx # MODIFY: Integrate new left panel with tabs
│   └── stores/
│       └── index.ts                   # EXISTING: Reuse for save status tracking
│
├── transform/                         # NEW: Transform subdomain
│   ├── components/
│   │   ├── TransformPanel.tsx         # NEW: Main transform config panel (left)
│   │   ├── TransformNodeList.tsx      # NEW: Draggable node list
│   │   ├── TransformNodeItem.tsx      # NEW: Individual node item with icon
│   │   ├── AddNodeDialog.tsx          # NEW: Node type selector dialog
│   │   ├── VariableMappingList.tsx    # NEW: Variable mappings section
│   │   ├── VariableMappingItem.tsx    # NEW: Individual mapping row
│   │   └── AddVariableDialog.tsx      # NEW: Add/edit variable form
│   │
│   ├── config-panels/                 # NEW: Node config panels (right panel)
│   │   ├── NodeConfigRouter.tsx       # NEW: Routes to correct panel by type
│   │   ├── RemoveBackgroundConfig.tsx # NEW: Cut Out node config
│   │   ├── CompositeConfig.tsx        # NEW: Combine node config (placeholder)
│   │   ├── BackgroundSwapConfig.tsx   # NEW: Background Swap node config
│   │   └── AiImageConfig.tsx          # NEW: AI Image node config (basic)
│   │
│   ├── hooks/
│   │   ├── useTransformConfig.ts      # NEW: Transform state management
│   │   ├── useUpdateTransform.ts      # NEW: Mutation for transform updates
│   │   └── useNodeSelection.ts        # NEW: Selected node state (URL sync)
│   │
│   ├── registry/
│   │   └── node-registry.ts           # NEW: Node type definitions, icons, display names
│   │
│   └── index.ts                       # NEW: Barrel exports
```

**Structure Decision**: New `transform/` subdomain within `experience/` domain, following vertical slice architecture. Reuses existing patterns from `designer/` and `steps/` modules.

**Note**: TransformPipelineRenderer (guest-facing loading UI) is not part of this phase. That's Phase 4 (Runtime & Step Integration) where the transform is injected as a virtual step for guests.

## Complexity Tracking

> No violations - implementation follows established patterns.
