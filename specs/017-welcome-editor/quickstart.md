# Quickstart: Welcome Editor Implementation

**Feature**: 017-welcome-editor
**Estimated Tasks**: 8 files + 1 modification

---

## Prerequisites

1. 016-themed-primitives must be complete (verified ✅)
2. Dev environment running: `pnpm dev` from `apps/clementine-app/`
3. Existing event to test with

---

## Implementation Order

### Step 1: Add Welcome Schema to Event Config

**File**: `apps/clementine-app/src/domains/event/shared/schemas/project-event-config.schema.ts`

Add `welcomeConfigSchema` and export the type:

```typescript
import { mediaReferenceSchema } from '@/shared/theming'

export const welcomeConfigSchema = z.object({
  title: z.string().default('Choose your experience'),
  description: z.string().nullable().default(null),
  media: mediaReferenceSchema.nullable().default(null),
  layout: z.enum(['list', 'grid']).default('list'),
})

// Add to projectEventConfigSchema
welcome: welcomeConfigSchema.nullable().default(null),

// Export type
export type WelcomeConfig = z.infer<typeof welcomeConfigSchema>
```

---

### Step 2: Create Welcome Module Structure

Create the directory structure:

```bash
mkdir -p src/domains/event/welcome/{components,containers,hooks,schemas,constants}
```

---

### Step 3: Create Schemas

**File**: `src/domains/event/welcome/schemas/welcome.schemas.ts`

```typescript
import { z } from 'zod'
import { mediaReferenceSchema } from '@/shared/theming'

export const updateWelcomeSchema = z.object({
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  media: mediaReferenceSchema.nullable().optional(),
  layout: z.enum(['list', 'grid']).optional(),
})

export type UpdateWelcome = z.infer<typeof updateWelcomeSchema>

// Re-export from shared for convenience
export type { WelcomeConfig } from '@/domains/event/shared'
```

**File**: `src/domains/event/welcome/schemas/index.ts`

```typescript
export * from './welcome.schemas'
```

---

### Step 4: Create Constants

**File**: `src/domains/event/welcome/constants/defaults.ts`

```typescript
import type { WelcomeConfig } from '@/domains/event/shared'

export const DEFAULT_WELCOME: WelcomeConfig = {
  title: 'Choose your experience',
  description: null,
  media: null,
  layout: 'list',
}
```

**File**: `src/domains/event/welcome/constants/index.ts`

```typescript
export * from './defaults'
```

---

### Step 5: Create Hooks

**File**: `src/domains/event/welcome/hooks/useUpdateWelcome.ts`

Pattern: Copy `useUpdateTheme.ts` and adapt for welcome.

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as Sentry from '@sentry/tanstackstart-react'
import { updateEventConfigField } from '@/domains/event/shared'
import { useTrackedMutation } from '@/domains/event/designer'
import { welcomeConfigSchema } from '@/domains/event/shared'
import type { WelcomeConfig } from '@/domains/event/shared'

export function useUpdateWelcome(projectId: string, eventId: string) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (welcome: WelcomeConfig) => {
      const validated = welcomeConfigSchema.parse(welcome)
      await updateEventConfigField(projectId, eventId, { welcome: validated })
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

**File**: `src/domains/event/welcome/hooks/useUploadAndUpdateHeroMedia.ts`

Pattern: Copy `useUploadAndUpdateBackground.ts` and adapt.

**File**: `src/domains/event/welcome/hooks/index.ts`

```typescript
export * from './useUpdateWelcome'
export * from './useUploadAndUpdateHeroMedia'
```

---

### Step 6: Create Components

**File**: `src/domains/event/welcome/components/WelcomePreview.tsx`

Display-only component using ThemedBackground and ThemedText.

**File**: `src/domains/event/welcome/components/WelcomeControls.tsx`

Right panel with EditorSection, EditorRow, Input, Textarea, MediaPickerField, ToggleGroupField.

**File**: `src/domains/event/welcome/components/index.ts`

```typescript
export * from './WelcomePreview'
export * from './WelcomeControls'
```

---

### Step 7: Create Container

**File**: `src/domains/event/welcome/containers/WelcomeEditorPage.tsx`

Pattern: Copy `ThemeEditorPage.tsx` and adapt:
- Replace theme with welcome
- Replace ThemePreview with WelcomePreview
- Replace ThemeControls with WelcomeControls
- Update auto-save fields

**File**: `src/domains/event/welcome/containers/index.ts`

```typescript
export * from './WelcomeEditorPage'
```

---

### Step 8: Create Module Index

**File**: `src/domains/event/welcome/index.ts`

```typescript
// Public API
export { WelcomeEditorPage } from './containers'
export { WelcomePreview, WelcomeControls } from './components'
export { useUpdateWelcome, useUploadAndUpdateHeroMedia } from './hooks'
export { DEFAULT_WELCOME } from './constants'
export type { WelcomeConfig, UpdateWelcome } from './schemas'
```

---

### Step 9: Update Route (if needed)

Check `apps/clementine-app/src/app/routes/` for welcome route.
Import `WelcomeEditorPage` from `@/domains/event/welcome`.

---

## Validation Checklist

Before committing:

- [ ] `pnpm app:check` passes (format + lint)
- [ ] `pnpm type-check` passes
- [ ] Dev server shows no errors
- [ ] Welcome editor loads at `/workspace/[slug]/projects/[projectId]/events/[eventId]/welcome`
- [ ] Title changes update preview in real-time
- [ ] Description changes update preview
- [ ] Hero image upload works with progress indicator
- [ ] Layout toggle switches between list/grid
- [ ] Auto-save works (check save indicator)
- [ ] Theme styling applies to preview

---

## Test Scenarios

1. **Empty State**: New event with no welcome config shows defaults
2. **Title Edit**: Type in title field, preview updates, auto-saves after 300ms
3. **Description**: Add/remove description, preview shows/hides
4. **Hero Upload**: Drag image, progress shows, preview displays image
5. **Hero Remove**: Click remove, image disappears, saves
6. **Layout Toggle**: Switch between list/grid, saves
7. **Reload**: Refresh page, all changes persisted
