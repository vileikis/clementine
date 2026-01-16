# Runtime Engine Contract

**Feature**: 030-session-runtime-capture
**Date**: 2026-01-15

## Overview

This document defines the contract for the Experience Runtime Engine - the state machine that manages step-by-step execution of experiences.

---

## Hook Interface

### `useExperienceRuntime`

**Purpose**: Manage experience execution, step navigation, data collection, and session synchronization.

```typescript
function useExperienceRuntime(
  config: RuntimeConfig
): RuntimeEngine
```

---

## Configuration

### RuntimeConfig

```typescript
interface RuntimeConfig {
  /** Experience being executed */
  experience: Experience

  /** Active session (from useSubscribeSession) */
  session: Session

  /** Callback when experience completes */
  onComplete?: () => void

  /** Callback on error */
  onError?: (error: Error) => void
}
```

---

## Return Value: RuntimeEngine

### State Properties (Read-Only)

| Property | Type | Description |
|----------|------|-------------|
| `experienceId` | string | Experience ID being executed |
| `sessionId` | string | Active session ID |
| `mode` | SessionMode | Execution mode (`'preview'` \| `'guest'`) |
| `currentStep` | Step \| null | Current step object, null if no steps |
| `currentStepIndex` | number | Current step index (0-based) |
| `totalSteps` | number | Total number of steps |
| `canProceed` | boolean | Whether next() is available |
| `canGoBack` | boolean | Whether back() is available |
| `isComplete` | boolean | Whether experience is finished |

### Navigation Methods

#### `next(): Promise<void>`

Advance to the next step.

**Preconditions**:
- `canProceed` must be `true`
- Current step must be complete (info steps always complete, input steps need valid answer)

**Behavior**:
1. Validate current step is complete
2. If on last step, trigger completion
3. Otherwise, increment `currentStepIndex`
4. Sync to session document

**Postconditions**:
- `currentStepIndex` incremented (or `isComplete` becomes true)
- Session document updated

---

#### `back(): void`

Return to the previous step.

**Preconditions**:
- `canGoBack` must be `true` (currentStepIndex > 0)

**Behavior**:
1. Decrement `currentStepIndex`
2. Sync to session document

**Postconditions**:
- `currentStepIndex` decremented
- Previous step's answer preserved in `inputs`

---

#### `goToStep(index: number): void`

Jump to a specific step.

**Preconditions**:
- `index` must be >= 0 and < totalSteps
- `index` must be <= currentStepIndex (can't skip ahead)

**Behavior**:
1. Set `currentStepIndex` to `index`
2. Sync to session document

---

### Data Methods

#### `setInput(stepId: string, input: unknown): void`

Record user input for a step.

**Parameters**:
- `stepId`: The step's unique identifier
- `input`: The input value (type depends on step type)

**Behavior**:
1. Store input in `inputs[stepId]`
2. Recalculate `canProceed` based on validation
3. Sync to session document

**Input Types by Step**:

| Step Type | Input Type |
|-----------|------------|
| `input.scale` | `number` |
| `input.yesNo` | `boolean` |
| `input.multiSelect` | `string[]` |
| `input.shortText` | `string` |
| `input.longText` | `string` |

---

#### `setMedia(stepId: string, mediaRef: MediaReference): void`

Record captured media for a step.

**Parameters**:
- `stepId`: The step's unique identifier
- `mediaRef`: Reference to stored media

**Behavior**:
1. Store media in `outputs[stepId]`
2. Sync to session document

---

#### `getInput(stepId: string): unknown | undefined`

Retrieve stored input for a step.

---

#### `getOutput(stepId: string): MediaReference | undefined`

Retrieve stored media for a step.

---

#### `getState(): RuntimeState`

Get a snapshot of current runtime state.

```typescript
interface RuntimeState {
  currentStepIndex: number
  inputs: Record<string, unknown>
  outputs: Record<string, MediaReference>
}
```

---

## Validation Rules

### `canProceed` Calculation

```typescript
function calculateCanProceed(
  currentStep: Step,
  inputs: Record<string, unknown>
): boolean {
  if (!currentStep) return false

  switch (currentStep.type) {
    // Info steps are always complete
    case 'info':
      return true

    // Input steps require valid input
    case 'input.scale':
      return isValidScale(inputs[currentStep.id], currentStep.config)

    case 'input.yesNo':
      return typeof inputs[currentStep.id] === 'boolean'

    case 'input.multiSelect':
      return isValidMultiSelect(inputs[currentStep.id], currentStep.config)

    case 'input.shortText':
    case 'input.longText':
      return isValidText(inputs[currentStep.id], currentStep.config)

    // Placeholder steps are always complete
    case 'capture.photo':
    case 'transform.pipeline':
      return true

    default:
      return false
  }
}
```

### `canGoBack` Calculation

```typescript
canGoBack = currentStepIndex > 0
```

---

## Session Synchronization

The runtime engine syncs state to Firestore via `useUpdateSessionProgress`:

### Sync Events

| Event | Synced Fields |
|-------|---------------|
| `next()` | `currentStepIndex` |
| `back()` | `currentStepIndex` |
| `goToStep()` | `currentStepIndex` |
| `setInput()` | `inputs` |
| `setMedia()` | `outputs` |

### Debouncing

- Navigation syncs immediately
- Input changes debounced (300ms) to avoid excessive writes

---

## Completion Flow

```
┌──────────────────────────────────────────┐
│            User on Last Step             │
│                                          │
│  1. User completes last step             │
│  2. User clicks "Continue"               │
│  3. next() called                        │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ Runtime Engine                      │ │
│  │                                    │ │
│  │ 1. Set isComplete = true           │ │
│  │ 2. Call session.complete()         │ │
│  │ 3. Fire onComplete callback        │ │
│  └────────────────────────────────────┘ │
│                                          │
│  Session Status: 'completed'             │
│  completedAt: timestamp                  │
└──────────────────────────────────────────┘
```

---

## Error Handling

| Error | Cause | Handling |
|-------|-------|----------|
| `INVALID_STEP_INDEX` | goToStep with invalid index | Throw error |
| `CANNOT_PROCEED` | next() when canProceed is false | Throw error |
| `CANNOT_GO_BACK` | back() when canGoBack is false | Throw error |
| `SYNC_FAILED` | Firestore update failed | Retry with exponential backoff, call onError |

---

## Usage Example

```typescript
function PreviewContent({ experience, session, onClose }: Props) {
  const runtime = useExperienceRuntime({
    experience,
    session,
    onComplete: () => {
      toast.success('Preview complete!')
      onClose()
    },
    onError: (error) => {
      toast.error('An error occurred')
      console.error(error)
    },
  })

  const handleAnswer = (value: unknown) => {
    if (runtime.currentStep) {
      runtime.setInput(runtime.currentStep.id, value)
    }
  }

  return (
    <StepRenderer
      step={runtime.currentStep}
      mode="run"
      answer={runtime.getInput(runtime.currentStep?.id)}
      onAnswer={handleAnswer}
      onNext={() => runtime.next()}
      onBack={() => runtime.back()}
      canGoBack={runtime.canGoBack}
    />
  )
}
```
