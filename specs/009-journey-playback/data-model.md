# Data Model: Journey Playback Mode

**Feature Branch**: `009-journey-playback`
**Date**: 2025-11-27

## Overview

This feature introduces **ephemeral, client-side state only**. No new Firestore collections or documents are created. All playback state exists in memory and is discarded when playback ends.

## Entities

### 1. PlaybackState

Manages the navigation state during journey playback.

**Location**: `web/src/features/steps/types/playback.types.ts`

```typescript
/**
 * Playback status enum
 */
export type PlaybackStatus = 'idle' | 'playing' | 'completed';

/**
 * Main playback state object
 */
export interface PlaybackState {
  /** Current status of playback */
  status: PlaybackStatus;

  /** Index of currently displayed step (0-based) */
  currentIndex: number;

  /** Ordered array of steps in the journey */
  steps: Step[];

  /** Whether back navigation is available */
  canGoBack: boolean;

  /** Whether forward navigation is available */
  canGoNext: boolean;

  /** Whether currently auto-advancing (disables manual nav briefly) */
  isAutoAdvancing: boolean;
}

/**
 * Initial/default playback state
 */
export const INITIAL_PLAYBACK_STATE: PlaybackState = {
  status: 'idle',
  currentIndex: 0,
  steps: [],
  canGoBack: false,
  canGoNext: false,
  isAutoAdvancing: false,
};
```

**State Transitions**:
| Current State | Action | Next State |
|--------------|--------|------------|
| idle | start() | playing (index=0) |
| playing | next() | playing (index+1) or completed |
| playing | previous() | playing (index-1) |
| playing | restart() | playing (index=0) |
| playing | exit() | idle |
| completed | restart() | playing (index=0) |
| completed | exit() | idle |

---

### 2. PlaybackMockSession

Extends existing `MockSessionData` to support interactive input collection during playback.

**Location**: `web/src/features/steps/types/playback.types.ts`

```typescript
import { MockSessionData } from './preview.types';

/**
 * Discriminated union for step input values
 */
export type StepInputValue =
  | { type: 'text'; value: string }
  | { type: 'boolean'; value: boolean }
  | { type: 'number'; value: number }
  | { type: 'selection'; selectedId: string }
  | { type: 'photo'; url: string };

/**
 * Extended mock session for playback mode
 * Includes all inputs collected during playback
 */
export interface PlaybackMockSession extends MockSessionData {
  /**
   * Collected inputs keyed by step ID
   * Persists across navigation for the duration of playback
   */
  inputs: Record<string, StepInputValue>;

  /**
   * Selected experience ID (from ExperiencePicker step)
   */
  selectedExperienceId: string | null;
}

/**
 * Default playback session with mock data
 */
export const DEFAULT_PLAYBACK_SESSION: PlaybackMockSession = {
  // Inherited from MockSessionData
  guestId: 'preview-guest-001',
  capturedPhoto: '/placeholders/selfie-placeholder.svg',
  transformedPhoto: '/placeholders/transformed-placeholder.svg',
  variables: {
    name: 'Jane Doe',
    email: 'jane@example.com',
    company: 'Acme Corp',
  },
  currentStepIndex: 0,

  // Playback-specific
  inputs: {},
  selectedExperienceId: null,
};
```

**Input Value Types by Step**:
| Step Type | StepInputValue.type | Example Value |
|-----------|---------------------|---------------|
| short_text | text | `"Hello World"` |
| long_text | text | `"Long form response..."` |
| email | text | `"user@example.com"` |
| yes_no | boolean | `true` |
| opinion_scale | number | `7` |
| multiple_choice | selection | `"option-abc"` |
| experience-picker | selection | `"exp-123"` |
| capture | photo | `"/placeholders/selfie-placeholder.svg"` |

---

### 3. PlaybackActions

Interface for playback control actions returned by the hook.

**Location**: `web/src/features/steps/types/playback.types.ts`

```typescript
/**
 * Actions available for playback control
 */
export interface PlaybackActions {
  /** Initialize playback with journey steps */
  start: (steps: Step[]) => void;

  /** Navigate to next step (or complete if at end) */
  next: () => void;

  /** Navigate to previous step */
  previous: () => void;

  /** Reset to first step and clear session */
  restart: () => void;

  /** Exit playback mode entirely */
  exit: () => void;

  /** Handle step completion (for auto-advance) */
  handleStepComplete: (stepId: string) => void;

  /** Update mock session with step input */
  updateInput: (stepId: string, value: StepInputValue) => void;
}
```

---

### 4. PreviewNavigationBarProps

Props interface for the navigation bar component.

**Location**: `web/src/features/steps/types/playback.types.ts`

```typescript
/**
 * Props for PreviewNavigationBar component
 */
export interface PreviewNavigationBarProps {
  /** Current step index (0-based) */
  currentIndex: number;

  /** Total number of steps */
  totalSteps: number;

  /** Whether back button is enabled */
  canGoBack: boolean;

  /** Whether next button is enabled */
  canGoNext: boolean;

  /** Whether playback has completed */
  isCompleted: boolean;

  /** Callback for back button */
  onBack: () => void;

  /** Callback for next button */
  onNext: () => void;

  /** Callback for restart button */
  onRestart: () => void;

  /** Callback for exit button */
  onExit: () => void;
}
```

---

### 5. PlaybackModeProps

Props interface for the main PlaybackMode component.

**Location**: `web/src/features/steps/types/playback.types.ts`

```typescript
import { Step } from './step.types';
import { EventTheme } from '../../events/types/event.types';
import { Experience } from '../../experiences/types/experience.types';

/**
 * Props for PlaybackMode component
 */
export interface PlaybackModeProps {
  /** Ordered array of steps to play */
  steps: Step[];

  /** Event theme for styling */
  theme: EventTheme;

  /** Available experiences (for ExperiencePicker and Capture steps) */
  experiences: Experience[];

  /** Initial viewport mode */
  initialViewport?: 'mobile' | 'desktop';

  /** Callback when playback is exited */
  onExit: () => void;
}
```

---

## Relationships

```text
PlaybackMode
  ├── uses PlaybackState (via useJourneyPlayback hook)
  ├── uses PlaybackMockSession (via useMockSession hook)
  ├── renders PreviewNavigationBar (receives PlaybackActions)
  └── renders PreviewRuntime (receives current Step + theme + session)

useJourneyPlayback
  ├── manages PlaybackState
  ├── provides PlaybackActions
  └── coordinates with useMockSession

useMockSession
  ├── manages PlaybackMockSession
  └── provides input update functions
```

---

## Validation Rules

### PlaybackState Invariants
- `currentIndex` MUST be >= 0 and < `steps.length` when `status === 'playing'`
- `canGoBack` MUST be `false` when `currentIndex === 0`
- `canGoNext` MUST be `false` when `status === 'completed'`
- `steps` array MUST NOT be mutated during playback

### PlaybackMockSession Invariants
- `inputs` keys MUST be valid step IDs from the current journey
- `StepInputValue.type` MUST match the corresponding step type
- Session MUST be reset when `restart()` is called

---

## Notes

1. **No Firestore Schema**: This feature is entirely client-side. Existing Step and Journey schemas from 008-preview-runtime are read-only.

2. **Ephemeral State**: All playback state is lost when:
   - User clicks Exit
   - Browser tab is closed
   - Page is refreshed

3. **Type Safety**: Discriminated union for `StepInputValue` ensures type-safe handling of different input types.

4. **Extensibility**: The `inputs` map keyed by `stepId` allows future support for branching/conditional steps without schema changes.
