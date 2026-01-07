# 015 - Event Theme Editor

## Overview

Create a theme editor for the event designer that allows users to customize the visual appearance of their event's guest-facing experience. The editor follows a 2-column layout with a live preview on the left and compact Figma-style controls on the right.

## Goals

1. Enable visual customization of event themes through an intuitive editor interface
2. Provide real-time preview of theme changes
3. Create reusable editor control components for use across other editors
4. Implement auto-saving with tracked mutations for save indicator integration

## Route

```
/workspace/[slug]/projects/[projectId]/events/[eventId]/theme
```

Accessed via the "Theme" tab in the event designer sidebar (already configured in `EventDesignerPage.tsx`).

## Technical Context

### Data Model

The editor modifies `event.draftConfig.theme` which follows the schema in:
`@/shared/theming/schemas/theme.schemas.ts`

```typescript
interface Theme {
  fontFamily: string | null
  primaryColor: string // hex color
  text: {
    color: string // hex color
    alignment: 'left' | 'center' | 'right'
  }
  button: {
    backgroundColor: string | null // hex color
    textColor: string // hex color
    radius: 'none' | 'sm' | 'md' | 'full'
  }
  background: {
    color: string // hex color
    image: string | null // URL
    overlayOpacity: number // 0-1 decimal
  }
}
```

### Dependencies

- Preview Shell: `@/shared/preview-shell/`
- Theme Schemas: `@/shared/theming/schemas/theme.schemas.ts`
- Media Upload: `@/domains/media-library/` (useUploadMediaAsset hook)
- Designer Tracking: `@/domains/event/designer/` (useTrackedMutation hook)

## Architecture

### New Shared Module: Editor Controls

Location: `@/shared/editor-controls/`

This module provides reusable, Figma-style control components for property editors.

```
shared/editor-controls/
├── components/
│   ├── EditorSection.tsx        # Collapsible section with title
│   ├── EditorRow.tsx            # Inline label + control layout
│   ├── ColorPickerField.tsx     # Label + color picker popover
│   ├── SelectField.tsx          # Label + select dropdown
│   ├── ToggleGroupField.tsx     # Label + toggle group (for enums)
│   ├── SliderField.tsx          # Label + slider with value display
│   ├── MediaPickerField.tsx     # Label + media upload/preview
│   └── index.ts
├── hooks/
│   └── index.ts
├── types/
│   └── index.ts
└── index.ts
```

### Theme Editor Module

Location: `@/domains/event/theme/`

```
domains/event/theme/
├── components/
│   ├── ThemePreview.tsx         # Display-only preview component
│   ├── ThemeControls.tsx        # Right panel with all controls
│   └── index.ts
├── containers/
│   ├── ThemeEditorPage.tsx      # 2-column layout container
│   └── index.ts
├── hooks/
│   ├── useUpdateTheme.ts        # Mutation hook for theme updates
│   ├── useUploadAndUpdateBackground.ts  # Composite upload + update
│   └── index.ts
├── constants/
│   ├── fonts.ts                 # Available font options
│   └── index.ts
└── index.ts
```

## Component Specifications

### 1. Editor Controls (Shared)

#### EditorSection

Collapsible section container with title.

```tsx
interface EditorSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}
```

#### EditorRow

Inline layout for label + control. Default: 2-column (label left, control right).

```tsx
interface EditorRowProps {
  label: string
  htmlFor?: string
  children: React.ReactNode
  /** Use stacked layout for large controls like textarea */
  stacked?: boolean
}
```

Layout behavior:
- Default: `grid grid-cols-[1fr_auto]` or similar for inline label+control
- Stacked: Label above, control below (for textarea, large inputs)

#### ColorPickerField

Custom color picker using native browser picker + hex input in a shadcn Popover.

```tsx
interface ColorPickerFieldProps {
  label: string
  value: string // hex color
  onChange: (color: string) => void
  /** Allow null/transparent */
  nullable?: boolean
}
```

**Trigger**: Colored circle showing current color (clickable to open popover)

**Popover Content**:
```
┌─────────────────────────────┐
│  [Native Color Picker]      │  <- <input type="color" /> styled larger
│                             │
│  Hex: [ #3B82F6         ]   │  <- Text input for hex value
│                             │
│  [Clear]  (if nullable)     │
└─────────────────────────────┘
```

Features:
- Colored circle trigger (not a button with text)
- Native `<input type="color" />` for visual picking
- Hex text input for precise values (validates hex format)
- Two-way sync: picker updates hex input, hex input updates picker
- Optional "Clear" button when nullable=true
- No RGBA - hex only

Implementation notes:
- Native color picker returns hex, so no conversion needed
- Validate hex input with regex: `/^#[0-9A-Fa-f]{6}$/`
- Sync on change, not on blur (real-time preview)

#### SelectField

Standard select with label.

```tsx
interface SelectFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  placeholder?: string
}
```

#### ToggleGroupField

Toggle group for enum-like selections (text alignment, button radius).

```tsx
interface ToggleGroupFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{
    value: string
    label: string
    icon?: React.ReactNode
  }>
}
```

Use icons where appropriate:
- Text alignment: AlignLeft, AlignCenter, AlignRight icons
- Button radius: Visual representations of radius options

#### SliderField

Slider with value display.

```tsx
interface SliderFieldProps {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  /** Format value for display (e.g., add % suffix) */
  formatValue?: (value: number) => string
}
```

#### MediaPickerField

Media upload with preview.

```tsx
interface MediaPickerFieldProps {
  label: string
  value: string | null // URL
  onChange: (url: string | null, mediaAssetId?: string) => void
  onUpload: (file: File) => Promise<{ url: string; mediaAssetId: string }>
  /** Accepted file types */
  accept?: string
  /** Show remove button */
  removable?: boolean
}
```

Features:
- Shows thumbnail preview when value exists
- Upload button/dropzone when empty
- Remove button when removable=true and value exists
- Loading state during upload

### 2. Theme Preview Component

`ThemePreview.tsx` - Display-only component showing theme application.

```tsx
interface ThemePreviewProps {
  theme: Theme
}
```

Preview demonstrates:
- **Background**: Color and image with overlay
- **Large text**: Heading styled with theme text color/alignment
- **Small text**: Body text styled with theme text color/alignment
- **Primary button**: Styled with button colors and radius

Layout suggestion:
```
┌─────────────────────────────────────┐
│  [Background color/image + overlay] │
│                                     │
│         Welcome to Our Event        │  <- Large text
│                                     │
│    This is what your guests will    │  <- Small text
│    see when they visit your event.  │
│                                     │
│         ┌─────────────────┐         │
│         │   Get Started   │         │  <- Primary button
│         └─────────────────┘         │
│                                     │
└─────────────────────────────────────┘
```

### 3. Theme Controls Component

`ThemeControls.tsx` - Right panel with all theme controls organized in sections.

```tsx
interface ThemeControlsProps {
  theme: Theme
  onUpdate: (updates: Partial<Theme>) => void
  onUploadBackground: (file: File) => Promise<{ url: string; mediaAssetId: string }>
  disabled?: boolean
}
```

Sections:

#### Text Section
| Control | Type | Field |
|---------|------|-------|
| Font | SelectField | `fontFamily` |
| Text Color | ColorPickerField | `text.color` |
| Alignment | ToggleGroupField | `text.alignment` |

#### Colors Section
| Control | Type | Field |
|---------|------|-------|
| Primary Color | ColorPickerField | `primaryColor` |

#### Buttons Section
| Control | Type | Field |
|---------|------|-------|
| Background | ColorPickerField (nullable) | `button.backgroundColor` |
| Text Color | ColorPickerField | `button.textColor` |
| Radius | ToggleGroupField | `button.radius` |

#### Background Section
| Control | Type | Field |
|---------|------|-------|
| Color | ColorPickerField | `background.color` |
| Image | MediaPickerField | `background.image` |
| Overlay | SliderField (0-100%) | `background.overlayOpacity` |

Note: Overlay opacity is stored as 0-1 decimal but displayed as 0-100%.

### 4. Theme Editor Page Container

`ThemeEditorPage.tsx` - Main container with 2-column layout.

```tsx
export function ThemeEditorPage() {
  // Get event data from route context or query
  // Set up form with react-hook-form
  // Use auto-save pattern similar to SharingSection

  return (
    <div className="flex h-full">
      {/* Left: Preview Shell */}
      <div className="flex-1 p-6">
        <PreviewShell>
          <ThemePreview theme={currentTheme} />
        </PreviewShell>
      </div>

      {/* Right: Controls Panel */}
      <aside className="w-80 border-l overflow-y-auto p-4">
        <ThemeControls
          theme={currentTheme}
          onUpdate={handleUpdate}
          onUploadBackground={handleUploadBackground}
        />
      </aside>
    </div>
  )
}
```

## Hooks

### useUpdateTheme

Similar to `useUpdateShareOptions` - wraps theme field updates with tracking.

```typescript
export function useUpdateTheme(projectId: string, eventId: string) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (updates: UpdateTheme) => {
      const validated = updateThemeSchema.parse(updates)
      const dotNotationUpdates = prefixKeys(validated, 'theme')
      await updateEventConfigField(projectId, eventId, dotNotationUpdates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-event', projectId, eventId],
      })
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: { domain: 'event/theme', action: 'update-theme' },
      })
    },
  })

  return useTrackedMutation(mutation)
}
```

### useUploadAndUpdateBackground

Composite hook combining upload + theme update.

```typescript
export function useUploadAndUpdateBackground(
  projectId: string,
  eventId: string,
  workspaceId: string,
  userId: string
) {
  const uploadAsset = useUploadMediaAsset(workspaceId, userId)
  const updateTheme = useUpdateTheme(projectId, eventId)

  const mutation = useMutation({
    mutationFn: async ({ file, onProgress }) => {
      const { mediaAssetId, url } = await uploadAsset.mutateAsync({
        file,
        type: 'background',
        onProgress,
      })

      await updateTheme.mutateAsync({
        background: { image: url },
      })

      return { mediaAssetId, url }
    },
  })

  return useTrackedMutation(mutation)
}
```

## Auto-Save Implementation

Follow the pattern from `SharingSection.tsx`:

1. Use `react-hook-form` for form state
2. Use `useAutoSave` hook with debouncing (300ms)
3. Use `useWatch` for real-time preview updates
4. Wrap mutations with `useTrackedMutation` for save indicator

```typescript
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
```

## Font Options

Available system fonts (defined in `constants/fonts.ts`):

```typescript
export const FONT_OPTIONS = [
  { value: 'system-ui', label: 'System Default' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Helvetica, sans-serif', label: 'Helvetica' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Times New Roman, serif', label: 'Times New Roman' },
  { value: 'Verdana, sans-serif', label: 'Verdana' },
  { value: 'Trebuchet MS, sans-serif', label: 'Trebuchet MS' },
  { value: 'Palatino, serif', label: 'Palatino' },
  { value: 'Garamond, serif', label: 'Garamond' },
  { value: 'Courier New, monospace', label: 'Courier New' },
]
```

## Dependencies to Install

No new dependencies required. The color picker uses native browser `<input type="color" />` with existing shadcn components (Popover, Input, Button).

## File Structure Summary

### New Files

```
apps/clementine-app/src/
├── shared/
│   └── editor-controls/
│       ├── components/
│       │   ├── EditorSection.tsx
│       │   ├── EditorRow.tsx
│       │   ├── ColorPickerField.tsx
│       │   ├── SelectField.tsx
│       │   ├── ToggleGroupField.tsx
│       │   ├── SliderField.tsx
│       │   ├── MediaPickerField.tsx
│       │   └── index.ts
│       ├── types/
│       │   └── index.ts
│       └── index.ts
│
└── domains/event/
    └── theme/
        ├── components/
        │   ├── ThemePreview.tsx
        │   ├── ThemeControls.tsx
        │   └── index.ts
        ├── containers/
        │   ├── ThemeEditorPage.tsx
        │   └── index.ts
        ├── hooks/
        │   ├── useUpdateTheme.ts
        │   ├── useUploadAndUpdateBackground.ts
        │   └── index.ts
        ├── constants/
        │   ├── fonts.ts
        │   └── index.ts
        └── index.ts
```

### Route File

```
apps/clementine-app/src/app/routes/
└── workspace.$workspaceSlug.projects.$projectId.events.$eventId.theme.tsx
```

## Testing Considerations

1. **Editor Controls**: Unit tests for each control component
2. **ThemePreview**: Visual regression tests for theme application
3. **Auto-save**: Integration tests for debounced save behavior
4. **Upload flow**: Mock tests for background image upload

## Out of Scope

- Reset to defaults functionality
- Project theme inheritance
- Secondary button styling
- Google Fonts integration (future enhancement)
- Theme presets/templates

## Success Criteria

1. Users can modify all theme properties through the editor
2. Changes are reflected in real-time in the preview
3. Auto-save works reliably with appropriate debouncing
4. Save indicator shows correct pending/saved state
5. Editor controls are reusable for other editors
6. Background image upload integrates with media library
