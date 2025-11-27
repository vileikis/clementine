# Quickstart: Journey Playback Mode

**Feature Branch**: `009-journey-playback`
**Date**: 2025-11-27

## Prerequisites

Before implementing this feature:

1. **008-preview-runtime** must be complete with:
   - `PreviewRuntime` component working
   - All 11 step renderers functional
   - `DeviceFrame` and `ViewSwitcher` components
   - `MockSessionData` type and defaults
   - `EventThemeProvider` context

2. **Journeys feature** must have:
   - `JourneyEditor` component with step list and preview panel
   - Journey and Step data loading from Firestore

## Implementation Order

### Phase 1: Core Types and Hooks (Foundation)

```text
1. Create types/playback.types.ts
   - PlaybackState, PlaybackStatus
   - PlaybackMockSession, StepInputValue
   - PlaybackActions, PreviewNavigationBarProps, PlaybackModeProps

2. Create hooks/useMockSession.ts
   - State management for PlaybackMockSession
   - updateInput(), reset() functions
   - Initial values with defaults

3. Create hooks/useJourneyPlayback.ts
   - PlaybackState management
   - Navigation logic (next, previous, restart)
   - Auto-advance handling
   - Integration with useMockSession
```

### Phase 2: UI Components (Navigation)

```text
4. Create components/preview/PreviewNavigationBar.tsx
   - Back, Next, Restart, Exit buttons
   - Step counter (e.g., "2 / 5")
   - 44x44px touch targets
   - Fixed bottom position

5. Create components/preview/PlaybackMode.tsx
   - Full-screen overlay/modal wrapper
   - ViewSwitcher integration
   - PreviewRuntime with current step
   - PreviewNavigationBar integration
```

### Phase 3: Step Interactivity (Enhancements)

```text
6. Enhance step renderers for interactive mode:
   - Add isInteractive and onValueChange props
   - ShortTextStep, LongTextStep: controlled inputs
   - MultipleChoiceStep, YesNoStep, OpinionScaleStep: click handlers
   - EmailStep: controlled input with validation display
   - ExperiencePickerStep: selection handler
   - CaptureStep: mock capture button with onComplete
   - ProcessingStep: emit onComplete after animation

7. Update PreviewRuntime
   - Add mode prop ("single-step" | "playback")
   - Pass interactive props when in playback mode
   - Forward onStepComplete callback
```

### Phase 4: Integration (Editor)

```text
8. Update JourneyEditorHeader.tsx
   - Add "Play Journey" button next to journey name
   - Accept onPlayClick callback prop

9. Update JourneyEditor.tsx
   - Add isPlaybackOpen state
   - Pass onPlayClick to JourneyEditorHeader
   - Conditional PlaybackMode overlay render
   - Pass steps, theme, experiences to PlaybackMode
   - Handle onExit callback

10. Add error boundaries
    - StepErrorBoundary component
    - Wrap each step in error boundary
    - Fallback UI with step info and error message
```

### Phase 5: Testing and Validation

```text
11. Unit tests
    - useJourneyPlayback: navigation, state transitions
    - useMockSession: input updates, reset
    - PreviewNavigationBar: button states, callbacks

12. Validation loop
    - pnpm lint
    - pnpm type-check
    - pnpm test
```

## Key Files to Create

| File | Purpose |
|------|---------|
| `steps/types/playback.types.ts` | All playback-related TypeScript types |
| `steps/hooks/useMockSession.ts` | Mock session state management |
| `steps/hooks/useJourneyPlayback.ts` | Playback controller hook |
| `steps/components/preview/PreviewNavigationBar.tsx` | Navigation controls UI |
| `steps/components/preview/PlaybackMode.tsx` | Main playback wrapper |
| `steps/components/preview/StepErrorBoundary.tsx` | Error handling wrapper |

## Key Files to Modify

| File | Changes |
|------|---------|
| `steps/types/preview.types.ts` | Export existing types for playback use |
| `steps/components/preview/PreviewRuntime.tsx` | Add `mode` prop, pass interactive callbacks |
| `steps/components/preview/steps/*.tsx` | Add `isInteractive`, `onValueChange`, `onComplete` props |
| `journeys/components/editor/JourneyEditorHeader.tsx` | Add "Play Journey" button, accept onPlayClick prop |
| `journeys/components/editor/JourneyEditor.tsx` | Add playback state, render PlaybackMode overlay |
| `steps/index.ts` | Export new components and hooks |

## Code Patterns

### Pattern 1: Playback Hook Usage

```typescript
// In PlaybackMode.tsx
const {
  state,
  actions,
  mockSession,
  updateInput,
} = useJourneyPlayback(steps);

// Navigation
actions.next();
actions.previous();
actions.restart();
actions.exit();

// Input handling
updateInput(stepId, { type: 'text', value: userInput });
```

### Pattern 2: Interactive Step Renderer

```typescript
// In ShortTextStep.tsx
interface ShortTextStepProps {
  step: ShortTextStep;
  isInteractive?: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
}

export function ShortTextStep({
  step,
  isInteractive = false,
  value = '',
  onValueChange,
}: ShortTextStepProps) {
  if (!isInteractive) {
    // Read-only preview mode
    return <StepLayout>...</StepLayout>;
  }

  // Interactive playback mode
  return (
    <StepLayout>
      <TextInput
        value={value}
        onChange={(e) => onValueChange?.(e.target.value)}
        placeholder={step.placeholder}
      />
    </StepLayout>
  );
}
```

### Pattern 3: Auto-Advance Handling

```typescript
// In ProcessingStep.tsx
useEffect(() => {
  if (!isInteractive) return;

  const timer = setTimeout(() => {
    onComplete?.();
  }, (step.estimatedDuration || 2) * 1000);

  return () => clearTimeout(timer);
}, [isInteractive, step.estimatedDuration, onComplete]);
```

### Pattern 4: Error Boundary

```typescript
// In StepErrorBoundary.tsx
class StepErrorBoundary extends Component<Props, State> {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <StepLayout>
          <div className="text-center p-4">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p>This step failed to render</p>
            <p className="text-sm text-gray-500">{this.state.error?.message}</p>
          </div>
        </StepLayout>
      );
    }
    return this.props.children;
  }
}
```

## Testing Checklist

- [ ] Start playback from journey with 0 steps (shows empty state)
- [ ] Start playback from journey with 1 step (Next shows completion)
- [ ] Navigate forward through all 11 step types
- [ ] Navigate backward and verify state persists
- [ ] Restart and verify state is cleared
- [ ] Exit and verify return to editor
- [ ] Auto-advance on Processing step
- [ ] Mock capture on Capture step
- [ ] Enter values in text inputs
- [ ] Select options in choice steps
- [ ] Viewport toggle works during playback
- [ ] Theme applies correctly to all steps
- [ ] Error boundary catches render failures
- [ ] Touch targets are 44x44px minimum
- [ ] Mobile viewport is default

## Common Pitfalls

1. **Forgetting to reset error boundary on step change** - Use `key` prop with stepId
2. **Mutating steps array** - Always treat as immutable
3. **Missing null checks on mockSession.inputs** - Initialize as empty object
4. **Auto-advance triggering multiple times** - Use refs to track if already advanced
5. **Viewport toggle losing playback state** - Keep playback state in parent component
