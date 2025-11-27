# Quickstart: Guest Experience Runtime Engine

**Feature**: 011-guest-runtime
**Date**: 2025-11-27

## Overview

This guide provides the essential steps to implement the Guest Experience Runtime Engine. Follow these steps in order for the fastest path to a working implementation.

---

## Prerequisites

Before starting, ensure you have:

1. **Event with active journey**: An event with `activeJourneyId` set and a journey with steps configured
2. **Experience(s) configured**: At least one experience with AI config for the transform step
3. **Environment variables**: AI provider credentials set (or use mock provider for development)

```bash
# For development (mock AI)
AI_PROVIDER=mock

# For production (Google AI)
AI_PROVIDER=google-ai
GOOGLE_AI_API_KEY=your-key-here
```

---

## Implementation Order

### Step 1: Extend Session Schemas (30 min)

Update the session types and schemas to include journey support fields:

**File**: `web/src/features/sessions/schemas/sessions.schemas.ts`

```typescript
// Add StepInputValue schema
export const stepInputValueSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), value: z.string() }),
  z.object({ type: z.literal('boolean'), value: z.boolean() }),
  z.object({ type: z.literal('number'), value: z.number() }),
  z.object({ type: z.literal('selection'), selectedId: z.string() }),
  z.object({ type: z.literal('selections'), selectedIds: z.array(z.string()) }),
  z.object({ type: z.literal('photo'), url: z.string().url() }),
]);

// Add to sessionSchema
export const sessionSchema = z.object({
  // ... existing fields ...
  journeyId: z.string().optional(),
  currentStepIndex: z.number().int().min(0).optional(),
  data: z.record(stepInputValueSchema).optional(),
});
```

**Verify**: `pnpm type-check` passes

---

### Step 2: Add Session Server Actions (1 hour)

Add journey-specific actions to the sessions module:

**File**: `web/src/features/sessions/actions/sessions.actions.ts`

Add these actions:
1. `startJourneySessionAction(eventId, journeyId)` - Creates journey session
2. `advanceStepAction(eventId, sessionId, nextIndex)` - Advances step
3. `saveStepDataAction(eventId, sessionId, stepId, value)` - Saves input
4. `selectExperienceAction(eventId, sessionId, experienceId)` - Saves selection

**Verify**: Each action can be called from a test component

---

### Step 3: Wire AI Transform (1 hour)

Connect the existing AI module to the transform action:

**File**: `web/src/features/sessions/actions/sessions.actions.ts`

```typescript
export async function triggerTransformAction(eventId: string, sessionId: string) {
  // 1. Get session
  const session = await getSession(eventId, sessionId);

  // 2. Get experience config
  const experienceId = session.data?.selected_experience_id;
  const experience = await getExperience(experienceId);

  // 3. Build params from experience.aiPhotoConfig
  const params: TransformParams = {
    prompt: experience.aiPhotoConfig?.prompt ?? 'Transform this image',
    inputImageUrl: await getDownloadURL(session.inputImagePath),
    referenceImageUrl: experience.aiPhotoConfig?.referenceImageUrls?.[0],
    model: experience.aiPhotoConfig?.model,
  };

  // 4. Call AI client
  await updateSessionState(eventId, sessionId, 'transforming');
  const aiClient = getAIClient();
  const result = await aiClient.generateImage(params);

  // 5. Upload result and update session
  const resultPath = `results/${eventId}/${sessionId}/result.png`;
  await uploadBytes(resultPath, result);
  const resultUrl = await getDownloadURL(resultPath);
  await updateSessionState(eventId, sessionId, 'ready', { resultImagePath: resultUrl });
}
```

**Verify**: Transform action produces AI result with mock provider

---

### Step 4: Create useJourneyRuntime Hook (2 hours)

The core state machine for journey navigation:

**File**: `web/src/features/guest/hooks/useJourneyRuntime.ts`

```typescript
interface JourneyRuntimeState {
  status: 'loading' | 'ready' | 'error';
  currentStepIndex: number;
  sessionId: string | null;
  error: string | null;
}

export function useJourneyRuntime(
  eventId: string,
  journey: Journey,
  steps: Step[]
) {
  const [state, dispatch] = useReducer(runtimeReducer, initialState);

  // Initialize session on mount
  useEffect(() => {
    startJourneySessionAction(eventId, journey.id)
      .then(result => dispatch({ type: 'SESSION_CREATED', sessionId: result.sessionId }));
  }, [eventId, journey.id]);

  // Navigation functions
  const next = useCallback(async () => {
    const nextIndex = state.currentStepIndex + 1;
    await advanceStepAction(eventId, state.sessionId, nextIndex);
    dispatch({ type: 'ADVANCE', index: nextIndex });
  }, [state.currentStepIndex, state.sessionId]);

  const previous = useCallback(async () => {
    await goBackStepAction(eventId, state.sessionId);
    dispatch({ type: 'GO_BACK' });
  }, [state.sessionId]);

  const saveInput = useCallback(async (stepId: string, value: StepInputValue) => {
    await saveStepDataAction(eventId, state.sessionId, stepId, value);
  }, [state.sessionId]);

  return {
    ...state,
    currentStep: steps[state.currentStepIndex],
    canGoBack: state.currentStepIndex > 0,
    canGoNext: state.currentStepIndex < steps.length - 1,
    next,
    previous,
    saveInput,
  };
}
```

**Verify**: Hook can navigate forward/back through steps

---

### Step 5: Create JourneyStepRenderer (2 hours)

Renders steps interactively with real callbacks:

**File**: `web/src/features/guest/components/JourneyStepRenderer.tsx`

```typescript
interface JourneyStepRendererProps {
  step: Step;
  theme: EventTheme;
  experiences?: Experience[];
  sessionId: string;
  eventId: string;
  onStepComplete: () => void;
  onInputChange: (stepId: string, value: StepInputValue) => void;
}

export function JourneyStepRenderer({
  step,
  theme,
  experiences,
  sessionId,
  eventId,
  onStepComplete,
  onInputChange,
}: JourneyStepRendererProps) {
  // Special handling for capture step - use real camera
  if (step.type === 'capture') {
    return (
      <GuestCaptureStep
        step={step}
        eventId={eventId}
        sessionId={sessionId}
        onCaptureComplete={onStepComplete}
      />
    );
  }

  // Special handling for processing step - trigger transform
  if (step.type === 'processing') {
    return (
      <GuestProcessingStep
        step={step}
        eventId={eventId}
        sessionId={sessionId}
        onProcessingComplete={onStepComplete}
      />
    );
  }

  // Reuse preview step renderers for other types
  return (
    <PreviewRuntime
      step={step}
      theme={theme}
      experiences={experiences}
      mode="playback"
      onInputChange={(_, value) => onInputChange(step.id, value)}
      onCtaClick={onStepComplete}
    />
  );
}
```

**Verify**: Each step type renders and responds to interaction

---

### Step 6: Create JourneyGuestContainer (1 hour)

Main orchestrator component:

**File**: `web/src/features/guest/components/JourneyGuestContainer.tsx`

```typescript
interface JourneyGuestContainerProps {
  event: Event;
  journey: Journey;
  steps: Step[];
  experiences: Experience[];
}

export function JourneyGuestContainer({
  event,
  journey,
  steps,
  experiences,
}: JourneyGuestContainerProps) {
  const runtime = useJourneyRuntime(event.id, journey, steps);

  if (runtime.status === 'loading') {
    return <LoadingSpinner />;
  }

  if (runtime.status === 'error') {
    return <JourneyErrorScreen error={runtime.error} onRetry={runtime.retry} />;
  }

  return (
    <EventThemeProvider theme={event.theme}>
      <JourneyStepRenderer
        step={runtime.currentStep}
        theme={event.theme}
        experiences={experiences}
        sessionId={runtime.sessionId}
        eventId={event.id}
        onStepComplete={runtime.next}
        onInputChange={runtime.saveInput}
      />
      <JourneyNavigation
        canGoBack={runtime.canGoBack}
        canGoNext={runtime.canGoNext}
        onBack={runtime.previous}
      />
    </EventThemeProvider>
  );
}
```

**Verify**: Container renders first step with theme applied

---

### Step 7: Update Join Page Routing (30 min)

Route to journey container when `activeJourneyId` exists:

**File**: `web/src/app/(public)/join/[eventId]/page.tsx`

```typescript
export default async function JoinPage({ params }) {
  const { eventId } = await params;
  const event = await getEventAction(eventId);

  // ... existing company status check ...

  // Route based on activeJourneyId
  if (event.activeJourneyId) {
    const { journey, steps } = await getJourneyForGuestAction(eventId, event.activeJourneyId);
    const { experiences } = await getExperiencesForGuestAction(eventId);

    if (journey && steps.length > 0) {
      return (
        <JourneyGuestContainer
          event={event}
          journey={journey}
          steps={steps}
          experiences={experiences}
        />
      );
    }
  }

  // Fallback to legacy flow
  return <GuestFlowContainer eventId={event.id} eventTitle={event.name} />;
}
```

**Verify**: Join link shows journey when activeJourneyId is set

---

### Step 8: Add Error Handling (1 hour)

Add error boundary and recovery UI:

**File**: `web/src/features/guest/components/JourneyErrorBoundary.tsx`

```typescript
export class JourneyErrorBoundary extends Component<Props, State> {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorScreen
          message={this.state.error}
          onRetry={() => this.setState({ hasError: false })}
          onRestart={this.props.onRestart}
        />
      );
    }
    return this.props.children;
  }
}
```

**Verify**: Errors display recovery options

---

## Validation Checklist

Before marking complete, verify:

- [ ] `pnpm lint` - No errors
- [ ] `pnpm type-check` - No TypeScript errors
- [ ] `pnpm test` - All tests pass
- [ ] Manual test: Complete full journey on mobile device
- [ ] Manual test: Camera capture works
- [ ] Manual test: AI transform produces result
- [ ] Manual test: Error recovery works (deny camera, simulate timeout)

---

## Testing Commands

```bash
# Run all checks
pnpm lint && pnpm type-check && pnpm test

# Dev server
pnpm dev

# Test join link
open http://localhost:3000/join/<your-event-id>
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Event not found" | Verify eventId exists in Firestore |
| "Journey not found" | Verify event.activeJourneyId is set and journey exists |
| Camera not working | Ensure HTTPS (use `pnpm dev` with HTTPS or deploy) |
| Transform timeout | Check AI_PROVIDER env var, try mock first |
| Session not persisting | Check Firestore security rules allow writes via Admin SDK |
