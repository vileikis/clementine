# Research: Preview Shell Module Migration

**Feature**: Preview Shell Module Migration
**Date**: 2025-12-29
**Status**: Complete

## Research Questions

### 1. Module Structure & Organization

**Question**: What is the complete file structure of the existing preview-shell module?

**Finding**:
The module contains 15 files organized across 6 subdirectories:

```
/web/src/features/preview-shell/
├── index.ts                           # Main barrel export
├── components/
│   ├── index.ts                       # Components barrel export
│   ├── PreviewShell.tsx               # Main orchestrator (~80 lines)
│   ├── DeviceFrame.tsx                # Device container (~40 lines)
│   ├── ViewportSwitcher.tsx           # Toggle buttons (~60 lines)
│   ├── FullscreenOverlay.tsx          # Fullscreen modal (~70 lines)
│   └── FullscreenTrigger.tsx          # Trigger button (~30 lines)
├── hooks/
│   ├── index.ts                       # Hooks barrel export
│   ├── useViewport.ts                 # Viewport state (~50 lines)
│   └── useFullscreen.ts               # Fullscreen state (~40 lines)
├── context/
│   ├── index.ts                       # Context barrel export
│   └── ViewportContext.tsx            # React context (~45 lines)
├── store/
│   ├── index.ts                       # Store barrel export
│   └── viewportStore.ts               # Zustand store (~20 lines)
├── types/
│   ├── index.ts                       # Types barrel export
│   └── preview-shell.types.ts         # All type definitions (~80 lines)
└── constants/
    ├── index.ts                       # Constants barrel export
    └── viewport.constants.ts          # Viewport dimensions (~8 lines)
```

**Decision**: Preserve this exact structure in the migration.

**Rationale**:
- Clear separation of concerns (components, hooks, context, store, types, constants)
- Easy to navigate and maintain
- Follows best practices for React module organization
- No improvement needed - structure is already optimal

**Alternatives Considered**:
- Flattening structure (all files in one directory) - Rejected: reduces discoverability
- Combining types/constants - Rejected: loses separation of concerns
- Splitting components further - Rejected: current granularity is appropriate

---

### 2. Zustand Store Configuration

**Question**: How is zustand configured for state persistence? Are there any TanStack Start compatibility concerns?

**Finding**:
```typescript
// /web/src/features/preview-shell/store/viewportStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useViewportStore = create<ViewportStore>()(
  persist(
    (set) => ({
      mode: "mobile",
      setMode: (mode) => set({ mode }),
      toggle: () =>
        set((state) => ({
          mode: state.mode === "mobile" ? "desktop" : "mobile",
        })),
    }),
    {
      name: "preview-viewport",  // localStorage key
    }
  )
);
```

**Key Configuration**:
- Uses zustand v5.0.9+ API (`create<Type>()()` double invocation)
- Persist middleware with localStorage backend
- Storage key: `"preview-viewport"`
- Default state: `{ mode: "mobile" }`
- No custom serialization/deserialization (uses JSON)

**TanStack Start Compatibility**:
- ✅ Zustand is framework-agnostic (no Next.js-specific code)
- ✅ Works identically in TanStack Start and Next.js
- ✅ Persist middleware handles SSR hydration correctly
- ✅ No special configuration needed

**Decision**: Use identical zustand configuration without modifications.

**Rationale**:
- Zustand works the same in all React environments
- Existing configuration is proven and tested
- No TanStack Start-specific adaptations needed

**Alternatives Considered**:
- Using TanStack Router's search params for state - Rejected: localStorage persistence is required
- Using React Context only (no zustand) - Rejected: loses cross-instance synchronization and persistence
- Different storage backend (sessionStorage) - Rejected: persistence across sessions is desired

---

### 3. Import Path Updates

**Question**: What import paths need updating when migrating from Next.js to TanStack Start?

**Finding**:

**Next.js Paths** (current):
```typescript
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PreviewShell } from "@/features/preview-shell";
```

**TanStack Start Paths** (target):
```typescript
import { cn } from "@/shared/utils";
import { Button } from "@/ui-kit/components/button";
import { PreviewShell } from "@/shared/preview-shell";
```

**Required Transformations**:
| Old Path | New Path | Affected Files |
|----------|----------|----------------|
| `@/lib/utils` | `@/shared/utils` | DeviceFrame, ViewportSwitcher, FullscreenOverlay, FullscreenTrigger, PreviewShell |
| `@/components/ui/button` | `@/ui-kit/components/button` | FullscreenOverlay, FullscreenTrigger |
| `@/features/preview-shell` | `@/shared/preview-shell` | (consumers only) |

**Decision**: Use find-and-replace for path updates during migration.

**Rationale**:
- Mechanical transformation with low risk
- Affects 5 files (all component files that import external dependencies)
- Easy to verify via TypeScript compiler errors

**Alternatives Considered**:
- Manual file-by-file updates - Rejected: error-prone, time-consuming
- Automated codemod script - Rejected: overkill for 2 simple path replacements

---

### 4. Client Component Handling

**Question**: How should "use client" directives be handled in TanStack Start?

**Finding**:
- All preview-shell files use `"use client"` directive
- TanStack Start supports React Server Components and Client Components
- Client Components work identically to Next.js App Router

**Client Component Files**:
```typescript
// All these files have "use client" directive:
- PreviewShell.tsx
- DeviceFrame.tsx
- ViewportSwitcher.tsx
- FullscreenOverlay.tsx
- FullscreenTrigger.tsx
- useViewport.ts
- useFullscreen.ts
- ViewportContext.tsx
- viewportStore.ts
```

**Why "use client" is needed**:
- `useState`, `useCallback`, `useMemo`, `useEffect` hooks
- Event handlers (`onClick`, keyboard events)
- Zustand store (client-side state)
- localStorage access (browser-only API)

**Decision**: Preserve all "use client" directives without changes.

**Rationale**:
- TanStack Start requires "use client" for the same reasons as Next.js
- No SSR needed for this UI infrastructure module
- Client-only code (hooks, state, events, localStorage)

**Alternatives Considered**:
- Removing "use client" and making components SSR-compatible - Rejected: requires localStorage, hooks, and client events
- Splitting into server/client components - Rejected: entire module is client-only, no benefit

---

### 5. Dependency Analysis

**Question**: What external dependencies does the module use? Are they available in TanStack Start?

**Finding**:

**External Packages** (from package.json):
| Package | Version | Usage | TanStack Start Compatible |
|---------|---------|-------|--------------------------|
| `react` | 19.2.0 | Core framework | ✅ Yes (same version) |
| `zustand` | 5.0.9 | State management | ❌ **MUST INSTALL** |
| `lucide-react` | 0.561.0 | Icons | ✅ Yes (already installed) |

**Internal Dependencies**:
| Import | Purpose | TanStack Start Path | Available |
|--------|---------|---------------------|-----------|
| `@/lib/utils` (cn) | Classname merger | `@/shared/utils` | ✅ Yes |
| `@/components/ui/button` | shadcn Button | `@/ui-kit/components/button` | ✅ Yes |

**Decision**:
1. Install zustand in TanStack Start workspace: `pnpm add zustand --filter @clementine/app`
2. Update import paths for `cn()` and `Button`
3. All other dependencies already available

**Rationale**:
- Zustand is not yet installed in TanStack Start app (verified in package.json)
- All other dependencies available or have direct equivalents
- Simple dependency installation process

**Alternatives Considered**:
- Using different state library (jotai, valtio) - Rejected: requires rewriting store logic
- Vendoring zustand code - Rejected: unnecessary, zustand is stable dependency

---

### 6. Testing Strategy

**Question**: How should the migrated module be tested?

**Finding**:
- Existing Next.js module has no automated tests
- Testing is done manually via integration in consuming features
- Requirements specify manual testing via dev-tools interface

**Testing Approach**:
1. **Dev-Tools Interactive Testing Interface**:
   - Route: `/admin/dev-tools/preview-shell`
   - Two-column layout (prop controls + live preview)
   - Visual verification of all functionality
   - No automated tests needed

2. **Validation Gates**:
   - TypeScript strict mode (compile-time errors)
   - ESLint (code quality)
   - Prettier (formatting)
   - Dev server smoke test (runtime errors)

3. **Manual Test Scenarios** (via dev-tools):
   - Viewport switching (mobile ↔ desktop)
   - Fullscreen activation/deactivation
   - Escape key handling
   - localStorage persistence (refresh page)
   - Component remount (reset button)
   - Prop toggle reactivity

**Decision**: Manual testing via dev-tools interface + validation gates. No automated tests.

**Rationale**:
- UI infrastructure best tested interactively
- Dev-tools interface provides comprehensive manual testing
- Validation gates catch type/lint errors
- Automated UI tests not in scope (constitution: minimal testing strategy)

**Alternatives Considered**:
- Writing Vitest component tests - Rejected: not required by spec, minimal testing strategy
- E2E tests with Playwright - Rejected: out of scope, high maintenance cost
- Visual regression tests - Rejected: overkill for internal dev tool

---

### 7. Public API & Barrel Exports

**Question**: What should be exported from the module? How should barrel exports be structured?

**Finding**:

**Current Public API** (from `/web/src/features/preview-shell/index.ts`):
```typescript
// Components
export { PreviewShell } from "./components/PreviewShell";
export { DeviceFrame } from "./components/DeviceFrame";
export { ViewportSwitcher } from "./components/ViewportSwitcher";
export { FullscreenOverlay } from "./components/FullscreenOverlay";
export { FullscreenTrigger } from "./components/FullscreenTrigger";

// Hooks
export { useViewport } from "./hooks/useViewport";
export { useFullscreen } from "./hooks/useFullscreen";

// Context
export { ViewportProvider, useViewportContext } from "./context/ViewportContext";

// Store
export { useViewportStore } from "./store/viewportStore";

// Types
export type * from "./types/preview-shell.types";

// Constants
export { VIEWPORT_DIMENSIONS } from "./constants/viewport.constants";
```

**Barrel Export Structure**:
```
preview-shell/
├── index.ts              # Main barrel (exports everything)
├── components/index.ts   # Component barrel
├── hooks/index.ts        # Hooks barrel
├── context/index.ts      # Context barrel
├── store/index.ts        # Store barrel
├── types/index.ts        # Types barrel
└── constants/index.ts    # Constants barrel
```

**Decision**: Preserve exact same public API and barrel export structure.

**Rationale**:
- Well-designed API surface (minimal but complete)
- Barrel exports improve import ergonomics
- Consumers can import from top level or subdirectories
- Follows project structure standards

**Alternatives Considered**:
- Flat exports (no subdirectory barrels) - Rejected: loses import flexibility
- Restricting exports (e.g., hiding store) - Rejected: all exports are intentionally public
- Named exports only (no type exports) - Rejected: TypeScript types are part of API

---

### 8. Dev-Tools Page Architecture

**Question**: How should the dev-tools testing interface be structured?

**Finding**:

**Requirements**:
- Route: `/admin/dev-tools/preview-shell`
- Two-column layout (25% controls, 75% preview)
- Interactive prop controls (toggles, select dropdown)
- Live preview area with sample content
- Reset & remount functionality

**Proposed Structure**:

**Route Definition** (`/app/admin/dev-tools/preview-shell.tsx`):
```typescript
// TanStack Router file-based route
import { createFileRoute } from "@tanstack/react-router";
import { DevToolsPreviewShell } from "@/domains/dev-tools/preview-shell";

export const Route = createFileRoute("/admin/dev-tools/preview-shell")({
  component: DevToolsPreviewShell,
});
```

**Container Component** (`/domains/dev-tools/preview-shell/DevToolsPreviewShell.tsx`):
```typescript
export function DevToolsPreviewShell() {
  const [config, setConfig] = useState({
    enableViewportSwitcher: true,
    enableFullscreen: true,
    defaultViewport: "mobile" as ViewportMode,
  });
  const [remountKey, setRemountKey] = useState(0);

  return (
    <div className="flex h-screen">
      {/* Left: Prop Controls (25%) */}
      <PropControlsPanel
        config={config}
        onConfigChange={setConfig}
        onReset={() => setRemountKey(k => k + 1)}
      />

      {/* Right: Preview Area (75%) */}
      <PreviewArea
        key={remountKey}  // Force remount on reset
        config={config}
      />
    </div>
  );
}
```

**UI Components** (`/domains/dev-tools/preview-shell/components/`):
1. **PropControlsPanel.tsx**:
   - Switch components for boolean props
   - Select dropdown for viewport mode
   - Reset button (triggers remount)
   - Form layout with labels

2. **PreviewArea.tsx**:
   - PreviewShell wrapper with config props
   - Rich sample content (headings, text, buttons, cards)
   - Visual state indicators

**Decision**: Three-layer architecture - route → container → UI components.

**Rationale**:
- **Route layer** (`/app/`): Handles navigation, imports domain container
- **Container layer** (`/domains/`): Owns page state and business logic
- **Component layer** (`/domains/.../components/`): Reusable UI components
- Clear separation of concerns (routing vs logic vs presentation)
- Domain owns functionality, router just wires it up

**Alternatives Considered**:
- Route contains page logic - Rejected: violates separation of routing and domain logic
- Single monolithic component - Rejected: harder to maintain, mixes concerns
- Separate store for dev-tools state - Rejected: overkill for simple UI state
- URL-based state (search params) - Rejected: state doesn't need to be shareable

---

## Research Summary

### All Unknowns Resolved ✅

1. **Module Structure**: Preserve exact 6-subdirectory structure
2. **Zustand Config**: Use identical configuration (no changes needed)
3. **Import Paths**: Replace `@/lib/utils` → `@/shared/utils`, `@/components/ui/*` → `@/ui-kit/components/*`
4. **Client Components**: Preserve all "use client" directives
5. **Dependencies**: Install zustand, update 2 import paths
6. **Testing**: Manual testing via dev-tools + validation gates
7. **Public API**: Maintain same exports and barrel structure
8. **Dev-Tools**: Three-layer architecture (route → container → UI components)

### Key Decisions

| Decision | Rationale | Alternative Rejected |
|----------|-----------|----------------------|
| Preserve module structure | Already optimal, clear separation | Flattening (reduces discoverability) |
| Keep zustand config unchanged | Framework-agnostic, proven | Different state solution (requires rewrite) |
| Manual testing only | UI best tested interactively | Automated tests (not in scope) |
| Three-layer dev-tools architecture | Clear separation: routing → logic → UI | Route contains logic (mixes concerns) |

### No Blockers

All research questions answered. Ready to proceed with Phase 1 (data model + quickstart).
