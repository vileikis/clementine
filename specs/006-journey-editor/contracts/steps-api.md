# API Contract: Steps

**Feature**: Journey Editor
**Branch**: `006-journey-editor`
**Date**: 2025-11-26

## Overview

This document defines the Server Actions API for Step CRUD operations. All mutations go through Server Actions using Firebase Admin SDK.

---

## Authentication

All server actions require admin authentication via `verifyAdminSecret()`.

```typescript
type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };
```

---

## Server Actions

### 1. List Steps

Retrieves all steps for a journey, ordered by journey's `stepOrder`.

**Signature**:
```typescript
async function listStepsAction(
  eventId: string,
  journeyId: string
): Promise<ActionResponse<Step[]>>
```

**Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| eventId | string | Event document ID |
| journeyId | string | Journey document ID |

**Response**:
```typescript
// Success
{
  success: true,
  data: Step[] // Ordered by journey.stepOrder
}

// Error
{
  success: false,
  error: { code: "NOT_FOUND", message: "Journey not found" }
}
```

**Error Codes**:
- `UNAUTHORIZED`: Invalid or missing auth
- `NOT_FOUND`: Event or journey doesn't exist
- `INTERNAL_ERROR`: Firestore operation failed

---

### 2. Get Step

Retrieves a single step by ID.

**Signature**:
```typescript
async function getStepAction(
  eventId: string,
  stepId: string
): Promise<ActionResponse<Step>>
```

**Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| eventId | string | Event document ID |
| stepId | string | Step document ID |

**Response**:
```typescript
// Success
{ success: true, data: Step }

// Error
{ success: false, error: { code: "NOT_FOUND", message: "Step not found" } }
```

---

### 3. Create Step

Creates a new step and appends to journey's `stepOrder`.

**Signature**:
```typescript
async function createStepAction(
  eventId: string,
  journeyId: string,
  input: CreateStepInput
): Promise<ActionResponse<Step>>
```

**Input Schema**:
```typescript
interface CreateStepInput {
  type: StepType;
  title?: string;
  description?: string;
  mediaUrl?: string;
  ctaLabel?: string;
  config?: StepConfig<StepType>; // Type-specific, optional for info
}
```

**Behavior**:
1. Validate input against step schema
2. Generate new document ID
3. Create step document with timestamps
4. Append step ID to `journey.stepOrder`
5. Return created step

**Response**:
```typescript
// Success
{ success: true, data: Step } // With generated id, timestamps

// Error
{ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid step config" } }
```

**Error Codes**:
- `UNAUTHORIZED`: Invalid auth
- `NOT_FOUND`: Event or journey doesn't exist
- `VALIDATION_ERROR`: Invalid input data
- `LIMIT_EXCEEDED`: Max 50 steps per journey
- `INTERNAL_ERROR`: Firestore operation failed

---

### 4. Update Step

Updates an existing step's configuration.

**Signature**:
```typescript
async function updateStepAction(
  eventId: string,
  stepId: string,
  input: UpdateStepInput
): Promise<ActionResponse<Step>>
```

**Input Schema**:
```typescript
interface UpdateStepInput {
  title?: string;
  description?: string;
  mediaUrl?: string | null; // null to remove
  ctaLabel?: string;
  config?: Partial<StepConfig<StepType>>;
}
```

**Note**: `type` cannot be changed after creation. To change type, delete and recreate.

**Behavior**:
1. Validate input against partial step schema
2. Merge with existing step data
3. Update `updatedAt` timestamp
4. Return updated step

**Response**:
```typescript
// Success
{ success: true, data: Step }

// Error
{ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid title length" } }
```

---

### 5. Delete Step

Removes a step and its reference from journey's `stepOrder`.

**Signature**:
```typescript
async function deleteStepAction(
  eventId: string,
  journeyId: string,
  stepId: string
): Promise<ActionResponse<{ deleted: true }>>
```

**Behavior**:
1. Remove step ID from `journey.stepOrder`
2. Delete step document
3. Use batch write for atomicity

**Response**:
```typescript
// Success
{ success: true, data: { deleted: true } }

// Error
{ success: false, error: { code: "NOT_FOUND", message: "Step not found" } }
```

---

### 6. Reorder Steps

Updates the order of steps in a journey.

**Signature**:
```typescript
async function reorderStepsAction(
  eventId: string,
  journeyId: string,
  stepOrder: string[]
): Promise<ActionResponse<{ stepOrder: string[] }>>
```

**Input Schema**:
```typescript
interface ReorderStepsInput {
  stepOrder: string[]; // Array of step IDs in new order
}
```

**Validation**:
- All step IDs must exist in current `stepOrder`
- No new IDs allowed (use create/delete for add/remove)
- No duplicates allowed

**Behavior**:
1. Validate all step IDs exist
2. Update `journey.stepOrder` with new order
3. Update `journey.updatedAt`
4. Return new order

**Response**:
```typescript
// Success
{ success: true, data: { stepOrder: ["step1", "step2", "step3"] } }

// Error
{ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid step IDs" } }
```

---

### 7. Duplicate Step

Creates a copy of an existing step.

**Signature**:
```typescript
async function duplicateStepAction(
  eventId: string,
  journeyId: string,
  stepId: string
): Promise<ActionResponse<Step>>
```

**Behavior**:
1. Get existing step
2. Create new step with same config (new ID, timestamps)
3. Append to `journey.stepOrder` immediately after original
4. Return new step

**Response**:
```typescript
// Success
{ success: true, data: Step } // The duplicated step

// Error
{ success: false, error: { code: "NOT_FOUND", message: "Step not found" } }
```

---

## Real-Time Subscriptions (Client SDK)

### Subscribe to Steps

For real-time updates in the editor, use Client SDK subscription.

**Usage**:
```typescript
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

function useSteps(eventId: string, journeyId: string) {
  const [steps, setSteps] = useState<Step[]>([]);
  const [journey, setJourney] = useState<Journey | null>(null);

  useEffect(() => {
    // Subscribe to steps collection
    const stepsRef = collection(db, "events", eventId, "steps");
    const stepsQuery = query(stepsRef, where("journeyId", "==", journeyId));

    const unsubscribe = onSnapshot(stepsQuery, (snapshot) => {
      const stepsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Step));

      // Order by journey.stepOrder
      if (journey) {
        const ordered = journey.stepOrder
          .map(id => stepsData.find(s => s.id === id))
          .filter(Boolean) as Step[];
        setSteps(ordered);
      }
    });

    return () => unsubscribe();
  }, [eventId, journeyId, journey]);

  return steps;
}
```

---

## Validation Rules

### Variable Names

Pattern: `^[a-zA-Z_][a-zA-Z0-9_]*$`

Valid: `user_name`, `selectedOption`, `_temp`
Invalid: `1st_choice`, `user-name`, `my.var`

### URLs

Must be valid URL format. For `mediaUrl`, should be full public URL (not relative path).

### Step Limits

- Max 50 steps per journey
- Max 10 options for multiple choice
- Max 10 messages for processing step
- Max 20 experience options for picker

---

## Error Handling

### Standard Error Response

```typescript
interface ApiError {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

type ErrorCode =
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "LIMIT_EXCEEDED"
  | "CONFLICT"
  | "INTERNAL_ERROR";
```

### HTTP-like Status Mapping

| Code | HTTP Equivalent | Description |
|------|-----------------|-------------|
| UNAUTHORIZED | 401 | Auth failed |
| NOT_FOUND | 404 | Resource doesn't exist |
| VALIDATION_ERROR | 400 | Invalid input |
| LIMIT_EXCEEDED | 400 | Quota exceeded |
| CONFLICT | 409 | Resource conflict |
| INTERNAL_ERROR | 500 | Server error |

---

## Cache Invalidation

After mutations, invalidate relevant cache paths:

```typescript
// After step mutations
revalidatePath(`/events/${eventId}/design/journeys/${journeyId}`);

// After journey order change
revalidatePath(`/events/${eventId}/design/journeys`);
```
