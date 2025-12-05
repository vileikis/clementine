# Quickstart: Experience Engine

**Feature Branch**: `020-experience-engine`
**Date**: 2025-12-05

## Overview

This guide covers common integration patterns for the Experience Engine.

---

## Basic Usage

### Admin Preview (Ephemeral Mode)

```tsx
import { ExperienceEngine } from "@/features/experience-engine";
import type { EngineConfig } from "@/features/experience-engine";

function ExperiencePreview({ experience, steps, theme }: PreviewProps) {
  const config: EngineConfig = {
    // Required
    experienceId: experience.id,
    steps,
    stepsOrder: experience.stepsOrder,
    flowName: "Admin Preview",

    // Ephemeral - no database
    persistSession: false,

    // Full navigation for preview
    allowBack: true,
    allowSkip: true,

    // Debug enabled
    debugMode: true,

    // Styling
    theme,

    // Callbacks
    onComplete: () => console.log("Preview complete"),
  };

  return <ExperienceEngine config={config} />;
}
```

### Guest Flow (Persisted Mode)

```tsx
import { ExperienceEngine } from "@/features/experience-engine";
import type { EngineConfig } from "@/features/experience-engine";

function GuestExperience({ event, experience, steps, sessionId }: GuestProps) {
  const config: EngineConfig = {
    // Required
    experienceId: experience.id,
    steps,
    stepsOrder: experience.stepsOrder,
    flowName: `Guest: ${event.name}`,

    // Persisted - syncs to Firestore
    persistSession: true,
    existingSessionId: sessionId, // Resume if provided

    // Restricted navigation for guests
    allowBack: false,
    allowSkip: false,

    // No debug in production
    debugMode: false,

    // Context for session creation
    eventId: event.id,
    projectId: event.projectId,
    companyId: event.companyId,

    // Styling
    theme: event.theme,

    // Lifecycle tracking
    onStart: (session) => {
      analytics.track("experience_started", {
        sessionId: session.id,
        experienceId: experience.id,
      });
    },
    onStepChange: (info) => {
      analytics.track("step_changed", {
        stepIndex: info.index,
        stepType: info.step.type,
        direction: info.direction,
      });
    },
    onComplete: (session) => {
      analytics.track("experience_completed", {
        sessionId: session.id,
      });
    },
    onError: (error) => {
      captureException(error);
    },
  };

  return (
    <EventThemeProvider theme={event.theme}>
      <ExperienceEngine config={config} />
    </EventThemeProvider>
  );
}
```

---

## Hook Usage

### Using useEngine Directly

For custom UI layouts, use the hook instead of the component:

```tsx
import { useEngine } from "@/features/experience-engine";

function CustomExperienceUI({ config }: { config: EngineConfig }) {
  const { state, actions, session, isReady } = useEngine({ config });

  if (!isReady) {
    return <LoadingScreen />;
  }

  if (state.status === "error") {
    return <ErrorScreen error={state.error} onRetry={actions.restart} />;
  }

  if (state.status === "completed") {
    return <CompletionScreen session={session} onRestart={actions.restart} />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Progress indicator */}
      <ProgressBar
        current={state.currentStepIndex + 1}
        total={config.steps.length}
      />

      {/* Step content */}
      <div className="flex-1">
        <StepRenderer
          step={state.currentStep!}
          sessionData={session.data}
          transformStatus={session.transformStatus}
          onChange={(value) => actions.updateInput(value)}
          onCtaClick={actions.next}
          onComplete={actions.next}
          onSkip={actions.skip}
          isInteractive={true}
          isLoading={false}
        />
      </div>

      {/* Navigation */}
      <NavigationButtons
        canGoBack={state.canGoBack}
        canGoNext={state.canGoNext}
        canSkip={state.canSkip}
        onBack={actions.previous}
        onNext={actions.next}
        onSkip={actions.skip}
      />
    </div>
  );
}
```

---

## Session Management

### Resume Existing Session

```tsx
// Check for existing session in URL or localStorage
const sessionId = searchParams.get("session") || localStorage.getItem("sessionId");

<ExperienceEngine
  config={{
    ...baseConfig,
    persistSession: true,
    existingSessionId: sessionId || undefined,
    onStart: (session) => {
      // Store session ID for resumption
      localStorage.setItem("sessionId", session.id);
    },
  }}
/>
```

### Access Session Data

```tsx
const { session } = useEngine({ config });

// Get captured photo URL
const photoUrl = session.data["capture-step-id"]?.type === "photo"
  ? session.data["capture-step-id"].url
  : null;

// Get text input value
const userName = session.data["name-step-id"]?.type === "text"
  ? session.data["name-step-id"].value
  : "";

// Get transformation result
const resultUrl = session.transformStatus.resultUrl;
```

---

## Transformation Flow

### AI Transform Step

The ai-transform step automatically:
1. Interpolates variables in the prompt
2. Triggers the background job
3. Updates session status to "pending"
4. Auto-advances to the next step

```tsx
// No special handling needed - just include the step in your experience
const aiTransformStep: StepAiTransform = {
  id: "ai-transform-1",
  experienceId: "exp_123",
  type: "ai-transform",
  title: "Creating your masterpiece...",
  config: {
    model: "gemini-2.5-flash-image",
    prompt: "Transform {{photo}} into a {{style}} portrait",
    variables: [
      { key: "photo", sourceType: "capture", sourceStepId: "capture-1" },
      { key: "style", sourceType: "input", sourceStepId: "style-selection-1" },
    ],
    outputType: "image",
    aspectRatio: "1:1",
    referenceImageUrls: [],
  },
  createdAt: Date.now(),
  updatedAt: Date.now(),
};
```

### Processing Step

The processing step automatically:
1. Subscribes to transformation status
2. Shows rotating messages
3. Auto-advances when complete

```tsx
const processingStep: StepProcessing = {
  id: "processing-1",
  experienceId: "exp_123",
  type: "processing",
  title: "Generating your image...",
  config: {
    messages: [
      "Analyzing your photo...",
      "Applying AI magic...",
      "Adding finishing touches...",
      "Almost there...",
    ],
    estimatedDuration: 30, // seconds
  },
  createdAt: Date.now(),
  updatedAt: Date.now(),
};
```

---

## Error Handling

### Global Error Callback

```tsx
<ExperienceEngine
  config={{
    ...baseConfig,
    onError: (error) => {
      switch (error.code) {
        case "TRANSFORM_FAILED":
          toast.error("Image generation failed. Please try again.");
          break;
        case "SESSION_SYNC_FAILED":
          toast.error("Connection lost. Your progress is saved locally.");
          break;
        default:
          toast.error("Something went wrong.");
          captureException(error.cause);
      }
    },
  }}
/>
```

### Step-Level Error Handling

Each renderer handles its own recoverable errors:

```tsx
// AiTransformRenderer shows retry button on failure
// ProcessingRenderer shows error state if transform fails
// RewardRenderer shows error state if result unavailable
```

---

## Theme Integration

```tsx
import { EventThemeProvider } from "@/components/providers/EventThemeProvider";

// Theme is applied via EventThemeProvider
<EventThemeProvider theme={project.theme}>
  <ExperienceEngine config={config} />
</EventThemeProvider>

// Or pass theme in config
<ExperienceEngine
  config={{
    ...baseConfig,
    theme: project.theme, // Theme applied internally
  }}
/>
```

---

## Testing

### Unit Testing Engine Hook

```tsx
import { renderHook, act } from "@testing-library/react";
import { useEngine } from "@/features/experience-engine";

test("engine initializes with first step", () => {
  const { result } = renderHook(() =>
    useEngine({
      config: {
        experienceId: "test",
        steps: mockSteps,
        stepsOrder: ["step-1", "step-2"],
        flowName: "Test",
        persistSession: false,
        allowBack: true,
        allowSkip: false,
        debugMode: false,
      },
    })
  );

  expect(result.current.state.currentStepIndex).toBe(0);
  expect(result.current.state.status).toBe("running");
});

test("navigation advances to next step", () => {
  const { result } = renderHook(() => useEngine({ config: testConfig }));

  act(() => {
    result.current.actions.next();
  });

  expect(result.current.state.currentStepIndex).toBe(1);
});
```

---

## Import Paths

```typescript
// Engine components
import { ExperienceEngine, StepRenderer } from "@/features/experience-engine";

// Engine hooks
import { useEngine, useEngineSession } from "@/features/experience-engine";

// Engine types
import type {
  EngineConfig,
  EngineState,
  StepRendererProps,
} from "@/features/experience-engine";

// Session types (from sessions module)
import type {
  EngineSession,
  TransformationStatus,
  SessionData,
  StepInputValue,
} from "@/features/sessions";

// Session hooks (from sessions module)
import { useTransformationStatus } from "@/features/sessions";
```

---

## Checklist

Before integrating the Experience Engine:

- [ ] Steps are ordered by `stepsOrder` array
- [ ] Theme is provided via config or EventThemeProvider
- [ ] Session persistence mode chosen (ephemeral vs persisted)
- [ ] Navigation flags set (allowBack, allowSkip)
- [ ] Lifecycle callbacks implemented (at minimum onError)
- [ ] Context IDs provided for persisted mode (eventId, projectId, companyId)
