# Server Actions Contract: Experience Engine

**Feature Branch**: `020-experience-engine`
**Date**: 2025-12-05

## Overview

The Experience Engine uses Server Actions for all write operations (per Firebase Architecture Standards). These actions use the Admin SDK and are located in `features/sessions/actions/` (session domain owner).

---

## Session Actions

### createEngineSession

Creates a new session for persisted mode.

```typescript
// Location: features/sessions/actions/sessions.actions.ts

interface CreateSessionInput {
  experienceId: string;
  eventId: string;
  projectId: string;
  companyId: string;
  initialStepIndex?: number; // Default: 0
}

interface CreateSessionOutput {
  sessionId: string;
  createdAt: number;
}

async function createEngineSession(
  input: CreateSessionInput
): Promise<ActionResponse<CreateSessionOutput>>
```

**Behavior**:
1. Validate input with Zod schema
2. Generate session ID (`nanoid`)
3. Create Firestore document at `/sessions/{sessionId}`
4. Initialize `transformStatus: { status: "idle" }`
5. Return session ID

**Errors**:
- `VALIDATION_ERROR`: Invalid input
- `FIRESTORE_ERROR`: Write failed

---

### loadEngineSession

Loads an existing session for resumption.

```typescript
interface LoadSessionInput {
  sessionId: string;
}

interface LoadSessionOutput {
  session: EngineSession;
}

async function loadEngineSession(
  input: LoadSessionInput
): Promise<ActionResponse<LoadSessionOutput>>
```

**Behavior**:
1. Fetch document from `/sessions/{sessionId}`
2. Return session data or NOT_FOUND error

**Errors**:
- `NOT_FOUND`: Session doesn't exist
- `FIRESTORE_ERROR`: Read failed

---

### updateSessionData

Updates session data (step inputs).

```typescript
interface UpdateDataInput {
  sessionId: string;
  stepId: string;
  value: StepInputValue;
}

async function updateSessionData(
  input: UpdateDataInput
): Promise<ActionResponse<void>>
```

**Behavior**:
1. Validate input
2. Update `data.{stepId}` field in session document
3. Update `updatedAt` timestamp

**Errors**:
- `VALIDATION_ERROR`: Invalid input/value type
- `NOT_FOUND`: Session doesn't exist
- `FIRESTORE_ERROR`: Update failed

---

### updateSessionStepIndex

Updates current step index during navigation.

```typescript
interface UpdateStepIndexInput {
  sessionId: string;
  stepIndex: number;
}

async function updateSessionStepIndex(
  input: UpdateStepIndexInput
): Promise<ActionResponse<void>>
```

**Behavior**:
1. Validate step index is non-negative
2. Update `currentStepIndex` field
3. Update `updatedAt` timestamp

---

## Transform Actions

### triggerTransformJob

Triggers an AI transformation background job.

```typescript
// Location: features/sessions/actions/sessions.actions.ts

interface TriggerTransformInput {
  sessionId: string;
  config: {
    model: string;
    prompt: string; // Already interpolated with variables
    inputImageUrl: string;
    outputType: "image" | "video" | "gif";
    aspectRatio: string;
    referenceImageUrls: string[];
  };
}

interface TriggerTransformOutput {
  jobId: string;
  status: "pending";
}

async function triggerTransformJob(
  input: TriggerTransformInput
): Promise<ActionResponse<TriggerTransformOutput>>
```

**Behavior**:
1. Validate input
2. Update session `transformStatus: { status: "pending", jobId }`
3. Queue background job (n8n webhook / Firebase Task)
4. Return job ID

**Errors**:
- `VALIDATION_ERROR`: Invalid config
- `SESSION_NOT_FOUND`: Session doesn't exist
- `TRANSFORM_QUEUE_ERROR`: Failed to queue job

---

### updateTransformStatus

Updates transformation status (called by background job or webhook).

```typescript
interface UpdateTransformStatusInput {
  sessionId: string;
  status: TransformStatus;
  resultUrl?: string;
  errorMessage?: string;
}

async function updateTransformStatus(
  input: UpdateTransformStatusInput
): Promise<ActionResponse<void>>
```

**Behavior**:
1. Validate input
2. Update session `transformStatus` fields
3. Update `updatedAt` timestamp

**Notes**:
- Called by external n8n workflow via API route
- Or called by internal background process

---

## Response Types

All actions follow the standard response pattern:

```typescript
type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: ActionError };

interface ActionError {
  code: string;
  message: string;
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Input failed Zod validation |
| `NOT_FOUND` | Resource doesn't exist |
| `FIRESTORE_ERROR` | Firebase operation failed |
| `TRANSFORM_QUEUE_ERROR` | Failed to queue AI job |
| `UNAUTHORIZED` | Missing/invalid authentication |

---

## Authentication

All Server Actions require authentication context:

```typescript
// Verify admin context (for admin preview)
const auth = await verifyAdminSecret();
if (!auth.authorized) {
  return { success: false, error: { code: "UNAUTHORIZED", message: auth.error } };
}

// Or verify guest context (for guest flow)
const guest = await verifyGuestSession(sessionId);
if (!guest.valid) {
  return { success: false, error: { code: "UNAUTHORIZED", message: "Invalid session" } };
}
```

---

## Usage Examples

### Creating a Session

```typescript
// In Guest Flow
const result = await createEngineSession({
  experienceId: "exp_123",
  eventId: "evt_456",
  projectId: "prj_789",
  companyId: "cmp_abc",
});

if (result.success) {
  initEngine({ existingSessionId: result.data.sessionId });
}
```

### Triggering Transform

```typescript
// In ai-transform step renderer
const result = await triggerTransformJob({
  sessionId,
  config: {
    model: "gemini-2.5-flash-image",
    prompt: interpolatedPrompt,
    inputImageUrl: sessionData.capturedPhoto,
    outputType: "image",
    aspectRatio: "1:1",
    referenceImageUrls: [],
  },
});

if (result.success) {
  onComplete(); // Trigger auto-advance
}
```

---

## File Locations

| Purpose | Path |
|---------|------|
| Session actions | `features/sessions/actions/sessions.actions.ts` |
| Session types | `features/sessions/types/sessions.types.ts` |
| Session schemas | `features/sessions/schemas/sessions.schemas.ts` |
| Engine types | `features/experience-engine/types/engine.types.ts` |
| Engine schemas | `features/experience-engine/schemas/engine.schemas.ts` |
