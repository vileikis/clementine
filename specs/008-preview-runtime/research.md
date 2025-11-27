# Research: Unified Preview Runtime

**Feature**: 008-preview-runtime
**Date**: 2025-11-27

## Research Overview

This document captures research findings for implementing the unified preview runtime feature.

---

## R1: Viewport Mode Implementation

### Question
How to implement responsive preview containers that toggle between mobile (375px) and desktop (900px) modes?

### Decision
Use a controlled container approach with CSS transform scaling for pixel-perfect preview.

### Rationale
- **Pixel-perfect rendering**: Using fixed widths ensures preview matches exact guest experience
- **Simple state management**: Single boolean or enum controls viewport mode
- **CSS containment**: Transform scaling doesn't affect child layout calculations

### Implementation Pattern

```typescript
// ViewportMode type
type ViewportMode = "mobile" | "desktop";

// Dimensions config
const VIEWPORT_DIMENSIONS = {
  mobile: { width: 375, height: 667 },  // iPhone SE/6/7/8 proportions
  desktop: { width: 900, height: 600 }, // 3:2 desktop ratio
} as const;

// Container scaling for fit
const calculateScale = (containerWidth: number, targetWidth: number) => {
  return Math.min(1, containerWidth / targetWidth);
};
```

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| CSS media queries | Doesn't allow user toggle; couples to browser viewport |
| iframe with resize | Overcomplicated; security/CSP issues; poor DX |
| CSS zoom | Browser support varies; affects computed styles |

---

## R2: Mock Data Patterns

### Question
How to generate realistic mock session data for preview rendering without actual camera/AI processing?

### Decision
Create a static mock data utility that returns typed placeholder data for each step type.

### Rationale
- **Type safety**: Mock data matches real session types
- **Predictable**: Same mock data renders consistently
- **Extensible**: Easy to add new step types or update placeholders

### Implementation Pattern

```typescript
// Mock session data type (matches future guest runtime)
interface MockSessionData {
  guestId: string;
  capturedPhoto?: string;      // Placeholder image URL
  transformedPhoto?: string;   // Placeholder result URL
  variables: Record<string, string>;  // Form input values
}

// Default mock data
const DEFAULT_MOCK_SESSION: MockSessionData = {
  guestId: "preview-guest-001",
  capturedPhoto: "/placeholders/selfie-placeholder.jpg",
  transformedPhoto: "/placeholders/transformed-placeholder.jpg",
  variables: {
    name: "Jane Doe",
    email: "jane@example.com",
    company: "Acme Corp",
  },
};
```

### Placeholder Assets

| Asset | Path | Purpose |
|-------|------|---------|
| Selfie placeholder | `/public/placeholders/selfie-placeholder.jpg` | Capture step mock |
| Transformed image | `/public/placeholders/transformed-placeholder.jpg` | Reward step mock |
| Camera viewfinder | `/public/placeholders/camera-viewfinder.svg` | Capture UI overlay |

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Random data generation | Inconsistent previews; harder to debug |
| Fetch from API | Adds latency; unnecessary complexity for preview |
| User-uploaded test data | Requires additional UI; out of scope |

---

## R3: Animation Handling

### Question
How to handle loading animations and camera UI in preview mode?

### Decision
Use CSS animations for Processing step; static placeholder with overlay for Capture step.

### Rationale
- **Lightweight**: CSS animations are performant and don't require JS
- **Visually accurate**: Shows users what guests will experience
- **No real dependencies**: Doesn't require camera API or AI service

### Implementation Patterns

#### Processing Step Animation

```typescript
// Rotating messages with animation
const ProcessingStepPreview = ({ step }: { step: StepProcessing }) => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % step.config.messages.length);
    }, 2000); // Rotate every 2 seconds
    return () => clearInterval(interval);
  }, [step.config.messages.length]);

  return (
    <div className="flex flex-col items-center gap-4">
      <LoadingSpinner className="animate-spin" />
      <p className="animate-fade-in">{step.config.messages[messageIndex]}</p>
    </div>
  );
};
```

#### Capture Step Placeholder

```tsx
// Static camera placeholder with overlay
const CaptureStepPreview = ({ step }: { step: StepCapture }) => {
  return (
    <div className="relative w-full h-full bg-gray-900">
      {/* Placeholder image simulating camera feed */}
      <Image
        src="/placeholders/selfie-placeholder.jpg"
        alt="Camera preview"
        fill
        className="object-cover opacity-75"
      />
      {/* Camera UI overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-48 h-48 border-2 border-white rounded-full opacity-50" />
      </div>
      {/* Countdown indicator (if configured) */}
      {step.config.countdown && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <span className="text-white text-2xl font-bold">3</span>
        </div>
      )}
    </div>
  );
};
```

### CSS Animation Classes

```css
/* Add to global styles or Tailwind config */
@keyframes fade-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}
```

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Video placeholder | Larger file size; more complexity |
| WebGL camera simulation | Overkill for preview; high effort |
| Real camera with blur | Requires permissions; inconsistent UX |

---

## R4: Existing Code Analysis

### Current Preview Architecture

Based on codebase exploration:

| Component | Location | Current State |
|-----------|----------|---------------|
| SimulatorScreen (→ DeviceFrame) | `features/steps/components/preview/SimulatorScreen.tsx` | Hardcoded 320px mobile only, rename to DeviceFrame |
| StepPreview | `features/journeys/components/editor/StepPreview.tsx` | Routes to step-specific components |
| Step Primitives | `components/step-primitives/` | Theme-aware shared UI components |
| EventThemeProvider | `components/providers/EventThemeProvider.tsx` | Context provider for theme |

### Gaps to Address

1. **DeviceFrame**: Rename SimulatorScreen → DeviceFrame, add `viewportMode` prop with 375px/900px support
2. **ViewSwitcher**: New toggle component for mode selection
3. **PreviewRuntime**: New wrapper for mock session injection
4. **Mock Data**: Create static placeholders and utility functions
5. **Processing Animation**: Add rotating message animation
6. **Capture Placeholder**: Add camera UI overlay

### Theme Application

Current theme application is already viewport-agnostic:
- `EventThemeProvider` sets CSS variables
- Step primitives use `useEventTheme()` hook
- Inline styles apply theme colors directly

No changes needed for theme handling—it will work in both viewport modes.

---

## Summary

| Research Topic | Decision | Complexity |
|----------------|----------|------------|
| Viewport Mode | Controlled container with CSS transform | Low |
| Mock Data | Static typed utility with placeholder assets | Low |
| Animations | CSS animations for Processing; static + overlay for Capture | Medium |
| Integration | Enhance existing components, add 3 new files | Medium |

**Overall Assessment**: Feature is well-scoped with clear implementation path. No architectural risks identified.
