# Implementation Plan: Preview Shell Module Migration

**Branch**: `tech/migrate-preview-shell-2` | **Date**: 2025-12-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-preview-shell-migration/spec.md`

## Summary

Migrate the existing preview-shell module from Next.js app (`/web/src/features/preview-shell/`) to TanStack Start app (`/apps/clementine-app/src/shared/preview-shell/`) and create a dev-tools testing interface at `/admin/dev-tools/preview-shell`. This migration provides foundational device preview infrastructure (mobile/desktop viewport switching, fullscreen overlay, state persistence) that other admin features depend on.

**Technical Approach**: Direct file migration with path updates, zustand installation, and creation of interactive testing playground for validation.

## Technical Context

**Language/Version**: TypeScript 5.7 (strict mode)
**Primary Dependencies**:
- React 19.2 (hooks: useState, useCallback, useMemo, useEffect, useContext)
- zustand 5.0.9+ (state management with persist middleware)
- lucide-react 0.561.0 (icons: Smartphone, Monitor, Maximize2, X)
- TanStack Start 1.132 (SSR framework)
- TanStack Router 1.132 (routing)

**Storage**: localStorage (viewport mode persistence via zustand persist middleware)
**Testing**: Vitest (manual testing via dev-tools interface - no automated tests in scope)
**Target Platform**: Web (TanStack Start SSR + Client Components)
**Project Type**: Monorepo workspace (`apps/clementine-app/`)
**Performance Goals**:
- Page load < 2 seconds for dev-tools route
- Viewport toggle < 100ms response time
- Fullscreen activation < 100ms
- Component remount < 100ms

**Constraints**:
- Must maintain exact same public API as Next.js version
- Must support "use client" directive (React Client Components)
- Must work with TanStack Start SSR (client-side hydration)
- Must preserve localStorage persistence behavior
- Must maintain barrel export pattern

**Scale/Scope**:
- ~15 source files (components, hooks, context, store, types, constants)
- 5 components, 2 hooks, 1 context provider, 1 zustand store
- 1 dev-tools page with 2-column layout
- 10 consumer files currently importing from this module (will migrate separately)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ Principle I: Mobile-First Design
**Status**: COMPLIANT
- Module already designed mobile-first (default viewport: 375x667px)
- Touch targets meet 44x44px minimum (ViewportSwitcher buttons)
- Dev-tools page uses responsive 2-column layout
- No violations

### ✅ Principle II: Clean Code & Simplicity
**Status**: COMPLIANT
- Existing module follows clean code practices:
  - Small, focused components (~30-80 lines each)
  - Single responsibility (DeviceFrame = sizing, ViewportSwitcher = buttons)
  - No dead code or commented-out sections
  - Clear separation of concerns (components, hooks, context, store)
- Migration maintains simplicity (direct copy + path updates)
- No new abstractions introduced
- No violations

### ✅ Principle III: Type-Safe Development
**Status**: COMPLIANT
- TypeScript strict mode enabled in source
- All types explicitly defined in `preview-shell.types.ts`
- No `any` types found in source code
- Runtime validation not applicable (internal UI components, not external data)
- No violations

### ✅ Principle IV: Minimal Testing Strategy
**Status**: COMPLIANT
- Manual testing via dev-tools interface (appropriate for UI infrastructure)
- No automated tests required for this migration
- Critical user flows tested via interactive playground
- No violations

### ✅ Principle V: Validation Gates
**Status**: COMPLIANT
- Will run `pnpm app:check` before commit
- Will verify TypeScript strict mode passes
- Will test in dev server before marking complete
- **Standards Compliance Review**:
  - `frontend/design-system.md` - Will verify no hard-coded colors
  - `frontend/component-libraries.md` - Already uses shadcn Button component
  - `global/project-structure.md` - Will follow vertical slice + barrel exports
  - `global/code-quality.md` - Existing code already clean
  - `frontend/accessibility.md` - Touch targets already compliant
- No violations

### ✅ Principle VI: Frontend Architecture
**Status**: COMPLIANT
- Uses client-first pattern (React Client Components with "use client")
- No SSR required for this module (pure client-side UI infrastructure)
- Real-time sync via zustand store (multiple PreviewShell instances)
- No violations

### ✅ Principle VII: Backend & Firebase
**Status**: NOT APPLICABLE
- Module does not interact with Firebase
- Pure client-side UI components only

### ✅ Principle VIII: Project Structure
**Status**: COMPLIANT
- Target location: `/apps/clementine-app/src/shared/preview-shell/` (shared infrastructure)
- Will follow vertical slice architecture:
  - `components/` - UI components
  - `hooks/` - React hooks
  - `context/` - React context provider
  - `store/` - Zustand global store
  - `types/` - TypeScript type definitions
  - `constants/` - Viewport dimension constants
- Will maintain barrel exports (`index.ts` at all levels)
- Will export from `/shared/index.ts` for cross-domain access
- No violations

**Overall Constitution Status**: ✅ **ALL PRINCIPLES COMPLIANT**

## Project Structure

### Documentation (this feature)

```text
specs/005-preview-shell-migration/
├── spec.md              # Feature specification
├── plan.md              # This file (implementation plan)
├── research.md          # Technical research findings
├── data-model.md        # State entities and types
├── quickstart.md        # Developer quick-start guide
├── contracts/           # N/A (no API contracts for UI module)
└── checklists/
    └── requirements.md  # Specification validation checklist
```

### Source Code (repository: /apps/clementine-app/)

```text
apps/clementine-app/
├── src/
│   ├── shared/
│   │   ├── preview-shell/                    # Migrated module (NEW)
│   │   │   ├── index.ts                      # Main barrel export
│   │   │   ├── components/
│   │   │   │   ├── index.ts
│   │   │   │   ├── PreviewShell.tsx
│   │   │   │   ├── DeviceFrame.tsx
│   │   │   │   ├── ViewportSwitcher.tsx
│   │   │   │   ├── FullscreenOverlay.tsx
│   │   │   │   └── FullscreenTrigger.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── index.ts
│   │   │   │   ├── useViewport.ts
│   │   │   │   └── useFullscreen.ts
│   │   │   ├── context/
│   │   │   │   ├── index.ts
│   │   │   │   └── ViewportContext.tsx
│   │   │   ├── store/
│   │   │   │   ├── index.ts
│   │   │   │   └── viewportStore.ts
│   │   │   ├── types/
│   │   │   │   ├── index.ts
│   │   │   │   └── preview-shell.types.ts
│   │   │   └── constants/
│   │   │       ├── index.ts
│   │   │       └── viewport.constants.ts
│   │   └── index.ts                          # Exports preview-shell module (UPDATED)
│   └── domains/
│       └── dev-tools/
│           └── preview-shell/                 # Dev-tools testing interface (NEW)
│               ├── index.ts                   # Exports DevToolsPreviewShell
│               ├── DevToolsPreviewShell.tsx   # Container component (page logic)
│               └── components/
│                   ├── index.ts
│                   ├── PropControlsPanel.tsx  # Left column (prop controls)
│                   └── PreviewArea.tsx        # Right column (live preview)
└── app/
    └── admin/
        └── dev-tools/
            └── preview-shell.tsx              # Route file for /admin/dev-tools/preview-shell (NEW)
```

**Structure Decision**:
- **Shared Module** (`/shared/preview-shell/`): Foundational UI infrastructure reusable across domains
- **Dev-Tools Domain** (`/domains/dev-tools/preview-shell/`): Testing interface specific to dev-tools
  - `DevToolsPreviewShell.tsx` - Container component handling page state and layout
  - `components/` - UI components (PropControlsPanel, PreviewArea)
- **Route File** (`/app/admin/dev-tools/preview-shell.tsx`): TanStack Router file-based routing (imports container from domain)

This follows the vertical slice architecture with:
- Shared infrastructure in `/shared/` (accessible to all domains)
- Domain-specific features in `/domains/` (dev-tools testing playground - contains page logic)
- Router definitions in `/app/` (imports and renders domain containers)
- Clear separation: domain owns business logic, router owns navigation

## Complexity Tracking

**Status**: No violations requiring justification.

This is a straightforward module migration with minimal complexity:
- Direct file copy with path updates
- Single new dependency (zustand - already approved in requirements)
- Standard component patterns (no custom abstractions)
- Simple dev-tools page (2-column layout with prop controls)

No constitution principles violated.

---

## Phase 0: Research (COMPLETED)

### Research Findings

All technical unknowns have been resolved through exploration of the existing Next.js module:

#### ✅ Module Structure
- **Finding**: 15 files organized in 6 subdirectories (components, hooks, context, store, types, constants)
- **Decision**: Preserve exact structure in migration to maintain consistency
- **Rationale**: Clear separation of concerns, easy to navigate, follows best practices

#### ✅ Zustand Configuration
- **Finding**: Uses `create` + `persist` middleware with localStorage key "preview-viewport"
- **Decision**: Maintain exact same configuration (no changes needed)
- **Rationale**: Persistence behavior is well-tested and works correctly

#### ✅ Import Path Updates Required
- **Current Paths**: `@/lib/utils`, `@/components/ui/button`
- **New Paths**: `@/shared/utils`, `@/ui-kit/components/button`
- **Decision**: Use find-and-replace for path updates
- **Rationale**: Mechanical transformation, low risk

#### ✅ Client Component Handling
- **Finding**: All files use "use client" directive
- **Decision**: Preserve "use client" directives in TanStack Start
- **Rationale**: TanStack Start supports React Client Components same as Next.js App Router

#### ✅ Zustand in TanStack Start
- **Finding**: Zustand is framework-agnostic (works in any React environment)
- **Decision**: No special configuration needed for TanStack Start
- **Rationale**: Zustand works identically in TanStack Start and Next.js

#### ✅ Best Practices
- **Finding**: Existing module follows all React best practices (hooks rules, immutability, composition)
- **Decision**: Maintain existing patterns without refactoring
- **Rationale**: If it works well, don't change it

**Research Status**: ✅ COMPLETE (all unknowns resolved)

---

## Phase 1: Design & Contracts

### Data Model

See [data-model.md](./data-model.md) for detailed entity definitions.

**Summary**:
- **ViewportMode**: "mobile" | "desktop" literal type
- **ViewportDimensions**: { width: number, height: number }
- **ViewportState**: Zustand store state { mode, setMode, toggle }
- **FullscreenState**: boolean (managed by useFullscreen hook)
- **ComponentConfig**: Dev-tools configuration state

No database entities (pure client-side state management).

### API Contracts

**Status**: N/A

This module has no API contracts. It's pure client-side UI infrastructure with:
- No HTTP endpoints
- No GraphQL mutations
- No Firebase operations
- Only local state management (React + zustand)

**Public API** (TypeScript exports):
- See barrel exports in `/index.ts` files
- Types exported from `/types/preview-shell.types.ts`
- Components, hooks, context exported for consumer use

### Developer Quick-Start

See [quickstart.md](./quickstart.md) for step-by-step migration guide.

**Quick Summary**:
1. Install zustand dependency
2. Copy files from Next.js to TanStack Start
3. Update import paths (find-and-replace)
4. Update barrel exports in `/shared/index.ts`
5. Create dev-tools route and components
6. Test in dev server
7. Run validation gates

---

## Phase 2: Implementation Tasks

**Status**: To be generated by `/speckit.tasks` command.

Tasks will be created based on this implementation plan and will include:
- Dependency installation
- File migration
- Path updates
- Barrel export updates
- Dev-tools page creation
- Manual testing via dev-tools interface
- Validation gates (format, lint, type-check)
- Standards compliance review

**Note**: This plan document ends here. The `/speckit.tasks` command will generate the detailed task breakdown in `tasks.md`.
