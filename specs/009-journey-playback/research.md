# Research: Journey Playback Mode

**Feature Branch**: `009-journey-playback`
**Date**: 2025-11-27

## 1. Existing PreviewRuntime Architecture

### Decision
Extend the existing PreviewRuntime with a `mode` prop to support both single-step and playback modes.

### Rationale
- PreviewRuntime already handles theme injection, mock data, and step rendering
- Adding a mode discriminator allows reuse without duplication
- Playback-specific logic can be encapsulated in hooks and passed via props

### Alternatives Considered
1. **Create separate PlaybackRuntime component** - Rejected because it would duplicate theme injection, device frame, and step rendering logic
2. **Use render props pattern** - Rejected because it adds complexity without clear benefit

### Findings
- Current PreviewRuntime accepts: `step`, `theme`, `viewportMode`, `experiences`, `mockSession`
- For playback mode, additional needs: `onStepComplete`, `onAutoAdvance`, `isInteractive`
- DeviceFrame and step renderers can be reused unchanged with minor prop additions

---

## 2. Step Interactivity Pattern

### Decision
Pass `isInteractive` and `onValueChange` props to step renderers to enable user input during playback.

### Rationale
- Single-step preview is read-only (display only)
- Playback mode requires collecting user inputs for mock session
- Prop-based approach is explicit and type-safe

### Alternatives Considered
1. **Context-based interactivity flag** - Rejected because it's less explicit and harder to trace
2. **Always interactive** - Rejected because single-step preview should remain read-only

### Findings
Step-specific interactivity requirements:
| Step Type | Interactive Elements | onValueChange Data |
|-----------|---------------------|-------------------|
| ShortText | Text input | `{ value: string }` |
| LongText | Textarea | `{ value: string }` |
| MultipleChoice | Option buttons | `{ selectedId: string }` |
| YesNo | Yes/No buttons | `{ value: boolean }` |
| OpinionScale | Scale buttons | `{ value: number }` |
| Email | Email input | `{ value: string }` |
| ExperiencePicker | Experience cards | `{ experienceId: string }` |
| Capture | Capture button | `{ capturedPhoto: string }` |
| Processing | N/A (auto) | `{ transformedPhoto: string }` |
| Reward | N/A | N/A |
| Info | N/A | N/A |

---

## 3. Auto-Advance Mechanism

### Decision
Steps emit `onComplete` callbacks when their actions finish, and the playback controller decides whether to auto-advance.

### Rationale
- Decouples step completion logic from navigation logic
- Processing step already has animation completion - just needs callback
- Capture step can trigger completion after mock capture button click

### Alternatives Considered
1. **Timer-based auto-advance in controller** - Rejected because step durations vary and are internal to steps
2. **Observable pattern** - Over-engineered for this use case

### Findings
Auto-advance rules:
- **Capture**: Advance after mock capture button clicked (instant)
- **Processing**: Advance after animation completes (1-2 seconds configurable via `estimatedDuration`)
- **Reward**: Never auto-advance (end of journey, user views result)
- **All others**: No auto-advance (require Next button click)

---

## 4. Mock Session State Management

### Decision
Create `useMockSession` hook with typed state and update functions, initialized with default values.

### Rationale
- Centralized state management for cross-step data
- Type-safe with discriminated updates per step type
- Easy to reset on "Restart" action

### Alternatives Considered
1. **Zustand store** - Overkill for ephemeral preview state
2. **useReducer** - Good alternative, but hook pattern simpler for this scope
3. **Parent component state** - Less encapsulated, harder to test

### Findings
MockSession structure (extending existing `MockSessionData`):

```typescript
interface PlaybackMockSession {
  // Existing fields
  guestId: string;
  capturedPhoto: string | null;
  transformedPhoto: string | null;

  // Extended fields for playback
  inputs: {
    [stepId: string]: StepInputValue;
  };
  selectedExperienceId: string | null;
}

type StepInputValue =
  | { type: 'text'; value: string }
  | { type: 'boolean'; value: boolean }
  | { type: 'number'; value: number }
  | { type: 'selection'; selectedId: string };
```

---

## 5. Navigation State Machine

### Decision
Use a simple state object with `currentIndex`, `steps`, and `status` managed by `useJourneyPlayback` hook.

### Rationale
- Linear journey with no branching simplifies state model
- Status enum handles edge cases (completion, empty journey)
- No need for complex state machine library

### Alternatives Considered
1. **XState** - Over-engineered for linear navigation
2. **URL-based state** - Could work but adds complexity for modal/fullscreen playback

### Findings
Playback state model:

```typescript
interface PlaybackState {
  status: 'idle' | 'playing' | 'completed';
  currentIndex: number;
  steps: Step[];
  canGoBack: boolean;
  canGoNext: boolean;
  isAutoAdvancing: boolean;
}

interface PlaybackActions {
  start: () => void;
  next: () => void;
  previous: () => void;
  restart: () => void;
  exit: () => void;
}
```

---

## 6. Preview Navigation Bar Design

### Decision
Fixed bottom bar with 44x44px touch targets, simple icon + text buttons.

### Rationale
- Bottom position allows thumb-friendly access on mobile
- Consistent with mobile app navigation patterns
- Icons + text provide clarity for all users

### Alternatives Considered
1. **Top bar** - Rejected because less accessible on mobile
2. **Floating buttons** - Rejected because clutters the preview
3. **Gesture-based navigation** - Could add later but buttons are essential baseline

### Findings
Button layout (left to right):
- **Back** (ChevronLeft icon): Disabled on first step
- **Progress indicator**: "2 / 5" step counter
- **Next** (ChevronRight icon): Shows "Done" or disabled on last step
- **Restart** (RotateCcw icon): Always enabled during playback
- **Exit** (X icon): Returns to editor

Mobile considerations:
- Bar height: 60px (includes padding)
- Button min-width: 44px
- Spacing between buttons: 8-16px
- Background: Semi-transparent with blur for readability

---

## 7. Integration with Journey Editor

### Decision
Add "Play Journey" button to JourneyEditor header, opens PlaybackMode as a modal/overlay.

### Rationale
- Consistent with existing editor layout
- Modal/overlay keeps editor state intact for easy return
- URL-based state optional (could add `?playback=true` for deep linking)

### Alternatives Considered
1. **Separate route** - Works but loses editor context
2. **Side panel** - Too constrained for full preview experience
3. **New tab/window** - Loses connection to editor state

### Findings
Integration points:
- `JourneyEditor.tsx`: Add PlayJourney button, conditional PlaybackMode render
- `PlaybackMode.tsx`: Full-screen overlay with DeviceFrame and NavBar
- Exit action: Calls `onExit` prop, parent closes overlay

---

## 8. Error Boundary Strategy

### Decision
Wrap each step renderer in an error boundary that shows fallback UI without breaking playback.

### Rationale
- Isolates step render failures from navigation
- Allows creators to see which steps have issues
- Consistent with PRD requirement for graceful error handling

### Alternatives Considered
1. **Global error boundary** - Would break entire playback on any step error
2. **Try-catch in renderer** - Doesn't catch React render errors

### Findings
Error boundary implementation:
- Create `StepErrorBoundary` component wrapping each step
- Fallback UI shows step type, error message, and step index
- Navigation continues to work (Next/Back still functional)
- Reset error boundary when step changes

---

## Summary of Key Decisions

| Topic | Decision | Key Rationale |
|-------|----------|---------------|
| Architecture | Extend PreviewRuntime with mode | Reuse existing infrastructure |
| Interactivity | Prop-based `isInteractive` | Explicit, type-safe |
| Auto-advance | Step emits `onComplete` | Decoupled from navigation |
| Session state | `useMockSession` hook | Centralized, typed, resettable |
| Navigation | Simple state object | Linear flow, no branching |
| Nav bar | Fixed bottom, 44px targets | Mobile-first, accessible |
| Integration | Modal overlay in editor | Preserves editor state |
| Errors | Per-step error boundary | Graceful degradation |
