# Server Actions Contract: Guest Experience Runtime

**Feature**: 011-guest-runtime
**Date**: 2025-11-27

## Overview

This document defines the server action contracts for the Guest Experience Runtime Engine. All actions use the existing pattern: `"use server"` functions that call repository methods with Firebase Admin SDK.

---

## Session Actions

### `startJourneySessionAction`

Creates a new session for a guest starting a journey.

**Signature**:
```typescript
export async function startJourneySessionAction(
  eventId: string,
  journeyId: string
): Promise<ActionResult<{ sessionId: string }>>
```

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `eventId` | `string` | Yes | Event identifier |
| `journeyId` | `string` | Yes | Journey identifier |

**Returns**:
```typescript
// Success
{ success: true, sessionId: "sess_abc123" }

// Error
{ success: false, error: "Event not found" }
```

**Side Effects**:
- Creates new document at `/events/{eventId}/sessions/{sessionId}`
- Sets `state: 'created'`, `journeyId`, `currentStepIndex: 0`

---

### `advanceStepAction`

Advances the session to the next step in the journey.

**Signature**:
```typescript
export async function advanceStepAction(
  eventId: string,
  sessionId: string,
  nextIndex: number
): Promise<ActionResult<void>>
```

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `eventId` | `string` | Yes | Event identifier |
| `sessionId` | `string` | Yes | Session identifier |
| `nextIndex` | `number` | Yes | Index of next step (0-based) |

**Returns**:
```typescript
// Success
{ success: true }

// Error
{ success: false, error: "Session not found" }
```

**Validation**:
- `nextIndex` must be >= 0
- `nextIndex` must be <= journey.stepOrder.length

**Side Effects**:
- Updates `currentStepIndex` in session document
- Updates `updatedAt` timestamp

---

### `goBackStepAction`

Moves the session back to the previous step.

**Signature**:
```typescript
export async function goBackStepAction(
  eventId: string,
  sessionId: string
): Promise<ActionResult<{ newIndex: number }>>
```

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `eventId` | `string` | Yes | Event identifier |
| `sessionId` | `string` | Yes | Session identifier |

**Returns**:
```typescript
// Success
{ success: true, newIndex: 2 }

// Error (already at first step)
{ success: false, error: "Cannot go back from first step" }
```

**Validation**:
- `currentStepIndex` must be > 0

**Side Effects**:
- Decrements `currentStepIndex` in session document
- Updates `updatedAt` timestamp

---

### `saveStepDataAction`

Saves user input data for a specific step.

**Signature**:
```typescript
export async function saveStepDataAction(
  eventId: string,
  sessionId: string,
  stepId: string,
  value: StepInputValue
): Promise<ActionResult<void>>
```

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `eventId` | `string` | Yes | Event identifier |
| `sessionId` | `string` | Yes | Session identifier |
| `stepId` | `string` | Yes | Step identifier (used as data key) |
| `value` | `StepInputValue` | Yes | Input value (discriminated union) |

**StepInputValue Types**:
```typescript
type StepInputValue =
  | { type: 'text'; value: string }
  | { type: 'boolean'; value: boolean }
  | { type: 'number'; value: number }
  | { type: 'selection'; selectedId: string }
  | { type: 'selections'; selectedIds: string[] }
  | { type: 'photo'; url: string };
```

**Returns**:
```typescript
// Success
{ success: true }

// Error
{ success: false, error: "Invalid input value" }
```

**Validation**:
- `value` must match StepInputValue schema
- String values sanitized (trimmed, max length enforced)

**Side Effects**:
- Updates `data.{stepId}` in session document
- Updates `updatedAt` timestamp

---

### `selectExperienceAction`

Saves the selected experience from an experience-picker step.

**Signature**:
```typescript
export async function selectExperienceAction(
  eventId: string,
  sessionId: string,
  experienceId: string
): Promise<ActionResult<void>>
```

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `eventId` | `string` | Yes | Event identifier |
| `sessionId` | `string` | Yes | Session identifier |
| `experienceId` | `string` | Yes | Selected experience ID |

**Returns**:
```typescript
// Success
{ success: true }

// Error
{ success: false, error: "Experience not found" }
```

**Validation**:
- `experienceId` must exist and be enabled
- Experience must be linked to the event

**Side Effects**:
- Sets `data.selected_experience_id` in session document
- Updates `updatedAt` timestamp

---

### `saveCaptureAction` (existing, unchanged)

Uploads captured photo to Storage and updates session.

**Signature**:
```typescript
export async function saveCaptureAction(
  formData: FormData
): Promise<ActionResult<{ inputImagePath: string }>>
```

**FormData Fields**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `eventId` | `string` | Yes | Event identifier |
| `sessionId` | `string` | Yes | Session identifier |
| `photo` | `File` | Yes | Captured photo blob |

**Returns**:
```typescript
// Success
{ success: true, inputImagePath: "captures/evt_123/sess_456/input.jpg" }

// Error
{ success: false, error: "Upload failed" }
```

**Side Effects**:
- Uploads photo to Firebase Storage
- Updates `inputImagePath` and `state: 'captured'` in session
- Updates `updatedAt` timestamp

---

### `triggerTransformAction` (existing, MODIFIED)

Triggers AI transformation using the selected experience config.

**Signature**:
```typescript
export async function triggerTransformAction(
  eventId: string,
  sessionId: string
): Promise<ActionResult<void>>
```

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `eventId` | `string` | Yes | Event identifier |
| `sessionId` | `string` | Yes | Session identifier |

**Returns**:
```typescript
// Success (transform started, client monitors via subscription)
{ success: true }

// Error
{ success: false, error: "No input image found" }
```

**Prerequisites**:
- Session must have `inputImagePath` set
- Session must have `data.selected_experience_id` set (for journey sessions)

**Processing Flow**:
1. Fetch session and verify input image exists
2. Load selected experience and AI config
3. Build `TransformParams` from experience config
4. Set `state: 'transforming'`
5. Call AI provider via `getAIClient().generateImage(params)`
6. Upload result to Storage
7. Set `state: 'ready'`, `resultImagePath: <public URL>`

**Error Handling**:
- On timeout (45s): Set `state: 'error'`, `error: "AI transform timed out"`
- On provider error: Set `state: 'error'`, `error: <message>`
- Client can retry by calling action again

---

### `retryTransformAction`

Retries a failed AI transformation.

**Signature**:
```typescript
export async function retryTransformAction(
  eventId: string,
  sessionId: string
): Promise<ActionResult<void>>
```

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `eventId` | `string` | Yes | Event identifier |
| `sessionId` | `string` | Yes | Session identifier |

**Returns**:
```typescript
// Success
{ success: true }

// Error
{ success: false, error: "Session not in error state" }
```

**Validation**:
- Session `state` must be `'error'`
- Session must have `inputImagePath`

**Side Effects**:
- Clears `error` field
- Delegates to `triggerTransformAction`

---

### `getSessionAction` (existing, unchanged)

Fetches session data by ID.

**Signature**:
```typescript
export async function getSessionAction(
  eventId: string,
  sessionId: string
): Promise<ActionResult<{ session: Session }>>
```

**Returns**:
```typescript
// Success
{ success: true, session: { id: "sess_123", state: "ready", ... } }

// Error
{ success: false, error: "Session not found" }
```

---

## Data Loading Actions

### `getJourneyForGuestAction`

Loads journey definition for guest display.

**Signature**:
```typescript
export async function getJourneyForGuestAction(
  eventId: string,
  journeyId: string
): Promise<ActionResult<{ journey: Journey; steps: Step[] }>>
```

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `eventId` | `string` | Yes | Event identifier |
| `journeyId` | `string` | Yes | Journey identifier |

**Returns**:
```typescript
// Success
{
  success: true,
  journey: { id: "journey_001", stepOrder: ["step1", "step2"], ... },
  steps: [{ id: "step1", type: "info", ... }, { id: "step2", type: "capture", ... }]
}

// Error
{ success: false, error: "Journey not found" }
```

**Notes**:
- Steps are returned in order defined by `journey.stepOrder`
- Only includes steps that exist (filters out deleted/missing)

---

### `getExperiencesForGuestAction`

Loads experiences available for selection (for experience-picker steps).

**Signature**:
```typescript
export async function getExperiencesForGuestAction(
  eventId: string
): Promise<ActionResult<{ experiences: Experience[] }>>
```

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `eventId` | `string` | Yes | Event identifier |

**Returns**:
```typescript
// Success
{
  success: true,
  experiences: [
    { id: "exp_cartoon", name: "Cartoon Style", previewMediaUrl: "...", ... },
    { id: "exp_retro", name: "Retro Filter", previewMediaUrl: "...", ... }
  ]
}

// Error
{ success: false, error: "Event not found" }
```

**Notes**:
- Only returns enabled experiences (`enabled: true`)
- Only returns experiences linked to the event (`eventIds` contains `eventId`)

---

## Shared Types

### `ActionResult<T>`

Standard result wrapper for all server actions:

```typescript
type ActionResult<T> =
  | { success: true } & T
  | { success: false; error: string };
```

### `StepInputValue`

Discriminated union for type-safe step input storage:

```typescript
type StepInputValue =
  | { type: 'text'; value: string }
  | { type: 'boolean'; value: boolean }
  | { type: 'number'; value: number }
  | { type: 'selection'; selectedId: string }
  | { type: 'selections'; selectedIds: string[] }
  | { type: 'photo'; url: string };
```

---

## Error Codes

| Error Message | Cause | Recovery |
|--------------|-------|----------|
| `"Event not found"` | Invalid eventId | Check URL, redirect to error page |
| `"Journey not found"` | Invalid journeyId or deleted | Fall back to legacy flow |
| `"Session not found"` | Invalid sessionId | Start new session |
| `"Experience not found"` | Invalid or disabled experience | Refresh experience list |
| `"No input image found"` | Capture not completed | Return to capture step |
| `"AI transform timed out"` | Provider timeout | Show retry button |
| `"AI transform failed"` | Provider error | Show retry button |
| `"Cannot go back from first step"` | Already at index 0 | Hide back button |
