# Components Contract: Experience Engine

**Feature Branch**: `020-experience-engine`
**Date**: 2025-12-05

## Overview

The Experience Engine exports components for rendering experiences. The main `ExperienceEngine` component is the public API; internal renderers are implementation details.

---

## Public Components

### ExperienceEngine

Main component that powers both Admin Preview and Guest Flow.

```typescript
// Location: features/experience-engine/components/ExperienceEngine.tsx

interface ExperienceEngineProps {
  /** Engine configuration */
  config: EngineConfig;

  /** Optional className for container */
  className?: string;

  /** Optional test ID */
  "data-testid"?: string;
}

function ExperienceEngine(props: ExperienceEngineProps): React.ReactElement
```

### Example Usage

```tsx
// Admin Preview
<ExperienceEngine
  config={{
    experienceId: "exp_123",
    steps: orderedSteps,
    stepsOrder: experience.stepsOrder,
    flowName: "Admin Preview",
    persistSession: false, // Ephemeral for preview
    allowBack: true,
    allowSkip: true,
    debugMode: true,
    theme: project.theme,
    onComplete: () => setPlaybackComplete(true),
  }}
/>

// Guest Flow
<ExperienceEngine
  config={{
    experienceId: event.experienceId,
    steps: orderedSteps,
    stepsOrder: experience.stepsOrder,
    flowName: `Guest: ${event.name}`,
    persistSession: true, // Persist for guests
    existingSessionId: sessionId, // Resume if returning
    allowBack: false, // No back for guests
    allowSkip: false, // No skip for guests
    debugMode: false,
    theme: project.theme,
    eventId: event.id,
    projectId: project.id,
    companyId: company.id,
    onStart: (session) => trackEngineStart(session),
    onComplete: (session) => trackEngineComplete(session),
    onError: (error) => captureError(error),
  }}
/>
```

---

## Internal Components

### StepRenderer

Dispatches to appropriate renderer based on step type.

```typescript
// Location: features/experience-engine/components/StepRenderer.tsx

interface StepRendererProps {
  /** Current step configuration */
  step: Step;

  /** Session data */
  sessionData: SessionData;

  /** Transformation status */
  transformStatus: TransformationStatus;

  // Handlers
  onChange: (value: StepInputValue) => void;
  onCtaClick: () => void;
  onComplete: () => void;
  onSkip: () => void;

  // Flags
  isInteractive: boolean;
  isLoading: boolean;
}

function StepRenderer(props: StepRendererProps): React.ReactElement
```

---

## Step Components

Each step type has a corresponding component in `components/steps/`. Naming follows the existing pattern from `features/steps/components/preview/steps/`.

### Step Props Interface

All step components receive `StepRendererProps<T>` where `T` is the specific step type:

```typescript
type InfoStepProps = StepRendererProps<StepInfo>;
type CaptureStepProps = StepRendererProps<StepCapture>;
type AiTransformStepProps = StepRendererProps<StepAiTransform>;
// ... etc
```

### Step Component List

| Step Type | Component | Notes |
|-----------|-----------|-------|
| `info` | `InfoStep` | Reuses existing preview component |
| `capture` | `CaptureStep` | Real camera for guest, mock for preview |
| `ai-transform` | `AiTransformStep` | Triggers job, auto-advances |
| `short_text` | `ShortTextStep` | Reuses existing preview component |
| `long_text` | `LongTextStep` | Reuses existing preview component |
| `multiple_choice` | `MultipleChoiceStep` | Reuses existing preview component |
| `yes_no` | `YesNoStep` | Reuses existing preview component |
| `opinion_scale` | `OpinionScaleStep` | Reuses existing preview component |
| `email` | `EmailStep` | Reuses existing preview component |
| `processing` | `ProcessingStep` | Real-time status subscription |
| `reward` | `RewardStep` | Real result display |

### AiTransformStep Specifics

```typescript
function AiTransformStep({
  step,
  sessionData,
  onComplete,
}: StepRendererProps<StepAiTransform>) {
  const [status, setStatus] = useState<"idle" | "triggering" | "triggered" | "error">("idle");

  useEffect(() => {
    // Auto-trigger on mount
    triggerTransform();
  }, []);

  async function triggerTransform() {
    setStatus("triggering");

    // Interpolate variables
    const prompt = interpolateVariables(
      step.config.prompt,
      sessionData,
      step.config.variables
    );

    // Trigger job via Server Action
    const result = await triggerTransformJob({
      sessionId,
      config: {
        model: step.config.model,
        prompt,
        inputImageUrl: getCapturedPhotoUrl(sessionData),
        outputType: step.config.outputType,
        aspectRatio: step.config.aspectRatio,
        referenceImageUrls: step.config.referenceImageUrls,
      },
    });

    if (result.success) {
      setStatus("triggered");
      // Brief delay then auto-advance
      setTimeout(() => onComplete(), 500);
    } else {
      setStatus("error");
    }
  }

  // Render brief confirmation UI
  return (
    <div className="flex flex-col items-center justify-center h-full">
      {status === "triggering" && <Spinner />}
      {status === "triggered" && <CheckIcon />}
      {status === "error" && <RetryButton onClick={triggerTransform} />}
    </div>
  );
}
```

### ProcessingStep Specifics

```typescript
function ProcessingStep({
  step,
  transformStatus,
  onComplete,
}: StepRendererProps<StepProcessing>) {
  // Auto-advance when transformation completes
  useEffect(() => {
    if (transformStatus.status === "complete") {
      onComplete();
    }
  }, [transformStatus.status, onComplete]);

  // Rotating messages
  const [messageIndex, setMessageIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % step.config.messages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [step.config.messages.length]);

  return (
    <StepLayout>
      <AnimatedSpinner />
      <p className="text-center mt-4">
        {step.config.messages[messageIndex]}
      </p>
    </StepLayout>
  );
}
```

### RewardStep Specifics

```typescript
function RewardStep({
  step,
  transformStatus,
  sessionData,
}: StepRendererProps<StepReward>) {
  const resultUrl = transformStatus.resultUrl;
  const isLoading = !resultUrl && transformStatus.status !== "error";

  return (
    <StepLayout>
      {isLoading ? (
        <Skeleton className="aspect-square w-full max-w-md" />
      ) : transformStatus.status === "error" ? (
        <ErrorDisplay message={transformStatus.errorMessage} />
      ) : (
        <TransformedImage src={resultUrl} />
      )}

      <ShareActions
        resultUrl={resultUrl}
        allowDownload={step.config.allowDownload}
        allowSystemShare={step.config.allowSystemShare}
        allowEmail={step.config.allowEmail}
        socials={step.config.socials}
        disabled={!resultUrl}
      />
    </StepLayout>
  );
}
```

---

## Step Registry

```typescript
// Location: features/experience-engine/lib/step-registry.ts

const STEP_REGISTRY: RendererRegistry = {
  info: InfoStep,
  capture: CaptureStep,
  "ai-transform": AiTransformStep,
  short_text: ShortTextStep,
  long_text: LongTextStep,
  multiple_choice: MultipleChoiceStep,
  yes_no: YesNoStep,
  opinion_scale: OpinionScaleStep,
  email: EmailStep,
  processing: ProcessingStep,
  reward: RewardStep,
  // Deprecated - not used in new flows
  "experience-picker": () => null,
};

export function getStepComponent(stepType: StepType): React.ComponentType<StepRendererProps> {
  const StepComponent = STEP_REGISTRY[stepType];
  if (!StepComponent) {
    throw new Error(`No component registered for step type: ${stepType}`);
  }
  return StepComponent;
}
```

---

## Navigation UI

The `ExperienceEngine` can optionally render navigation controls based on configuration.

```typescript
interface NavigationBarProps {
  currentIndex: number;
  totalSteps: number;
  canGoBack: boolean;
  canGoNext: boolean;
  canSkip: boolean;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  onRestart: () => void;
}

// Rendered when debugMode: true or in Admin Preview
function NavigationBar(props: NavigationBarProps): React.ReactElement
```

---

## File Locations

| Purpose | Path |
|---------|------|
| Main component | `features/experience-engine/components/ExperienceEngine.tsx` |
| Step dispatcher | `features/experience-engine/components/StepRenderer.tsx` |
| Step components | `features/experience-engine/components/steps/*.tsx` |
| Step registry | `features/experience-engine/lib/step-registry.ts` |
| Component barrel | `features/experience-engine/components/index.ts` |
