# PRD: Preview Shell Feature Module

## Overview

Create a reusable **preview shell** feature module that provides themed device preview capabilities across the application. This module extracts and generalizes the preview infrastructure currently embedded in the `steps` feature.

## Problem Statement

The current preview infrastructure (DeviceFrame, ViewSwitcher, viewport modes) is tightly coupled to the `steps` feature module. Other parts of the application (e.g., welcome screens, event previews, theme editor) need similar preview capabilities but cannot easily reuse the existing code.

## Goals

1. **Reusability**: Easy to add preview capabilities anywhere in the app
2. **Configurability**: Developer control over features (viewport switcher, fullscreen mode)
3. **Flexibility**: Render any children inside the preview container
4. **Consistency**: Unified look and behavior across all preview contexts

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

**Note:** Background/theme styling is handled by wrapping content with `ThemedBackground` inside `PreviewShell`. This keeps `PreviewShell` focused on viewport/fullscreen concerns while allowing flexible theming.

**Usage Example:**

```tsx
// Simple usage - just device frame
<PreviewShell>
  <MyComponent />
</PreviewShell>

// With themed background
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

#### 2. DeviceFrame (Extracted from steps)

Reusable device frame without logo (logo is theme-specific, handled by consumer).

```tsx
interface DeviceFrameProps {
  children: ReactNode;
  viewportMode?: ViewportMode;
  className?: string;
}
```

**Key changes from existing DeviceFrame:**
- Remove logo rendering (not needed for generic use)
- Remove background handling (moved to `ThemedBackground`)
- Pure viewport/frame container only
- Maintain viewport dimensions logic

#### 3. ThemedBackground (New - Extracted Pattern)

Handles background color, image, and overlay - extracted from duplicate code in `ThemeEditor` and `EventThemeEditor`.

```tsx
interface ThemedBackgroundProps {
  children: ReactNode;
  background?: {
    color?: string;
    image?: string;
    overlayOpacity?: number;
  };
  fontFamily?: string;
  className?: string;
}
```

**Usage:**
```tsx
// Inside DeviceFrame or standalone
<ThemedBackground
  background={{
    color: theme.background.color,
    image: theme.background.image,
    overlayOpacity: theme.background.overlayOpacity,
  }}
  fontFamily={theme.fontFamily}
>
  <YourContent />
</ThemedBackground>
```

**Eliminates duplicate code from:**
- `web/src/features/projects/components/designer/ThemeEditor.tsx` (lines 471-489)
- `web/src/features/events/components/designer/EventThemeEditor.tsx` (lines 476-493)
- `web/src/features/steps/components/preview/DeviceFrame.tsx` (lines 51-65)

All three have identical:
```tsx
// Background image
<div
  className="absolute inset-0 bg-cover bg-center"
  style={{ backgroundImage: `url(${image})` }}
/>
// Overlay
{overlayOpacity > 0 && (
  <div
    className="absolute inset-0 bg-black"
    style={{ opacity: overlayOpacity }}
  />
)}
```

#### 4. ViewportSwitcher (Extracted from steps)

Already well-designed, minimal changes needed.

```tsx
interface ViewportSwitcherProps {
  mode: ViewportMode;
  onChange: (mode: ViewportMode) => void;
  className?: string;
  size?: "sm" | "md"; // New: size variant
}
```

#### 5. FullscreenOverlay (New Component)

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

#### 6. FullscreenTrigger (New Component)

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

export interface PreviewTheme {
  background?: {
    color?: string;
    image?: string;
    overlayOpacity?: number;
  };
  fontFamily?: string;
}
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

## File Structure

```
web/src/features/preview-shell/
├── index.ts                    # Public exports
├── types.ts                    # Type definitions
├── constants.ts                # Viewport dimensions, etc.
├── components/
│   ├── index.ts
│   ├── PreviewShell.tsx        # Main container component
│   ├── DeviceFrame.tsx         # Device frame (extracted, pure container)
│   ├── ThemedBackground.tsx    # Background color/image/overlay (new)
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

## Scope: Apply to Event Theme Editor

**Target file**: `web/src/app/(workspace)/[companySlug]/[projectId]/[eventId]/theme/page.tsx`
**Component**: `EventThemeEditor` in `web/src/features/events/components/designer/EventThemeEditor.tsx`

### Current State

The Event Theme Editor currently uses a simple `PreviewPanel` component that:
- Has no viewport switching (mobile/desktop)
- Has no fullscreen mode
- Uses fixed 70vh height
- No device frame styling (border radius, device chrome)

### Target State

Replace `PreviewPanel` with `PreviewShell` to provide:
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

### After (With PreviewShell)

```tsx
// EventThemeEditor.tsx - refactored
<PreviewShell enableViewportSwitcher enableFullscreen>
  <ThemedBackground
    background={{
      color: theme.background.color,
      image: theme.background.image,
      overlayOpacity: theme.background.overlayOpacity,
    }}
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
// Refactored ExperienceEditor preview section
// Note: PreviewRuntime has its own ThemedBackground internally via EventThemeProvider
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
// Refactored EventThemeEditor preview section
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
// Refactored ThemeEditor (projects) - same as EventThemeEditor
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
<PreviewShell enableViewportSwitcher enableFullscreen>
  <ThemedBackground background={welcomeConfig.background}>
    <WelcomeScreenPreview config={welcomeConfig} />
  </ThemedBackground>
</PreviewShell>
```

### 5. Standalone Fullscreen Button

```tsx
// When you just need a fullscreen trigger elsewhere
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

## Migration Plan

### Phase 1: Create Module
1. Create `preview-shell` feature module structure
2. Extract `DeviceFrame` (without logo)
3. Extract `ViewportSwitcher`
4. Extract viewport types and constants
5. Create `PreviewShell` wrapper component

### Phase 2: Add Fullscreen
1. Create `FullscreenOverlay` component
2. Create `FullscreenTrigger` component
3. Create `useFullscreen` hook with keyboard handling
4. Integrate fullscreen into `PreviewShell`

### Phase 3: Migrate Experience Editor
1. Update `steps` feature to use `preview-shell` components
2. Update `ExperienceEditor` to use new `PreviewShell`
3. Deprecate old `DeviceFrame` and `ViewSwitcher` in steps module

### Phase 4: Migrate Theme Editors (In Scope)
1. Refactor `EventThemeEditor` to use `PreviewShell` + `ThemedBackground`
2. Refactor `ThemeEditor` (projects) to use `PreviewShell` + `ThemedBackground`
3. Extract shared `ThemePreviewContent` component (logo, title, button preview)
4. Replace `PreviewPanel` usage with new components
5. Add viewport switching and fullscreen capabilities to both editors
6. Deprecate/remove `PreviewPanel` from projects feature

## Non-Goals

- **Playback logic**: Step navigation, session state - stays in `steps` or `experience-engine`
- **Theme provider**: `EventThemeProvider` stays in `components/providers`
- **Step rendering**: `PreviewRuntime` and step components stay in `steps`

## Success Criteria

1. Any feature can add preview capabilities with `<PreviewShell>` wrapper
2. Fullscreen mode works with keyboard (Escape) and button exit
3. Viewport switching works in both inline and fullscreen modes
4. Zero breaking changes to existing experience editor

## Open Questions

1. Should `PreviewShell` automatically include the header with controls, or should it be composable (separate `PreviewShellHeader` component)?
   - **Recommendation**: Include header by default for simplicity, but allow `headerContent` prop for customization

2. Should we support custom viewport dimensions beyond mobile/desktop?
   - **Recommendation**: Not in MVP, but design types to be extensible

3. Should fullscreen use native Fullscreen API or just CSS overlay?
   - **Recommendation**: CSS overlay - more reliable cross-browser, easier to control UI
