# Research: Preview Shell Feature Module

**Feature**: 024-preview-shell
**Date**: 2025-12-10

## Overview

This document consolidates research findings for the preview-shell feature module implementation. All technical decisions are documented with rationale and alternatives considered.

---

## 1. Component Extraction Strategy

### Decision: Extract DeviceFrame as Pure Container

**Rationale**: The current DeviceFrame in `steps` feature has theme dependencies (`useEventTheme`, `ThemedBackground`) baked in. For reusability, the preview-shell version should be a pure container that accepts any children.

**Alternatives Considered**:

| Option | Description | Why Rejected |
|--------|-------------|--------------|
| Copy with theme support | Keep ThemedBackground integration | Couples preview-shell to theming module, reduces flexibility |
| Make theming optional prop | Add `background` prop to DeviceFrame | Blurs responsibility, theming should be consumer's concern |
| **Pure container (chosen)** | DeviceFrame renders frame only | Maximum flexibility, clear separation of concerns |

**Implementation**: Consumers wrap their content with `ThemedBackground` as needed. This matches the PRD recommendation.

---

## 2. ViewportSwitcher vs ViewSwitcher Naming

### Decision: Rename to ViewportSwitcher

**Rationale**: "Viewport" is more precise than "View" in this context. The component specifically toggles between viewport modes (mobile/desktop dimensions), not generic views.

**Alternatives Considered**:

| Option | Description | Why Rejected |
|--------|-------------|--------------|
| ViewSwitcher | Keep original name | Ambiguous - could mean any view switching |
| DeviceSwitcher | Emphasize device aspect | Less accurate - we're switching viewport size, not device |
| **ViewportSwitcher (chosen)** | Precise terminology | Clear intent, matches type name (ViewportMode) |

---

## 3. Fullscreen Implementation Approach

### Decision: CSS Overlay (not native Fullscreen API)

**Rationale**: CSS overlay (`fixed inset-0 z-50`) provides consistent behavior across all browsers and easier UI control (header, close button). Native Fullscreen API has cross-browser inconsistencies and limited UI customization.

**Alternatives Considered**:

| Option | Description | Why Rejected |
|--------|-------------|--------------|
| Native Fullscreen API | Use `requestFullscreen()` | Browser inconsistencies, difficult to add custom header/controls |
| **CSS Overlay (chosen)** | Fixed positioning with z-index | Reliable, customizable, matches PRD recommendation |

**Implementation Details**:
- Container: `fixed inset-0 z-50 bg-background`
- Header: Fixed top bar with title, ViewportSwitcher, close button
- Body: Centered DeviceFrame with padding
- Exit: Escape key listener + close button

---

## 4. State Management Pattern

### Decision: Controlled + Uncontrolled Support

**Rationale**: Some consumers want to manage viewport state externally (controlled), while others prefer internal state (uncontrolled). Supporting both provides maximum flexibility.

**Pattern**:
```tsx
// Uncontrolled (internal state)
<PreviewShell defaultViewport="mobile">

// Controlled (external state)
<PreviewShell
  viewportMode={viewport}
  onViewportChange={setViewport}
>
```

**Implementation**: Use pattern from React form inputs - check if `viewportMode` prop is provided to determine mode.

---

## 5. Context Design

### Decision: Extended ViewportContext with Dimensions + Fullscreen

**Rationale**: Nested components need access to current viewport mode, computed dimensions, and fullscreen state. A single context provides all preview-related state.

**Context Shape**:
```typescript
interface ViewportContextValue {
  mode: ViewportMode;              // "mobile" | "desktop"
  dimensions: ViewportDimensions;  // { width, height }
  isFullscreen: boolean;
}
```

**Alternatives Considered**:

| Option | Description | Why Rejected |
|--------|-------------|--------------|
| Separate contexts | One for viewport, one for fullscreen | Unnecessary complexity, related state |
| Props drilling | Pass through component tree | Tedious for deeply nested components |
| **Single context (chosen)** | Combined preview state | Simple, cohesive, matches use case |

---

## 6. Hook Organization

### Decision: Separate useViewport and useFullscreen Hooks

**Rationale**: Different concerns warrant different hooks. `useViewport` handles mode state, `useFullscreen` handles overlay state + keyboard events.

**Hook Responsibilities**:

| Hook | Responsibility |
|------|---------------|
| `useViewport` | Viewport mode state (controlled/uncontrolled), dimension lookup |
| `useFullscreen` | Fullscreen state, Escape key listener, enter/exit callbacks |

**Alternatives Considered**:

| Option | Description | Why Rejected |
|--------|-------------|--------------|
| Single usePreviewShell | Combine all state | Too large, harder to test |
| **Separate hooks (chosen)** | One hook per concern | Focused, testable, composable |

---

## 7. Steps Feature Migration Strategy

### Decision: Re-export from preview-shell (Backward Compatibility)

**Rationale**: Existing code in `steps` feature uses `DeviceFrame`, `ViewSwitcher`, `ViewportModeContext`. To avoid breaking changes, these will be re-exported from steps (marked deprecated) while implementation moves to preview-shell.

**Migration Path**:
1. Create preview-shell module with new implementations
2. Update steps feature to re-export from preview-shell
3. Add deprecation warnings to steps exports
4. Gradually update consumers to import from preview-shell
5. Remove deprecated exports in future cleanup

**Timeline**: Phase 2 creates re-exports, Phase 4 removes them after migration complete.

---

## 8. Theme Editor Integration Pattern

### Decision: Replace PreviewPanel with PreviewShell + ThemedBackground

**Rationale**: Current `PreviewPanel` is a simple container with fixed height. Replacing with `PreviewShell` adds viewport switching and fullscreen capabilities.

**Before**:
```tsx
<PreviewPanel>
  <div style={{ backgroundColor: theme.background.color }}>
    <ThemePreviewContent />
  </div>
</PreviewPanel>
```

**After**:
```tsx
<PreviewShell enableViewportSwitcher enableFullscreen>
  <ThemedBackground background={theme.background}>
    <ThemePreviewContent />
  </ThemedBackground>
</PreviewShell>
```

**Benefits**:
- Viewport switching to see theme on mobile vs desktop
- Fullscreen mode for immersive preview
- Consistent preview UX across application

---

## 9. Keyboard Accessibility

### Decision: Escape Key Exits Fullscreen (Enabled by Default)

**Rationale**: Standard UX pattern - users expect Escape to dismiss overlays/modals. This should be enabled by default but configurable.

**Props**:
```tsx
interface FullscreenOverlayProps {
  closeOnEscape?: boolean;  // Default: true
  onExit: () => void;
}
```

**Implementation**: `useEffect` with `keydown` listener on document, cleanup on unmount.

---

## 10. Touch Target Sizing

### Decision: 44x44px Minimum for All Interactive Elements

**Rationale**: Constitution Principle I (Mobile-First) requires touch targets ≥44x44px. This applies to:
- ViewportSwitcher buttons
- FullscreenTrigger button
- Fullscreen close (X) button

**Implementation**: Use Tailwind classes `min-h-11 min-w-11` (44px) for interactive elements.

---

## 11. File Naming Convention

### Decision: Use `[domain].[purpose].[ext]` Pattern

**Rationale**: Constitution Principle VII (Feature Module Architecture) specifies explicit file naming for instant recognition.

**Examples**:
- `preview-shell.types.ts` (not `types.ts`)
- `viewport.constants.ts` (not `constants.ts`)

---

## 12. Public API Design

### Decision: Export Components, Hooks, Types Only

**Rationale**: Constitution Principle VII restricts public API to components, hooks, and types - NOT constants, utilities, or internal implementations.

**Public Exports** (`index.ts`):
```typescript
// Components
export { PreviewShell } from "./components";
export { DeviceFrame } from "./components";
export { ViewportSwitcher } from "./components";
export { FullscreenOverlay } from "./components";
export { FullscreenTrigger } from "./components";

// Hooks
export { useViewport } from "./hooks";
export { useFullscreen } from "./hooks";

// Context
export { ViewportProvider, useViewportContext } from "./context";

// Types
export type {
  ViewportMode,
  ViewportDimensions,
  ViewportContextValue,
  PreviewShellProps,
  // ... other prop types
} from "./types";
```

**Internal Only** (not exported from feature index):
- `VIEWPORT_DIMENSIONS` constant
- Internal utilities

---

## Summary

All research items have been resolved with clear decisions and rationale. No items require user clarification. The implementation can proceed with Phase 1: Design & Contracts.
