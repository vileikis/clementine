# Research: Transform Pipeline Editor

**Phase**: 0 (Outline & Research)
**Date**: 2026-01-31
**Status**: Complete

## Overview

This document captures research findings for implementing the Transform Pipeline Editor (Phase 1b-2 from the Inline Prompt Architecture plan). The research focuses on understanding existing schemas, auto-save patterns, and UI component patterns to ensure consistency with the codebase.

---

## 1. Schema Structure Analysis

### Decision: Use Existing Phase 1a Schemas

**Rationale**: Phase 1a is complete with comprehensive schemas already defined in `packages/shared`. These schemas provide all necessary validation and types for AI Image nodes.

**Alternatives Considered**: Create new schemas → Rejected because Phase 1a already provides complete schema definitions with proper validation.

### AI Image Node Configuration

**File**: `packages/shared/src/schemas/experience/nodes/ai-image-node.schema.ts`

**Structure**:
```typescript
aiImageNodeConfigSchema = {
  model: 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview',  // Required
  aspectRatio: '1:1' | '3:2' | '2:3' | '9:16' | '16:9',             // Required
  prompt: string (min 1 char, required),                             // Supports @{step:name}, @{ref:mediaAssetId}
  refMedia: mediaReferenceSchema[]                                   // Required but can be empty
}
```

**Key Constraints**:
- Prompt is required (cannot be empty)
- Model is constrained to 2 Gemini variants
- Aspect ratio has 5 valid options
- RefMedia array required but can be `[]`

### Transform Configuration

**File**: `packages/shared/src/schemas/experience/transform.schema.ts`

**Structure**:
```typescript
transformConfigSchema = {
  nodes: transformNodeSchema[],     // Array of pipeline nodes
  outputFormat: {                   // Optional post-processing
    aspectRatio: '1:1' | '9:16' | '3:2' | '2:3' | null,
    quality: number (0-100) | null
  } | null
}

transformNodeSchema = {
  id: string,                       // Unique node identifier
  type: string,                     // e.g., 'ai.imageGeneration'
  config: Record<string, unknown>   // Polymorphic config (aiImageNodeConfig for AI Image nodes)
}
```

**Key Constraints**:
- Nodes use `looseObject` schema for extensibility
- Node config is polymorphic (generic Record)
- OutputFormat is nullable (optional)
- Uses dot notation for Firestore updates

### Media Reference

**File**: `packages/shared/src/schemas/media/media-reference.schema.ts`

**Structure**:
```typescript
mediaReferenceSchema = {
  mediaAssetId: string,            // Required unique ID
  url: string,                     // Required public URL
  filePath: string | null,         // Optional storage path
  displayName: string              // Default: 'Untitled'
}
```

**Key Constraints**:
- URL must be valid URL format (Zod `.url()` validator)
- FilePath nullable for backward compatibility
- DisplayName always has value for UI

---

## 2. Auto-Save & Draft Update Patterns

### Decision: Use Shared Auto-Save Hook with 2000ms Debounce

**Rationale**: The codebase has a proven `useAutoSave` hook used across experience designer, theme editor, and welcome screen editor. This provides consistent UX and handles form validation, change detection, and debouncing.

**Alternatives Considered**:
- Custom debounce implementation → Rejected for consistency and code reuse
- No debounce (immediate save) → Rejected because this is for continuous editing (not discrete operations like add/delete)

### Pattern: Shared `useAutoSave` Hook

**File**: `apps/clementine-app/src/shared/forms/hooks/useAutoSave.ts`

**Usage**:
```typescript
const { triggerSave } = useAutoSave({
  form,                                 // react-hook-form instance
  originalValues: step?.config ?? {},   // Compare against original
  onUpdate: async () => {
    await updateDraft.mutateAsync({
      workspaceId,
      experienceId: experience.id,
      draft: { ...experience.draft, transform },
    })
  },
  fieldsToCompare: ['prompt', 'model'], // Optional selective comparison
  debounceMs: 2000,                     // Standard 2-second debounce
})
```

**Features**:
- Validates form before saving (`form.trigger()`)
- Only saves if changes detected (compares fields)
- Normalizes empty strings to null
- Cleanup of debounce timers on unmount

### Pattern: Experience Draft Update Hook

**File**: `apps/clementine-app/src/domains/experience/designer/hooks/useUpdateExperienceDraft.ts`

**Usage**:
```typescript
const updateDraft = useUpdateExperienceDraft()
await updateDraft.mutateAsync({
  workspaceId: experience.workspaceId,
  experienceId: experience.id,
  draft: { ...experience.draft, transform: newTransformConfig },
})
```

**Features**:
- Uses Firestore `runTransaction()` for atomicity
- Increments `draftVersion` for optimistic conflict detection
- Sets `updatedAt: serverTimestamp()`
- Invalidates TanStack Query cache on success
- Captures errors to Sentry with domain tags

### Pattern: Nested Field Update Helper

**File**: `apps/clementine-app/src/domains/experience/shared/lib/updateExperienceConfigField.ts`

**Usage**:
```typescript
await updateExperienceConfigField(workspaceId, experienceId, {
  transform: newTransformConfig,
  // Can update multiple fields atomically
})
```

**Features**:
- Converts to Firestore dot notation automatically
- Wraps in transaction for atomic multi-field updates
- Always increments draftVersion
- Sets server timestamp

---

## 3. Save Status Indicator Pattern

### Decision: Use Shared Editor Save Status Component

**Rationale**: Consistent save status feedback across all editors (experience designer, theme editor, welcome editor). Provides accessible, visually clear feedback.

**Alternatives Considered**: Custom status indicator → Rejected for consistency.

### Pattern: Editor Save Status Component

**File**: `apps/clementine-app/src/shared/editor-status/components/EditorSaveStatus.tsx`

**Usage**:
```tsx
<EditorSaveStatus
  pendingSaves={store.pendingSaves}
  lastCompletedAt={store.lastCompletedAt}
  successDuration={3000}
/>
```

**States**:
- **Saving**: Spinner + "Saving changes..." (when `pendingSaves > 0`)
- **Saved**: Green checkmark (shows for 3 seconds after completion)
- **Idle**: Nothing shown

**Accessibility**:
- `role="status"`
- `aria-live="polite"`
- Screen reader labels

### Pattern: Mutation Tracking Hook

**File**: `apps/clementine-app/src/shared/editor-status/hooks/useTrackedMutation.ts`

**Usage**:
```typescript
const baseMutation = useUpdateExperienceDraft()
const store = useGenerateEditorStore() // Created with createEditorStore()
const updateDraft = useTrackedMutation(baseMutation, store)
```

**Features**:
- Automatically calls `store.startSave()` when mutation starts
- Automatically calls `store.completeSave()` when mutation ends
- Tracks pending save count and last completion timestamp
- Works with any TanStack Query mutation

---

## 4. Delete Confirmation Dialog Patterns

### Decision: Use AlertDialog for Delete Confirmations

**Rationale**: AlertDialog provides better semantics for destructive actions and is the established pattern for delete confirmations in the codebase (workspaces, AI presets).

**Alternatives Considered**: Regular Dialog → Rejected because AlertDialog is semantically correct for critical confirmations.

### Pattern: AlertDialog-Based Delete Confirmation

**Reference Files**:
- `apps/clementine-app/src/domains/admin/workspace/components/DeleteWorkspaceDialog.tsx`
- `apps/clementine-app/src/domains/ai-presets/components/DeleteAIPresetDialog.tsx`

**Structure**:
```tsx
<AlertDialog open={open} onOpenChange={onOpenChange}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete Node?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
      <AlertDialogAction
        onClick={handleDelete}
        disabled={isPending}
        className="min-h-[44px]"
      >
        {isPending ? 'Deleting...' : 'Delete'}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Key Features**:
- Controlled state via `open` and `onOpenChange` props
- Parent manages dialog state
- Buttons disabled during deletion (`isPending`)
- Minimum touch target height (`min-h-[44px]`)
- Dialog stays open on error for user to retry

### Pattern: Delete Mutation Hook

**Reference Files**:
- `apps/clementine-app/src/domains/admin/workspace/hooks/useDeleteWorkspace.ts`
- `apps/clementine-app/src/domains/ai-presets/hooks/useDeleteAIPreset.ts`

**Structure**:
```typescript
const deleteNode = useMutation({
  mutationFn: async (nodeId: string) => {
    // Perform deletion operation
    // For nodes: update transform config, remove from array
  },
  onSuccess: () => {
    // Invalidate relevant queries
    queryClient.invalidateQueries({ queryKey: ['experience', experienceId] })
  },
  onError: (error) => {
    // Report to Sentry
    console.error(error)
  },
})
```

**Key Features**:
- Uses TanStack Query `useMutation`
- Validates input with Zod schemas
- Invalidates cache on success
- Reports errors to Sentry
- For entities: soft delete (update status field)
- For nodes: remove from array (hard delete)

---

## 5. UI Component Library Usage

### Decision: Use shadcn/ui + Radix UI Components

**Rationale**: Codebase standard. All UI components built on shadcn/ui and Radix UI primitives for consistency and accessibility.

**Alternatives Considered**: Custom components → Rejected for consistency.

### Components to Use

**From `ui-kit/ui/`**:
- `Button` - All buttons (Add Node, Delete, Close)
- `AlertDialog` - Delete confirmation
- `Card` - Node cards
- `Sheet` - Sidebar panel for node editor
- `Badge` - Node type badge
- `Tooltip` - Hover information

**shadcn/ui Installation**:
```bash
pnpm dlx shadcn@latest add sheet  # If not already installed
```

---

## 6. Node ID Generation

### Decision: Use `nanoid` for Node IDs

**Rationale**: The codebase uses `nanoid` for unique ID generation throughout (steps, experiences, workspaces). Consistent with existing patterns.

**Alternatives Considered**: UUID v4 → Rejected for consistency with codebase.

**Pattern**:
```typescript
import { nanoid } from 'nanoid'

const newNode = {
  id: nanoid(),
  type: 'ai.imageGeneration',
  config: { /* ... */ }
}
```

---

## 7. Mobile-First Considerations

### Decision: Follow Existing Mobile-First Patterns

**Rationale**: Constitution principle I (Mobile-First Design) and codebase standards require mobile-first approach.

**Key Requirements**:
- Minimum touch target: 44x44px (use `min-h-[44px]` Tailwind class)
- Primary viewport: 320px-768px
- Test on real mobile devices before completion
- Use responsive design utilities from Tailwind

**Patterns to Follow**:
- Buttons: `min-h-[44px]` or `h-11` (44px)
- Sheet/Sidebar: Use `Sheet` component with responsive width
- Cards: Full-width on mobile, grid on desktop
- Empty state: Centered with large touch target for "Add Node"

---

## 8. State Management Approach

### Decision: Zustand Store for Selected Node State

**Rationale**: The codebase uses Zustand for local UI state (experience designer store, AI preset editor store). Consistent with existing patterns for managing selected entity state.

**Alternatives Considered**:
- React Context → Rejected because Zustand is the established pattern
- Component state only → Rejected because selected node state needs to be shared

**Pattern**:
```typescript
// stores/useGenerateEditorStore.ts
import { createEditorStore } from '@/shared/editor-status/stores/createEditorStore'

interface GenerateEditorState {
  selectedNodeId: string | null
  setSelectedNodeId: (id: string | null) => void
}

export const useGenerateEditorStore = create<GenerateEditorState & EditorStoreState>()(
  (set) => ({
    // Editor status tracking
    ...createEditorStore(set),
    // Selected node state
    selectedNodeId: null,
    setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  })
)
```

---

## 9. Testing Approach

### Decision: Defer Comprehensive Testing to Phase 1h

**Rationale**: Phase 1h (Testing & Documentation) is dedicated to comprehensive testing. For Phase 1b-2, focus on implementation with basic unit tests for critical logic.

**Testing Strategy**:
- **Now (Phase 1b-2)**: Basic unit tests for hooks (useAddNode, useDeleteNode, useUpdateTransformConfig)
- **Later (Phase 1h)**: Component tests, E2E tests, edge case coverage

**Pattern** (from `domains/ai-presets/preview/`):
- Vitest for unit tests
- Testing Library for component tests
- Mock Firebase client SDK for tests

---

## Summary

All research areas resolved. Key decisions:

1. **Schemas**: Use existing Phase 1a schemas from `packages/shared`
2. **Auto-Save**: Use `useAutoSave` hook with 2000ms debounce
3. **Draft Updates**: Use `useUpdateExperienceDraft` with transaction pattern
4. **Save Status**: Use `EditorSaveStatus` component with tracked mutation
5. **Delete Dialog**: Use `AlertDialog` from Radix UI
6. **UI Components**: Use shadcn/ui + Radix UI (Button, Card, Sheet, Badge, Tooltip)
7. **Node IDs**: Use `nanoid` for unique ID generation
8. **Mobile-First**: 44px touch targets, responsive design, test on devices
9. **State**: Zustand store for selected node state
10. **Testing**: Defer comprehensive testing to Phase 1h

No remaining unknowns. Ready to proceed to Phase 1 (Design & Contracts).
