# Research: Event Theme Editor

**Feature**: 015-event-theme-editor
**Date**: 2026-01-07

## Research Summary

All unknowns have been resolved through codebase exploration. This document consolidates findings from the research phase.

---

## 1. Theme Schema Location & Structure

**Decision**: Use existing schema at `@/shared/theming/schemas/theme.schemas.ts`

**Rationale**:
- Schema already exists and is well-defined with Zod validation
- Includes hex color regex validation (`/^#[0-9A-Fa-f]{6}$/`)
- Provides both full `themeSchema` and partial `updateThemeSchema` for updates
- Nested structure for text, button, and background settings

**Alternatives considered**:
- Creating a new schema: Rejected - existing schema matches requirements exactly
- Extending schema: Not needed - current schema covers all spec fields

**File location**: `/apps/clementine-app/src/shared/theming/schemas/theme.schemas.ts`

---

## 2. Auto-Save Implementation Pattern

**Decision**: Use existing `useAutoSave` hook from `@/shared/forms/hooks/useAutoSave.ts`

**Rationale**:
- Already implemented and battle-tested in SharingSection
- Integrates with React Hook Form
- Provides configurable debounce (default 300ms)
- Uses intelligent change detection via `getChangedFields()` utility
- Only persists actual changes, not full form state

**Pattern details**:
```typescript
const { triggerSave } = useAutoSave({
  form,                    // React Hook Form instance
  originalValues,          // Data to compare against
  onUpdate: async (updates) => { /* persist */ },
  fieldsToCompare: [...],  // Which fields to watch
  debounceMs: 300,         // Debounce delay
})
```

**Alternatives considered**:
- Manual debounce implementation: Rejected - reinventing the wheel
- Real-time save without debounce: Rejected - too many API calls

---

## 3. Tracked Mutation Integration

**Decision**: Use existing `useTrackedMutation` hook from `@/domains/event/designer/hooks/useTrackedMutation.ts`

**Rationale**:
- Wraps TanStack Query mutations transparently
- Tracks mutation state transitions for save indicator UI
- Integrates with `useEventDesignerStore` for pending/completed state
- Returns original mutation unchanged (passthrough pattern)

**Pattern details**:
```typescript
const mutation = useMutation({ ... })
return useTrackedMutation(mutation)
```

**Store integration**:
- `startSave()` - called on idle → pending transition
- `completeSave()` - called on pending → idle transition
- `pendingSaves` - counter for active mutations
- `lastCompletedAt` - timestamp for last completed save

---

## 4. Preview Shell Component Usage

**Decision**: Use existing `PreviewShell` component from `@/shared/preview-shell/`

**Rationale**:
- Already provides viewport switching (mobile/desktop)
- Includes fullscreen support
- Uses Zustand for viewport persistence across session
- Provides ViewportContext to children for responsive preview

**Props interface**:
```typescript
interface PreviewShellProps {
  children: React.ReactNode
  enableViewportSwitcher?: boolean
  enableFullscreen?: boolean
  viewportMode?: ViewportMode
  onViewportChange?: (mode: ViewportMode) => void
  className?: string
}
```

**Alternatives considered**:
- Building custom preview wrapper: Rejected - PreviewShell handles all requirements

---

## 5. Media Upload Pattern

**Decision**: Use existing `useUploadMediaAsset` hook from `@/domains/media-library/hooks/useUploadMediaAsset.ts`

**Rationale**:
- Handles Firebase Storage upload with progress tracking
- Creates Firestore document for media asset
- Returns `{ mediaAssetId, url }` for theme update
- Validates file type and size

**Upload flow**:
1. Validate file
2. Extract image dimensions
3. Generate unique filename
4. Upload to Firebase Storage with progress
5. Get download URL
6. Create Firestore document
7. Return mediaAssetId and url

**Composite hook pattern**:
```typescript
export function useUploadAndUpdateBackground(projectId, eventId, workspaceId, userId) {
  const uploadAsset = useUploadMediaAsset(workspaceId, userId)
  const updateTheme = useUpdateTheme(projectId, eventId)

  return useMutation({
    mutationFn: async ({ file, onProgress }) => {
      const { mediaAssetId, url } = await uploadAsset.mutateAsync({ file, onProgress })
      await updateTheme.mutateAsync({ background: { image: url } })
      return { mediaAssetId, url }
    },
  })
}
```

---

## 6. Color Picker Implementation

**Decision**: Native `<input type="color" />` with custom hex input in shadcn Popover

**Rationale**:
- No additional dependency required
- Native picker returns hex directly (no conversion needed)
- Custom hex input for precise values
- Two-way sync on change (real-time preview)
- Consistent with project principle of minimal dependencies

**Implementation approach**:
```tsx
<Popover>
  <PopoverTrigger>
    <div className="..." style={{ backgroundColor: value }} /> {/* Color circle */}
  </PopoverTrigger>
  <PopoverContent>
    <input type="color" value={value} onChange={...} />
    <Input value={value} onChange={...} /> {/* Hex input */}
    {nullable && <Button onClick={() => onChange(null)}>Clear</Button>}
  </PopoverContent>
</Popover>
```

**Hex validation**: `/^#[0-9A-Fa-f]{6}$/` (from existing theme schema)

**Alternatives considered**:
- react-colorful: Rejected - adds unnecessary dependency
- @radix-ui/colors: Not a color picker, just color palettes
- Custom HSL picker: Over-engineered for hex-only requirements

---

## 7. Editor Controls Architecture

**Decision**: Create shared module at `@/shared/editor-controls/`

**Rationale**:
- Reusable across multiple editors (theme, welcome, settings)
- Generic components with no business logic
- Follows project structure standard for shared code used by 2+ domains
- Could be extracted to npm package in future

**Component list**:
| Component | Purpose | shadcn/Radix Base |
|-----------|---------|-------------------|
| `EditorSection` | Collapsible section | Collapsible |
| `EditorRow` | Label + control layout | Custom (CSS Grid) |
| `ColorPickerField` | Color picker | Popover + Input |
| `SelectField` | Dropdown select | Select |
| `ToggleGroupField` | Toggle group | ToggleGroup |
| `SliderField` | Slider with display | Slider |
| `MediaPickerField` | Media upload | Custom + FileInput |

---

## 8. Form State Management

**Decision**: React Hook Form with Zod validation

**Rationale**:
- Consistent with existing patterns in codebase
- Integrates well with `useAutoSave` hook
- `useWatch` for real-time preview updates
- Clean separation of form state and persistence
- Zod resolver for type-safe validation

**Pattern**:
```typescript
const form = useForm({
  resolver: zodResolver(themeSchema),
  defaultValues: event.draftConfig?.theme ?? defaultTheme,
})

const watchedTheme = useWatch({ control: form.control })

useAutoSave({
  form,
  originalValues: event.draftConfig?.theme ?? defaultTheme,
  onUpdate: async (updates) => {
    await updateTheme.mutateAsync(updates)
  },
  fieldsToCompare: [...themeFields],
})
```

---

## 9. Route Structure

**Decision**: Create route at `/workspace/$workspaceSlug/projects/$projectId/events/$eventId/theme`

**Rationale**:
- Consistent with existing event designer routes (welcome, settings)
- Theme tab already configured in EventDesignerSidebar
- Uses TanStack Router file-based routing pattern

**Route file**: `workspace.$workspaceSlug.projects.$projectId.events.$eventId.theme.tsx`

**Container import**: `ThemeEditorPage` from `@/domains/event/theme/containers/ThemeEditorPage`

---

## 10. Design System Compliance

**Decision**: Use theme tokens for all styling, no hard-coded colors

**Rationale**:
- Required by `standards/frontend/design-system.md`
- Ensures dark mode compatibility
- Maintains visual consistency

**Key rules**:
- Use `bg-primary`, `text-foreground`, etc. - never `bg-blue-500`
- Pair background with foreground tokens
- Use opacity modifiers for subtle variants

**Exception for theme editor**:
- ThemePreview component MUST display user-selected colors
- These are applied via inline styles, not design system tokens
- This is intentional - preview shows the guest-facing theme, not admin UI

---

## Resolved Unknowns

| Unknown | Resolution |
|---------|------------|
| Theme schema location | `@/shared/theming/schemas/theme.schemas.ts` |
| Auto-save pattern | `useAutoSave` hook with 300ms debounce |
| Mutation tracking | `useTrackedMutation` wrapper hook |
| Preview component | `PreviewShell` with viewport switching |
| Media upload | `useUploadMediaAsset` + composite hook |
| Color picker | Native `<input type="color">` + hex input |
| Editor controls location | `@/shared/editor-controls/` |
| Form state | React Hook Form + Zod resolver |
| Route pattern | Nested under event designer layout |
| Design system | Tokens for admin UI, inline for preview |

All NEEDS CLARIFICATION items have been resolved. Ready for Phase 1 design.
