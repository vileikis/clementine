# Quickstart: Event Settings - Sharing Configuration & Draft/Publish

**Feature**: 012-event-settings-sharing-publish
**Date**: 2026-01-05
**Target**: Developers implementing this feature

## Overview

This quickstart guide provides a step-by-step implementation plan for the event settings sharing configuration and draft/publish workflow. Follow these steps in order for a clean, systematic implementation.

---

## Phase 1: Architecture Refactor (Foundation)

**Goal**: Move UI ownership from route file to event domain, following DDD principles.

### Step 1.1: Create EventDesignerTopBar Component

**File**: `apps/clementine-app/src/domains/event/designer/components/EventDesignerTopBar.tsx`

**Implementation**:
```tsx
import { Button } from '@/ui-kit/components/button'
import { Loader2 } from 'lucide-react'

interface EventDesignerTopBarProps {
  projectName: string
  eventName: string
  hasUnpublishedChanges: boolean
  isPublishing: boolean
  onPublish: () => void
}

export function EventDesignerTopBar({
  projectName,
  eventName,
  hasUnpublishedChanges,
  isPublishing,
  onPublish,
}: EventDesignerTopBarProps) {
  return (
    <div className="border-b bg-background">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left: Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{projectName}</span>
          <span>/</span>
          <span className="font-medium text-foreground">{eventName}</span>
          {hasUnpublishedChanges && (
            <div className="flex items-center gap-1.5 rounded-full bg-yellow-50 dark:bg-yellow-950 px-2.5 py-1 text-xs font-medium text-yellow-700 dark:text-yellow-400">
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
              New changes
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled>
            Preview
          </Button>
          <Button
            onClick={onPublish}
            disabled={!hasUnpublishedChanges || isPublishing}
          >
            {isPublishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Publish
          </Button>
        </div>
      </div>
    </div>
  )
}
```

**Key Features**:
- Breadcrumbs: Project name → Event name
- "New changes" badge: Yellow circle + text (conditional)
- Preview button: Placeholder (disabled)
- Publish button: Enabled only when changes exist, shows loading state

**Testing**:
- [ ] Badge shows when `hasUnpublishedChanges === true`
- [ ] Badge hidden when `hasUnpublishedChanges === false`
- [ ] Publish button disabled when no changes
- [ ] Publish button shows loading spinner during mutation
- [ ] 44x44px touch target for all buttons (mobile-first)

---

### Step 1.2: Create EventDesignerLayout Container

**File**: `apps/clementine-app/src/domains/event/designer/containers/EventDesignerLayout.tsx`

**Implementation**:
```tsx
import { useMemo } from 'react'
import { useRouter } from '@tanstack/react-router'
import { useToast } from '@/ui-kit/hooks/use-toast'
import { EventDesignerTopBar } from '../components/EventDesignerTopBar'
import { EventDesignerPage } from './EventDesignerPage'
import { usePublishEvent } from '../hooks/usePublishEvent'
import type { ProjectEventFull } from '@/domains/event/shared/schemas'
import type { Project } from '@/domains/project/shared/schemas'

interface EventDesignerLayoutProps {
  event: ProjectEventFull
  project: Project
}

export function EventDesignerLayout({ event, project }: EventDesignerLayoutProps) {
  const router = useRouter()
  const { toast } = useToast()
  const publishEvent = usePublishEvent(project.id, event.id)

  // Detect unpublished changes
  const hasUnpublishedChanges = useMemo(() => {
    if (event.publishedVersion === null) return true // Never published
    return event.draftVersion !== null && event.draftVersion > event.publishedVersion
  }, [event.draftVersion, event.publishedVersion])

  // Publish handler
  const handlePublish = async () => {
    try {
      await publishEvent.mutateAsync()
      toast({
        title: 'Event published',
        description: 'Your changes are now live for guests.',
      })
    } catch (error) {
      toast({
        title: 'Publish failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <EventDesignerTopBar
        projectName={project.name}
        eventName={event.name}
        hasUnpublishedChanges={hasUnpublishedChanges}
        isPublishing={publishEvent.isPending}
        onPublish={handlePublish}
      />
      <EventDesignerPage />
    </div>
  )
}
```

**Key Features**:
- Change detection: `draftVersion > publishedVersion`
- Publish handler: Calls `usePublishEvent` mutation
- Toast notifications: Success and error messages
- Self-contained: No route file dependencies

**Testing**:
- [ ] `hasUnpublishedChanges` detects never-published state (publishedVersion === null)
- [ ] `hasUnpublishedChanges` detects new changes (draftVersion > publishedVersion)
- [ ] Publish mutation success → Toast notification
- [ ] Publish mutation error → Error toast

---

### Step 1.3: Update Route File (Thin Wrapper)

**File**: `apps/clementine-app/src/app/workspace/$workspaceSlug.projects/$projectId.events/$eventId.tsx`

**Before** (route owns UI):
```tsx
export const Route = createFileRoute('...')({
  loader: async ({ params, context }) => {
    // ... loader logic
  },
  component: EventLayout,
})

function EventLayout() {
  const { event, project } = Route.useLoaderData()
  return (
    <>
      <TopNavBar breadcrumbs={...} actions={...} />
      <EventDesignerPage />
    </>
  )
}
```

**After** (domain owns UI):
```tsx
import { EventDesignerLayout } from '@/domains/event/designer'

export const Route = createFileRoute('...')({
  loader: async ({ params, context }) => {
    // ... loader logic (unchanged)
  },
  component: EventLayout,
})

function EventLayout() {
  const { event, project } = Route.useLoaderData()
  return <EventDesignerLayout event={event} project={project} />
}
```

**Changes**:
- ✅ Import `EventDesignerLayout` from event domain
- ✅ Remove `TopNavBar` (now owned by `EventDesignerTopBar`)
- ✅ Remove `EventDesignerPage` import (now owned by layout)
- ✅ Pass data props to layout

**Testing**:
- [ ] Route still loads data correctly
- [ ] Layout renders with correct event and project data
- [ ] Top bar shows correct breadcrumbs
- [ ] Tabs navigation still works

---

### Step 1.4: Update Barrel Exports

**File**: `apps/clementine-app/src/domains/event/designer/index.ts`

**Add exports**:
```typescript
// Components
export { EventDesignerTopBar } from './components/EventDesignerTopBar'

// Containers
export { EventDesignerLayout } from './containers/EventDesignerLayout'
export { EventDesignerPage } from './containers/EventDesignerPage'

// Hooks (to be added in Phase 2)
// export { usePublishEvent } from './hooks/usePublishEvent'
```

**Testing**:
- [ ] Import `EventDesignerLayout` from `@/domains/event/designer` works
- [ ] No circular dependencies
- [ ] TypeScript types export correctly

---

## Phase 2: Shared Helper & Mutation Hooks

**Goal**: Create reusable transaction helper and domain-specific mutation hooks.

### Step 2.1: Create Shared Transaction Helper

**File**: `apps/clementine-app/src/domains/event/shared/lib/updateEventConfigField.ts`

**Implementation**:
```typescript
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import type { WithFieldValue, UpdateData } from 'firebase/firestore'
import { firestore } from '@/integrations/firebase/client'
import type { ProjectEventFull, ProjectEventConfig } from '../schemas'

/**
 * Reusable helper for simple event config field updates
 * Handles lazy initialization and version increment
 *
 * @param projectId - Project ID
 * @param eventId - Event ID
 * @param field - Field name in ProjectEventConfig (type-safe)
 * @param value - New value for the field
 * @returns Updated config
 */
export async function updateEventConfigField<K extends keyof ProjectEventConfig>(
  projectId: string,
  eventId: string,
  field: K,
  value: ProjectEventConfig[K],
): Promise<ProjectEventConfig> {
  return await runTransaction(firestore, async (transaction) => {
    const eventRef = doc(firestore, `projects/${projectId}/events`, eventId)
    const eventDoc = await transaction.get(eventRef)

    if (!eventDoc.exists()) {
      throw new Error(`Event ${eventId} not found`)
    }

    const currentEvent = eventDoc.data() as ProjectEventFull

    // Lazy initialization of draftConfig
    const currentDraft = currentEvent.draftConfig ?? {
      schemaVersion: 1,
      theme: null,
      overlays: null,
      sharing: null,
    }

    // Update field
    const updatedDraft: ProjectEventConfig = {
      ...currentDraft,
      [field]: value,
    }

    // Increment version
    const currentVersion = currentEvent.draftVersion ?? 0

    // Write update
    const updateData: UpdateData<ProjectEventFull> = {
      draftConfig: updatedDraft,
      draftVersion: currentVersion + 1,
      updatedAt: serverTimestamp(),
    }

    transaction.update(eventRef, updateData)

    return updatedDraft
  })
}
```

**Key Features**:
- Generic over `ProjectEventConfig` keys (type-safe)
- Lazy initialization (creates draftConfig on first update)
- Increments draftVersion
- Transaction ensures atomicity

**When to Use**:
- ✅ Simple field replacement (theme, overlays)
- ❌ Complex deep merge (sharing with nested socials) → Use custom hook

**Testing**:
- [ ] Creates draftConfig if null
- [ ] Increments draftVersion on each call
- [ ] Updates serverTimestamp
- [ ] Returns updated config
- [ ] Throws error if event doesn't exist

---

### Step 2.2: Create useUpdateShareOptions Hook

**File**: `apps/clementine-app/src/domains/event/settings/hooks/useUpdateShareOptions.ts`

**Implementation**:
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import type { UpdateData } from 'firebase/firestore'
import * as Sentry from '@sentry/tanstack start-react'
import { firestore } from '@/integrations/firebase/client'
import { sharingConfigSchema } from '@/domains/event/shared/schemas'
import type { ProjectEventFull, ProjectEventConfig, SharingConfig } from '@/domains/event/shared/schemas'
import { z } from 'zod'

// Partial update schema
export const updateShareOptionsSchema = sharingConfigSchema.partial()
export type UpdateShareOptionsInput = z.infer<typeof updateShareOptionsSchema>

export function useUpdateShareOptions(projectId: string, eventId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateShareOptionsInput) => {
      // 1. Validate input
      const validated = updateShareOptionsSchema.parse(input)

      // 2. Transaction with deep merge
      return await runTransaction(firestore, async (transaction) => {
        const eventRef = doc(firestore, `projects/${projectId}/events`, eventId)
        const eventDoc = await transaction.get(eventRef)

        if (!eventDoc.exists()) {
          throw new Error(`Event ${eventId} not found`)
        }

        const currentEvent = eventDoc.data() as ProjectEventFull

        // 3. Lazy initialization
        const currentDraft = currentEvent.draftConfig ?? {
          schemaVersion: 1,
          theme: null,
          overlays: null,
          sharing: null,
        }

        const currentSharing = currentDraft.sharing ?? {
          downloadEnabled: true,
          copyLinkEnabled: true,
          socials: null,
        }

        // 4. Deep merge for socials
        const updatedSharing: SharingConfig = {
          downloadEnabled: validated.downloadEnabled ?? currentSharing.downloadEnabled,
          copyLinkEnabled: validated.copyLinkEnabled ?? currentSharing.copyLinkEnabled,
          socials: validated.socials
            ? {
                ...currentSharing.socials, // Preserve existing flags
                ...validated.socials,      // Apply updates
              }
            : currentSharing.socials,
        }

        // 5. Update draft
        const updatedDraft: ProjectEventConfig = {
          ...currentDraft,
          sharing: updatedSharing,
        }

        const currentVersion = currentEvent.draftVersion ?? 0

        // 6. Write
        const updateData: UpdateData<ProjectEventFull> = {
          draftConfig: updatedDraft,
          draftVersion: currentVersion + 1,
          updatedAt: serverTimestamp(),
        }

        transaction.update(eventRef, updateData)

        return updatedDraft
      })
    },

    // 7. Success handling
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-event', projectId, eventId],
      })
    },

    // 8. Error handling
    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          domain: 'event/settings',
          action: 'update-share-options',
        },
        extra: {
          errorType: 'sharing-config-update-failure',
          projectId,
          eventId,
        },
      })
    },
  })
}
```

**Key Features**:
- Zod validation: `updateShareOptionsSchema.parse(input)`
- Deep merge: Preserves `sharing.socials` flags
- Lazy initialization: Creates draftConfig on first update
- Transaction: Atomic update with version increment
- Query invalidation: Triggers re-render
- Sentry: Reports all errors (no filtering needed)

**Testing**:
- [ ] Validates input with Zod
- [ ] Creates draftConfig if null
- [ ] Deep merges sharing.socials correctly
- [ ] Increments draftVersion
- [ ] Invalidates query cache
- [ ] Reports errors to Sentry

---

### Step 2.3: Create usePublishEvent Hook

**File**: `apps/clementine-app/src/domains/event/designer/hooks/usePublishEvent.ts`

**Implementation**:
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import type { UpdateData } from 'firebase/firestore'
import * as Sentry from '@sentry/tanstackstart-react'
import { firestore } from '@/integrations/firebase/client'
import type { ProjectEventFull } from '@/domains/event/shared/schemas'

export function usePublishEvent(projectId: string, eventId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      return await runTransaction(firestore, async (transaction) => {
        const eventRef = doc(firestore, `projects/${projectId}/events`, eventId)
        const eventDoc = await transaction.get(eventRef)

        if (!eventDoc.exists()) {
          throw new Error(`Event ${eventId} not found`)
        }

        const currentEvent = eventDoc.data() as ProjectEventFull

        // Validate draftConfig exists
        if (!currentEvent.draftConfig) {
          throw new Error('Cannot publish: no draft configuration exists')
        }

        // Copy draft → published
        const updateData: UpdateData<ProjectEventFull> = {
          publishedConfig: currentEvent.draftConfig,
          publishedVersion: currentEvent.draftVersion,
          publishedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }

        transaction.update(eventRef, updateData)

        return {
          eventId,
          publishedVersion: currentEvent.draftVersion,
        }
      })
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-event', projectId, eventId],
      })
    },

    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          domain: 'event/designer',
          action: 'publish-event',
        },
        extra: {
          errorType: 'event-publish-failure',
          projectId,
          eventId,
        },
      })
    },
  })
}
```

**Key Features**:
- Copies `draftConfig` → `publishedConfig`
- Syncs `publishedVersion` with `draftVersion`
- Updates `publishedAt` timestamp
- Validates draftConfig exists
- Transaction ensures atomicity

**Testing**:
- [ ] Copies draftConfig to publishedConfig
- [ ] Syncs publishedVersion
- [ ] Sets publishedAt timestamp
- [ ] Throws error if no draftConfig
- [ ] Invalidates query cache
- [ ] Reports errors to Sentry

---

### Step 2.4: Update Barrel Exports

**File**: `apps/clementine-app/src/domains/event/designer/index.ts`

**Add hook export**:
```typescript
export { usePublishEvent } from './hooks/usePublishEvent'
```

**File**: `apps/clementine-app/src/domains/event/settings/index.ts`

**Add hook export**:
```typescript
export { useUpdateShareOptions } from './hooks/useUpdateShareOptions'
```

**File**: `apps/clementine-app/src/domains/event/shared/index.ts`

**Add helper export**:
```typescript
export { updateEventConfigField } from './lib/updateEventConfigField'
```

---

## Phase 3: Sharing Settings UI

**Goal**: Create sharing configuration UI with auto-save.

### Step 3.1: Create SharingOptionCard Component

**File**: `apps/clementine-app/src/domains/event/settings/components/SharingOptionCard.tsx`

**Implementation**:
```tsx
import { Button } from '@/ui-kit/components/button'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface SharingOptionCardProps {
  icon: LucideIcon
  label: string
  description: string
  enabled: boolean
  onClick: () => void
}

export function SharingOptionCard({
  icon: Icon,
  label,
  description,
  enabled,
  onClick,
}: SharingOptionCardProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        'h-auto w-48 flex-col items-start gap-2 p-4',
        enabled
          ? 'border-blue-500 bg-blue-50 dark:border-blue-700 dark:bg-blue-950'
          : 'bg-muted',
      )}
      onClick={onClick}
      aria-pressed={enabled}
    >
      <Icon
        className={cn(
          'h-10 w-10',
          enabled ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground',
        )}
      />
      <span className="font-medium">{label}</span>
      <span className="text-left text-sm text-muted-foreground">{description}</span>
    </Button>
  )
}
```

**Key Features**:
- Fixed width: `w-48` (192px)
- Toggle on click: No visible toggle switch
- Visual states: OFF (muted) → ON (blue)
- Accessible: Button with `aria-pressed` attribute
- 44x44px+ touch target (h-auto with p-4)

**Testing**:
- [ ] Card is 192px wide (w-48)
- [ ] Click toggles aria-pressed attribute
- [ ] Background color changes when enabled (blue)
- [ ] Icon color changes when enabled
- [ ] Touch target >= 44x44px
- [ ] Keyboard accessible (focus ring, Enter/Space)

---

### Step 3.2: Create SharingSection Component

**File**: `apps/clementine-app/src/domains/event/settings/components/SharingSection.tsx`

**Implementation**:
```tsx
import { useForm } from 'react-hook-form'
import { Download, Link2, Mail, Instagram, Facebook, Linkedin, Twitter } from 'lucide-react'
import { FaTiktok, FaTelegram } from 'react-icons/fa'
import { SharingOptionCard } from './SharingOptionCard'
import { useUpdateShareOptions } from '../hooks/useUpdateShareOptions'
import { useAutoSave } from '@/shared/forms/hooks/useAutoSave'
import type { ProjectEventFull } from '@/domains/event/shared/schemas'

interface SharingFormValues {
  downloadEnabled: boolean
  copyLinkEnabled: boolean
  socials: {
    email: boolean
    instagram: boolean
    facebook: boolean
    linkedin: boolean
    twitter: boolean
    tiktok: boolean
    telegram: boolean
  }
}

interface SharingSectionProps {
  event: ProjectEventFull
  projectId: string
  eventId: string
}

export function SharingSection({ event, projectId, eventId }: SharingSectionProps) {
  const updateShareOptions = useUpdateShareOptions(projectId, eventId)

  const sharing = event.draftConfig?.sharing

  const form = useForm<SharingFormValues>({
    defaultValues: {
      downloadEnabled: sharing?.downloadEnabled ?? true,
      copyLinkEnabled: sharing?.copyLinkEnabled ?? true,
      socials: {
        email: sharing?.socials?.email ?? false,
        instagram: sharing?.socials?.instagram ?? false,
        facebook: sharing?.socials?.facebook ?? false,
        linkedin: sharing?.socials?.linkedin ?? false,
        twitter: sharing?.socials?.twitter ?? false,
        tiktok: sharing?.socials?.tiktok ?? false,
        telegram: sharing?.socials?.telegram ?? false,
      },
    },
  })

  const { handleBlur } = useAutoSave({
    form,
    originalValues: sharing ?? {},
    onUpdate: async (updates) => {
      await updateShareOptions.mutateAsync(updates)
    },
    fieldsToCompare: ['downloadEnabled', 'copyLinkEnabled', 'socials'],
    debounceMs: 300,
  })

  const toggleField = (field: keyof SharingFormValues | string) => {
    if (field === 'downloadEnabled' || field === 'copyLinkEnabled') {
      form.setValue(field, !form.watch(field), { shouldDirty: true })
    } else if (field.startsWith('socials.')) {
      const socialField = field.split('.')[1] as keyof SharingFormValues['socials']
      form.setValue(
        `socials.${socialField}`,
        !form.watch(`socials.${socialField}`),
        { shouldDirty: true },
      )
    }
  }

  return (
    <form onBlur={handleBlur} className="space-y-6">
      {/* Main Options */}
      <div>
        <h3 className="mb-4 text-lg font-medium">Main Options</h3>
        <div className="flex flex-wrap gap-3">
          <SharingOptionCard
            icon={Download}
            label="Download"
            description="Allow guests to download photos"
            enabled={form.watch('downloadEnabled')}
            onClick={() => toggleField('downloadEnabled')}
          />
          <SharingOptionCard
            icon={Link2}
            label="Copy Link"
            description="Allow guests to copy share link"
            enabled={form.watch('copyLinkEnabled')}
            onClick={() => toggleField('copyLinkEnabled')}
          />
        </div>
      </div>

      {/* Social Media */}
      <div>
        <h3 className="mb-4 text-lg font-medium">Social Media</h3>
        <div className="flex flex-wrap gap-3">
          <SharingOptionCard
            icon={Mail}
            label="Email"
            description="Share via email"
            enabled={form.watch('socials.email')}
            onClick={() => toggleField('socials.email')}
          />
          <SharingOptionCard
            icon={Instagram}
            label="Instagram"
            description="Share to Instagram"
            enabled={form.watch('socials.instagram')}
            onClick={() => toggleField('socials.instagram')}
          />
          <SharingOptionCard
            icon={Facebook}
            label="Facebook"
            description="Share to Facebook"
            enabled={form.watch('socials.facebook')}
            onClick={() => toggleField('socials.facebook')}
          />
          <SharingOptionCard
            icon={Linkedin}
            label="LinkedIn"
            description="Share to LinkedIn"
            enabled={form.watch('socials.linkedin')}
            onClick={() => toggleField('socials.linkedin')}
          />
          <SharingOptionCard
            icon={Twitter}
            label="Twitter"
            description="Share to Twitter/X"
            enabled={form.watch('socials.twitter')}
            onClick={() => toggleField('socials.twitter')}
          />
          <SharingOptionCard
            icon={FaTiktok}
            label="TikTok"
            description="Share to TikTok"
            enabled={form.watch('socials.tiktok')}
            onClick={() => toggleField('socials.tiktok')}
          />
          <SharingOptionCard
            icon={FaTelegram}
            label="Telegram"
            description="Share via Telegram"
            enabled={form.watch('socials.telegram')}
            onClick={() => toggleField('socials.telegram')}
          />
        </div>
      </div>
    </form>
  )
}
```

**Key Features**:
- Self-contained: Handles all sharing-related UI and logic
- React Hook Form: State management for sharing options
- Auto-save: `useAutoSave` hook with 300ms debounce
- Toggle handler: Updates form value, marks as dirty
- Responsive: `flex flex-wrap` for card layout
- Icons: Lucide + react-icons for TikTok/Telegram
- Props-based: Receives event data from parent (testable)

**Testing**:
- [ ] Form initializes with correct default values
- [ ] Clicking card toggles form value
- [ ] Auto-save triggers on blur after 300ms
- [ ] Mutation invalidates cache → re-render
- [ ] Cards wrap to next row on mobile

---

### Step 3.3: Create SettingsSharingPage Container

**File**: `apps/clementine-app/src/domains/event/settings/containers/SettingsSharingPage.tsx`

**Implementation**:
```tsx
import { useParams } from '@tanstack/react-router'
import { useProjectEvent } from '@/domains/event/shared/hooks/useProjectEvent'
import { SharingSection } from '../components/SharingSection'

export function SettingsSharingPage() {
  const { projectId, eventId } = useParams({ strict: false })
  const { data: event } = useProjectEvent(projectId!, eventId!)

  if (!event) return null

  return (
    <div className="space-y-8 p-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Configure your event settings
        </p>
      </div>

      {/* Sections */}
      <SharingSection event={event} projectId={projectId!} eventId={eventId!} />

      {/* Future sections */}
      {/* <OverlaysSection event={event} projectId={projectId!} eventId={eventId!} /> */}
    </div>
  )
}
```

**Key Features**:
- Thin container: Just renders section components
- Data loading: Fetches event data, passes to sections
- Page-level header: "Settings" title and description
- Extensible: Easy to add new sections (OverlaysSection, etc.)
- Clean separation: Page handles data, sections handle UI logic

**Testing**:
- [ ] Page renders with correct header
- [ ] SharingSection receives correct props
- [ ] Loading state handled (if event is null)
- [ ] Page is scrollable with multiple sections

---

### Step 3.4: Update Settings Route

**File**: `apps/clementine-app/src/app/workspace/$workspaceSlug.projects/$projectId.events/$eventId.settings.tsx`

**Before** (placeholder):
```tsx
import { EventSettingsPage } from '@/domains/event/settings'

export const Route = createFileRoute('...')({
  component: EventSettingsRoute,
})

function EventSettingsRoute() {
  return <EventSettingsPage />
}
```

**After** (use SettingsSharingPage):
```tsx
import { SettingsSharingPage } from '@/domains/event/settings'

export const Route = createFileRoute('...')({
  component: EventSettingsRoute,
})

function EventSettingsRoute() {
  return <SettingsSharingPage />
}
```

**Testing**:
- [ ] Settings route renders SettingsSharingPage
- [ ] Sharing options load correctly
- [ ] Auto-save works on blur

---

### Step 3.5: Update Barrel Exports

**File**: `apps/clementine-app/src/domains/event/settings/index.ts`

**Add exports**:
```typescript
// Components
export { SharingOptionCard } from './components/SharingOptionCard'
export { SharingSection } from './components/SharingSection'

// Containers
export { SettingsSharingPage } from './containers/SettingsSharingPage'

// Hooks
export { useUpdateShareOptions } from './hooks/useUpdateShareOptions'
```

**Note**: Only export components and containers that are used outside the settings domain. Internal components (like SharingOptionCard used only by SharingSection) can optionally stay non-exported.

---

## Phase 4: Validation & Testing

**Goal**: Ensure all features work correctly and meet acceptance criteria.

### Step 4.1: Manual Testing Checklist

**Architecture Refactor**:
- [ ] Route file is thin (data loader only)
- [ ] EventDesignerLayout owns complete UI
- [ ] EventDesignerTopBar shows correct breadcrumbs
- [ ] Domain structure follows DDD principles

**Sharing Settings UI**:
- [ ] All 9 sharing options render as cards
- [ ] Cards are 192px wide (w-48)
- [ ] Cards wrap automatically on mobile
- [ ] Click toggles card background color
- [ ] Form state updates on click
- [ ] Auto-save triggers on blur (300ms)

**Draft/Publish Workflow**:
- [ ] "New changes" badge shows when never published
- [ ] Badge shows when draftVersion > publishedVersion
- [ ] Badge hidden when draft === published
- [ ] Publish button enabled only when changes exist
- [ ] Publish button shows loading state
- [ ] After publish, badge disappears
- [ ] After publish, button disables

**Data Mutations**:
- [ ] useUpdateShareOptions increments draftVersion
- [ ] useUpdateShareOptions deep merges socials correctly
- [ ] usePublishEvent copies draft → published
- [ ] usePublishEvent syncs publishedVersion
- [ ] Mutations invalidate queries
- [ ] Errors reported to Sentry

**Mobile-First**:
- [ ] All buttons >= 44x44px touch target
- [ ] Layout works on 320px viewport
- [ ] Cards wrap on mobile
- [ ] Text is readable on mobile

---

### Step 4.2: Code Quality Validation

**Run before commit**:
```bash
cd apps/clementine-app
pnpm check          # Format + lint
pnpm type-check     # TypeScript
pnpm test           # Tests (if written)
```

**Expected output**: All checks pass ✅

---

### Step 4.3: Standards Compliance Review

**Frontend/Design System** (`frontend/design-system.md`):
- [ ] Using theme tokens (bg-blue-50, bg-muted, text-muted-foreground)
- [ ] Paired background/foreground colors (bg-blue-50 + text-blue-600)
- [ ] No hard-coded colors (hex values)

**Frontend/Component Libraries** (`frontend/component-libraries.md`):
- [ ] Using shadcn/ui Button as base
- [ ] Preserving accessibility (aria-pressed, focus rings)
- [ ] Following shadcn patterns (variant="outline", className={cn(...)})

**Global/Project Structure** (`global/project-structure.md`):
- [ ] Vertical slice architecture (event domain owns all)
- [ ] Organized by technical concern (components/, containers/, hooks/)
- [ ] Barrel exports in each subdomain
- [ ] No route file logic (thin wrapper)

**Global/Zod Validation** (`global/zod-validation.md`):
- [ ] All mutation inputs validated with Zod
- [ ] Schemas use Firestore-safe patterns (nullable, defaults)
- [ ] Runtime validation before Firestore operations

**Global/Client-First Architecture** (`global/client-first-architecture.md`):
- [ ] All mutations use Firestore client SDK
- [ ] No server functions created
- [ ] Security enforced by Firestore rules (not code)

---

## Phase 5: Deployment Checklist

**Pre-Deploy**:
- [ ] All manual tests pass
- [ ] Code quality validation passes
- [ ] Standards compliance verified
- [ ] Git branch clean (no uncommitted changes)

**Commit**:
```bash
git add .
git commit -m "feat: implement event settings sharing and draft/publish workflow

- Add EventDesignerLayout container for domain-owned UI
- Add EventDesignerTopBar with breadcrumbs and publish button
- Implement useUpdateShareOptions hook with deep merge
- Implement usePublishEvent hook for draft → published
- Create SharingOptionCard component with toggle behavior
- Create SettingsSharingPage with auto-save integration
- Refactor route file to thin wrapper (DDD compliance)
- Add version-based change detection (draftVersion > publishedVersion)

Closes #012"
```

**Push & Create PR**:
```bash
git push origin 012-event-settings-sharing-publish
gh pr create --title "feat: Event Settings - Sharing & Draft/Publish" --body "See spec: specs/012-event-settings-sharing-publish/spec.md"
```

**PR Review Checklist**:
- [ ] Code follows constitution principles
- [ ] Standards compliance verified
- [ ] Manual testing completed
- [ ] No console errors or warnings
- [ ] Mobile-first design verified
- [ ] Accessibility tested (keyboard navigation)

---

## Troubleshooting

### Issue: Auto-save not triggering

**Cause**: Form blur event not firing
**Solution**: Ensure `onBlur={handleBlur}` is on `<form>` element, not individual inputs

### Issue: Deep merge not preserving social flags

**Cause**: Shallow merge overwriting `socials` object
**Solution**: Verify deep merge logic in `useUpdateShareOptions`:
```typescript
socials: {
  ...currentSharing.socials, // Preserve
  ...validated.socials,      // Apply
}
```

### Issue: "New changes" badge not showing

**Cause**: `hasUnpublishedChanges` logic incorrect
**Solution**: Check `useMemo` in `EventDesignerLayout`:
```typescript
if (event.publishedVersion === null) return true
return event.draftVersion !== null && event.draftVersion > event.publishedVersion
```

### Issue: Publish button stays disabled

**Cause**: `isPublishing` state not resetting
**Solution**: Ensure `usePublishEvent` mutation properly handles `isPending` state

### Issue: Zod validation errors on serverTimestamp()

**Cause**: Not using `runTransaction()` with `serverTimestamp()`
**Solution**: Always use `runTransaction()` for operations with `serverTimestamp()`:
```typescript
return await runTransaction(firestore, async (transaction) => {
  // ... transaction logic
})
```

---

## Summary

**Implementation complete when**:
- ✅ All 5 phases done
- ✅ All manual tests pass
- ✅ Code quality validation passes
- ✅ Standards compliance verified
- ✅ PR created and reviewed

**Time estimate**: 6-8 hours for experienced developer following this guide

**Next feature**: Theme editor (theme tab) or Welcome editor (welcome tab)
