# Research Findings: Loading State Editor

**Date**: 2026-01-28
**Feature**: Loading State Editor for Share Screen

## Overview

This document consolidates research findings from investigating the existing share screen editor architecture. All unknowns from the Technical Context have been resolved through codebase exploration.

---

## 1. Auto-Save Patterns

### Decision
Reuse existing `useAutoSave` hook with 2000ms debounce for both ready and loading state forms.

### Rationale
- Proven pattern used across all project config editors
- Handles change detection via deep comparison with normalization
- Triggers form validation before save
- Automatically cleans up pending timers on unmount
- Converts empty strings to null for consistent storage

### Implementation Notes
- Create second `useAutoSave` instance for loading form (independent lifecycle)
- Both hooks use same debounce timing (2000ms) for consistency
- Each form gets its own `onUpdate` callback pointing to respective mutation
- Auto-save handles null/undefined normalization automatically

### Existing Pattern
```typescript
useAutoSave({
  form: shareReadyForm,
  originalValues: currentShareReady,
  onUpdate: async () => {
    const fullShare = shareReadyForm.getValues()
    await updateShareReady.mutateAsync(fullShare)
  },
  fieldsToCompare: ['title', 'description', 'cta'],
  debounceMs: 2000,
})
```

### Edge Cases Handled
- **Pending save during tab switch**: Auto-save completes before state change (current behavior, no special handling needed)
- **Rapid typing**: Debounce resets on each keystroke, only saves after 2s of inactivity
- **Unmount with pending save**: Timer cancelled, save does not fire

---

## 2. Preview Shell Header Extension

### Decision
Add optional `headerSlot?: React.ReactNode` prop to PreviewShell for custom header content.

### Rationale
- Non-breaking change (optional prop with undefined default)
- Follows React render props pattern
- Maintains existing header layout (viewport switcher, fullscreen remain)
- Clean separation: slot for custom content, props for built-in controls

### Implementation Notes
- Render `headerSlot` before viewport switcher in header
- Use flexbox gap for spacing (existing pattern)
- No conditional logic needed (React renders nothing for undefined)

### Existing Header Structure
```typescript
<div className="border-b border-border px-4 py-2 flex items-center gap-4">
  {/* Future: headerSlot renders here */}
  {enableViewportSwitcher && <ViewportSwitcher />}
  {enableFullscreen && <FullscreenToggle />}
</div>
```

### Accessibility Considerations
- Header remains a single landmark (`role="banner"` if added)
- Tab order: custom slot content → viewport switcher → fullscreen toggle
- No ARIA changes needed

---

## 3. Multiple Forms in Container

### Decision
Create separate React Hook Form instances for ready state and loading state with independent auto-save lifecycles.

### Rationale
- **Independent validation**: Each form validates its own fields
- **Independent change tracking**: `useWatch` on each form tracks changes separately
- **Independent auto-save**: Each form triggers its own mutation
- **Simpler state management**: No need to merge form states

### Implementation Notes
```typescript
// Ready form
const shareReadyForm = useForm<ShareReadyConfig>({
  defaultValues: currentShareReady,
  values: currentShareReady, // Sync with server
})

// Loading form
const shareLoadingForm = useForm<ShareLoadingConfig>({
  defaultValues: currentShareLoading,
  values: currentShareLoading, // Sync with server
})

// Watch both forms
const watchedReady = useWatch({ control: shareReadyForm.control })
const watchedLoading = useWatch({ control: shareLoadingForm.control })
```

### Form Values Sync
- `values` prop keeps form in sync with server state (TanStack Query updates)
- No manual `form.reset()` needed when server data changes
- Form resets to server state on query refetch

---

## 4. Schema Migration Strategy

### Decision
Export both old (`shareConfigSchema`) and new (`shareReadyConfigSchema`) schema names temporarily with deprecation warning.

### Rationale
- **Non-breaking**: Existing imports continue working
- **Gradual migration**: Codebase can update imports over time
- **Clear deprecation path**: JSDoc warns developers
- **No backend impact**: Functions use schemas, not schema variable names

### Implementation Notes
```typescript
// New primary export
export const shareReadyConfigSchema = z.object({ ... })

// Backward compatibility (deprecated)
/** @deprecated Use shareReadyConfigSchema instead */
export const shareConfigSchema = shareReadyConfigSchema

// Types
export type ShareReadyConfig = z.infer<typeof shareReadyConfigSchema>
export type ShareConfig = ShareReadyConfig // Alias for backward compat
```

### Migration Timeline
1. **This PR**: Add new name, keep old name as alias
2. **Future PR**: Update all imports to new name
3. **Later PR**: Remove old name (breaking change)

---

## 5. Skeleton Loader Component

### Decision
Use shadcn/ui `Skeleton` component for loading state preview.

### Rationale
- Already available in `@/ui-kit/components/skeleton`
- Accessible by default (no custom ARIA needed)
- Matches existing loading patterns across app
- Supports Tailwind classes for sizing/styling

### Implementation Notes
```typescript
import { Skeleton } from '@/ui-kit/components/skeleton'

// Loading preview media placeholder
<Skeleton className="w-full aspect-square max-w-md mb-6 rounded-lg" />
```

### Styling
- Use `aspect-square` to match media aspect ratio
- Use `max-w-md` to match preview content width
- Use `rounded-lg` to match media border radius
- Skeleton uses theme colors automatically (muted foreground)

### Accessibility
- Skeleton has no interactive elements (no ARIA needed)
- Screen readers skip skeleton (decorative only)
- Loading state communicated via title/description text

---

## 6. Firestore Null Handling

### Decision
Store `null` for empty fields (not empty strings or undefined).

### Rationale
- **Consistent with existing patterns**: All share config fields use null
- **Firestore best practice**: null is explicit, undefined deletes field
- **Auto-normalized**: `useAutoSave` converts empty strings to null
- **Type-safe**: Zod schema accepts `string | null`

### Implementation Notes
- Fields default to `null` in schema: `.nullable().default(null)`
- useAutoSave normalization: `'' → null`, `null → null`, `undefined → null`
- Display logic: `title || 'Default Title'` (falsy coalescing)

### Empty String Handling
```typescript
// User clears field → onChange receives ''
onChange={(e) => onShareLoadingUpdate({ title: e.target.value || null })}

// Auto-save normalizes before save
getChangedFields() // Converts '' to null internally
```

---

## 7. Save State Management

### Decision
Wrap both `useUpdateShareReady` and `useUpdateShareLoading` mutations with `useTrackedMutation` to track save state globally.

### Rationale
- **Global indicator**: Single save status indicator tracks all pending saves
- **Existing pattern**: All project config mutations wrapped
- **Proper lifecycle**: Tracks pending→idle transitions
- **User feedback**: Shows spinner while any save is in progress

### Implementation Notes
```typescript
// In useUpdateShareLoading.ts
export function useUpdateShareLoading(projectId: string) {
  const mutation = useProjectConfigMutation(projectId, ['shareLoading'])
  return useTrackedMutation(mutation) // Tracks pending saves
}
```

### Save Indicator Behavior
- `pendingSaves > 0` → Show spinner
- `pendingSaves === 0 && lastCompletedAt recent` → Show checkmark (3s)
- `pendingSaves === 0 && lastCompletedAt stale` → Hide indicator

### Multiple Pending Saves
- Ready form save + loading form save → `pendingSaves = 2`
- Indicator shows spinner until both complete
- Counter decrements as each save completes

---

## 8. State Tab Component Choice

### Decision
Use shadcn/ui `Tabs` component for state switcher (Ready | Loading).

### Rationale
- Accessible by default (ARIA tabs pattern)
- Keyboard navigation (arrow keys, tab, enter)
- Controlled component (fits existing patterns)
- Styled to match app design system

### Implementation Notes
```typescript
import { Tabs, TabsList, TabsTrigger } from '@/ui-kit/components/tabs'

<Tabs value={previewState} onValueChange={(v) => setPreviewState(v)}>
  <TabsList>
    <TabsTrigger value="ready">Ready</TabsTrigger>
    <TabsTrigger value="loading">Loading</TabsTrigger>
  </TabsList>
</Tabs>
```

### Accessibility Features
- `role="tablist"` on TabsList
- `role="tab"` on each TabsTrigger
- `aria-selected="true"` on active tab
- Keyboard navigation built-in

---

## 9. Preview State Synchronization

### Decision
Single `previewState` variable controls both preview and config panel display.

### Rationale
- **Single source of truth**: No state mismatch possible
- **Simple mental model**: Tab selection = preview + panel
- **No additional state**: No need to track panel state separately
- **Immediate feedback**: Click tab → both update instantly

### Implementation Pattern
```typescript
const [previewState, setPreviewState] = useState<'ready' | 'loading'>('ready')

// Tabs control state
<Tabs value={previewState} onValueChange={setPreviewState}>

// Preview reads state
<SharePreview previewState={previewState} />

// Config panel reads state
{previewState === 'ready' ? <ReadyPanel /> : <LoadingPanel />}
```

### Default State
- Start with `'ready'` (existing behavior)
- Matches current share editor (no loading tab yet)
- Users must explicitly switch to loading state

---

## 10. Component Naming Conventions

### Decision
- `ShareReadyConfigPanel` (renamed from ShareConfigPanel)
- `ShareLoadingConfigPanel` (new)
- `useUpdateShareReady` (renamed from useUpdateShare)
- `useUpdateShareLoading` (new)

### Rationale
- **Explicit naming**: Clear which state each component handles
- **Consistent pattern**: `Share{State}ConfigPanel`, `useUpdateShare{State}`
- **No ambiguity**: "ShareConfigPanel" was unclear which state
- **File naming**: Matches component name exactly

### File Naming
```
components/
  ShareReadyConfigPanel.tsx   # Component + file name match
  ShareLoadingConfigPanel.tsx # Component + file name match

hooks/
  useUpdateShareReady.ts      # Hook + file name match
  useUpdateShareLoading.ts    # Hook + file name match
```

---

## Summary of Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| **Auto-Save** | Reuse existing useAutoSave (2000ms) | Proven pattern, handles edge cases |
| **Preview Shell** | Add headerSlot prop | Non-breaking, follows render props pattern |
| **Form Management** | Separate React Hook Form instances | Independent validation and auto-save |
| **Schema Migration** | Export both old and new names | Non-breaking, gradual migration |
| **Skeleton Loader** | Use shadcn/ui Skeleton | Already available, accessible |
| **Null Handling** | Store null for empty fields | Consistent with existing patterns |
| **Save Tracking** | Wrap mutations with useTrackedMutation | Global save indicator |
| **State Tabs** | Use shadcn/ui Tabs | Accessible, keyboard navigation |
| **State Sync** | Single previewState variable | Simple, no state mismatch |
| **Naming** | `Share{State}ConfigPanel` pattern | Explicit, consistent |

All research tasks complete. No unknowns remain. Ready for Phase 1 (Design & Contracts).
