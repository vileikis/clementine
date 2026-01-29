# Implementation Plan: Guest Share Screen with Renderer Integration

**Branch**: `046-guest-share-screen` | **Date**: 2026-01-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/046-guest-share-screen/spec.md`

## Summary

Integrate ShareLoadingRenderer and ShareReadyRenderer components into the guest SharePage container to display AI generation progress and results. Implementation includes architectural refactoring to align share renderers with the ExperiencePage pattern by extracting ThemedBackground to the container level. Uses mock data with a simulated 3-second loading transition, displays non-interactive share icons, and implements functional "Start Over" and CTA navigation buttons. This establishes the visual foundation for the share screen while deferring real data fetching and share functionality to future iterations.

**Architectural Change**: Refactor share renderers to remove internal ThemedBackground wrappers, matching the pattern used by step renderers in ExperiencePage. This improves performance (no background re-mount during transitions), consistency (all renderers follow same pattern), and flexibility (renderers become layout-agnostic).

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode, ES2022 target)
**Primary Dependencies**: React 19.2.0, TanStack Router 1.132.0, @clementine/shared (Zod schemas)
**Storage**: N/A (using mock data, no database interaction in this phase)
**Testing**: Vitest (integration tests for state transitions and navigation)
**Target Platform**: Web (modern browsers, mobile-first responsive design)
**Project Type**: Web application (TanStack Start full-stack framework)
**Performance Goals**:
- Loading state renders < 100ms on page load
- Transition timing accuracy: 3 seconds ± 50ms
- Button navigation response < 200ms
**Constraints**:
- Must align with ExperiencePage architectural pattern (ThemedBackground at container level)
- No backend/Firebase integration (mock data only)
- Mobile-first viewport (320px-768px primary)
- Must preserve mainSessionId prop throughout lifecycle
- Refactoring must not break ShareEditorPage functionality
**Scale/Scope**:
- 1 new container component (~150-200 LOC): SharePage with mock data integration
- 2 renderer refactors (~50 LOC each): Extract ThemedBackground from ShareLoadingRenderer and ShareReadyRenderer
- 1 editor update (~20 LOC): Add ThemedBackground wrapper to ShareEditorPage
- Total: ~270-320 LOC across 4 files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Mobile-First Design ✅ PASS
- **Status**: COMPLIANT
- **Rationale**: ShareLoadingRenderer and ShareReadyRenderer are already mobile-first with responsive layouts. SharePage container adds no custom styling that could violate mobile-first principles. ThemeProvider handles theming without viewport-specific concerns.

### Principle II: Clean Code & Simplicity ✅ PASS
- **Status**: COMPLIANT
- **Rationale**: Implementation is straightforward:
  - Single useState for loading/ready state toggle
  - Single useEffect for 3-second timer
  - Navigation handlers delegate to TanStack Router
  - No abstractions, no premature optimization
  - Mock data defined inline (clear, simple)
- **Estimated LOC**: ~150-200 lines (well within simplicity bounds)

### Principle III: Type-Safe Development ✅ PASS
- **Status**: COMPLIANT
- **Rationale**:
  - All types imported from @clementine/shared (ShareLoadingConfig, ShareReadyConfig, ShareOptionsConfig)
  - TypeScript strict mode enabled
  - No `any` types needed
  - Props interface strictly typed (mainSessionId: string)
  - No runtime validation needed (mock data is hardcoded and type-safe)

### Principle IV: Minimal Testing Strategy ✅ PASS
- **Status**: COMPLIANT
- **Rationale**:
  - Test critical behavior: 3-second transition timing
  - Test navigation: "Start Over" and CTA button clicks
  - No implementation details tested (React hooks internals)
  - Focus on user-facing behavior only

### Principle V: Validation Gates ✅ PASS
- **Status**: COMPLIANT
- **Validation checklist**:
  - [x] Run `pnpm app:check` before commit
  - [x] Review `standards/frontend/component-libraries.md` (using existing components)
  - [x] Review `standards/frontend/design-system.md` (ThemeProvider handles theming)
  - [x] Review `standards/global/code-quality.md` (simple, clean implementation)
  - [x] Review `standards/global/project-structure.md` (container in correct domain location)

### Principle VI: Frontend Architecture ✅ PASS
- **Status**: COMPLIANT
- **Rationale**:
  - Client-side only (no server functions)
  - Uses React hooks for state management (useState, useEffect)
  - Navigation via TanStack Router (client-side routing)
  - No Firebase operations (mock data phase)
  - Aligns with client-first pattern

### Principle VII: Backend & Firebase ✅ PASS
- **Status**: N/A (no backend interaction in this phase)
- **Rationale**: Feature uses mock data exclusively. Future iterations will add Firebase reads for real share configs and result media.

### Principle VIII: Project Structure ✅ PASS
- **Status**: COMPLIANT
- **File location**: `apps/clementine-app/src/domains/guest/containers/SharePage.tsx` (already exists)
- **Domain**: `guest` (correct - this is the guest-facing share screen)
- **Layer**: `containers` (correct - this is a page-level container component)
- **No new files needed**: Updating existing container only

### Standards Compliance Review

**Applicable Standards**:
- ✅ `frontend/component-libraries.md` - Using existing ShareLoadingRenderer and ShareReadyRenderer
- ✅ `frontend/design-system.md` - ThemeProvider integration (no hardcoded colors/styles)
- ✅ `global/project-structure.md` - File in correct domain/layer
- ✅ `global/code-quality.md` - Simple, clean, well-named functions

**Compliance Status**: ALL PASS - No deviations required.

## Project Structure

### Documentation (this feature)

```text
specs/046-guest-share-screen/
├── plan.md              # This file
├── research.md          # Phase 0 output (minimal - using existing components)
├── data-model.md        # Phase 1 output (mock data structures)
├── quickstart.md        # Phase 1 output (integration guide)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
apps/clementine-app/src/
├── domains/
│   ├── guest/
│   │   ├── containers/
│   │   │   └── SharePage.tsx              # ← UPDATE (add renderers + ThemedBackground)
│   │   └── contexts/
│   │       └── GuestContext.tsx           # ← READ (provides project theme)
│   └── project-config/
│       └── share/
│           ├── components/
│           │   ├── ShareLoadingRenderer.tsx   # ← REFACTOR (extract ThemedBackground)
│           │   └── ShareReadyRenderer.tsx     # ← REFACTOR (extract ThemedBackground)
│           ├── containers/
│           │   └── ShareEditorPage.tsx        # ← UPDATE (add ThemedBackground wrapper)
│           └── constants/
│               └── defaults.ts                 # ← REFERENCE (default configs)
├── shared/
│   └── theming/
│       ├── ThemeProvider.tsx              # ← USE (theme application)
│       └── ThemedBackground.tsx           # ← USE (background component)
└── ui-kit/
    └── ui/
        └── skeleton.tsx                   # ← USED BY RENDERERS (no changes)

packages/shared/src/
└── schemas/
    └── project/
        └── project-config.schema.ts       # ← REFERENCE (type imports)
```

**Structure Decision**: This is a web application following vertical slice architecture. The SharePage container belongs in the `guest` domain since it's part of the guest-facing experience.

**Architectural Alignment**: Share renderers are being refactored to match the ExperiencePage pattern where ThemedBackground is managed at the container level, not within individual renderers. This creates consistency across the codebase:
- **ExperiencePage pattern**: Container → ThemedBackground → StepRendererRouter → Step Renderers (content only)
- **SharePage pattern** (after refactor): Container → ThemedBackground → Share Renderers (content only)
- **ShareEditorPage pattern** (after refactor): PreviewShell → ThemeProvider → ThemedBackground → Share Renderers (content only)

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**Status**: No violations - complexity tracking not required. Implementation follows all constitution principles.
