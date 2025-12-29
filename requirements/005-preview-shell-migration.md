# Feature Requirements: Preview Shell Module Migration + Dev Tools

## Goal

Migrate the **preview-shell module** from the Next.js app (`web/src/features/preview-shell/`) to the TanStack Start app (`apps/clementine-app/src/shared/preview-shell/`) and create **dev-tools testing interface** to enable device preview infrastructure for admin interfaces.

---

## Overview

The preview-shell module is **shared UI infrastructure** that provides:
- Device preview capabilities (mobile/desktop viewport simulation)
- Viewport switching with persistent state
- Fullscreen overlay mode
- Reusable preview components for admin tools

**Migration Target:** `/apps/clementine-app/src/shared/preview-shell/`

**Dev Tools Target:** `/apps/clementine-app/src/domains/dev-tools/preview-shell/`

---

## Part 1: Module Migration

### Module Structure

The migrated module MUST maintain the following exports:

**Components:**
- `PreviewShell` - Main orchestrator (viewport switching, fullscreen, device frame)
- `DeviceFrame` - Device screen container with proper dimensions
- `ViewportSwitcher` - Toggle buttons for mobile/desktop
- `FullscreenOverlay` - CSS-based fullscreen overlay with header
- `FullscreenTrigger` - Button to enter fullscreen mode

**Hooks:**
- `useViewport()` - Manages viewport mode state (controlled/uncontrolled)
- `useFullscreen()` - Manages fullscreen overlay state

**Context:**
- `ViewportProvider` - Context provider for viewport state
- `useViewportContext()` - Access viewport context

**Store:**
- `useViewportStore()` - Zustand global state with localStorage persistence

**Types:**
- `ViewportMode` - "mobile" | "desktop"
- `ViewportDimensions` - width/height object
- `ViewportContextValue` - Context value shape
- Component prop types

**Constants:**
- `VIEWPORT_DIMENSIONS` - Mobile (375x667px), Desktop (900x600px)

### Core Functionality

**PreviewShell Requirements:**
- MUST orchestrate viewport switching and fullscreen state
- MUST support controlled and uncontrolled modes
- MUST accept `enableViewportSwitcher` and `enableFullscreen` props
- MUST wrap content with `ViewportProvider`
- MUST render `DeviceFrame`, `ViewportSwitcher`, `FullscreenOverlay` conditionally

**DeviceFrame Requirements:**
- MUST render pure container simulating device screen
- MUST support mobile (375x667px fixed) and desktop (900x600px) modes
- MUST handle responsive layout (mobile centered, desktop fills space)
- MUST NOT handle theming (consumers wrap with ThemedBackground)

**ViewportSwitcher Requirements:**
- MUST render toggle buttons for mobile/desktop
- MUST include icons (Smartphone, Monitor) from lucide-react
- MUST support size variants ("sm", "md")
- MUST meet accessibility requirements (44x44px touch targets, ARIA labels)

**FullscreenOverlay Requirements:**
- MUST render CSS-based fullscreen overlay (not native Fullscreen API)
- MUST include header with title and optional close button
- MUST support viewport switcher in header
- MUST handle Escape key for closing
- MUST prevent body scroll when active

**useViewport Requirements:**
- MUST manage viewport mode state
- MUST support controlled/uncontrolled patterns
- MUST return: `mode`, `setMode`, `toggle`, `dimensions`

**useFullscreen Requirements:**
- MUST manage fullscreen overlay state
- MUST return: `isFullscreen`, `enter`, `exit`, `toggle`
- MUST support optional `onEnter`/`onExit` callbacks

**useViewportStore Requirements:**
- MUST use Zustand for global state management
- MUST persist viewport mode to localStorage (key: `"preview-viewport"`)
- MUST synchronize all PreviewShell instances
- MUST return: `mode`, `setMode`, `toggle`

---

## Part 2: Dev Tools Interface

### Route

**Route:** `/admin/dev-tools/preview-shell`

**Purpose:** Interactive playground for testing PreviewShell component with different configurations.

### Page Layout

The dev-tools page MUST include **two columns**:

**Column 1: Prop Controls** (Left - ~25% width)
- Component configuration panel
- Props:
  - `enableViewportSwitcher` (boolean toggle)
  - `enableFullscreen` (boolean toggle)
  - `defaultViewport` (select: "mobile" | "desktop")
- Actions:
  - Reset & Remount button (force component remount with key change)

**Column 2: Preview Area** (Right - ~75% width)
- Container showing PreviewShell with current configuration
- MUST display sample content inside PreviewShell (text, buttons, cards)
- MUST show current viewport mode visually (mobile frame vs desktop)
- MUST allow testing viewport switching and fullscreen mode interactively
- MUST visually indicate all state changes (viewport, fullscreen)

### Functionality Requirements

**Prop Controls Panel:**
- MUST allow toggling boolean props (Switch components)
- MUST allow selecting viewport mode (Select component)
- MUST trigger component remount on "Reset & Remount"
- MUST apply changes immediately

**Preview Area:**
- MUST render PreviewShell with current prop configuration
- MUST display rich sample content inside preview (text, buttons, images, cards)
- MUST be fully interactive (allow testing viewport switch, fullscreen)
- MUST show visual indication of viewport mode (mobile frame vs desktop)
- MUST show visual indication of fullscreen state (overlay active or not)
- State is verified visually - no separate monitor needed

**Reset Functionality:**
- MUST clear component state
- MUST force component remount (key change)
- MUST reset all props to defaults

**localStorage Persistence Testing:**
- MUST be testable by: change viewport → refresh page → verify persisted
- No real-time monitoring needed - persistence verified through page refresh

---

## Technical Requirements

### Dependency Installation

**Required:**
- MUST install `zustand` package: `pnpm add zustand --filter @clementine/app`
- MUST verify zustand persist middleware works in TanStack Start

### Import Path Updates

The following import paths MUST be updated:
- `@/lib/utils` → `@/shared/utils`
- `@/components/ui/button` → `@/ui-kit/components/button`

### Client Component Handling

- MUST verify "use client" directives are correct for TanStack Start
- MUST ensure Zustand store initialization works client-side
- MUST test localStorage persistence in TanStack Start environment

### Barrel Exports

- MUST maintain barrel export pattern (`index.ts` re-exports)
- MUST export module from `/shared/index.ts`
- MUST export dev-tools components from `/domains/dev-tools/preview-shell/index.ts`

---

## Validation Gates

Before marking migration complete:

**Technical Validation (Automated):**
- ✅ `pnpm check` (format + lint + auto-fix)
- ✅ `pnpm type-check` (zero TypeScript errors)
- ✅ Module builds without errors
- ✅ Dev server runs without warnings

**Standards Compliance (Manual):**
- ✅ Review `standards/global/project-structure.md` (barrel exports, vertical slices)
- ✅ Review `standards/global/code-quality.md` (clean code, simplicity)
- ✅ Review `standards/frontend/component-libraries.md` (shadcn/ui usage)
- ✅ Review `standards/frontend/accessibility.md` (ARIA labels, touch targets)

**Functional Verification:**
- ✅ PreviewShell renders correctly in both viewports
- ✅ Viewport switching works (mobile ↔ desktop) - visually verified
- ✅ Fullscreen mode works (enter/exit, Escape key) - visually verified
- ✅ Zustand store persists to localStorage (test via page refresh)
- ✅ Dev-tools page loads and functions correctly
- ✅ Prop controls update preview in real-time
- ✅ Reset & remount works correctly
- ✅ All state changes are visible in the preview (no hidden state)

---

## Acceptance Criteria

### Module Migration

- [ ] All files copied to `/apps/clementine-app/src/shared/preview-shell/`
- [ ] `zustand` dependency installed and configured
- [ ] Import paths updated to TanStack Start conventions
- [ ] All barrel exports maintain public API surface
- [ ] Module structure preserved (components/, hooks/, context/, store/, types/, constants/)

### Component Functionality

- [ ] `PreviewShell` orchestrates viewport and fullscreen correctly
- [ ] `DeviceFrame` renders mobile (375x667px) and desktop (900x600px)
- [ ] `ViewportSwitcher` toggles between modes
- [ ] `FullscreenOverlay` renders and closes correctly
- [ ] `useViewport` supports controlled/uncontrolled modes
- [ ] `useFullscreen` manages fullscreen state
- [ ] `useViewportStore` persists to localStorage

### Dev Tools Page

- [ ] Route `/admin/dev-tools/preview-shell` exists and loads
- [ ] Two-column layout renders correctly (controls left, preview right)
- [ ] Prop controls panel allows toggling all props
- [ ] Preview area shows PreviewShell with current config
- [ ] Preview area displays rich sample content
- [ ] All state changes are visually apparent in preview
- [ ] localStorage persistence works (verified via page refresh)
- [ ] Reset & remount triggers component remount
- [ ] All interactions work smoothly (no errors)

### Build & Type Safety

- [ ] TypeScript strict mode passes (zero errors)
- [ ] ESLint passes (zero errors)
- [ ] Prettier formatting applied
- [ ] No runtime errors in dev server
- [ ] Module can be imported from other domains

---

## Dependencies

### Available

- ✅ React 19.2 (hooks: useState, useCallback, useMemo, useContext, useEffect)
- ✅ lucide-react v0.561.0 (icons)
- ✅ Button component (`@/ui-kit/components/button`)
- ✅ `cn` utility (`@/shared/utils`)
- ✅ Switch, Select components (shadcn/ui - may need to add)

### Must Install

- ❌ `zustand` (global state + persist middleware)

---

## Migration Priority

**Priority:** 1 (First)

**Rationale:**
- Independent module with no feature dependencies
- Only requires zustand installation and standard path updates
- Provides critical infrastructure for admin preview tooling
- Can be migrated and tested independently

---

## Explicit Non-Goals (Out of Scope)

- Native Fullscreen API support (CSS-based only)
- Mobile device detection or automatic viewport selection
- Custom viewport sizes beyond mobile/desktop presets
- Recording or screenshot capabilities
- Multi-device preview (multiple viewports simultaneously)
- Tablet-specific viewport mode
- Responsive design testing tools

---

## References

### Source Module
- **Location:** `/web/src/features/preview-shell/`
- **Files:** ~15 files (components, hooks, context, store, types, constants)
- **Used by:** Theme editor, experience editor, step previews

### Target Module
- **Location:** `/apps/clementine-app/src/shared/preview-shell/`
- **Classification:** Shared UI infrastructure
- **Exports:** Public API preserved via barrel exports

### Dev Tools Location
- **Location:** `/apps/clementine-app/src/domains/dev-tools/preview-shell/`
- **Route:** `/admin/dev-tools/preview-shell`
- **Purpose:** Interactive testing playground

---

## Success Metrics

- ✅ Module migrated with zero TypeScript errors
- ✅ All validation gates passed
- ✅ Zustand store persists correctly to localStorage
- ✅ Dev-tools page loads and functions without errors
- ✅ All component interactions work smoothly
- ✅ No breaking changes to public API
- ✅ Module can be used by other features (theme editor, experience editor)
