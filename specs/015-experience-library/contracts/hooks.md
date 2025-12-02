# Hooks Contract: Experience Library

**Feature**: 015-experience-library
**Date**: 2025-12-02

## Overview

React hooks for data fetching and state management. Follows existing patterns from `journeys/hooks/`.

---

## useExperiences

**Purpose**: Real-time subscription to company experiences

**Signature**:
```typescript
function useExperiences(companyId: string | null): {
  experiences: Experience[];
  loading: boolean;
  error: Error | null;
}
```

**Behavior**:
1. Subscribe to `/experiences` with `where("companyId", "==", companyId)` and `where("status", "==", "active")`
2. Order by `createdAt` descending
3. Update state on snapshot changes
4. Cleanup subscription on unmount or `companyId` change

**Usage**:
```typescript
const { experiences, loading, error } = useExperiences(companyId);
```

---

## useExperience

**Purpose**: Real-time subscription to a single experience

**Signature**:
```typescript
function useExperience(experienceId: string | null): {
  experience: Experience | null;
  loading: boolean;
  error: Error | null;
}
```

**Behavior**:
1. Subscribe to `/experiences/{experienceId}` document
2. Update state on snapshot changes
3. Return `null` if experience doesn't exist or is deleted

---

## useSteps

**Purpose**: Real-time subscription to experience steps with ordering

**Signature**:
```typescript
function useSteps(experienceId: string | null): {
  steps: Step[];
  loading: boolean;
  error: Error | null;
}
```

**Behavior**:
1. Subscribe to `/experiences/{experienceId}/steps` collection
2. Fetch experience document for `stepsOrder`
3. Order steps according to `stepsOrder` array
4. Handle steps not in `stepsOrder` (append to end)

**Usage**:
```typescript
const { steps, loading, error } = useSteps(experienceId);
```

---

## useStepMutations

**Purpose**: Step mutation handlers with loading state and toast notifications

**Signature**:
```typescript
function useStepMutations(experienceId: string): {
  createStep: (input: CreateStepInput) => Promise<{ success: boolean; stepId?: string }>;
  updateStep: (stepId: string, input: UpdateStepInput) => Promise<{ success: boolean }>;
  deleteStep: (stepId: string) => Promise<{ success: boolean }>;
  reorderSteps: (newOrder: string[]) => Promise<{ success: boolean }>;
  duplicateStep: (stepId: string) => Promise<{ success: boolean; stepId?: string }>;
  isLoading: boolean;
}
```

**Behavior**:
1. Wrap server actions with loading state
2. Show success/error toasts via `sonner`
3. Return success status for UI feedback

**Usage**:
```typescript
const { createStep, updateStep, deleteStep, reorderSteps, duplicateStep, isLoading } =
  useStepMutations(experienceId);

const result = await createStep({ type: "info", experienceId });
if (result.success) {
  setSelectedStepId(result.stepId);
}
```

---

## useSelectedStep

**Purpose**: Manage currently selected step in editor

**Signature**:
```typescript
function useSelectedStep(steps: Step[]): {
  selectedStepId: string | null;
  selectedStep: Step | null;
  setSelectedStepId: (id: string | null) => void;
}
```

**Behavior**:
1. Track selected step ID in state
2. Derive selected step from steps array
3. Auto-clear selection if step is deleted
4. Auto-select first step if none selected and steps exist

---

## useKeyboardShortcuts

**Purpose**: Keyboard shortcuts for step operations

**Signature**:
```typescript
function useKeyboardShortcuts(params: {
  steps: Step[];
  selectedStepId: string | null;
  onNavigate: (direction: "up" | "down") => void;
  onDelete: () => void;
  onDuplicate: () => void;
}): void
```

**Shortcuts**:
| Key | Action |
| --- | ------ |
| `ArrowUp` | Navigate to previous step |
| `ArrowDown` | Navigate to next step |
| `Delete` / `Backspace` | Delete selected step |
| `Cmd/Ctrl + D` | Duplicate selected step |

**Behavior**:
1. Register global keyboard listeners
2. Only activate when focus is not in input/textarea
3. Cleanup on unmount

---

## useAutoSave

**Purpose**: Debounced auto-save on form blur

**Signature**:
```typescript
function useAutoSave<T extends FieldValues>(params: {
  form: UseFormReturn<T>;
  originalValues: T;
  onUpdate: (data: Partial<T>) => Promise<void>;
  fieldsToCompare: (keyof T)[];
  debounceMs?: number; // default: 300
}): {
  handleBlur: () => void;
}
```

**Behavior**:
1. On blur, compare current form values to original
2. If changed fields detected, debounce and call `onUpdate`
3. Only send changed fields to reduce update size

**Usage**:
```typescript
const { handleBlur } = useAutoSave({
  form,
  originalValues: step,
  onUpdate: (data) => updateStep(step.id, data),
  fieldsToCompare: ["title", "description", "ctaLabel", "config"],
});

<Input onBlur={handleBlur} {...form.register("title")} />
```
