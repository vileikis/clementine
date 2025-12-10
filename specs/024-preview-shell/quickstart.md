# Quickstart: Preview Shell

**Feature**: 024-preview-shell
**Date**: 2025-12-10

## Overview

The `preview-shell` feature module provides reusable device preview capabilities for any content in the application. This guide shows how to integrate preview-shell into your feature.

---

## Installation

No installation required - the module is part of the Clementine codebase.

---

## Basic Usage

### Simple Device Frame

Wrap any content in a device frame:

```tsx
import { PreviewShell } from "@/features/preview-shell";

function MyComponent() {
  return (
    <PreviewShell>
      <div>Your content here</div>
    </PreviewShell>
  );
}
```

This renders content in a mobile device frame (375x667px) by default.

---

### With Viewport Switching

Allow users to toggle between mobile and desktop views:

```tsx
import { PreviewShell } from "@/features/preview-shell";

function MyComponent() {
  return (
    <PreviewShell enableViewportSwitcher>
      <div>Your content here</div>
    </PreviewShell>
  );
}
```

---

### With Fullscreen Mode

Enable immersive fullscreen preview:

```tsx
import { PreviewShell } from "@/features/preview-shell";

function MyComponent() {
  return (
    <PreviewShell enableViewportSwitcher enableFullscreen>
      <div>Your content here</div>
    </PreviewShell>
  );
}
```

---

### With Themed Background

For content that needs theme styling, combine with the `theming` module:

```tsx
import { PreviewShell } from "@/features/preview-shell";
import { ThemedBackground } from "@/features/theming";

function ThemePreview({ theme }) {
  return (
    <PreviewShell enableViewportSwitcher enableFullscreen>
      <ThemedBackground
        background={theme.background}
        fontFamily={theme.fontFamily}
      >
        <YourThemedContent theme={theme} />
      </ThemedBackground>
    </PreviewShell>
  );
}
```

---

## Controlled vs Uncontrolled

### Uncontrolled (Internal State)

PreviewShell manages viewport state internally:

```tsx
<PreviewShell
  defaultViewport="desktop"  // Start with desktop view
  enableViewportSwitcher
>
  <Content />
</PreviewShell>
```

### Controlled (External State)

You manage viewport state:

```tsx
import { useState } from "react";
import { PreviewShell, type ViewportMode } from "@/features/preview-shell";

function MyComponent() {
  const [viewport, setViewport] = useState<ViewportMode>("mobile");

  return (
    <>
      <PreviewShell
        viewportMode={viewport}
        onViewportChange={setViewport}
        enableViewportSwitcher
      >
        <Content />
      </PreviewShell>

      {/* You can also control viewport from elsewhere */}
      <button onClick={() => setViewport("desktop")}>
        Switch to Desktop
      </button>
    </>
  );
}
```

---

## Using Individual Components

For more control, use components directly:

### DeviceFrame Only

```tsx
import { DeviceFrame } from "@/features/preview-shell";

<DeviceFrame viewportMode="mobile">
  <Content />
</DeviceFrame>
```

### ViewportSwitcher Only

```tsx
import { ViewportSwitcher, type ViewportMode } from "@/features/preview-shell";

function Controls({ mode, onChange }: {
  mode: ViewportMode;
  onChange: (mode: ViewportMode) => void;
}) {
  return (
    <ViewportSwitcher
      mode={mode}
      onChange={onChange}
      size="sm"  // or "md"
    />
  );
}
```

### Standalone Fullscreen

```tsx
import { useState } from "react";
import {
  FullscreenTrigger,
  FullscreenOverlay,
  DeviceFrame
} from "@/features/preview-shell";

function MyComponent() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <>
      <FullscreenTrigger onClick={() => setIsFullscreen(true)} />

      {isFullscreen && (
        <FullscreenOverlay
          title="Preview"
          onExit={() => setIsFullscreen(false)}
          enableViewportSwitcher
        >
          <DeviceFrame>
            <Content />
          </DeviceFrame>
        </FullscreenOverlay>
      )}
    </>
  );
}
```

---

## Using Hooks

### useViewport

Manage viewport state programmatically:

```tsx
import { useViewport } from "@/features/preview-shell";

function MyComponent() {
  const { mode, setMode, toggle, dimensions } = useViewport("mobile");

  return (
    <div>
      <p>Current: {mode} ({dimensions.width}x{dimensions.height})</p>
      <button onClick={toggle}>Toggle Viewport</button>
      <button onClick={() => setMode("desktop")}>Desktop</button>
    </div>
  );
}
```

### useFullscreen

Manage fullscreen state:

```tsx
import { useFullscreen } from "@/features/preview-shell";

function MyComponent() {
  const { isFullscreen, enter, exit, toggle } = useFullscreen();

  return (
    <div>
      <button onClick={enter}>Enter Fullscreen</button>
      {isFullscreen && (
        <FullscreenOverlay onExit={exit}>
          <Content />
        </FullscreenOverlay>
      )}
    </div>
  );
}
```

---

## Context Access

Access viewport state from nested components:

```tsx
import { useViewportContext } from "@/features/preview-shell";

function NestedComponent() {
  const { mode, dimensions, isFullscreen } = useViewportContext();

  return (
    <div style={{
      fontSize: mode === "mobile" ? "14px" : "16px"
    }}>
      Viewport: {dimensions.width}x{dimensions.height}
      {isFullscreen && " (Fullscreen)"}
    </div>
  );
}
```

**Note**: Must be used within a `PreviewShell` or `ViewportProvider`.

---

## Fullscreen Options

### Custom Header Content

```tsx
<FullscreenOverlay
  title="Experience Preview"
  headerContent={<MyCustomControls />}
  onExit={handleExit}
>
  <Content />
</FullscreenOverlay>
```

### Disable Escape Key

```tsx
<FullscreenOverlay
  closeOnEscape={false}  // User must click X button
  onExit={handleExit}
>
  <Content />
</FullscreenOverlay>
```

### Callbacks

```tsx
<PreviewShell
  enableFullscreen
  onFullscreenEnter={() => console.log("Entered fullscreen")}
  onFullscreenExit={() => console.log("Exited fullscreen")}
>
  <Content />
</PreviewShell>
```

---

## Migration from PreviewPanel

If you're migrating from the old `PreviewPanel` component:

### Before

```tsx
import { PreviewPanel } from "@/features/projects/components/designer/PreviewPanel";

<PreviewPanel title="Theme Preview">
  <div style={{ backgroundColor: theme.background.color }}>
    <Content />
  </div>
</PreviewPanel>
```

### After

```tsx
import { PreviewShell } from "@/features/preview-shell";
import { ThemedBackground } from "@/features/theming";

<PreviewShell enableViewportSwitcher enableFullscreen>
  <ThemedBackground background={theme.background}>
    <Content />
  </ThemedBackground>
</PreviewShell>
```

**Benefits of migration**:
- Viewport switching (mobile/desktop)
- Fullscreen mode
- Consistent UX across app
- Better mobile device simulation

---

## TypeScript

All types are exported from the module:

```tsx
import type {
  ViewportMode,
  ViewportDimensions,
  ViewportContextValue,
  PreviewShellProps,
  DeviceFrameProps,
  ViewportSwitcherProps,
  FullscreenOverlayProps,
  FullscreenTriggerProps,
} from "@/features/preview-shell";
```

---

## Common Patterns

### Theme Editor Pattern

```tsx
function ThemeEditor({ theme, onThemeChange }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Form controls */}
      <div>
        <ThemeForm theme={theme} onChange={onThemeChange} />
      </div>

      {/* Preview */}
      <div className="lg:sticky lg:top-4">
        <PreviewShell enableViewportSwitcher enableFullscreen>
          <ThemedBackground
            background={theme.background}
            fontFamily={theme.fontFamily}
          >
            <ThemePreviewContent theme={theme} />
          </ThemedBackground>
        </PreviewShell>
      </div>
    </div>
  );
}
```

### Experience Editor Pattern

```tsx
function ExperienceEditor({ step, theme }) {
  const [viewport, setViewport] = useState<ViewportMode>("mobile");

  return (
    <PreviewShell
      viewportMode={viewport}
      onViewportChange={setViewport}
      enableViewportSwitcher
    >
      <PreviewRuntime step={step} theme={theme} viewportMode={viewport} />
    </PreviewShell>
  );
}
```

---

## Troubleshooting

### Context Error

**Error**: "useViewportContext must be used within ViewportProvider"

**Solution**: Ensure your component is inside a `PreviewShell` or wrap with `ViewportProvider`.

### Fullscreen Not Closing

**Issue**: Escape key doesn't work

**Check**: Ensure `closeOnEscape` is not set to `false`.

### Content Overflows Frame

**Issue**: Content extends beyond device frame

**Solution**: Add `overflow-hidden` or `overflow-auto` to your content wrapper.

---

## API Reference

See [data-model.md](./data-model.md) for complete type definitions.
