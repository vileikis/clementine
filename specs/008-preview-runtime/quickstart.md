# Quickstart: Unified Preview Runtime

**Feature**: 008-preview-runtime
**Date**: 2025-11-27

## Overview

This guide provides implementation instructions for the Unified Preview Runtime feature. Follow these steps to add mobile/desktop viewport switching to the Journey Editor preview panel.

---

## Prerequisites

- Feature branch: `008-preview-runtime`
- Existing codebase: Journey Editor with 3-panel layout
- Dependencies: All existing deps (no new packages required)

---

## Step 1: Add Preview Types

Create new types file for preview-specific definitions.

**File**: `web/src/features/steps/types/preview.types.ts`

```typescript
/**
 * Preview viewport modes
 */
export type ViewportMode = "mobile" | "desktop";

/**
 * Viewport dimensions configuration
 */
export interface ViewportDimensions {
  width: number;
  height: number;
}

/**
 * Dimension lookup by mode
 */
export const VIEWPORT_DIMENSIONS: Record<ViewportMode, ViewportDimensions> = {
  mobile: { width: 375, height: 667 },
  desktop: { width: 900, height: 600 },
};

/**
 * Mock session data for preview mode
 */
export interface MockSessionData {
  guestId: string;
  capturedPhoto: string | null;
  transformedPhoto: string | null;
  variables: Record<string, string>;
  currentStepIndex: number;
}

/**
 * Default mock session
 */
export const DEFAULT_MOCK_SESSION: MockSessionData = {
  guestId: "preview-guest-001",
  capturedPhoto: "/placeholders/selfie-placeholder.jpg",
  transformedPhoto: "/placeholders/transformed-placeholder.jpg",
  variables: {
    name: "Jane Doe",
    email: "jane@example.com",
  },
  currentStepIndex: 0,
};
```

Update barrel export: `web/src/features/steps/types/index.ts`

---

## Step 2: Create ViewSwitcher Component

Add the mobile/desktop toggle component.

**File**: `web/src/features/steps/components/preview/ViewSwitcher.tsx`

```typescript
"use client";

import { Smartphone, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { ViewportMode } from "../../types/preview.types";

interface ViewSwitcherProps {
  mode: ViewportMode;
  onChange: (mode: ViewportMode) => void;
  className?: string;
}

export function ViewSwitcher({ mode, onChange, className }: ViewSwitcherProps) {
  return (
    <div className={cn("flex items-center gap-1 p-1 bg-muted rounded-lg", className)}>
      <button
        type="button"
        onClick={() => onChange("mobile")}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
          "min-w-[44px] min-h-[44px]", // Touch target
          mode === "mobile"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-pressed={mode === "mobile"}
        aria-label="Mobile preview"
      >
        <Smartphone className="h-4 w-4" />
        <span className="hidden sm:inline">Mobile</span>
      </button>
      <button
        type="button"
        onClick={() => onChange("desktop")}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
          "min-w-[44px] min-h-[44px]", // Touch target
          mode === "desktop"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-pressed={mode === "desktop"}
        aria-label="Desktop preview"
      >
        <Monitor className="h-4 w-4" />
        <span className="hidden sm:inline">Desktop</span>
      </button>
    </div>
  );
}
```

---

## Step 3: Rename SimulatorScreen → DeviceFrame

Rename the existing component and enhance to support viewport modes.

**File**: `web/src/features/steps/components/preview/DeviceFrame.tsx` (rename from SimulatorScreen.tsx)

Key changes:
1. Add `viewportMode` prop
2. Use `VIEWPORT_DIMENSIONS` for sizing
3. Apply CSS transform scaling for container fit

```typescript
// Add to existing imports
import { ViewportMode, VIEWPORT_DIMENSIONS } from "../../types/preview.types";

interface DeviceFrameProps {
  theme: EventTheme;
  viewportMode?: ViewportMode; // NEW
  children: React.ReactNode;
}

export function DeviceFrame({
  theme,
  viewportMode = "mobile", // Default to mobile
  children,
}: DeviceFrameProps) {
  const dimensions = VIEWPORT_DIMENSIONS[viewportMode];

  return (
    <div
      className="relative overflow-hidden rounded-[2rem] border-4 border-gray-800 bg-gray-800 shadow-xl"
      style={{
        width: dimensions.width,
        height: dimensions.height,
      }}
    >
      {/* Screen content with theme */}
      <div
        className="h-full w-full overflow-auto"
        style={{
          backgroundColor: theme.background.color,
          fontFamily: theme.fontFamily || undefined,
        }}
      >
        {/* Background image with overlay if configured */}
        {theme.background.image && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${theme.background.image})`,
              opacity: 1 - theme.background.overlayOpacity,
            }}
          />
        )}
        {children}
      </div>
    </div>
  );
}
```

---

## Step 4: Create PreviewRuntime Wrapper

Add the runtime wrapper that provides mock session context.

**File**: `web/src/features/steps/components/preview/PreviewRuntime.tsx`

```typescript
"use client";

import { EventThemeProvider } from "@/components/providers/EventThemeProvider";
import { DeviceFrame } from "./DeviceFrame";
import { StepPreview } from "@/features/journeys/components/editor/StepPreview";
import { Step, Experience, EventTheme } from "@/features/steps/types";
import { ViewportMode, MockSessionData, DEFAULT_MOCK_SESSION } from "../../types/preview.types";

interface PreviewRuntimeProps {
  step: Step;
  theme: EventTheme;
  viewportMode: ViewportMode;
  experiences?: Experience[];
  mockSession?: Partial<MockSessionData>;
}

export function PreviewRuntime({
  step,
  theme,
  viewportMode,
  experiences = [],
  mockSession,
}: PreviewRuntimeProps) {
  // Merge provided mock data with defaults
  const session: MockSessionData = {
    ...DEFAULT_MOCK_SESSION,
    ...mockSession,
  };

  return (
    <EventThemeProvider theme={theme}>
      <DeviceFrame theme={theme} viewportMode={viewportMode}>
        <StepPreview
          step={step}
          theme={theme}
          experiences={experiences}
          mockSession={session}
        />
      </DeviceFrame>
    </EventThemeProvider>
  );
}
```

---

## Step 5: Update JourneyEditor

Integrate viewport state and switcher.

**File**: `web/src/features/journeys/components/editor/JourneyEditor.tsx`

Key changes:
1. Add `viewportMode` state
2. Add `ViewSwitcher` to preview panel header
3. Pass `viewportMode` to preview components

```typescript
// Add to imports
import { ViewSwitcher } from "@/features/steps/components/preview/ViewSwitcher";
import { PreviewRuntime } from "@/features/steps/components/preview/PreviewRuntime";
import { ViewportMode } from "@/features/steps/types/preview.types";

// Add to component state
const [viewportMode, setViewportMode] = useState<ViewportMode>("mobile");

// In preview panel section, add header with switcher
<div className="flex-1 flex flex-col overflow-hidden">
  {/* Preview panel header */}
  <div className="flex items-center justify-between p-4 border-b">
    <h3 className="text-sm font-medium text-muted-foreground">Preview</h3>
    <ViewSwitcher mode={viewportMode} onChange={setViewportMode} />
  </div>

  {/* Preview content */}
  <div className="flex-1 p-6 overflow-auto bg-muted/10">
    <div className="flex justify-center">
      {displayStep ? (
        <PreviewRuntime
          step={displayStep as Step}
          theme={event.theme}
          viewportMode={viewportMode}
          experiences={experiences}
        />
      ) : (
        <div className="text-muted-foreground">Select a step to preview</div>
      )}
    </div>
  </div>
</div>
```

---

## Step 6: Add Placeholder Assets

Create placeholder images for mock preview.

**Directory**: `web/public/placeholders/`

Required files:
- `selfie-placeholder.jpg` (375x500px, person silhouette or generic face)
- `transformed-placeholder.jpg` (375x500px, example AI-transformed image)
- `camera-viewfinder.svg` (simple circular viewfinder overlay)

Note: Use royalty-free placeholder images or simple generated graphics.

---

## Step 7: Update Barrel Exports

Ensure all new components are exported.

**File**: `web/src/features/steps/components/preview/index.ts`

```typescript
export { DeviceFrame } from "./DeviceFrame";
export { ViewSwitcher } from "./ViewSwitcher";
export { PreviewRuntime } from "./PreviewRuntime";
```

**File**: `web/src/features/steps/index.ts`

```typescript
// Add to existing exports
export type { ViewportMode, MockSessionData } from "./types/preview.types";
```

---

## Step 8: Enhance Step Preview Components (Optional)

Enhance specific step previews for better mock rendering.

### Processing Step

Add rotating message animation:

**File**: `web/src/features/steps/components/preview/steps/ProcessingStep.tsx`

```typescript
// Add animation for rotating messages
const [messageIndex, setMessageIndex] = useState(0);

useEffect(() => {
  const interval = setInterval(() => {
    setMessageIndex((i) => (i + 1) % step.config.messages.length);
  }, 2000);
  return () => clearInterval(interval);
}, [step.config.messages.length]);
```

### Capture Step

Add camera placeholder overlay (if not already present).

---

## Validation Checklist

Before marking complete, verify:

- [ ] `pnpm lint` passes
- [ ] `pnpm type-check` passes
- [ ] `pnpm test` passes (add tests for new components)
- [ ] Manual testing in dev server:
  - [ ] Mobile preview renders at 375px
  - [ ] Desktop preview renders at 900px
  - [ ] Toggle switches instantly (<500ms)
  - [ ] Theme applies correctly in both modes
  - [ ] All 11 step types render in both modes

---

## File Summary

| File | Action | Purpose |
|------|--------|---------|
| `types/preview.types.ts` | Create | ViewportMode, MockSessionData types |
| `components/preview/ViewSwitcher.tsx` | Create | Toggle component |
| `components/preview/PreviewRuntime.tsx` | Create | Runtime wrapper |
| `components/preview/DeviceFrame.tsx` | Rename + Modify | Rename from SimulatorScreen, add viewportMode prop |
| `components/editor/JourneyEditor.tsx` | Modify | Integrate viewport state |
| `public/placeholders/*` | Create | Mock images |
| `types/index.ts` | Modify | Export new types |
| `components/preview/index.ts` | Modify | Export new components |
