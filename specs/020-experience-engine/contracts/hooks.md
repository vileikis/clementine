# Hooks Contract: Experience Engine

**Feature Branch**: `020-experience-engine`
**Date**: 2025-12-05

## Overview

The Experience Engine exposes hooks for engine state management, session handling, and real-time subscriptions. These hooks are the primary interface for integrating applications.

---

## useEngine

Main engine hook for state and navigation control.

```typescript
// Location: features/experience-engine/hooks/useEngine.ts

interface UseEngineOptions {
  config: EngineConfig;
}

interface UseEngineReturn {
  /** Current engine state */
  state: EngineState;

  /** Navigation actions */
  actions: EngineActions;

  /** Current session (ephemeral or persisted) */
  session: EngineSession;

  /** Whether engine is ready for interaction */
  isReady: boolean;
}

function useEngine(options: UseEngineOptions): UseEngineReturn
```

### EngineActions

```typescript
interface EngineActions {
  /** Start engine execution */
  start: () => void;

  /** Navigate to next step */
  next: () => void;

  /** Navigate to previous step (if allowed) */
  previous: () => void;

  /** Skip current step (if allowed) */
  skip: () => void;

  /** Restart from first step */
  restart: () => void;

  /** Update input value for current step */
  updateInput: (value: StepInputValue) => void;

  /** Jump to specific step (admin/debug only) */
  goToStep: (index: number) => void;
}
```

### Example Usage

```tsx
function ExperienceEngine({ config }: { config: EngineConfig }) {
  const { state, actions, session, isReady } = useEngine({ config });

  if (!isReady) {
    return <LoadingSpinner />;
  }

  if (state.status === "error") {
    return <ErrorDisplay error={state.error} onRetry={actions.restart} />;
  }

  return (
    <StepRenderer
      step={state.currentStep}
      sessionData={session.data}
      transformStatus={session.transformStatus}
      onCtaClick={actions.next}
      onChange={actions.updateInput}
      onComplete={() => actions.next()}
    />
  );
}
```

---

## useEngineSession

Manages session state for both ephemeral and persisted modes.

```typescript
// Location: features/experience-engine/hooks/useEngineSession.ts

interface UseEngineSessionOptions {
  mode: "ephemeral" | "persisted";
  experienceId: string;
  eventId?: string;
  projectId?: string;
  companyId?: string;
  existingSessionId?: string;
}

interface UseEngineSessionReturn {
  /** Session object */
  session: EngineSession;

  /** Loading state */
  isLoading: boolean;

  /** Error state */
  error: EngineError | null;

  /** Session actions */
  updateData: (stepId: string, value: StepInputValue) => void;
  updateStepIndex: (index: number) => void;
  setTransformStatus: (status: TransformationStatus) => void;
  reset: () => void;
}

function useEngineSession(
  options: UseEngineSessionOptions
): UseEngineSessionReturn
```

### Mode Behaviors

**Ephemeral Mode**:
- All state stored in React state
- No Firestore calls
- Session ID is `"ephemeral-" + nanoid()`
- Reset clears all data

**Persisted Mode**:
- Creates session in Firestore on mount
- Updates trigger Server Actions
- Subscribes to real-time updates
- Session ID is Firestore document ID

---

## useTransformationStatus

Subscribes to real-time transformation status updates.

```typescript
// Location: features/experience-engine/hooks/useTransformationStatus.ts

interface UseTransformationStatusOptions {
  sessionId: string;
  enabled?: boolean; // Default: true
}

interface UseTransformationStatusReturn {
  /** Current transformation status */
  status: TransformationStatus;

  /** Loading state */
  isLoading: boolean;

  /** Error state */
  error: Error | null;

  /** Refresh status manually */
  refresh: () => void;
}

function useTransformationStatus(
  options: UseTransformationStatusOptions
): UseTransformationStatusReturn
```

### Subscription Behavior

```typescript
// Internal implementation pattern
useEffect(() => {
  if (!enabled || !sessionId) return;

  const sessionRef = doc(db, "sessions", sessionId);
  const unsubscribe = onSnapshot(
    sessionRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setStatus(data.transformStatus);
      }
    },
    (err) => setError(err)
  );

  return () => unsubscribe();
}, [sessionId, enabled]);
```

---

## useStepInput

Helper hook for managing individual step input state.

```typescript
// Location: features/experience-engine/hooks/useStepInput.ts

interface UseStepInputOptions<T extends StepInputValue["type"]> {
  stepId: string;
  type: T;
  sessionData: SessionData;
  onChange: (stepId: string, value: StepInputValue) => void;
}

interface UseStepInputReturn<T> {
  /** Current value (typed based on input type) */
  value: T extends "text" ? string :
         T extends "boolean" ? boolean :
         T extends "number" ? number :
         T extends "selection" ? string :
         T extends "photo" ? string : never;

  /** Update value */
  setValue: (value: UseStepInputReturn<T>["value"]) => void;

  /** Whether input has value */
  hasValue: boolean;
}

function useStepInput<T extends StepInputValue["type"]>(
  options: UseStepInputOptions<T>
): UseStepInputReturn<T>
```

### Example Usage

```tsx
function ShortTextRenderer({ step, sessionData, onChange }: StepRendererProps) {
  const { value, setValue, hasValue } = useStepInput({
    stepId: step.id,
    type: "text",
    sessionData,
    onChange,
  });

  return (
    <Input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={step.config.placeholder}
    />
  );
}
```

---

## Hook Dependencies

```
┌──────────────────────────────────────────────────────┐
│                    useEngine                          │
│                        │                              │
│         ┌──────────────┼──────────────┐              │
│         ▼              ▼              ▼              │
│  useEngineSession   useNavigate   useCallbacks       │
│         │                                            │
│         ▼                                            │
│  useTransformationStatus                             │
│         │                                            │
│         ▼                                            │
│  onSnapshot (Firestore Client SDK)                   │
└──────────────────────────────────────────────────────┘
```

---

## File Locations

| Purpose | Path |
|---------|------|
| Main engine hook | `features/experience-engine/hooks/useEngine.ts` |
| Session hook | `features/experience-engine/hooks/useEngineSession.ts` |
| Transform status hook | `features/experience-engine/hooks/useTransformationStatus.ts` |
| Step input helper | `features/experience-engine/hooks/useStepInput.ts` |
| Hook barrel export | `features/experience-engine/hooks/index.ts` |
