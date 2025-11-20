# Server Actions Contracts: Survey Experience

**Date**: 2025-11-20  
**Feature**: Survey Experience Type  
**Purpose**: Define Server Action signatures for survey step operations

---

## Overview

All survey step mutations use Next.js Server Actions with Firebase Admin SDK. Actions follow the standard `ActionResponse<T>` pattern for type-safe error handling.

**Action Response Type**:
```typescript
type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };
```

**File Location**: `web/src/features/experiences/actions/survey-steps.ts`

---

## 1. Create Survey Step

**Function**: `createSurveyStepAction`

**Description**: Creates a new survey step and adds it to the experience's stepsOrder array.

**Signature**:
```typescript
export async function createSurveyStepAction(
  eventId: string,
  experienceId: string,
  input: CreateStepInput
): Promise<ActionResponse<{ stepId: string }>>
```

**Input Schema**:
```typescript
const createStepInputSchema = z.object({
  type: z.enum([
    'multiple-choice',
    'yes-no',
    'opinion-scale',
    'short-text',
    'long-text',
    'email',
    'statement',
  ]),
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  required: z.boolean().nullable().default(null),
  helperText: z.string().max(200).optional(),
  ctaLabel: z.string().min(1).max(50).optional(),
  mediaUrl: z.string().url().optional(),
  config: z.any(), // Type-specific config validated per type
});

type CreateStepInput = z.infer<typeof createStepInputSchema>;
```

**Success Response**:
```typescript
{
  success: true,
  data: {
    stepId: "step_abc123"  // Generated Firestore document ID
  }
}
```

**Error Codes**:
- `VALIDATION_ERROR`: Input validation failed
- `MAX_STEPS_EXCEEDED`: Attempting to create more than 10 steps
- `EXPERIENCE_NOT_FOUND`: Experience document doesn't exist
- `FIRESTORE_ERROR`: Database operation failed

**Example Usage**:
```typescript
const result = await createSurveyStepAction('event_123', 'exp_456', {
  type: 'multiple-choice',
  title: 'How would you rate this event?',
  description: 'Your feedback helps us improve',
  required: true,
  config: {
    options: ['Excellent', 'Good', 'Fair', 'Poor'],
    allowMultiple: false,
  },
});

if (result.success) {
  console.log('Created step:', result.data.stepId);
} else {
  console.error(result.error.message);
}
```

**Validation Rules**:
- Input validated against `createStepInputSchema` + type-specific config schema
- Experience must have < 10 steps (hard limit)
- `type` must be one of 7 supported step types
- Type-specific config validated (e.g., multiple-choice requires ≥1 option)

**Side Effects**:
- Creates document in `/events/{eventId}/steps/{stepId}`
- Appends `stepId` to `SurveyExperience.config.stepsOrder` array
- Revalidates `/events/{eventId}` path
- Sets `createdAt` and `updatedAt` timestamps

---

## 2. Update Survey Step

**Function**: `updateSurveyStepAction`

**Description**: Updates an existing survey step's configuration.

**Signature**:
```typescript
export async function updateSurveyStepAction(
  eventId: string,
  stepId: string,
  input: UpdateStepInput
): Promise<ActionResponse<{ step: SurveyStep }>>
```

**Input Schema**:
```typescript
const updateStepInputSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  required: z.boolean().nullable().optional(),
  helperText: z.string().max(200).optional(),
  ctaLabel: z.string().min(1).max(50).optional(),
  mediaUrl: z.string().url().optional(),
  config: z.any().optional(), // Type-specific config
});

type UpdateStepInput = z.infer<typeof updateStepInputSchema>;
```

**Success Response**:
```typescript
{
  success: true,
  data: {
    step: {
      id: "step_abc123",
      type: "multiple-choice",
      title: "Updated question",
      // ... full step data
    }
  }
}
```

**Error Codes**:
- `VALIDATION_ERROR`: Input validation failed
- `STEP_NOT_FOUND`: Step document doesn't exist
- `FIRESTORE_ERROR`: Database operation failed

**Example Usage**:
```typescript
const result = await updateSurveyStepAction('event_123', 'step_abc123', {
  title: 'How would you rate your experience?',
  config: {
    options: ['Excellent', 'Good', 'Fair', 'Poor', 'Very Poor'],
    allowMultiple: false,
  },
});

if (result.success) {
  console.log('Updated step:', result.data.step);
}
```

**Validation Rules**:
- Only provided fields are updated (partial update)
- Type cannot be changed (immutable after creation)
- Type-specific config validated if provided
- All field constraints enforced (max lengths, etc.)

**Side Effects**:
- Updates document in `/events/{eventId}/steps/{stepId}`
- Updates `updatedAt` timestamp
- Revalidates `/events/{eventId}` path

---

## 3. Delete Survey Step

**Function**: `deleteSurveyStepAction`

**Description**: Deletes a survey step and removes it from the experience's stepsOrder array.

**Signature**:
```typescript
export async function deleteSurveyStepAction(
  eventId: string,
  experienceId: string,
  stepId: string
): Promise<ActionResponse<{ stepId: string }>>
```

**Input**: None (path parameters only)

**Success Response**:
```typescript
{
  success: true,
  data: {
    stepId: "step_abc123"  // ID of deleted step
  }
}
```

**Error Codes**:
- `STEP_NOT_FOUND`: Step document doesn't exist
- `EXPERIENCE_NOT_FOUND`: Experience document doesn't exist
- `FIRESTORE_ERROR`: Database operation failed

**Example Usage**:
```typescript
const result = await deleteSurveyStepAction('event_123', 'exp_456', 'step_abc123');

if (result.success) {
  console.log('Deleted step:', result.data.stepId);
}
```

**Side Effects**:
- Deletes document from `/events/{eventId}/steps/{stepId}`
- Removes `stepId` from `SurveyExperience.config.stepsOrder` array
- Revalidates `/events/{eventId}` path

**Transaction Safety**:
- Uses Firestore transaction to ensure atomic delete + array update
- If step deletion fails, stepsOrder array is not modified

---

## 4. Reorder Survey Steps

**Function**: `reorderSurveyStepsAction`

**Description**: Updates the order of survey steps by modifying the stepsOrder array.

**Signature**:
```typescript
export async function reorderSurveyStepsAction(
  eventId: string,
  experienceId: string,
  newOrder: string[]
): Promise<ActionResponse<{ stepsOrder: string[] }>>
```

**Input Schema**:
```typescript
const reorderStepsInputSchema = z.object({
  stepsOrder: z.array(z.string()).max(10, 'Max 10 steps allowed'),
});

type ReorderStepsInput = z.infer<typeof reorderStepsInputSchema>;
```

**Success Response**:
```typescript
{
  success: true,
  data: {
    stepsOrder: ["step_abc", "step_def", "step_ghi"]
  }
}
```

**Error Codes**:
- `VALIDATION_ERROR`: Invalid step ID array
- `EXPERIENCE_NOT_FOUND`: Experience document doesn't exist
- `INVALID_STEP_IDS`: Step IDs don't match existing steps
- `FIRESTORE_ERROR`: Database operation failed

**Example Usage**:
```typescript
const result = await reorderSurveyStepsAction('event_123', 'exp_456', [
  'step_def',  // Moved to position 0
  'step_abc',  // Moved to position 1
  'step_ghi',  // Stayed at position 2
]);

if (result.success) {
  console.log('New order:', result.data.stepsOrder);
}
```

**Validation Rules**:
- Array length must match current `stepsOrder` length
- All step IDs must exist in current `stepsOrder` (no additions/removals)
- No duplicate step IDs
- Max 10 steps

**Side Effects**:
- Updates `SurveyExperience.config.stepsOrder` array
- Updates `updatedAt` timestamp on experience
- Revalidates `/events/{eventId}` path

---

## 5. Batch Update Steps (Optional Future)

**Function**: `batchUpdateSurveyStepsAction`

**Description**: Update multiple steps atomically (not in MVP, documented for future).

**Signature**:
```typescript
export async function batchUpdateSurveyStepsAction(
  eventId: string,
  updates: Array<{ stepId: string; input: UpdateStepInput }>
): Promise<ActionResponse<{ stepsUpdated: number }>>
```

**Note**: Not implemented in initial version. Consider for future bulk operations.

---

## Error Handling Pattern

All Server Actions follow this error handling pattern:

```typescript
export async function exampleAction(
  eventId: string,
  input: unknown
): Promise<ActionResponse<Data>> {
  'use server';
  
  try {
    // 1. Validate input
    const validated = inputSchema.parse(input);
    
    // 2. Perform database operations (Admin SDK)
    const result = await repository.operation(eventId, validated);
    
    // 3. Revalidate paths
    revalidatePath(`/events/${eventId}`);
    
    // 4. Return success
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    // 5. Handle known errors
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.errors[0].message,
        },
      };
    }
    
    // 6. Handle unknown errors
    console.error('Action failed:', error);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    };
  }
}
```

---

## Client-Side Usage Pattern

**With React Hook**:
```typescript
// hooks/useSurveyStepMutations.ts
export function useSurveyStepMutations(eventId: string, experienceId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createStep = async (input: CreateStepInput) => {
    setLoading(true);
    setError(null);
    
    const result = await createSurveyStepAction(eventId, experienceId, input);
    
    if (result.success) {
      setLoading(false);
      return result.data.stepId;
    } else {
      setError(result.error.message);
      setLoading(false);
      return null;
    }
  };

  const updateStep = async (stepId: string, input: UpdateStepInput) => {
    // Similar pattern...
  };

  const deleteStep = async (stepId: string) => {
    // Similar pattern...
  };

  const reorderSteps = async (newOrder: string[]) => {
    // Similar pattern...
  };

  return {
    createStep,
    updateStep,
    deleteStep,
    reorderSteps,
    loading,
    error,
  };
}
```

**In Components**:
```typescript
function SurveyStepEditor({ eventId, experienceId }) {
  const { createStep, loading, error } = useSurveyStepMutations(eventId, experienceId);

  const handleSubmit = async (data: CreateStepInput) => {
    const stepId = await createStep(data);
    if (stepId) {
      console.log('Step created:', stepId);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ... */}
      {error && <div className="text-red-500">{error}</div>}
      <Button disabled={loading}>Create Step</Button>
    </form>
  );
}
```

---

## Testing Contracts

**Unit Tests** (Jest):
```typescript
// actions/survey-steps.test.ts
describe('createSurveyStepAction', () => {
  it('creates step and updates stepsOrder', async () => {
    const result = await createSurveyStepAction('event_123', 'exp_456', {
      type: 'short-text',
      title: 'What is your name?',
    });

    expect(result.success).toBe(true);
    expect(result.data.stepId).toBeDefined();
  });

  it('validates max steps limit', async () => {
    // Mock experience with 10 existing steps
    const result = await createSurveyStepAction('event_123', 'exp_456', {
      type: 'short-text',
      title: '11th step',
    });

    expect(result.success).toBe(false);
    expect(result.error.code).toBe('MAX_STEPS_EXCEEDED');
  });

  it('validates input schema', async () => {
    const result = await createSurveyStepAction('event_123', 'exp_456', {
      type: 'invalid-type',
      title: '',
    } as any);

    expect(result.success).toBe(false);
    expect(result.error.code).toBe('VALIDATION_ERROR');
  });
});
```

---

## Security Considerations

1. **Authentication**: Actions should verify user authentication (future enhancement)
2. **Authorization**: Verify user owns/can edit the event (future enhancement)
3. **Rate Limiting**: Consider rate limits for mutation actions (future enhancement)
4. **Input Sanitization**: All inputs validated via Zod schemas
5. **SQL Injection**: N/A (Firestore uses document IDs and structured data)

**Future Authorization Pattern**:
```typescript
export async function createSurveyStepAction(
  eventId: string,
  experienceId: string,
  input: CreateStepInput
): Promise<ActionResponse<{ stepId: string }>> {
  'use server';
  
  // 1. Verify authentication
  const session = await getServerSession();
  if (!session?.user) {
    return {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
    };
  }
  
  // 2. Verify authorization
  const hasAccess = await userCanEditEvent(session.user.id, eventId);
  if (!hasAccess) {
    return {
      success: false,
      error: { code: 'FORBIDDEN', message: 'Not authorized' },
    };
  }
  
  // 3. Proceed with validated operation...
}
```

---

## Performance Considerations

1. **Firestore Transactions**: Use for atomic operations (delete + update stepsOrder)
2. **Batch Writes**: Not needed for single-step operations
3. **Optimistic Updates**: Client can optimistically update UI before Server Action completes
4. **Revalidation**: Only revalidate affected paths (`/events/{eventId}`)

---

## Summary

| Action | Purpose | Inputs | Returns |
|--------|---------|--------|---------|
| `createSurveyStepAction` | Create new step | `CreateStepInput` | `{ stepId }` |
| `updateSurveyStepAction` | Update step config | `UpdateStepInput` | `{ step }` |
| `deleteSurveyStepAction` | Delete step | `stepId` | `{ stepId }` |
| `reorderSurveyStepsAction` | Reorder steps | `string[]` | `{ stepsOrder }` |

All actions:
- Use Firebase Admin SDK
- Return `ActionResponse<T>` for type-safe error handling
- Validate inputs with Zod schemas
- Revalidate Next.js paths after mutations
- Handle errors gracefully with specific error codes

