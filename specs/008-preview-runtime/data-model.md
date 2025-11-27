# Data Model: Unified Preview Runtime

**Feature**: 008-preview-runtime
**Date**: 2025-11-27

## Overview

This feature introduces preview-specific types for viewport management and mock session data. No new Firestore entities are created—this is a UI-only feature that consumes existing Step and Event data.

---

## New Types

### ViewportMode

Controls the preview display size.

```typescript
/**
 * Preview viewport modes
 */
type ViewportMode = "mobile" | "desktop";
```

**Values**:
| Mode | Width | Height | Aspect Ratio | Use Case |
|------|-------|--------|--------------|----------|
| mobile | 375px | 667px | ~9:16 | Primary guest experience (phones) |
| desktop | 900px | 600px | 3:2 | Secondary guest experience (laptops) |

### ViewportDimensions

Configuration for each viewport mode.

```typescript
/**
 * Viewport dimensions configuration
 */
interface ViewportDimensions {
  width: number;
  height: number;
}

/**
 * Dimension lookup by mode
 */
const VIEWPORT_DIMENSIONS: Record<ViewportMode, ViewportDimensions> = {
  mobile: { width: 375, height: 667 },
  desktop: { width: 900, height: 600 },
};
```

### MockSessionData

Simulated guest session for preview rendering.

```typescript
/**
 * Mock session data for preview mode
 * Matches structure of future guest runtime session
 */
interface MockSessionData {
  /** Unique identifier for the preview session */
  guestId: string;

  /** Placeholder captured photo URL */
  capturedPhoto: string | null;

  /** Placeholder transformed result URL */
  transformedPhoto: string | null;

  /** Simulated form input values keyed by variable name */
  variables: Record<string, string>;

  /** Current step index in journey (for multi-step preview) */
  currentStepIndex: number;
}
```

**Default Values**:
```typescript
const DEFAULT_MOCK_SESSION: MockSessionData = {
  guestId: "preview-guest-001",
  capturedPhoto: "/placeholders/selfie-placeholder.jpg",
  transformedPhoto: "/placeholders/transformed-placeholder.jpg",
  variables: {
    name: "Jane Doe",
    email: "jane@example.com",
    company: "Acme Corp",
    selectedExperience: "exp-001",
  },
  currentStepIndex: 0,
};
```

### PreviewRuntimeProps

Props for the preview runtime wrapper component.

```typescript
/**
 * Props for PreviewRuntime component
 */
interface PreviewRuntimeProps {
  /** Step to render */
  step: Step;

  /** Event theme configuration */
  theme: EventTheme;

  /** Current viewport mode */
  viewportMode: ViewportMode;

  /** Mock session data (uses defaults if not provided) */
  mockSession?: Partial<MockSessionData>;

  /** Available experiences for picker step */
  experiences?: Experience[];
}
```

---

## Existing Types (Reference)

These types already exist and are consumed by the preview runtime:

### Step (from `features/steps/types`)

Discriminated union of 11 step types:
- `StepInfo`
- `StepExperiencePicker`
- `StepCapture`
- `StepShortText`
- `StepLongText`
- `StepMultipleChoice`
- `StepYesNo`
- `StepOpinionScale`
- `StepEmail`
- `StepProcessing`
- `StepReward`

### EventTheme (from `features/events/types`)

```typescript
interface EventTheme {
  logoUrl?: string | null;
  fontFamily?: string | null;
  primaryColor: string;
  text: EventThemeText;
  button: EventThemeButton;
  background: EventThemeBackground;
}
```

### Experience (from `features/experiences/types`)

Used for Experience Picker step preview.

---

## Type Location

New types will be added to:

```
web/src/features/steps/types/
├── step.types.ts      # Existing step types
├── preview.types.ts   # NEW: ViewportMode, MockSessionData, PreviewRuntimeProps
└── index.ts           # Update barrel export
```

---

## Validation Schemas

### ViewportMode Schema

```typescript
import { z } from "zod";

export const viewportModeSchema = z.enum(["mobile", "desktop"]);

export type ViewportMode = z.infer<typeof viewportModeSchema>;
```

### MockSessionData Schema

```typescript
export const mockSessionDataSchema = z.object({
  guestId: z.string(),
  capturedPhoto: z.string().url().nullable(),
  transformedPhoto: z.string().url().nullable(),
  variables: z.record(z.string(), z.string()),
  currentStepIndex: z.number().int().min(0),
});

export type MockSessionData = z.infer<typeof mockSessionDataSchema>;
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     JourneyEditor                           │
│  ┌─────────────────┐  ┌──────────────────────────────────┐  │
│  │ viewportMode    │  │ selectedStep + previewStep       │  │
│  │ (local state)   │  │ (merged displayStep)             │  │
│  └────────┬────────┘  └────────────────┬─────────────────┘  │
│           │                            │                    │
│           ▼                            ▼                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  PreviewRuntime                      │   │
│  │  ┌──────────────┐  ┌─────────────┐  ┌────────────┐ │   │
│  │  │ viewportMode │  │ step        │  │ mockSession│ │   │
│  │  └──────┬───────┘  └──────┬──────┘  └─────┬──────┘ │   │
│  │         │                 │               │         │   │
│  │         ▼                 ▼               ▼         │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │            DeviceFrame                       │   │   │
│  │  │  (applies viewport dimensions + theme)       │   │   │
│  │  │                                              │   │   │
│  │  │  ┌────────────────────────────────────────┐ │   │   │
│  │  │  │         StepPreview (router)          │ │   │   │
│  │  │  │                                        │ │   │   │
│  │  │  │  InfoStep | CaptureStep | RewardStep  │ │   │   │
│  │  │  │  ... (11 step components)             │ │   │   │
│  │  │  └────────────────────────────────────────┘ │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Summary

| Type | Purpose | New/Existing |
|------|---------|--------------|
| ViewportMode | Control preview size | New |
| ViewportDimensions | Width/height config | New |
| MockSessionData | Simulated guest data | New |
| PreviewRuntimeProps | Component props | New |
| Step | Step configuration | Existing |
| EventTheme | Theme configuration | Existing |
| Experience | AI experience data | Existing |
