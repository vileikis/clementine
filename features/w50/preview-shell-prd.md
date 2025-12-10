# PRD: Preview Shell Feature Module

## Overview

Create a reusable **preview-shell** feature module that provides device preview capabilities across the application. This module extracts and generalizes the preview infrastructure (viewport switching, device framing, fullscreen mode) currently embedded in the `steps` feature.

## Dependencies

**Requires**: `theming` module (see `theming-prd.md`)
- Uses `ThemedBackground` component for background styling
- Uses `Theme` types for type definitions

**Implementation Order**: theming → preview-shell

## Problem Statement

The current preview infrastructure (DeviceFrame, ViewSwitcher, viewport modes) is tightly coupled to the `steps` feature module. Other parts of the application (e.g., welcome screens, event previews, theme editor) need similar preview capabilities but cannot easily reuse the existing code.

## Goals

1. **Reusability**: Easy to add preview capabilities anywhere in the app
2. **Configurability**: Developer control over features (viewport switcher, fullscreen mode)
3. **Flexibility**: Render any children inside the preview container
4. **Consistency**: Unified look and behavior across all preview contexts

## Non-Goals

- **Theming/styling**: Handled by `theming` module (`ThemedBackground`, `ThemeProvider`)
- **Playback logic**: Step navigation, session state - stays in `steps` or `experience-engine`
- **Step rendering**: `PreviewRuntime` and step components stay in `steps`

## Naming Discussion

### Recommendation: `preview-shell`

The term "shell" accurately describes a container/wrapper that provides structure without dictating content. Other alternatives considered:

| Name | Pros | Cons |
|------|------|------|
| `preview` | Simple, intuitive | Too generic, conflicts with "preview" concept elsewhere |
| `preview-shell` | Clear purpose, "shell" implies container | Slightly longer |
| `viewport` | Describes core functionality | Doesn't convey the full feature set |
| `device-frame` | Descriptive | Too narrow (excludes fullscreen/controls) |
| `simulator` | Industry term | Implies more than UI framing |
| `showcase` | Marketing-friendly | Less technical precision |

**Verdict**: Use `preview-shell` - it's descriptive, distinguishes from step preview logic, and clearly communicates that it's a container/wrapper.

---

## Requirements

### Core Components

#### 1. PreviewShell (Main Container)

The primary wrapper component that orchestrates all preview features.

```tsx
interface PreviewShellProps {
  children: ReactNode;

  // Feature flags
  enableViewportSwitcher?: boolean; // Default: true
  enableFullscreen?: boolean;       // Default: false

  // Viewport control
  defaultViewport?: ViewportMode;   // Default: "mobile"
  viewportMode?: ViewportMode;      // Controlled mode
  onViewportChange?: (mode: ViewportMode) => void;

  // Fullscreen callbacks
  onFullscreenEnter?: () => void;
  onFullscreenExit?: () => void;

  // Styling
  className?: string;
}
```

**Note:** Background/theme styling is handled by wrapping content with `ThemedBackground` from the `theming` module. This keeps `PreviewShell` focused on viewport/fullscreen concerns.

**Usage Example:**

```tsx
import { PreviewShell } from "@/features/preview-shell";
import { ThemedBackground } from "@/features/theming";

// Simple usage - just device frame
<PreviewShell>
  <MyComponent />
</PreviewShell>

// With themed background (from theming module)
<PreviewShell enableViewportSwitcher>
  <ThemedBackground background={theme.background}>
    <MyComponent />
  </ThemedBackground>
</PreviewShell>

// With fullscreen support
<PreviewShell enableFullscreen enableViewportSwitcher>
  <ThemedBackground background={theme.background} fontFamily={theme.fontFamily}>
    <MyComponent />
  </ThemedBackground>
</PreviewShell>

// Controlled viewport (background optional)
<PreviewShell
  viewportMode={viewport}
  onViewportChange={setViewport}
  enableViewportSwitcher
>
  <MyComponent />
</PreviewShell>
```

#### 2. DeviceFrame

Reusable device frame - pure viewport/size container.

```tsx
interface DeviceFrameProps {
  children: ReactNode;
  viewportMode?: ViewportMode;
  className?: string;
}
```

**Key changes from existing DeviceFrame:**
- Remove logo rendering (not needed for generic use)
- Remove background handling (use `ThemedBackground` from theming module)
- Pure viewport/frame container only
- Maintain viewport dimensions logic

#### 3. ViewportSwitcher (Extracted from steps)

Already well-designed, minimal changes needed.

```tsx
interface ViewportSwitcherProps {
  mode: ViewportMode;
  onChange: (mode: ViewportMode) => void;
  className?: string;
  size?: "sm" | "md"; // New: size variant
}
```

#### 4. FullscreenOverlay (New Component)

Full-screen preview mode with easy exit options.

```tsx
interface FullscreenOverlayProps {
  children: ReactNode;

  // Header content
  title?: string;
  headerContent?: ReactNode; // Custom header (e.g., ViewSwitcher)

  // Exit options
  onExit: () => void;
  showCloseButton?: boolean;     // Default: true
  closeOnEscape?: boolean;       // Default: true

  // Viewport support in fullscreen
  viewportMode?: ViewportMode;
  enableViewportSwitcher?: boolean;
  onViewportChange?: (mode: ViewportMode) => void;
}
```

**Keyboard Support:**
- `Escape` key to exit fullscreen (when `closeOnEscape` is true)

**UI:**
- Fixed overlay covering entire viewport (`fixed inset-0 z-50`)
- Close button (X) in top-right corner
- Optional title in header
- ViewSwitcher in header when enabled

#### 5. FullscreenTrigger (New Component)

Button to enter fullscreen mode.

```tsx
interface FullscreenTriggerProps {
  onClick: () => void;
  className?: string;
  size?: "sm" | "md";
  variant?: "ghost" | "outline";
}
```

### Types

```tsx
// web/src/features/preview-shell/types.ts

export type ViewportMode = "mobile" | "desktop";

export interface ViewportDimensions {
  width: number;
  height: number;
}

export const VIEWPORT_DIMENSIONS: Record<ViewportMode, ViewportDimensions> = {
  mobile: { width: 375, height: 667 },
  desktop: { width: 900, height: 600 },
};
```

### Context (Optional)

```tsx
// ViewportContext for nested components to access current viewport
interface ViewportContextValue {
  mode: ViewportMode;
  dimensions: ViewportDimensions;
  isFullscreen: boolean;
}
```

---

## UI/UX Specifications

### Default Layout (Non-Fullscreen)

```
+------------------------------------------+
| Preview           [Mobile] [Desktop]     |  <- Header with ViewSwitcher (optional)
+------------------------------------------+
|                                          |
|    +----------------------------+        |
|    |                            |        |
|    |     Device Frame           |        |
|    |     (children)             |        |
|    |                            |        |
|    +----------------------------+        |
|                                          |
+------------------------------------------+
```

### Fullscreen Layout

```
+--------------------------------------------------+
| Experience Preview    [Mobile] [Desktop]     [X] |  <- Fixed header
+--------------------------------------------------+
|                                                  |
|                                                  |
|        +----------------------------+            |
|        |                            |            |
|        |     Device Frame           |            |
|        |     (children)             |            |
|        |                            |            |
|        +----------------------------+            |
|                                                  |
|                                                  |
+--------------------------------------------------+
```

### Exit Fullscreen

Two methods:
1. **Close Button (X)** - Top-right corner, always visible
2. **Escape Key** - Keyboard shortcut for power users

---

## File Structure

```
web/src/features/preview-shell/
├── index.ts                    # Public exports
├── types.ts                    # ViewportMode, ViewportDimensions
├── constants.ts                # VIEWPORT_DIMENSIONS
├── components/
│   ├── index.ts
│   ├── PreviewShell.tsx        # Main container component
│   ├── DeviceFrame.tsx         # Device frame (pure container)
│   ├── ViewportSwitcher.tsx    # Mobile/Desktop toggle (extracted)
│   ├── FullscreenOverlay.tsx   # Fullscreen mode overlay
│   └── FullscreenTrigger.tsx   # Button to enter fullscreen
├── context/
│   └── ViewportContext.tsx     # Optional context for nested access
└── hooks/
    ├── index.ts
    ├── useViewport.ts          # Viewport state management
    └── useFullscreen.ts        # Fullscreen state + keyboard handling
```

---

## Scope: Apply to Theme Editors

### Target Files
- `web/src/features/events/components/designer/EventThemeEditor.tsx`
- `web/src/features/projects/components/designer/ThemeEditor.tsx`

### Current State

Both theme editors use a simple `PreviewPanel` component that:
- Has no viewport switching (mobile/desktop)
- Has no fullscreen mode
- Uses fixed 70vh height
- No device frame styling (border radius, device chrome)

### Target State

Replace `PreviewPanel` with `PreviewShell` + `ThemedBackground` to provide:
- **Viewport switching**: See how theme looks on mobile vs desktop
- **Fullscreen mode**: Full immersive preview of the theme
- **Device frame**: Proper mobile device styling with rounded corners
- **Consistent UX**: Same preview behavior as Experience Editor

### Before (Current)

```tsx
// EventThemeEditor.tsx - current implementation
<PreviewPanel>
  <div
    className="relative flex h-full w-full flex-col..."
    style={{ backgroundColor: theme.background.color, ... }}
  >
    {/* theme preview content */}
  </div>
</PreviewPanel>
```

### After (With PreviewShell + ThemedBackground)

```tsx
import { PreviewShell } from "@/features/preview-shell";
import { ThemedBackground } from "@/features/theming";

// EventThemeEditor.tsx - refactored
<PreviewShell enableViewportSwitcher enableFullscreen>
  <ThemedBackground
    background={theme.background}
    fontFamily={theme.fontFamily}
  >
    <ThemePreviewContent theme={theme} />
  </ThemedBackground>
</PreviewShell>
```

### Value Added

| Feature | Before | After |
|---------|--------|-------|
| Mobile preview | Fixed size | Accurate 375px mobile frame |
| Desktop preview | N/A | 900px desktop view |
| Fullscreen | N/A | Full immersive preview |
| Device frame | Basic border | Rounded device chrome |
| Keyboard exit | N/A | Escape to exit fullscreen |

---

## Integration Examples

### 1. Experience Editor (Current Use Case)

```tsx
import { PreviewShell } from "@/features/preview-shell";

// Note: PreviewRuntime handles its own theming internally via ThemeProvider
<PreviewShell
  enableViewportSwitcher
  viewportMode={viewportMode}
  onViewportChange={setViewportMode}
>
  <PreviewRuntime step={displayStep} theme={theme} />
</PreviewShell>
```

### 2. Event Theme Editor (In Scope)

```tsx
import { PreviewShell } from "@/features/preview-shell";
import { ThemedBackground } from "@/features/theming";

<PreviewShell enableViewportSwitcher enableFullscreen>
  <ThemedBackground
    background={theme.background}
    fontFamily={theme.fontFamily}
  >
    <ThemePreviewContent theme={theme} />
  </ThemedBackground>
</PreviewShell>
```

### 3. Project Theme Editor (In Scope - Same Pattern)

```tsx
import { PreviewShell } from "@/features/preview-shell";
import { ThemedBackground } from "@/features/theming";

<PreviewShell enableViewportSwitcher enableFullscreen>
  <ThemedBackground
    background={theme.background}
    fontFamily={theme.fontFamily}
  >
    <ThemePreviewContent theme={theme} />
  </ThemedBackground>
</PreviewShell>
```

### 4. Welcome Screen Editor (Future Use Case)

```tsx
import { PreviewShell } from "@/features/preview-shell";
import { ThemedBackground } from "@/features/theming";

<PreviewShell enableViewportSwitcher enableFullscreen>
  <ThemedBackground background={welcomeConfig.background}>
    <WelcomeScreenPreview config={welcomeConfig} />
  </ThemedBackground>
</PreviewShell>
```

### 5. Standalone Fullscreen Button

```tsx
import { FullscreenTrigger, FullscreenOverlay } from "@/features/preview-shell";

<FullscreenTrigger onClick={() => setIsFullscreen(true)} />

{isFullscreen && (
  <FullscreenOverlay
    onExit={() => setIsFullscreen(false)}
    enableViewportSwitcher
    viewportMode={viewport}
    onViewportChange={setViewport}
  >
    <MyContent />
  </FullscreenOverlay>
)}
```

---

## Migration Plan

### Phase 1: Create Module (After theming module is complete)
1. Create `preview-shell` feature module structure
2. Define viewport types and constants
3. Extract `DeviceFrame` (pure container, no background)
4. Extract `ViewportSwitcher`
5. Create `PreviewShell` wrapper component

### Phase 2: Add Fullscreen
1. Create `FullscreenOverlay` component
2. Create `FullscreenTrigger` component
3. Create `useFullscreen` hook with keyboard handling
4. Integrate fullscreen into `PreviewShell`

### Phase 3: Migrate Experience Editor
1. Update `ExperienceEditor` to use new `PreviewShell`
2. Update imports from steps to preview-shell
3. Deprecate old `DeviceFrame` and `ViewSwitcher` in steps module

### Phase 4: Migrate Theme Editors
1. Refactor `EventThemeEditor` to use `PreviewShell` + `ThemedBackground`
2. Refactor `ThemeEditor` (projects) to use `PreviewShell` + `ThemedBackground`
3. Extract shared `ThemePreviewContent` component (logo, title, button preview)
4. Replace `PreviewPanel` usage with new components
5. Add viewport switching and fullscreen capabilities to both editors
6. Deprecate/remove `PreviewPanel` from projects feature

---

## Success Criteria

1. Any feature can add preview capabilities with `<PreviewShell>` wrapper
2. Fullscreen mode works with keyboard (Escape) and button exit
3. Viewport switching works in both inline and fullscreen modes
4. Zero breaking changes to existing experience editor
5. Theme editors have viewport switching and fullscreen mode

---

## Open Questions

1. Should `PreviewShell` automatically include the header with controls, or should it be composable (separate `PreviewShellHeader` component)?
   - **Recommendation**: Include header by default for simplicity, but allow `headerContent` prop for customization

2. Should we support custom viewport dimensions beyond mobile/desktop?
   - **Recommendation**: Not in MVP, but design types to be extensible

3. Should fullscreen use native Fullscreen API or just CSS overlay?
   - **Recommendation**: CSS overlay - more reliable cross-browser, easier to control UI

---

## Relationship to Other PRDs

| PRD | Relationship |
|-----|--------------|
| `theming-prd.md` | **Dependency**. preview-shell uses `ThemedBackground` from theming. |
| `welcome-screen-prd.md` | Will use preview-shell for preview capabilities. |

**Implementation Order:**
1. **theming** - Create types, provider, ThemedBackground
2. **preview-shell** (this PRD) - Uses theming components
