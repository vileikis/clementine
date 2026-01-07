# Quickstart: Event Theme Editor

**Feature**: 015-event-theme-editor
**Date**: 2026-01-07

## Overview

This guide provides a rapid onboarding path for implementing the Event Theme Editor feature.

---

## Prerequisites

Before starting implementation:

1. ✅ Ensure you're on the feature branch: `git checkout 015-event-theme-editor`
2. ✅ Install dependencies: `cd apps/clementine-app && pnpm install`
3. ✅ Start dev server: `pnpm dev`
4. ✅ Read the spec: [spec.md](./spec.md)

---

## Implementation Order

Follow this order for optimal dependency flow:

### Phase 1: Shared Editor Controls (~2-3 hours)

**Location**: `apps/clementine-app/src/shared/editor-controls/`

1. **Create module structure**
   ```bash
   mkdir -p src/shared/editor-controls/{components,types}
   ```

2. **Implement components** (in order):
   - `EditorSection.tsx` - Collapsible wrapper using shadcn Collapsible
   - `EditorRow.tsx` - Simple CSS Grid layout
   - `ColorPickerField.tsx` - Popover with native color picker + hex input
   - `SelectField.tsx` - Wrapper around shadcn Select
   - `ToggleGroupField.tsx` - Wrapper around shadcn ToggleGroup
   - `SliderField.tsx` - Wrapper around shadcn Slider
   - `MediaPickerField.tsx` - Upload zone with preview

3. **Create barrel exports**
   - `components/index.ts`
   - `types/index.ts`
   - `index.ts`

### Phase 2: Theme Domain (~2-3 hours)

**Location**: `apps/clementine-app/src/domains/event/theme/`

1. **Create module structure**
   ```bash
   mkdir -p src/domains/event/theme/{components,containers,hooks,constants}
   ```

2. **Implement constants**
   - `constants/fonts.ts` - Font options array

3. **Implement hooks**
   - `useUpdateTheme.ts` - Copy pattern from `useUpdateShareOptions`
   - `useUploadAndUpdateBackground.ts` - Composite upload + theme update

4. **Implement components**
   - `ThemePreview.tsx` - Display-only with inline styles
   - `ThemeControls.tsx` - Sections using editor controls

5. **Implement container**
   - `ThemeEditorPage.tsx` - 2-column layout with PreviewShell + controls

6. **Create barrel exports**

### Phase 3: Route Integration (~30 mins)

1. Create route file:
   ```
   src/app/routes/workspace.$workspaceSlug.projects.$projectId.events.$eventId.theme.tsx
   ```

2. Import and render `ThemeEditorPage`

### Phase 4: Testing (~1-2 hours)

1. Unit tests for editor controls
2. Unit tests for theme hooks
3. Manual testing in browser

---

## Key Patterns to Follow

### 1. Auto-Save Pattern

Copy from `SharingSection.tsx`:

```typescript
import { useForm, useWatch } from 'react-hook-form'
import { useAutoSave } from '@/shared/forms/hooks/useAutoSave'

function ThemeEditorPage() {
  const form = useForm({
    defaultValues: event.draftConfig?.theme ?? defaultTheme,
  })

  const { triggerSave } = useAutoSave({
    form,
    originalValues: event.draftConfig?.theme ?? defaultTheme,
    onUpdate: async (updates) => {
      await updateTheme.mutateAsync(updates)
      toast.success('Theme saved')
    },
    fieldsToCompare: [
      'fontFamily',
      'primaryColor',
      'text.color',
      'text.alignment',
      'button.backgroundColor',
      'button.textColor',
      'button.radius',
      'background.color',
      'background.image',
      'background.overlayOpacity',
    ],
    debounceMs: 300,
  })

  // Use watched values for preview
  const watchedTheme = useWatch({ control: form.control })

  return (/* ... */)
}
```

### 2. Tracked Mutation Pattern

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTrackedMutation } from '@/domains/event/designer/hooks/useTrackedMutation'

export function useUpdateTheme(projectId: string, eventId: string) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (updates: UpdateTheme) => {
      const validated = updateThemeSchema.parse(updates)
      const dotNotation = prefixKeys(validated, 'theme')
      await updateEventConfigField(projectId, eventId, dotNotation)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-event', projectId, eventId],
      })
    },
  })

  return useTrackedMutation(mutation)
}
```

### 3. Color Picker Pattern

```tsx
function ColorPickerField({ label, value, onChange, nullable }: ColorPickerFieldProps) {
  const [localValue, setLocalValue] = useState(value)

  // Sync with prop changes
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleColorChange = (newColor: string) => {
    setLocalValue(newColor)
    if (COLOR_REGEX.test(newColor)) {
      onChange(newColor)
    }
  }

  return (
    <EditorRow label={label}>
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="h-8 w-8 rounded-md border border-input"
            style={{ backgroundColor: value }}
          />
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <input
            type="color"
            value={value}
            onChange={(e) => handleColorChange(e.target.value)}
            className="w-full h-32"
          />
          <Input
            value={localValue}
            onChange={(e) => handleColorChange(e.target.value)}
            placeholder="#000000"
            className="mt-2"
          />
          {nullable && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange(null)}
              className="mt-2 w-full"
            >
              Clear
            </Button>
          )}
        </PopoverContent>
      </Popover>
    </EditorRow>
  )
}
```

### 4. 2-Column Layout Pattern

```tsx
function ThemeEditorPage() {
  return (
    <div className="flex h-full">
      {/* Left: Preview */}
      <div className="flex-1 p-6">
        <PreviewShell enableViewportSwitcher enableFullscreen>
          <ThemePreview theme={watchedTheme} />
        </PreviewShell>
      </div>

      {/* Right: Controls */}
      <aside className="w-80 border-l overflow-y-auto p-4">
        <ThemeControls
          theme={watchedTheme}
          onUpdate={(updates) => {
            // Update form fields
            Object.entries(updates).forEach(([key, value]) => {
              form.setValue(key as keyof Theme, value, { shouldDirty: true })
            })
            triggerSave()
          }}
          onUploadBackground={handleUploadBackground}
        />
      </aside>
    </div>
  )
}
```

---

## Reference Files

Study these existing implementations:

| Pattern | File |
|---------|------|
| Auto-save | `src/domains/event/settings/containers/SharingSection.tsx` |
| Tracked mutation | `src/domains/event/settings/hooks/useUpdateShareOptions.ts` |
| PreviewShell | `src/shared/preview-shell/components/PreviewShell.tsx` |
| Media upload | `src/domains/media-library/hooks/useUploadMediaAsset.ts` |
| Theme schema | `src/shared/theming/schemas/theme.schemas.ts` |

---

## Validation Checklist

Before marking complete:

- [ ] All theme properties editable via controls
- [ ] Real-time preview updates
- [ ] Auto-save with 300ms debounce
- [ ] Save indicator works (pending/saved states)
- [ ] Background image upload works
- [ ] Editor controls are reusable (no hardcoded theme logic)
- [ ] No hard-coded colors in admin UI (use theme tokens)
- [ ] `pnpm check` passes
- [ ] `pnpm type-check` passes
- [ ] Unit tests pass

---

## Common Pitfalls

1. **Don't forget tracked mutations** - All updates must use `useTrackedMutation` for save indicator
2. **Use inline styles in preview** - ThemePreview shows user colors, not design tokens
3. **Validate hex format** - Reject invalid hex before calling onChange
4. **Handle null values** - button.backgroundColor and background.image can be null
5. **Overlay opacity conversion** - Store as 0-1, display as 0-100%

---

## Getting Help

1. Check existing implementations in referenced files
2. Review standards in `standards/` directory
3. Consult [plan.md](./plan.md) for architecture decisions
4. Consult [data-model.md](./data-model.md) for schema details
