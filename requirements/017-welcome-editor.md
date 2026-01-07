# 017 - Welcome Editor

## Overview

Create a Welcome Editor for the event designer that allows admins to customize the welcome screen of their event's guest-facing experience. The editor follows a 2-column layout with a live preview on the left and compact Figma-style controls on the right.

## Goals

1. Enable customization of welcome screen content (title, description, hero media, layout)
2. Provide real-time preview of welcome changes with theme applied
3. Implement auto-saving with tracked mutations for save indicator integration
4. Leverage themed primitives for consistent preview styling

## Prerequisites

- **016-themed-primitives**: Must be implemented first. Provides:
  - `ThemedText`, `ThemedButton` components
  - `MediaReference` schema (used for welcome.media)

## Route

```
/workspace/[slug]/projects/[projectId]/events/[eventId]/welcome
```

Accessed via the "Welcome" tab in the event designer sidebar (already configured in `EventDesignerPage.tsx`).

## Technical Context

### Data Model

The editor modifies `event.draftConfig.welcome` which will follow this schema:

```typescript
// MediaReference is imported from @/shared/theming (defined in 016-themed-primitives)
import type { MediaReference } from '@/shared/theming'

interface WelcomeConfig {
  /** Welcome screen title */
  title: string // default: "Choose your experience"
  /** Welcome screen description */
  description: string | null
  /** Hero media (image) - uses shared MediaReference type */
  media: MediaReference | null
  /** Experience cards layout */
  layout: 'list' | 'grid'
}
```

### Dependencies

- **Themed Primitives**: `@/shared/theming` (ThemedText, ThemedButton, ThemedBackground, ThemeProvider, MediaReference)
- **Preview Shell**: `@/shared/preview-shell/`
- **Editor Controls**: `@/shared/editor-controls/`
- **Media Upload**: `@/domains/media-library/` (useUploadMediaAsset hook)
- **Designer Tracking**: `@/domains/event/designer/` (useTrackedMutation hook)
- **Auto Save**: `@/domains/event/shared/hooks/useAutoSave`

## Architecture

### Welcome Editor Module

Location: `@/domains/event/welcome/`

```
domains/event/welcome/
├── components/
│   ├── WelcomePreview.tsx       # Display-only preview component
│   ├── WelcomeControls.tsx      # Right panel with all controls
│   └── index.ts
├── containers/
│   ├── WelcomeEditorPage.tsx    # 2-column layout container
│   └── index.ts
├── hooks/
│   ├── useUpdateWelcome.ts      # Mutation hook for welcome updates
│   ├── useUploadAndUpdateHeroMedia.ts  # Composite upload + update
│   └── index.ts
├── schemas/
│   ├── welcome.schemas.ts       # Zod schemas for welcome config
│   └── index.ts
├── constants/
│   ├── defaults.ts              # DEFAULT_WELCOME constant
│   └── index.ts
└── index.ts
```

## Data Schema

### Welcome Config Schema

Add to `@/domains/event/shared/schemas/project-event-config.schema.ts`:

```typescript
import { mediaReferenceSchema } from '@/shared/theming/schemas/media-reference.schema'

/**
 * Welcome screen configuration
 */
export const welcomeConfigSchema = z.object({
  /** Welcome screen title */
  title: z.string().default('Choose your experience'),
  /** Welcome screen description */
  description: z.string().nullable().default(null),
  /** Hero media (image) - uses shared MediaReference from theming */
  media: mediaReferenceSchema.nullable().default(null),
  /** Experience cards layout */
  layout: z.enum(['list', 'grid']).default('list'),
})

// Add to projectEventConfigSchema:
export const projectEventConfigSchema = z.looseObject({
  schemaVersion: z.number().default(CURRENT_CONFIG_VERSION),
  theme: themeSchema.nullable().default(null),
  overlays: overlaysConfigSchema,
  sharing: sharingConfigSchema.nullable().default(null),
  welcome: welcomeConfigSchema.nullable().default(null), // NEW
})

export type WelcomeConfig = z.infer<typeof welcomeConfigSchema>
// Note: MediaReference type is exported from @/shared/theming
```

### Update Schema

In `@/domains/event/welcome/schemas/welcome.schemas.ts`:

```typescript
import { z } from 'zod'
import { mediaReferenceSchema } from '@/shared/theming/schemas/media-reference.schema'

/**
 * Schema for partial welcome updates
 * All fields optional for granular updates
 */
export const updateWelcomeSchema = z.object({
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  media: mediaReferenceSchema.nullable().optional(),
  layout: z.enum(['list', 'grid']).optional(),
})

export type UpdateWelcome = z.infer<typeof updateWelcomeSchema>
```

## Component Specifications

### 1. Welcome Preview Component

`WelcomePreview.tsx` - Display-only component showing the welcome screen with theme applied.

```tsx
interface WelcomePreviewProps {
  /** Welcome configuration */
  welcome: WelcomeConfig
  /** Theme to apply */
  theme: Theme
}
```

**Preview Layout:**

```
┌─────────────────────────────────────────────┐
│  [ThemedBackground with theme.background]   │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │  [Hero Media - if present]          │    │
│  │  (centered, max-height: 200px)      │    │
│  └─────────────────────────────────────┘    │
│                                             │
│     Choose your experience                  │  <- ThemedText heading
│                                             │
│     Welcome description text goes here.     │  <- ThemedText body
│     This explains what guests will do.      │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │                                     │    │
│  │    Experiences coming soon...       │    │  <- Placeholder
│  │                                     │    │
│  └─────────────────────────────────────┘    │
│                                             │
└─────────────────────────────────────────────┘
```

**Implementation:**

```tsx
import { ThemedText, ThemedBackground } from '@/shared/theming'

export function WelcomePreview({ welcome, theme }: WelcomePreviewProps) {
  return (
    <ThemedBackground
      background={theme.background}
      fontFamily={theme.fontFamily}
      className="h-full"
    >
      <div className="flex flex-col items-center gap-6 py-8">
        {/* Hero Media */}
        {welcome.media && (
          <div className="w-full max-w-md">
            <img
              src={welcome.media.url}
              alt=""
              className="mx-auto max-h-48 w-auto rounded-lg object-contain"
            />
          </div>
        )}

        {/* Title */}
        <ThemedText variant="heading" theme={theme}>
          {welcome.title || 'Choose your experience'}
        </ThemedText>

        {/* Description */}
        {welcome.description && (
          <ThemedText variant="body" theme={theme} className="max-w-md opacity-90">
            {welcome.description}
          </ThemedText>
        )}

        {/* Experiences Placeholder */}
        <div
          className="mt-4 w-full max-w-md rounded-lg border-2 border-dashed p-8 text-center"
          style={{
            borderColor: theme.text.color,
            opacity: 0.3,
          }}
        >
          <ThemedText variant="small" theme={theme} className="opacity-50">
            Experiences coming soon...
          </ThemedText>
        </div>
      </div>
    </ThemedBackground>
  )
}
```

### 2. Welcome Controls Component

`WelcomeControls.tsx` - Right panel with all welcome controls organized in sections.

```tsx
interface WelcomeControlsProps {
  welcome: WelcomeConfig
  onUpdate: (updates: Partial<WelcomeConfig>) => void
  onUploadMedia: (file: File) => Promise<{ url: string; mediaAssetId: string }>
  uploadingMedia?: boolean
  uploadProgress?: number
  disabled?: boolean
}
```

**Sections:**

#### Content Section
| Control | Type | Field |
|---------|------|-------|
| Title | Text Input | `title` |
| Description | Textarea (stacked) | `description` |

#### Media Section
| Control | Type | Field |
|---------|------|-------|
| Hero Image | MediaPickerField | `media` |

#### Layout Section
| Control | Type | Field |
|---------|------|-------|
| Experience Layout | ToggleGroupField | `layout` |

**Implementation:**

```tsx
import {
  EditorSection,
  EditorRow,
  MediaPickerField,
  ToggleGroupField,
} from '@/shared/editor-controls'
import { Input } from '@/ui-kit/components/input'
import { Textarea } from '@/ui-kit/components/textarea'
import { LayoutList, LayoutGrid } from 'lucide-react'

const LAYOUT_OPTIONS = [
  { value: 'list', label: 'List', icon: <LayoutList className="size-4" /> },
  { value: 'grid', label: 'Grid', icon: <LayoutGrid className="size-4" /> },
]

export function WelcomeControls({
  welcome,
  onUpdate,
  onUploadMedia,
  uploadingMedia,
  uploadProgress,
  disabled,
}: WelcomeControlsProps) {
  return (
    <div className="space-y-4">
      {/* Content Section */}
      <EditorSection title="Content" defaultOpen>
        <EditorRow label="Title">
          <Input
            value={welcome.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Choose your experience"
            disabled={disabled}
          />
        </EditorRow>

        <EditorRow label="Description" stacked>
          <Textarea
            value={welcome.description ?? ''}
            onChange={(e) =>
              onUpdate({ description: e.target.value || null })
            }
            placeholder="Welcome message for your guests..."
            rows={3}
            disabled={disabled}
          />
        </EditorRow>
      </EditorSection>

      {/* Media Section */}
      <EditorSection title="Media" defaultOpen>
        <MediaPickerField
          label="Hero Image"
          value={welcome.media?.url ?? null}
          onChange={(url, mediaAssetId) =>
            onUpdate({
              media: url && mediaAssetId ? { url, mediaAssetId } : null,
            })
          }
          onUpload={onUploadMedia}
          accept="image/*"
          removable
          uploading={uploadingMedia}
          uploadProgress={uploadProgress}
          disabled={disabled}
        />
      </EditorSection>

      {/* Layout Section */}
      <EditorSection title="Layout" defaultOpen>
        <ToggleGroupField
          label="Experiences"
          value={welcome.layout}
          onChange={(value) => onUpdate({ layout: value as 'list' | 'grid' })}
          options={LAYOUT_OPTIONS}
          disabled={disabled}
        />
      </EditorSection>
    </div>
  )
}
```

### 3. Welcome Editor Page Container

`WelcomeEditorPage.tsx` - Main container with 2-column layout.

```tsx
import { useForm, useWatch } from 'react-hook-form'
import { PreviewShell } from '@/shared/preview-shell'
import { useAutoSave } from '@/domains/event/shared/hooks/useAutoSave'
import { useEventDesignerContext } from '@/domains/event/designer'
import { useUpdateWelcome } from '../hooks/useUpdateWelcome'
import { useUploadAndUpdateHeroMedia } from '../hooks/useUploadAndUpdateHeroMedia'
import { WelcomePreview } from '../components/WelcomePreview'
import { WelcomeControls } from '../components/WelcomeControls'
import { DEFAULT_WELCOME } from '../constants/defaults'
import { DEFAULT_THEME } from '@/shared/theming'
import type { WelcomeConfig } from '../schemas/welcome.schemas'

export function WelcomeEditorPage() {
  const { event, projectId } = useEventDesignerContext()

  // Get current values with defaults
  const welcome = event.draftConfig?.welcome ?? DEFAULT_WELCOME
  const theme = event.draftConfig?.theme ?? DEFAULT_THEME

  // Form setup
  const form = useForm<WelcomeConfig>({
    values: welcome,
  })

  // Watch for live preview updates
  const currentWelcome = useWatch({ control: form.control }) as WelcomeConfig

  // Mutations
  const updateWelcome = useUpdateWelcome(projectId, event.id)
  const uploadHeroMedia = useUploadAndUpdateHeroMedia(
    projectId,
    event.id,
    event.workspaceId,
    event.createdBy
  )

  // Upload state
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Auto-save setup
  const { triggerSave } = useAutoSave({
    form,
    originalValues: welcome,
    onUpdate: async (updates) => {
      await updateWelcome.mutateAsync(updates)
    },
    fieldsToCompare: ['title', 'description', 'media', 'layout'],
    debounceMs: 300,
  })

  // Handle media upload
  const handleUploadMedia = async (file: File) => {
    setIsUploading(true)
    setUploadProgress(0)

    try {
      const result = await uploadHeroMedia.mutateAsync({
        file,
        onProgress: setUploadProgress,
      })
      return result
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  // Handle control updates
  const handleUpdate = (updates: Partial<WelcomeConfig>) => {
    Object.entries(updates).forEach(([key, value]) => {
      form.setValue(key as keyof WelcomeConfig, value, { shouldDirty: true })
    })
    triggerSave()
  }

  return (
    <div className="flex h-full">
      {/* Left: Preview */}
      <div className="flex-1 p-6">
        <PreviewShell>
          <WelcomePreview welcome={currentWelcome} theme={theme} />
        </PreviewShell>
      </div>

      {/* Right: Controls Panel */}
      <aside className="flex w-80 flex-col border-l">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 border-b bg-background px-4 py-3">
          <h2 className="font-semibold">Welcome</h2>
          <p className="text-xs text-muted-foreground">
            Customize your welcome screen
          </p>
        </div>

        {/* Scrollable Controls */}
        <div className="flex-1 overflow-y-auto p-4">
          <WelcomeControls
            welcome={currentWelcome}
            onUpdate={handleUpdate}
            onUploadMedia={handleUploadMedia}
            uploadingMedia={isUploading}
            uploadProgress={uploadProgress}
          />
        </div>
      </aside>
    </div>
  )
}
```

## Hooks

### useUpdateWelcome

Similar to `useUpdateTheme` - wraps welcome field updates with tracking.

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as Sentry from '@sentry/react'
import { useTrackedMutation } from '@/domains/event/designer'
import { updateEventConfigField } from '@/domains/event/shared'
import { updateWelcomeSchema } from '../schemas/welcome.schemas'
import { prefixKeys } from '@/domains/event/shared/lib/prefixKeys'
import type { UpdateWelcome } from '../schemas/welcome.schemas'

export function useUpdateWelcome(projectId: string, eventId: string) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (updates: UpdateWelcome) => {
      const validated = updateWelcomeSchema.parse(updates)
      const dotNotationUpdates = prefixKeys(validated, 'welcome')
      await updateEventConfigField(projectId, eventId, dotNotationUpdates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-event', projectId, eventId],
      })
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: { domain: 'event/welcome', action: 'update-welcome' },
      })
    },
  })

  return useTrackedMutation(mutation)
}
```

### useUploadAndUpdateHeroMedia

Composite hook combining upload + welcome update.

```typescript
import { useMutation } from '@tanstack/react-query'
import { useUploadMediaAsset } from '@/domains/media-library'
import { useUpdateWelcome } from './useUpdateWelcome'
import { useTrackedMutation } from '@/domains/event/designer'

interface UploadParams {
  file: File
  onProgress?: (progress: number) => void
}

export function useUploadAndUpdateHeroMedia(
  projectId: string,
  eventId: string,
  workspaceId: string,
  userId: string
) {
  const uploadAsset = useUploadMediaAsset(workspaceId, userId)
  const updateWelcome = useUpdateWelcome(projectId, eventId)

  const mutation = useMutation({
    mutationFn: async ({ file, onProgress }: UploadParams) => {
      const { mediaAssetId, url } = await uploadAsset.mutateAsync({
        file,
        type: 'hero',
        onProgress,
      })

      await updateWelcome.mutateAsync({
        media: { mediaAssetId, url },
      })

      return { mediaAssetId, url }
    },
  })

  return useTrackedMutation(mutation)
}
```

## Constants

### Default Welcome

In `@/domains/event/welcome/constants/defaults.ts`:

```typescript
import type { WelcomeConfig } from '../schemas/welcome.schemas'

export const DEFAULT_WELCOME: WelcomeConfig = {
  title: 'Choose your experience',
  description: null,
  media: null,
  layout: 'list',
}
```

## Auto-Save Implementation

Follows the pattern from Theme Editor:

1. Use `react-hook-form` for form state
2. Use `useAutoSave` hook with 300ms debouncing
3. Use `useWatch` for real-time preview updates
4. Wrap mutations with `useTrackedMutation` for save indicator

```typescript
const { triggerSave } = useAutoSave({
  form,
  originalValues: event.draftConfig?.welcome ?? DEFAULT_WELCOME,
  onUpdate: async (updates) => {
    await updateWelcome.mutateAsync(updates)
  },
  fieldsToCompare: ['title', 'description', 'media', 'layout'],
  debounceMs: 300,
})
```

## File Structure Summary

### New Files

```
apps/clementine-app/src/domains/event/
└── welcome/
    ├── components/
    │   ├── WelcomePreview.tsx
    │   ├── WelcomeControls.tsx
    │   └── index.ts
    ├── containers/
    │   ├── WelcomeEditorPage.tsx   # Replace placeholder
    │   └── index.ts
    ├── hooks/
    │   ├── useUpdateWelcome.ts
    │   ├── useUploadAndUpdateHeroMedia.ts
    │   └── index.ts
    ├── schemas/
    │   ├── welcome.schemas.ts
    │   └── index.ts
    ├── constants/
    │   ├── defaults.ts
    │   └── index.ts
    └── index.ts
```

### Modified Files

```
apps/clementine-app/src/domains/event/shared/schemas/
└── project-event-config.schema.ts   # Add welcomeConfigSchema, mediaReferenceSchema
```

## Testing Considerations

1. **WelcomePreview**: Visual tests for all states (with/without media, with/without description)
2. **WelcomeControls**: Unit tests for control interactions
3. **useUpdateWelcome**: Mock tests for mutation behavior
4. **Auto-save**: Integration tests for debounced save behavior
5. **Upload flow**: Mock tests for hero media upload

## Out of Scope

- Actual experience cards (placeholder only)
- Video hero media (images only for now)
- Multiple hero media / carousel
- Welcome animation/transitions
- A/B testing for welcome content

## Success Criteria

1. Users can modify all welcome properties through the editor
2. Changes are reflected in real-time in the preview
3. Preview correctly applies event theme (background, text styles)
4. Auto-save works reliably with appropriate debouncing
5. Save indicator shows correct pending/saved state
6. Hero image upload integrates with media library
7. Layout toggle correctly switches between list/grid options

## Dependencies

- **016-themed-primitives**: Must be completed first. Provides:
  - `ThemedText`, `ThemedButton` components
  - `ThemedBackground` component
  - `MediaReference` schema and type
- **Existing**: Editor controls, Preview shell, Media library, Designer tracking
