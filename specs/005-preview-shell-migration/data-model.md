# Data Model: Preview Shell Module

**Feature**: Preview Shell Module Migration
**Date**: 2025-12-29

## Overview

This document defines all data entities, types, and state models for the preview-shell module. The module is **pure client-side UI infrastructure** with no database persistence. All state is managed in-memory (React state) or browser localStorage (zustand persist middleware).

---

## Entity Definitions

### 1. ViewportMode

**Type**: Literal Union Type
**Purpose**: Represents the device viewport type selection

```typescript
type ViewportMode = "mobile" | "desktop";
```

**Values**:
- `"mobile"` - Mobile device viewport (375x667px - iPhone SE dimensions)
- `"desktop"` - Desktop viewport (900x600px - compact desktop)

**Validation Rules**:
- MUST be one of the two literal values
- No runtime validation needed (TypeScript enforces at compile time)

**State Transitions**:
```
mobile → toggle() → desktop
desktop → toggle() → mobile
```

**Usage**:
- Default value in zustand store: `"mobile"`
- Prop type for controlled viewport mode
- Context value for nested components

---

### 2. ViewportDimensions

**Type**: Object Type
**Purpose**: Represents viewport width and height in pixels

```typescript
interface ViewportDimensions {
  width: number;
  height: number;
}
```

**Fields**:
| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `width` | `number` | Viewport width in pixels | Positive integer |
| `height` | `number` | Viewport height in pixels | Positive integer |

**Validation Rules**:
- Width and height MUST be positive integers
- No decimal values (device pixels are whole numbers)

**Constants**:
```typescript
const VIEWPORT_DIMENSIONS: Record<ViewportMode, ViewportDimensions> = {
  mobile: { width: 375, height: 667 },   // iPhone SE
  desktop: { width: 900, height: 600 },  // Compact desktop
};
```

**Usage**:
- Computed from `ViewportMode` via lookup in `VIEWPORT_DIMENSIONS`
- Used for inline styles on `DeviceFrame` component
- Returned by `useViewport` hook

---

### 3. ViewportState (Zustand Store)

**Type**: Zustand Store State
**Purpose**: Global viewport mode state with localStorage persistence

```typescript
interface ViewportStore {
  mode: ViewportMode;
  setMode: (mode: ViewportMode) => void;
  toggle: () => void;
}
```

**Fields**:
| Field | Type | Description | Persistence |
|-------|------|-------------|-------------|
| `mode` | `ViewportMode` | Current viewport mode | ✅ localStorage |
| `setMode` | `(mode: ViewportMode) => void` | Set mode explicitly | ❌ Function (not persisted) |
| `toggle` | `() => void` | Toggle mobile ↔ desktop | ❌ Function (not persisted) |

**State Management**:
- **Library**: zustand v5.0.9+
- **Middleware**: `persist` (localStorage backend)
- **Storage Key**: `"preview-viewport"`
- **Initial State**: `{ mode: "mobile" }`

**Persistence Behavior**:
```json
// localStorage["preview-viewport"]
{
  "state": {
    "mode": "mobile"
  },
  "version": 0
}
```

**State Transitions**:
1. **setMode(mode)**:
   - Explicitly set mode to provided value
   - Persists to localStorage
   - Synchronizes all store subscribers

2. **toggle()**:
   - If current mode is "mobile" → set to "desktop"
   - If current mode is "desktop" → set to "mobile"
   - Persists to localStorage
   - Synchronizes all store subscribers

**Usage**:
- Global state shared across all `PreviewShell` instances
- Always updated on viewport change (even in controlled mode)
- Hydrates from localStorage on client-side mount

---

### 4. ViewportContextValue

**Type**: React Context Value
**Purpose**: Provides viewport state to nested components via React Context

```typescript
interface ViewportContextValue {
  mode: ViewportMode;
  dimensions: ViewportDimensions;
}
```

**Fields**:
| Field | Type | Description | Source |
|-------|------|-------------|--------|
| `mode` | `ViewportMode` | Current viewport mode | From parent state or zustand store |
| `dimensions` | `ViewportDimensions` | Computed viewport dimensions | Looked up from `VIEWPORT_DIMENSIONS[mode]` |

**Provider**:
```typescript
<ViewportProvider mode={mode}>
  {children}
</ViewportProvider>
```

**Consumer**:
```typescript
const { mode, dimensions } = useViewportContext();
```

**Validation Rules**:
- Context MUST be consumed within `ViewportProvider` (throws error otherwise)
- Mode and dimensions MUST be kept in sync

**Usage**:
- Provides viewport state to deeply nested components
- Avoids prop drilling for viewport-aware UI
- Used internally by `DeviceFrame` and other components

---

### 5. FullscreenState

**Type**: Boolean State (React useState)
**Purpose**: Tracks whether fullscreen overlay is currently active

```typescript
type FullscreenState = boolean;
```

**Values**:
- `true` - Fullscreen overlay is active
- `false` - Fullscreen overlay is not active

**State Management**:
- Managed by `useFullscreen` hook (React `useState`)
- Local to each component instance (no global store)
- Not persisted (resets on unmount)

**State Transitions**:
```
false → enter() → true
true → exit() → false
true → toggle() → false
false → toggle() → true
```

**Callbacks**:
```typescript
interface UseFullscreenOptions {
  onEnter?: () => void;   // Called when entering fullscreen
  onExit?: () => void;    // Called when exiting fullscreen
}
```

**Usage**:
- Controls visibility of `FullscreenOverlay` component
- Handles Escape key → exit transition
- Manages body scroll lock (prevent background scrolling)

---

### 6. ComponentConfig (Dev-Tools Only)

**Type**: Local Component State
**Purpose**: Configuration state for dev-tools testing interface

```typescript
interface ComponentConfig {
  enableViewportSwitcher: boolean;
  enableFullscreen: boolean;
  defaultViewport: ViewportMode;
}
```

**Fields**:
| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `enableViewportSwitcher` | `boolean` | Show viewport switcher buttons | `true` |
| `enableFullscreen` | `boolean` | Show fullscreen trigger button | `true` |
| `defaultViewport` | `ViewportMode` | Initial viewport mode | `"mobile"` |

**State Management**:
- Managed by dev-tools route component (`useState`)
- Local to dev-tools page (not shared)
- Not persisted (resets on page reload)

**Usage**:
- Controls which features are enabled in preview
- Passed as props to `PreviewShell` in dev-tools
- Updated by prop controls panel (toggles, select)

---

## Type Definitions

### Component Prop Types

```typescript
// PreviewShell component props
interface PreviewShellProps {
  children: React.ReactNode;
  enableViewportSwitcher?: boolean;        // Default: true
  enableFullscreen?: boolean;              // Default: true
  viewportMode?: ViewportMode;             // Controlled mode (optional)
  onViewportChange?: (mode: ViewportMode) => void;  // Controlled callback
  className?: string;
}

// DeviceFrame component props
interface DeviceFrameProps {
  children: React.ReactNode;
  mode: ViewportMode;
  className?: string;
}

// ViewportSwitcher component props
interface ViewportSwitcherProps {
  mode: ViewportMode;
  onModeChange: (mode: ViewportMode) => void;
  size?: "sm" | "md";                      // Default: "md"
  className?: string;
}

// FullscreenOverlay component props
interface FullscreenOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  showViewportSwitcher?: boolean;
  className?: string;
}

// FullscreenTrigger component props
interface FullscreenTriggerProps {
  onClick: () => void;
  className?: string;
}
```

### Hook Return Types

```typescript
// useViewport hook return type
interface UseViewportReturn {
  mode: ViewportMode;
  setMode: (mode: ViewportMode) => void;
  toggle: () => void;
  dimensions: ViewportDimensions;
}

// useFullscreen hook return type
interface UseFullscreenReturn {
  isFullscreen: boolean;
  enter: () => void;
  exit: () => void;
  toggle: () => void;
}
```

---

## State Flow Diagrams

### Viewport Mode State Flow

```
┌─────────────────────────────────────────────────────┐
│              Controlled Mode                        │
│  (viewportMode prop + onViewportChange callback)   │
│                                                     │
│  Parent Component                                   │
│  ┌─────────────────────────┐                       │
│  │ const [mode, setMode] = │                       │
│  │   useState("mobile")    │                       │
│  └──────────┬──────────────┘                       │
│             │                                       │
│             ▼                                       │
│  <PreviewShell                                      │
│    viewportMode={mode}                              │
│    onViewportChange={setMode}                       │
│  />                                                 │
│             │                                       │
│             ▼                                       │
│  ViewportSwitcher triggers onViewportChange         │
│             │                                       │
│             ▼                                       │
│  Parent setMode updates → re-renders PreviewShell   │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│            Uncontrolled Mode                        │
│  (no viewportMode prop - uses global store)        │
│                                                     │
│  <PreviewShell />  (no props)                       │
│         │                                           │
│         ▼                                           │
│  useViewportStore() → reads global mode             │
│         │                                           │
│         ▼                                           │
│  ViewportSwitcher triggers setMode()                │
│         │                                           │
│         ▼                                           │
│  zustand store updates → persists to localStorage   │
│         │                                           │
│         ▼                                           │
│  All PreviewShell instances re-render (subscribed)  │
└─────────────────────────────────────────────────────┘
```

### Fullscreen State Flow

```
┌─────────────────────────────────────────────────────┐
│  Component with useFullscreen hook                  │
│                                                     │
│  const { isFullscreen, enter, exit } =              │
│    useFullscreen({ onEnter, onExit });              │
│                                                     │
│  [Initial State: isFullscreen = false]              │
│         │                                           │
│         ▼                                           │
│  User clicks FullscreenTrigger                      │
│         │                                           │
│         ▼                                           │
│  enter() → setFullscreen(true) → onEnter() called   │
│         │                                           │
│         ▼                                           │
│  FullscreenOverlay renders (isOpen={isFullscreen})  │
│         │                                           │
│         ▼                                           │
│  User presses Escape or clicks close button         │
│         │                                           │
│         ▼                                           │
│  exit() → setFullscreen(false) → onExit() called    │
│         │                                           │
│         ▼                                           │
│  FullscreenOverlay unmounts                         │
└─────────────────────────────────────────────────────┘
```

---

## Persistence & Hydration

### localStorage Persistence

**Key**: `"preview-viewport"`

**Stored Data**:
```json
{
  "state": {
    "mode": "mobile" | "desktop"
  },
  "version": 0
}
```

**Hydration Flow**:
1. Component mounts on client
2. `useViewportStore` hook subscribes to store
3. Zustand checks `localStorage["preview-viewport"]`
4. If found: deserialize JSON and merge with initial state
5. If not found: use initial state (`{ mode: "mobile" }`)
6. Component re-renders with hydrated state

**Fallback Behavior**:
- If localStorage is full or blocked: falls back to in-memory state (no persistence)
- If stored data is corrupted: resets to initial state (`{ mode: "mobile" }`)

---

## No Database Entities

This module has **no backend or database entities**. All state is:
- In-memory (React `useState`, zustand store)
- Browser localStorage (zustand persist middleware)
- Ephemeral (resets on localStorage clear)

**Rationale**: Pure UI infrastructure for viewport simulation. No need for server-side state or database records.

---

## Summary

| Entity | Storage | Persistence | Scope |
|--------|---------|-------------|-------|
| ViewportMode | Type (no runtime storage) | N/A | N/A |
| ViewportDimensions | Computed (constants lookup) | N/A | N/A |
| ViewportState | zustand store | localStorage | Global (all instances) |
| ViewportContextValue | React Context | None | Component tree |
| FullscreenState | React useState | None | Component instance |
| ComponentConfig | React useState (dev-tools) | None | Dev-tools page |

**Key Takeaways**:
- Only `ViewportState` persists (via localStorage)
- All other state is ephemeral (in-memory)
- No backend APIs or database operations
- State management is entirely client-side
