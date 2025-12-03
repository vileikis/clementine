# Server Actions Contract: Experience Library

**Feature**: 015-experience-library
**Date**: 2025-12-02

## Overview

All mutations use Next.js Server Actions with Admin SDK. Actions follow the existing pattern from `journeys/actions/`.

---

## Action Response Type

```typescript
export type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };
```

---

## Experience Actions

### listExperiencesAction

**Purpose**: List all active experiences for a company

**Signature**:
```typescript
async function listExperiencesAction(
  companyId: string
): Promise<ActionResponse<Experience[]>>
```

**Validation**:
- `companyId` must be non-empty string
- Company must exist

**Errors**:
| Code | Description |
| ---- | ----------- |
| `VALIDATION_ERROR` | Invalid input |
| `COMPANY_NOT_FOUND` | Company does not exist |

---

### getExperienceAction

**Purpose**: Get a single experience by ID

**Signature**:
```typescript
async function getExperienceAction(
  experienceId: string
): Promise<ActionResponse<Experience>>
```

**Validation**:
- `experienceId` must be non-empty string

**Errors**:
| Code | Description |
| ---- | ----------- |
| `VALIDATION_ERROR` | Invalid input |
| `EXPERIENCE_NOT_FOUND` | Experience does not exist |

---

### createExperienceAction

**Purpose**: Create a new experience

**Signature**:
```typescript
async function createExperienceAction(
  input: CreateExperienceInput
): Promise<ActionResponse<{ experienceId: string }>>
```

**Input Schema**:
```typescript
{
  companyId: string;  // Required, non-empty
  name: string;       // Required, 1-200 chars, trimmed
}
```

**Behavior**:
1. Validate input with Zod schema
2. Verify company exists
3. Create experience document with:
   - `status: "active"`
   - `stepsOrder: []`
   - `deletedAt: null`
   - `createdAt: Date.now()`
   - `updatedAt: Date.now()`
4. Revalidate path: `/{companySlug}/exps`
5. Return `{ experienceId }`

**Errors**:
| Code | Description |
| ---- | ----------- |
| `VALIDATION_ERROR` | Invalid input |
| `COMPANY_NOT_FOUND` | Company does not exist |

---

### updateExperienceAction

**Purpose**: Update experience name or description

**Signature**:
```typescript
async function updateExperienceAction(
  experienceId: string,
  input: UpdateExperienceInput
): Promise<ActionResponse<void>>
```

**Input Schema**:
```typescript
{
  name?: string;        // Optional, 1-200 chars, trimmed
  description?: string; // Optional, max 1000 chars
}
```

**Behavior**:
1. Validate input with Zod schema
2. Verify experience exists
3. Update only provided fields + `updatedAt`
4. Revalidate path: `/{companySlug}/exps/{experienceId}`

**Errors**:
| Code | Description |
| ---- | ----------- |
| `VALIDATION_ERROR` | Invalid input |
| `EXPERIENCE_NOT_FOUND` | Experience does not exist |

---

### deleteExperienceAction

**Purpose**: Soft delete an experience

**Signature**:
```typescript
async function deleteExperienceAction(
  experienceId: string
): Promise<ActionResponse<void>>
```

**Behavior**:
1. Verify experience exists
2. Update experience:
   - `status: "deleted"`
   - `deletedAt: Date.now()`
   - `updatedAt: Date.now()`
3. Revalidate path: `/{companySlug}/exps`

**Errors**:
| Code | Description |
| ---- | ----------- |
| `EXPERIENCE_NOT_FOUND` | Experience does not exist |

---

## Step Actions

### listStepsAction

**Purpose**: List all steps for an experience

**Signature**:
```typescript
async function listStepsAction(
  experienceId: string
): Promise<ActionResponse<Step[]>>
```

**Behavior**:
1. Fetch all steps from subcollection
2. Order by `experience.stepsOrder` array
3. Return ordered steps

**Errors**:
| Code | Description |
| ---- | ----------- |
| `EXPERIENCE_NOT_FOUND` | Experience does not exist |

---

### createStepAction

**Purpose**: Create a new step in an experience

**Signature**:
```typescript
async function createStepAction(
  input: CreateStepInput
): Promise<ActionResponse<{ stepId: string }>>
```

**Input Schema**:
```typescript
{
  experienceId: string;
  type: StepType;
  // ... type-specific config
}
```

**Behavior**:
1. Validate input with type-specific Zod schema
2. Verify experience exists
3. Check max steps limit (50)
4. Create step document
5. Append step ID to `experience.stepsOrder`
6. Revalidate path

**Errors**:
| Code | Description |
| ---- | ----------- |
| `VALIDATION_ERROR` | Invalid input |
| `EXPERIENCE_NOT_FOUND` | Experience does not exist |
| `MAX_STEPS_EXCEEDED` | Experience has 50 steps |

---

### updateStepAction

**Purpose**: Update step configuration

**Signature**:
```typescript
async function updateStepAction(
  experienceId: string,
  stepId: string,
  input: UpdateStepInput
): Promise<ActionResponse<void>>
```

**Behavior**:
1. Validate input with type-specific schema
2. Verify step exists
3. Update only provided fields + `updatedAt`

**Errors**:
| Code | Description |
| ---- | ----------- |
| `VALIDATION_ERROR` | Invalid input |
| `STEP_NOT_FOUND` | Step does not exist |

---

### deleteStepAction

**Purpose**: Delete a step from an experience

**Signature**:
```typescript
async function deleteStepAction(
  experienceId: string,
  stepId: string
): Promise<ActionResponse<void>>
```

**Behavior**:
1. Verify step exists
2. Delete step document
3. Remove step ID from `experience.stepsOrder`
4. Revalidate path

**Errors**:
| Code | Description |
| ---- | ----------- |
| `STEP_NOT_FOUND` | Step does not exist |

---

### reorderStepsAction

**Purpose**: Reorder steps within an experience

**Signature**:
```typescript
async function reorderStepsAction(
  experienceId: string,
  newOrder: string[]
): Promise<ActionResponse<void>>
```

**Validation**:
- `newOrder` must contain same IDs as current `stepsOrder`
- No duplicates, no additions, no removals

**Behavior**:
1. Verify experience exists
2. Validate `newOrder` matches current step IDs
3. Update `experience.stepsOrder`
4. Revalidate path

**Errors**:
| Code | Description |
| ---- | ----------- |
| `EXPERIENCE_NOT_FOUND` | Experience does not exist |
| `INVALID_STEP_ORDER` | IDs don't match existing steps |

---

### duplicateStepAction

**Purpose**: Duplicate an existing step

**Signature**:
```typescript
async function duplicateStepAction(
  experienceId: string,
  stepId: string
): Promise<ActionResponse<{ stepId: string }>>
```

**Behavior**:
1. Verify step exists
2. Check max steps limit
3. Create copy with " (Copy)" suffix on title
4. Insert new step ID after original in `stepsOrder`
5. Return new step ID

**Errors**:
| Code | Description |
| ---- | ----------- |
| `STEP_NOT_FOUND` | Step does not exist |
| `MAX_STEPS_EXCEEDED` | Experience has 50 steps |
