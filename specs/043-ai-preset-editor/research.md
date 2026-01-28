# Research: AI Preset Editor - Configuration

**Branch**: `043-ai-preset-editor` | **Date**: 2025-01-26

## Research Overview

This document captures research findings for implementing the AI Preset Editor configuration page. All NEEDS CLARIFICATION items have been resolved through codebase exploration and technical analysis.

---

## 1. Existing Editor Patterns

### ExperienceDesignerLayout Pattern

**Location**: `apps/clementine-app/src/domains/experience/designer/containers/ExperienceDesignerLayout.tsx`

**Key Features**:
- Full-height flex layout (`h-screen flex-col`)
- TopNavBar with breadcrumbs, left content, and right actions
- Breadcrumb with icon linking to list + entity badge (editable)
- Right section: EditorSaveStatus, EditorChangesBadge, action buttons
- Content area fills remaining space
- **Location**: In `containers/` folder (orchestrates state, not presentational)

**Pattern to Adopt**:
```tsx
<div className="flex h-screen flex-col">
  <TopNavBar
    breadcrumbs={[
      { label: <EditableNameBadge />, icon: Sparkles, iconHref: listPath }
    ]}
    right={
      <>
        <EditorSaveStatus pendingSaves={} lastCompletedAt={} />
        <Button>Save</Button>
      </>
    }
  />
  <MainContent />
</div>
```

**Decision**: Follow ExperienceDesignerLayout pattern exactly, substituting Publish for Save button and omitting EditorChangesBadge (no publish workflow for presets). Place `AIPresetEditorLayout` in `containers/` folder to match the pattern.

---

## 2. Save State Management

### createEditorStore Factory

**Location**: `apps/clementine-app/src/shared/editor-status/store/createEditorStore.ts`

**Pattern**:
```typescript
export function createEditorStore() {
  return create<EditorStore>((set) => ({
    pendingSaves: 0,
    lastCompletedAt: null,
    startSave: () => set((state) => ({ pendingSaves: state.pendingSaves + 1 })),
    completeSave: () => set((state) => ({
      pendingSaves: Math.max(0, state.pendingSaves - 1),
      lastCompletedAt: newCount === 0 ? Date.now() : state.lastCompletedAt
    })),
    resetSaveState: () => set({ pendingSaves: 0, lastCompletedAt: null }),
  }))
}
```

### useTrackedMutation Hook

**Location**: `apps/clementine-app/src/shared/editor-status/hooks/useTrackedMutation.ts`

**Pattern**:
- Wraps TanStack Query mutation result
- Detects state transitions (isPending: false→true, true→false)
- Calls startSave/completeSave automatically
- Returns mutation unchanged (passthrough)

**Decision**: Create `useAIPresetEditorStore = createEditorStore()` in editor subdomain. Wrap update mutation with useTrackedMutation.

---

## 3. Auto-Save Pattern

### useAutoSave Hook

**Location**: `apps/clementine-app/src/shared/forms/hooks/useAutoSave.ts`

**Features**:
- Takes React Hook Form instance
- Compares current values with originalValues
- Uses getChangedFields() for deep comparison
- Debounced (configurable, default 300ms)
- Only triggers onUpdate if changes detected
- Returns triggerSave function for manual triggering

**Usage Pattern**:
```tsx
const { triggerSave } = useAutoSave({
  form,
  originalValues: preset,
  onUpdate: async (updates) => { await updatePreset.mutateAsync(updates) },
  fieldsToCompare: ['name', 'model', 'aspectRatio', 'promptTemplate'],
})

return <form onBlur={triggerSave}>...</form>
```

**Decision**: Use useAutoSave for form sections. For complex nested updates (variables, media), use direct mutation calls with debouncing.

---

## 4. Form Field Components

### Available Components

**Location**: `apps/clementine-app/src/shared/editor-controls/components/`

| Component | Use Case |
|-----------|----------|
| TextField | Single-line text input with character counter |
| TextareaField | Multi-line text with rows/max |
| SelectField | Dropdown select with options |
| SliderField | Numeric range slider |
| ToggleGroupField | Toggle button group |
| ColorPickerField | Color selection with palette |
| MediaPickerField | Single media upload with preview (drag-drop + click) |

**Pattern**:
- All use EditorRow wrapper
- Consistent label positioning (above input)
- Support disabled prop
- Character counters where applicable

**Decision**: Use SelectField for Model and Aspect Ratio. Use TextField for variable names/labels. Build custom components for media registry, variables, and prompt editor. Note: MediaPickerField is for single image uploads - not suitable for multi-image library browsing.

---

## 5. Media Library Integration

### Current State

**MediaPickerField** (`src/shared/editor-controls/components/MediaPickerField.tsx`):
- Handles **single file upload** only (drag-drop + click)
- No "browse from library" functionality
- Shows preview, replace, remove actions
- **Use case**: Inline single image field (e.g., background image)

**Media Library Domain** (`src/domains/media-library/`):
- Services for upload only (`useUploadMediaAsset`)
- Types re-exported from @clementine/shared
- No UI components for browsing/selecting
- Small domain - flat structure, no subdomains

### Decision: Simplified Upload-Only Approach

**Rationale**: Keep AI Preset Editor scope focused. Full "browse from library" functionality is a separate feature with its own PRD (see `requirements/ai-presets/media-library-picker-prd.md`).

**Approach for AI Preset Editor**:
- Create `AddMediaDialog` component in ai-presets/editor/components/
- Dialog contains `MediaPickerField` for upload + name input field
- User uploads image, provides reference name, adds to registry
- Same pattern as other editors in the codebase

**Future Enhancement** (separate feature):
- Full Media Library Picker with browse, search, pagination
- Will be implemented in `domains/media-library/` when needed
- AI Preset Editor can integrate picker later via simple component swap

**MediaPickerField Usage**:
| Field | Value |
|-------|-------|
| Component | MediaPickerField |
| Purpose | Upload single image for media registry |
| Location | Inside AddMediaDialog |
| Returns | URL string + file path |

---

## 6. Rich Text / @Mention Implementation

### Current State

**No existing implementation** of rich text editors or @mention autocomplete in the codebase.

### Options Evaluated

| Option | Pros | Cons |
|--------|------|------|
| Slate.js | Full-featured, React-native, good plugin ecosystem | Heavy (50KB+), complex setup, overkill for @mentions |
| TipTap | Modern, modular, good React support | Heavy, requires extension setup, overkill |
| Custom contentEditable | Lightweight, no dependencies, full control | More work, need to handle cursor/selection manually |
| Textarea with post-processing | Simplest, no special rendering | No visual pills, poor UX |

### Research: contentEditable @Mention Pattern

**Core approach**:
1. Use contentEditable div with data attributes
2. Track cursor position and detect @ character
3. Show autocomplete dropdown on @ trigger
4. Insert non-editable span (pill) on selection
5. Serialize to string format (e.g., `Hello @{variable:name}`) for storage
6. Parse and render on load

**Key challenges**:
- Cursor positioning after pill insertion
- Handling backspace/delete on pill boundaries
- Serialization/deserialization consistency
- Accessibility (keyboard navigation in autocomplete)

**Decision**: Implement custom contentEditable solution:
- `PromptTemplateEditor` - main editor component
- `MentionAutocomplete` - dropdown with suggestions
- Serialize to format: `Create image of @{var:subject} in @{media:style_ref} style`
- Parse format on load, render as pills

---

## 7. AI Preset Schemas

### Existing Schemas

**Location**: `packages/shared/src/schemas/ai-preset/`

| Schema | Purpose |
|--------|---------|
| `aiPresetSchema` | Main preset document |
| `presetVariableSchema` | Discriminated union (text/image) |
| `presetMediaEntrySchema` | Media registry entry |
| `valueMappingEntrySchema` | Value→text mapping |

### Key Fields

```typescript
// AIPreset
{
  id: string
  name: string (1-100 chars)
  description: string | null
  status: 'active' | 'deleted'
  mediaRegistry: PresetMediaEntry[]
  variables: PresetVariable[]
  promptTemplate: string
  model: 'gemini-2.5-flash' | 'gemini-2.5-pro' | 'gemini-3.0'
  aspectRatio: '1:1' | '3:2' | '2:3' | '9:16' | '16:9'
  // timestamps, createdBy
}

// PresetVariable (discriminated union)
TextVariable: { type: 'text', name, defaultValue, valueMap }
ImageVariable: { type: 'image', name }

// PresetMediaEntry
{ mediaAssetId, url, filePath, name }
```

**Decision**: Use existing schemas. Create editor-specific input schemas for partial updates.

---

## 8. Real-Time Data Pattern

### Existing Pattern (from useWorkspaceAIPresets)

```typescript
// Set up real-time listener
useEffect(() => {
  const unsubscribe = onSnapshot(docRef, (snapshot) => {
    const data = convertFirestoreDoc(snapshot, schema)
    queryClient.setQueryData(queryKey, data)
  })
  return () => unsubscribe()
}, [dependencies])

// Query for fallback/initial load
return useQuery({
  queryKey,
  queryFn: fetchOnce,
  staleTime: Infinity,
  refetchOnWindowFocus: false,
})
```

**Decision**: Create `useAIPreset(workspaceId, presetId)` hook with single-document real-time subscription. Same pattern as list but for single document.

---

## 9. Update Mutation Pattern

### Existing Pattern (from useRenameAIPreset)

```typescript
useMutation({
  mutationFn: async (input) => {
    const validated = schema.parse(input)
    return await runTransaction(firestore, async (transaction) => {
      const presetRef = doc(firestore, path)
      const snapshot = await transaction.get(presetRef)
      if (!snapshot.exists()) throw new Error('Preset not found')
      transaction.update(presetRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      })
      return { presetId, workspaceId }
    })
  },
  onSuccess: () => queryClient.invalidateQueries(queryKey),
  onError: (error) => Sentry.captureException(error, { tags })
})
```

**Decision**: Create `useUpdateAIPreset` mutation that accepts partial updates. Use same transaction pattern for consistency.

---

## Summary of Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| Layout location | `containers/` folder | Matches ExperienceDesignerLayout pattern |
| Save State | createEditorStore + useTrackedMutation | Reuse existing infrastructure |
| Auto-Save | useAutoSave hook | Handles debouncing, field comparison |
| Model/Aspect Ratio | SelectField components | Existing UI components |
| Media Registry | Upload-only via AddMediaDialog | Keep scope focused, ship faster |
| Media Library Picker | Deferred to separate feature | DDD: separate PRD in requirements/ |
| MediaPickerField | Reuse for simplified upload | Same pattern as other editors |
| Prompt Editor | Custom contentEditable | Lightweight, no heavy dependencies |
| Data Hooks | useAIPreset + useUpdateAIPreset | Real-time + partial updates |
| Schemas | Use existing + add editor inputs | Type safety maintained |
