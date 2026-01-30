# Data Model: Experience Designer Tabs - Collect and Generate

**Feature**: 050-exp-designer-tabs
**Date**: 2026-01-30
**Purpose**: Document data structures, entities, and state management

## Overview

This feature introduces routing changes and removes deprecated step types. It does not introduce new data models but modifies existing schemas and state.

## Data Entities

### 1. Tab Configuration (Frontend State)

**Entity**: `TabItem[]`

Represents the tab navigation configuration for the Experience Designer.

**Structure**:
```typescript
interface TabItem {
  id: string          // Unique tab identifier ('collect' | 'generate')
  label: string       // Display label ('Collect' | 'Generate')
  to: string          // Route path (e.g., '/workspace/.../ experiences/.../ collect')
}
```

**Location**: Defined in `ExperienceDesignerLayout.tsx` component

**Lifecycle**:
- **Created**: On component mount (static array)
- **Updated**: Never (immutable configuration)
- **Destroyed**: On component unmount

**Validation**: None required (statically typed)

**Example**:
```typescript
const experienceDesignerTabs: TabItem[] = [
  {
    id: 'collect',
    label: 'Collect',
    to: '/workspace/$workspaceSlug/experiences/$experienceId/collect',
  },
  {
    id: 'generate',
    label: 'Generate',
    to: '/workspace/$workspaceSlug/experiences/$experienceId/generate',
  },
]
```

---

### 2. Route Search Parameters (URL State)

**Entity**: `ExperienceDesignerSearch`

Represents URL query parameters for step selection in the Collect tab.

**Structure**:
```typescript
interface ExperienceDesignerSearch {
  step?: string  // Optional step ID for deep linking
}
```

**Location**: Defined in route files (`$experienceId.collect.tsx`)

**Validation**:
```typescript
// Zod schema in route definition
const experienceDesignerSearchSchema = z.object({
  step: z.string().optional(),
})
```

**Lifecycle**:
- **Created**: When navigating to Collect tab with step ID
- **Updated**: When selecting different step (via `useStepSelection` hook)
- **Destroyed**: When navigating to Generate tab or clearing selection

**Example**:
```typescript
// URL: /workspace/acme/experiences/exp-123/collect?step=step-abc-456
{
  step: 'step-abc-456'
}
```

---

## Schema Changes

### 1. Step Schema Modifications (Shared Package)

**File**: `packages/shared/src/schemas/experience/step.schema.ts`

**Change**: Remove `transform.pipeline` from discriminated union

**Before**:
```typescript
export const experienceStepSchema = z.discriminatedUnion('type', [
  infoStepSchema,
  inputStepSchema,
  captureStepSchema,
  transformPipelineStepSchema,  // ← REMOVE THIS
])
```

**After**:
```typescript
export const experienceStepSchema = z.discriminatedUnion('type', [
  infoStepSchema,
  inputStepSchema,
  captureStepSchema,
])
```

**Impact**:
- TypeScript type `ExperienceStep` no longer includes `TransformPipelineStep`
- Firestore documents with `type: 'transform.pipeline'` will fail validation
- No production data risk (transform.pipeline steps never saved to production)

---

### 2. Deleted Schemas

**Files Removed**:
1. `packages/shared/src/schemas/experience/steps/transform-pipeline.schema.ts`

**Rationale**: `transform.pipeline` step type removed from frontend step system (backend schemas unchanged - AI service is independent)

---

## State Management

### 1. Experience Designer Store (Zustand)

**Store**: `useExperienceDesignerStore`

**State Shape**:
```typescript
interface ExperienceDesignerStore {
  pendingSaves: number        // Count of pending save operations
  lastCompletedAt: number | null  // Timestamp of last completed save
  resetSaveState: () => void  // Reset save state on unmount
}
```

**Location**: `apps/clementine-app/src/domains/experience/designer/stores/useExperienceDesignerStore.ts`

**Changes**: None (store unchanged by this feature)

**Sharing Across Tabs**:
- Both Collect and Generate tabs access the same store instance
- Save state (pending saves, last completed) shared across tabs
- Ensures consistent save status indicators regardless of active tab

---

### 2. Local Component State

**Component**: `ExperienceCollectPage` (renamed from `ExperienceDesignerPage`)

**State**:
```typescript
const [steps, setSteps] = useState<Step[]>([])              // Local copy of draft steps
const [showAddDialog, setShowAddDialog] = useState(false)   // Add step dialog visibility
const [showStepListSheet, setShowStepListSheet] = useState(false)  // Mobile sheet (step list)
const [showConfigSheet, setShowConfigSheet] = useState(false)      // Mobile sheet (config panel)
```

**Changes**: None (component state unchanged, only renamed)

---

## Data Flow

### 1. Tab Navigation Flow

```
User clicks tab
  ↓
TanStack Router navigation
  ↓
URL updates (e.g., /collect → /generate)
  ↓
Route component renders
  ↓
ExperienceDesignerLayout re-renders with same data
  ↓
TopNavBar highlights active tab
```

**Data Sources**:
- Tab configuration: Static array in `ExperienceDesignerLayout`
- Active tab detection: TanStack Router's `useRouter()` hook (matches current path)

---

### 2. Step Selection Flow (Collect Tab)

```
User clicks step in list
  ↓
useStepSelection.selectStep(stepId)
  ↓
navigate({ search: { step: stepId } })
  ↓
URL updates: ?step=stepId
  ↓
Route re-renders with new search param
  ↓
useStepSelection returns selectedStep from URL
  ↓
StepPreview and StepConfigPanel render selected step
```

**Data Sources**:
- Step list: `experience.draft.steps` from Firestore (via `onSnapshot`)
- Selected step ID: URL search param (`?step=...`)
- Step data: Derived from steps array using selected ID

---

### 3. Experience Data Sync (Shared Across Tabs)

```
Firestore onSnapshot listener (parent route)
  ↓
Experience document updates
  ↓
React context/props passed to ExperienceDesignerLayout
  ↓
ExperienceDesignerLayout passes to child routes
  ↓
Both Collect and Generate tabs receive same experience data
  ↓
Save mutations update Firestore
  ↓
onSnapshot triggers re-render with new data
```

**Data Sources**:
- Experience document: Firestore realtime listener in parent route loader
- Mutations: TanStack Query mutations (via `useUpdateDraftSteps`, `usePublishExperience`)

---

## Validation Rules

### 1. Route Validation

**Collect Route Search Params**:
- `step`: Optional string (no format validation)
- Invalid step ID: Silently ignored (no step selected)

**Generate Route**:
- No search params defined (ignores all query params)

### 2. Step Type Validation

**Removed**:
- `transform.pipeline` step type no longer valid
- Validation logic in `step-validation.ts` removes transform.pipeline checks

**Remaining Valid Types**:
- `info.text`
- `input.text`
- `input.rating`
- `capture.photo`
- `capture.video`

---

## Relationships

### 1. Experience → Steps (One-to-Many)

**Relationship**: An experience has many steps in its `draft.steps` array

**Cardinality**: 1:N (one experience, many steps)

**Constraints**:
- Steps must be one of: info, input, capture (transform.pipeline removed)
- Step order defined by array position
- Step IDs must be unique within experience

### 2. Experience → Transform Config (One-to-One)

**Relationship**: An experience has one optional transform configuration

**Cardinality**: 1:0..1 (one experience, zero or one transform config)

**Location**: `experience.draft.transform` (nullable)

**Note**: This supersedes the removed AI transform step functionality

---

## Summary

This feature makes minimal data model changes:
- **New**: Tab configuration (static frontend state)
- **Modified**: Step schema (remove transform.pipeline from discriminated union)
- **Removed**: Transform pipeline step schema (frontend step type only, backend untouched)
- **Unchanged**: Experience document structure, step selection state management, Zustand stores

All data flows remain consistent with existing patterns. The primary changes are routing-based (URL structure) rather than data-based.
