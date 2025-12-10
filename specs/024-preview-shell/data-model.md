# Data Model: Preview Shell

**Feature**: 024-preview-shell
**Date**: 2025-12-10

## Overview

The preview-shell feature is a client-side only module. This document defines TypeScript types and interfaces rather than database entities. No Firestore collections or server-side data storage is involved.

---

## Core Types

### ViewportMode

Enumeration of supported viewport sizes.

```typescript
/**
 * Supported viewport modes for device preview
 */
export type ViewportMode = "mobile" | "desktop";
```

**Usage**: Determines which device frame dimensions to apply.

---

### ViewportDimensions

Width and height specification for each viewport mode.

```typescript
/**
 * Pixel dimensions for a viewport mode
 */
export interface ViewportDimensions {
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
}
```

**Predefined Values**:
| Mode | Width | Height |
|------|-------|--------|
| mobile | 375px | 667px |
| desktop | 900px | 600px |

---

### ViewportContextValue

React context value providing viewport state to nested components.

```typescript
/**
 * Context value for viewport state
 */
export interface ViewportContextValue {
  /** Current viewport mode */
  mode: ViewportMode;
  /** Computed dimensions for current mode */
  dimensions: ViewportDimensions;
  /** Whether fullscreen overlay is active */
  isFullscreen: boolean;
}
```

**Provider**: `ViewportProvider`
**Consumer Hook**: `useViewportContext`

---

## Component Props

### PreviewShellProps

Main wrapper component props.

```typescript
/**
 * Props for PreviewShell component
 */
export interface PreviewShellProps {
  /** Content to render inside device frame */
  children: ReactNode;

  // Feature flags
  /** Show viewport switcher controls. Default: true */
  enableViewportSwitcher?: boolean;
  /** Enable fullscreen mode. Default: false */
  enableFullscreen?: boolean;

  // Viewport control (uncontrolled)
  /** Initial viewport mode when uncontrolled. Default: "mobile" */
  defaultViewport?: ViewportMode;

  // Viewport control (controlled)
  /** Current viewport mode (controlled) */
  viewportMode?: ViewportMode;
  /** Callback when viewport changes (controlled) */
  onViewportChange?: (mode: ViewportMode) => void;

  // Fullscreen callbacks
  /** Called when entering fullscreen */
  onFullscreenEnter?: () => void;
  /** Called when exiting fullscreen */
  onFullscreenExit?: () => void;

  // Styling
  /** Additional CSS classes for container */
  className?: string;
}
```

---

### DeviceFrameProps

Device frame container props.

```typescript
/**
 * Props for DeviceFrame component
 */
export interface DeviceFrameProps {
  /** Content to render inside device frame */
  children: ReactNode;
  /** Viewport mode determining dimensions. Default: "mobile" */
  viewportMode?: ViewportMode;
  /** Additional CSS classes */
  className?: string;
}
```

---

### ViewportSwitcherProps

Viewport toggle button group props.

```typescript
/**
 * Props for ViewportSwitcher component
 */
export interface ViewportSwitcherProps {
  /** Current viewport mode */
  mode: ViewportMode;
  /** Callback when mode changes */
  onChange: (mode: ViewportMode) => void;
  /** Additional CSS classes */
  className?: string;
  /** Button size variant. Default: "md" */
  size?: "sm" | "md";
}
```

---

### FullscreenOverlayProps

Fullscreen overlay component props.

```typescript
/**
 * Props for FullscreenOverlay component
 */
export interface FullscreenOverlayProps {
  /** Content to render in fullscreen */
  children: ReactNode;

  // Header content
  /** Title displayed in header */
  title?: string;
  /** Custom header content (e.g., additional controls) */
  headerContent?: ReactNode;

  // Exit options
  /** Callback when exiting fullscreen */
  onExit: () => void;
  /** Show close (X) button. Default: true */
  showCloseButton?: boolean;
  /** Exit on Escape key press. Default: true */
  closeOnEscape?: boolean;

  // Viewport support
  /** Current viewport mode */
  viewportMode?: ViewportMode;
  /** Show viewport switcher in header. Default: false */
  enableViewportSwitcher?: boolean;
  /** Callback when viewport changes */
  onViewportChange?: (mode: ViewportMode) => void;
}
```

---

### FullscreenTriggerProps

Button to enter fullscreen mode.

```typescript
/**
 * Props for FullscreenTrigger component
 */
export interface FullscreenTriggerProps {
  /** Callback when clicked */
  onClick: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Button size variant. Default: "md" */
  size?: "sm" | "md";
  /** Button style variant. Default: "ghost" */
  variant?: "ghost" | "outline";
}
```

---

## Hook Return Types

### UseViewportReturn

Return type for useViewport hook.

```typescript
/**
 * Return value from useViewport hook
 */
export interface UseViewportReturn {
  /** Current viewport mode */
  mode: ViewportMode;
  /** Set viewport mode */
  setMode: (mode: ViewportMode) => void;
  /** Toggle between mobile and desktop */
  toggle: () => void;
  /** Computed dimensions for current mode */
  dimensions: ViewportDimensions;
}
```

---

### UseFullscreenReturn

Return type for useFullscreen hook.

```typescript
/**
 * Return value from useFullscreen hook
 */
export interface UseFullscreenReturn {
  /** Whether fullscreen is active */
  isFullscreen: boolean;
  /** Enter fullscreen mode */
  enter: () => void;
  /** Exit fullscreen mode */
  exit: () => void;
  /** Toggle fullscreen state */
  toggle: () => void;
}
```

---

## Constants

### VIEWPORT_DIMENSIONS

Mapping of viewport modes to dimensions.

```typescript
/**
 * Predefined dimensions for each viewport mode
 */
export const VIEWPORT_DIMENSIONS: Record<ViewportMode, ViewportDimensions> = {
  mobile: { width: 375, height: 667 },
  desktop: { width: 900, height: 600 },
};
```

**Note**: This constant is internal to the module and not exported from the public API.

---

## Type Relationships

```
ViewportMode ──────┐
                   │
                   ▼
    ┌──────────────────────────────┐
    │     ViewportContextValue     │
    ├──────────────────────────────┤
    │ mode: ViewportMode           │
    │ dimensions: ViewportDimensions│
    │ isFullscreen: boolean        │
    └──────────────────────────────┘
                   ▲
                   │
    ┌──────────────┴──────────────┐
    │                             │
PreviewShellProps         FullscreenOverlayProps
    │                             │
    ├── viewportMode?             ├── viewportMode?
    ├── onViewportChange?         ├── onViewportChange?
    └── enableFullscreen?         └── closeOnEscape?
```

---

## Validation

No Zod schemas are required for this feature because:

1. **No external inputs**: All data is internal React state
2. **No API boundaries**: No server communication
3. **TypeScript suffices**: Compile-time type checking is adequate for component props

If future requirements introduce persisted viewport preferences, Zod schemas would be added for the persistence layer.

---

## State Transitions

### Viewport State

```
mobile ◄────► desktop
         toggle()
```

### Fullscreen State

```
closed ──enter()──► open
   ▲                  │
   └───exit()/Esc─────┘
```

---

## Summary

| Type | Purpose |
|------|---------|
| ViewportMode | Union type for viewport options |
| ViewportDimensions | Width/height pair |
| ViewportContextValue | Context state shape |
| PreviewShellProps | Main component props |
| DeviceFrameProps | Frame container props |
| ViewportSwitcherProps | Toggle button props |
| FullscreenOverlayProps | Overlay component props |
| FullscreenTriggerProps | Fullscreen button props |
| UseViewportReturn | Viewport hook return |
| UseFullscreenReturn | Fullscreen hook return |
