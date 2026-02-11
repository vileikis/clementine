# Data Model: Experience-to-Share Transition Gap

## No Firestore Schema Changes

This feature does not add or modify any Firestore documents, collections, or schemas.

## Zustand Store Changes

### experienceRuntimeStore — State Shape Update

**Before**:
```typescript
interface ExperienceRuntimeState {
  experienceId: string | null  // ← just the ID
  sessionId: string | null
  projectId: string | null
  steps: ExperienceStep[]
  // ... rest unchanged
}
```

**After**:
```typescript
interface ExperienceRuntimeState {
  experience: Experience | null  // ← full Experience reference
  sessionId: string | null
  projectId: string | null
  steps: ExperienceStep[]
  // ... rest unchanged
}
```

**Fields available via `experience`** (from `@clementine/shared` Experience type):
- `id: string` — replaces `experienceId`
- `name: string` — used by RuntimeTopBar (no longer prop-drilled)
- `status`, `profile`, `media`, `draft`, `published`, `draftVersion`, `publishedVersion` — available for future use

### initFromSession — Signature Change

**Before**: `initFromSession(session: Session, steps: ExperienceStep[], experienceId: string)`
**After**: `initFromSession(session: Session, steps: ExperienceStep[], experience: Experience)`

### useRuntime Hook — API Addition

**New field**: `experienceName: string` — derived from `store.experience?.name ?? 'Experience'`

## Component Interface Changes

### ExperienceRuntimeProps

| Prop | Before | After |
|------|--------|-------|
| `experienceId` | `string` (required) | Removed — derived from `experience.id` |
| `experienceName` | `string` (optional) | Removed — stored in `experience.name` |
| `experience` | N/A | `Experience` (required, new) |
| `onHomeClick` | `() => void` (optional) | Removed — renamed to `onClose` |
| `onClose` | N/A | `() => void` (optional, new) |

### RuntimeTopBarProps

| Prop | Before | After |
|------|--------|-------|
| `experienceName` | `string` (required) | Removed — from store |
| `currentStepIndex` | `number` (required) | Removed — from store |
| `totalSteps` | `number` (required) | Removed — from store |
| `onHomeClick` | `() => void` (optional) | Removed |
| `onBack` | `() => void` (optional) | Removed — from store |
| `onClose` | `() => void` (optional) | Kept — unified exit callback |
| `canGoBack` | `boolean` (optional) | Removed — from store |
| `className` | `string` (optional) | Kept |

### RuntimeNavigationProps

| Prop | Before | After |
|------|--------|-------|
| `onNext` | `() => void` (optional) | Removed — from store |
| `canProceed` | `boolean` (optional) | Removed — from store |
| `buttonLabel` | `string` (optional) | Kept — UI customization |

---

## Phase 2: Completion Error Handling — Data Model Changes

### experienceRuntimeStore — completionError state

**New state field**:
```typescript
interface ExperienceRuntimeState {
  // ... existing fields ...
  completionError: string | null  // Error message from failed completion flow
}
```

**New action**:
```typescript
interface ExperienceRuntimeActions {
  // ... existing actions ...
  setCompletionError: (error: string | null) => void
}
```

**Initial value**: `null`
**Cleared in**: `initFromSession()`, `reset()`, start of `runCompletion()`

### useRuntime Hook — API Addition

**New field**: `completionError: string | null` — read from `store.completionError`

### ExperienceRuntimeProps — onComplete type change

| Prop | Before | After |
|------|--------|-------|
| `onComplete` | `() => void` (optional) | `() => void \| Promise<void>` (optional) |
