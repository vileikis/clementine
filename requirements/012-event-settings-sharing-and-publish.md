# 012: Event Settings - Sharing Configuration & Draft/Publish

**Status**: Draft
**Created**: 2026-01-05
**Domain**: Events (Event Designer)
**Depends On**: 011-events-domain-backbone.md

## Overview

Implement the **Settings tab** in the event designer with sharing configuration UI and the **draft/publish workflow** for event changes. This enables event creators to:

1. Configure sharing options (download, copy link, social media platforms)
2. Auto-save changes to draft configuration
3. Publish draft configuration to make it live for guests

This PRD also **refactors the event designer architecture** to move UI ownership from the route file to the event domain, following DDD principles.

## Goals & Objectives

### Primary Goals
1. ✅ Enable sharing configuration via toggleable cards with auto-save
2. ✅ Implement draft/publish workflow (detect changes, publish action)
3. ✅ Refactor event designer to domain-owned layout (thin routes)

### Success Criteria
- Event creators can enable/disable sharing options with instant visual feedback
- Changes auto-save to `draftConfig` without manual save button
- Visual indicator shows when unpublished changes exist
- Publish button copies draft → published config atomically
- Route file is lightweight (data loader only)

## Architecture Refactor: EventDesignerLayout

### Current Structure (Before)

```tsx
// Route file owns TopNavBar (heavy route)
function EventLayout() {
  return (
    <>
      <TopNavBar {...} />  {/* Route handles top bar */}
      <EventDesignerPage />  {/* Domain handles tabs */}
    </>
  )
}
```

**Problem**: Route file is heavy, event domain doesn't own all its UI.

### New Structure (After)

```tsx
// Route file is thin (data loader only)
function EventLayout() {
  const { event, project } = Route.useLoaderData()

  return <EventDesignerLayout event={event} project={project} />
}
```

**Event domain owns complete UI:**

```
@domains/event/
├── designer/
│   ├── components/
│   │   └── EventDesignerTopBar.tsx     # Event-specific top bar (NEW)
│   ├── containers/
│   │   ├── EventDesignerLayout.tsx     # Main layout shell (NEW)
│   │   └── EventDesignerPage.tsx       # Tabs navigation + outlet (EXISTING)
│   └── hooks/
│       └── usePublishEvent.ts          # Publish logic (NEW)
├── settings/
│   └── hooks/
│       └── useUpdateShareOptions.ts    # Sharing mutation (NEW)
└── shared/
    └── lib/
        └── updateEventConfigField.ts   # Shared transaction helper (NEW)
```

### EventDesignerLayout Component

**File**: `@domains/event/designer/containers/EventDesignerLayout.tsx`

**Responsibilities**:
- Owns top bar and tabs layout
- Manages draft/publish state
- Handles publish action
- Passes event data to child components

**Component Structure**:

```tsx
import { EventDesignerTopBar } from '../components/EventDesignerTopBar'
import { EventDesignerPage } from './EventDesignerPage'
import { useEventPublish } from '../hooks/useEventPublish'

interface EventDesignerLayoutProps {
  event: ProjectEventFull
  project: Project
}

export function EventDesignerLayout({ event, project }: EventDesignerLayoutProps) {
  const { workspaceSlug, projectId, eventId } = useParams({
    from: '/workspace/$workspaceSlug/projects/$projectId/events/$eventId',
  })

  const publishMutation = useEventPublish(projectId, eventId)

  // Detect unpublished changes
  const hasUnpublishedChanges =
    event.publishedVersion === null ||
    event.draftVersion > event.publishedVersion

  const handlePublish = async () => {
    await publishMutation.mutateAsync()
    toast.success('Event published successfully')
  }

  return (
    <>
      <EventDesignerTopBar
        event={event}
        project={project}
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        hasUnpublishedChanges={hasUnpublishedChanges}
        onPublish={handlePublish}
        isPublishing={publishMutation.isPending}
      />
      <EventDesignerPage />
    </>
  )
}
```

### EventDesignerTopBar Component

**File**: `@domains/event/designer/components/EventDesignerTopBar.tsx`

**Responsibilities**:
- Renders breadcrumbs
- Shows "New changes" indicator when draft != published
- Renders preview button (placeholder for now)
- Renders publish button (enabled/disabled based on changes)

**Component Structure**:

```tsx
import { TopNavBar } from '@/domains/navigation'
import { FolderOpen, Play, Upload } from 'lucide-react'
import { Badge } from '@/ui-kit/components/badge'

interface EventDesignerTopBarProps {
  event: ProjectEventFull
  project: Project
  workspaceSlug: string
  projectId: string
  hasUnpublishedChanges: boolean
  onPublish: () => void
  isPublishing: boolean
}

export function EventDesignerTopBar({
  event,
  project,
  workspaceSlug,
  projectId,
  hasUnpublishedChanges,
  onPublish,
  isPublishing,
}: EventDesignerTopBarProps) {
  const projectPath = `/workspace/${workspaceSlug}/projects/${projectId}`
  const projectsListPath = `/workspace/${workspaceSlug}/projects`

  return (
    <TopNavBar
      breadcrumbs={[
        {
          label: project.name,
          href: projectPath,
          icon: FolderOpen,
          iconHref: projectsListPath,
        },
        {
          label: event.name,
        },
      ]}
      actions={[
        // "New changes" indicator (only when changes exist)
        ...(hasUnpublishedChanges ? [{
          customContent: (
            <Badge variant="secondary" className="gap-1.5">
              <span className="h-2 w-2 rounded-full bg-yellow-500" />
              New changes
            </Badge>
          ),
        }] : []),

        // Preview button (placeholder)
        {
          icon: Play,
          onClick: () => {}, // No-op for now
          variant: 'ghost' as const,
          ariaLabel: 'Preview event',
        },

        // Publish button
        {
          label: 'Publish',
          icon: Upload,
          onClick: onPublish,
          variant: 'default' as const,
          ariaLabel: 'Publish event',
          disabled: !hasUnpublishedChanges || isPublishing,
        },
      ]}
    />
  )
}
```

**Key Features**:
- **Yellow circle badge**: Shows "New changes" when `hasUnpublishedChanges === true`
- **Publish button states**:
  - Disabled when `!hasUnpublishedChanges` (draft === published)
  - Disabled when `isPublishing` (mutation in progress)
  - Enabled when changes exist and not publishing
- **Preview button**: Placeholder (no functionality in this PRD)

## Sharing Settings UI

### Settings Tab Route

**File**: `@app/workspace/$workspaceSlug.projects/$projectId.events/$eventId.settings.tsx`

**Update from WIP placeholder to real implementation:**

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { SettingsSharingPage } from '@/domains/event/settings'

export const Route = createFileRoute(
  '/workspace/$workspaceSlug/projects/$projectId/events/$eventId/settings'
)({
  component: SettingsSharingPage,
})
```

### SettingsSharingPage Container

**File**: `@domains/event/settings/containers/SettingsSharingPage.tsx`

**Layout**:
```
┌────────────────────────────────────────────────────┐
│  Sharing Settings                                  │
│  Configure how guests can share their photos       │
│                                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ Download │ │ Copy Link│ │ Email    │          │
│  └──────────┘ └──────────┘ └──────────┘          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ Instagram│ │ Facebook │ │ LinkedIn │          │
│  └──────────┘ └──────────┘ └──────────┘          │
│  ┌──────────┐ ┌──────────┐                       │
│  │ Twitter  │ │ TikTok   │                       │
│  └──────────┘ └──────────┘                       │
└────────────────────────────────────────────────────┘
```

**Component Structure**:

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form } from '@/ui-kit/components/form'
import { SharingOptionCard } from '../components/SharingOptionCard'
import { sharingConfigSchema } from '../../shared/schemas'
import { useAutoSave } from '@/shared/forms/hooks/useAutoSave'
import { useUpdateShareOptions } from '../hooks/useUpdateShareOptions'

export function SettingsSharingPage() {
  const { projectId, eventId } = useParams({
    from: '/workspace/$workspaceSlug/projects/$projectId/events/$eventId/settings',
  })
  const { event } = Route.useLoaderData({
    from: '/workspace/$workspaceSlug/projects/$projectId/events/$eventId',
  })

  const updateShareOptions = useUpdateShareOptions(projectId, eventId)

  // Initialize form with current sharing config (or defaults)
  const form = useForm({
    resolver: zodResolver(sharingConfigSchema),
    defaultValues: event.draftConfig?.sharing || {
      downloadEnabled: true,
      copyLinkEnabled: true,
      socials: null,
    },
  })

  // Auto-save on blur
  const { handleBlur } = useAutoSave({
    form,
    originalValues: event.draftConfig?.sharing,
    onUpdate: async (updates) => {
      await updateShareOptions.mutateAsync(updates)
    },
    fieldsToCompare: ['downloadEnabled', 'copyLinkEnabled', 'socials'],
  })

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Sharing Settings</h2>
        <p className="text-muted-foreground mt-2">
          Configure how guests can share their photos
        </p>
      </div>

      <Form {...form}>
        <form onBlur={handleBlur}>
          {/* Main sharing options */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Main Options</h3>
            <div className="flex flex-wrap gap-3">
              <SharingOptionCard
                icon={<Download className="h-5 w-5" />}
                label="Download"
                description="Allow guests to download their photos"
                name="downloadEnabled"
              />
              <SharingOptionCard
                icon={<Link className="h-5 w-5" />}
                label="Copy Link"
                description="Allow guests to copy photo links"
                name="copyLinkEnabled"
              />
            </div>
          </div>

          {/* Social media options */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Social Media</h3>
            <div className="flex flex-wrap gap-3">
              <SharingOptionCard
                icon={<Mail className="h-5 w-5" />}
                label="Email"
                description="Share via email"
                name="socials.email"
              />
              <SharingOptionCard
                icon={<Instagram className="h-5 w-5" />}
                label="Instagram"
                description="Share to Instagram"
                name="socials.instagram"
              />
              <SharingOptionCard
                icon={<Facebook className="h-5 w-5" />}
                label="Facebook"
                description="Share to Facebook"
                name="socials.facebook"
              />
              <SharingOptionCard
                icon={<Linkedin className="h-5 w-5" />}
                label="LinkedIn"
                description="Share to LinkedIn"
                name="socials.linkedin"
              />
              <SharingOptionCard
                icon={<Twitter className="h-5 w-5" />}
                label="Twitter"
                description="Share to Twitter"
                name="socials.twitter"
              />
              <SharingOptionCard
                icon={<Music className="h-5 w-5" />}
                label="TikTok"
                description="Share to TikTok"
                name="socials.tiktok"
              />
              <SharingOptionCard
                icon={<Send className="h-5 w-5" />}
                label="Telegram"
                description="Share to Telegram"
                name="socials.telegram"
              />
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
```

### SharingOptionCard Component

**File**: `@domains/event/settings/components/SharingOptionCard.tsx`

**Design**: Fixed-width toggleable card with background color change.

**Visual States**:
```
OFF State (bg-muted):
┌──────────────────────┐
│  📥  Download        │
│  Allow guests to     │
│  download photos     │
└──────────────────────┘

ON State (bg-blue-50 dark:bg-blue-950):
┌──────────────────────┐
│  📥  Download        │  ← Colored background
│  Allow guests to     │
│  download photos     │
└──────────────────────┘
```

**Component Structure**:

```tsx
import { useController, useFormContext } from 'react-hook-form'
import { cn } from '@/lib/utils'

interface SharingOptionCardProps {
  icon: React.ReactNode
  label: string
  description: string
  name: string  // React Hook Form field name (e.g., "downloadEnabled", "socials.email")
}

export function SharingOptionCard({
  icon,
  label,
  description,
  name,
}: SharingOptionCardProps) {
  const { control } = useFormContext()
  const { field } = useController({ control, name })

  const isEnabled = Boolean(field.value)

  const handleToggle = () => {
    field.onChange(!isEnabled)
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={cn(
        'w-48 p-4 rounded-lg border-2 transition-all text-left',
        'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring',
        isEnabled
          ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
          : 'bg-muted border-border hover:bg-muted/80'
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          'mt-0.5',
          isEnabled ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'
        )}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className={cn(
            'font-semibold mb-1',
            isEnabled ? 'text-blue-900 dark:text-blue-100' : 'text-foreground'
          )}>
            {label}
          </div>
          <div className={cn(
            'text-sm',
            isEnabled ? 'text-blue-700 dark:text-blue-300' : 'text-muted-foreground'
          )}>
            {description}
          </div>
        </div>
      </div>
    </button>
  )
}
```

**Key Features**:
- **Fixed width**: `w-48` (192px) - cards maintain consistent size
- **Flex wrap**: Parent container uses `flex flex-wrap gap-3`
- **Background color**: Changes from `bg-muted` to `bg-blue-50` when enabled
- **Border color**: Changes from `border-border` to `border-blue-200` when enabled
- **Text color**: Icon and text get blue tint when enabled
- **Accessible**: Uses button with keyboard focus ring
- **Responsive**: Cards wrap to next row automatically

## Data Flow & Mutations

### Domain-Specific Hook Architecture

**Philosophy**: Each subdomain owns its own mutation hooks for better type safety, domain ownership, and maintainability.

**Structure**:
```
@domains/event/
├── theme/hooks/useUpdateTheme.ts           # Future: Theme mutations
├── welcome/hooks/useUpdateWelcome.ts       # Future: Welcome mutations
├── settings/hooks/
│   ├── useUpdateShareOptions.ts            # Sharing mutations (THIS PRD)
│   └── useUpdateOverlays.ts                # Future: Overlays mutations
└── shared/lib/
    └── updateEventConfigField.ts           # Shared Firestore transaction logic
```

**Benefits**:
- ✅ **Domain ownership**: Settings domain owns sharing mutations
- ✅ **Type safety**: Hook validates against `SharingConfig` schema, not generic `ProjectEventConfig`
- ✅ **Clear intent**: `useUpdateShareOptions()` is more explicit than `useUpdateEventConfig({ sharing: ... })`
- ✅ **No duplication**: Shared transaction helper ensures consistency
- ✅ **Easy testing**: Test sharing mutations independently from theme mutations

### Shared Transaction Helper

**File**: `@domains/event/shared/lib/updateEventConfigField.ts`

**Purpose**: Reusable Firestore transaction logic for updating any field in `draftConfig`.

**Implementation**:

```typescript
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { firestore } from '@/integrations/firebase/client'
import type { ProjectEventConfig } from '../schemas'

/**
 * Update a specific field in event draft configuration
 *
 * Shared transaction helper used by all domain-specific update hooks.
 * Handles lazy initialization, version incrementing, and atomicity.
 *
 * @param projectId - Project ID
 * @param eventId - Event ID
 * @param field - Field name in ProjectEventConfig (e.g., 'theme', 'sharing', 'overlays')
 * @param value - Validated value to set
 * @returns Promise with updated event ID and config
 *
 * @example
 * ```typescript
 * // Used by useUpdateShareOptions
 * await updateEventConfigField(projectId, eventId, 'sharing', validatedSharing)
 * ```
 */
export async function updateEventConfigField<
  K extends keyof ProjectEventConfig
>(
  projectId: string,
  eventId: string,
  field: K,
  value: ProjectEventConfig[K]
) {
  return await runTransaction(firestore, async (transaction) => {
    const eventRef = doc(firestore, `projects/${projectId}/events`, eventId)

    // Read current event (all reads before writes in transaction)
    const eventDoc = await transaction.get(eventRef)
    if (!eventDoc.exists()) {
      throw new Error('Event not found')
    }

    const event = eventDoc.data()

    // Lazy initialization: create draftConfig if doesn't exist
    const currentDraft = event.draftConfig || { schemaVersion: 1 }
    const currentVersion = event.draftVersion || 1

    // Update specific field
    const updatedConfig = {
      ...currentDraft,
      [field]: value,
    }

    // Update with incremented version
    transaction.update(eventRef, {
      draftConfig: updatedConfig,
      draftVersion: currentVersion + 1,
      updatedAt: serverTimestamp(),
    })

    return { eventId, config: updatedConfig }
  })
}
```

**Key Features**:
- ✅ Generic over `ProjectEventConfig` keys (type-safe field access)
- ✅ Lazy initialization (creates `draftConfig` on first update)
- ✅ Increments `draftVersion` on every update
- ✅ Transaction ensures atomicity with `serverTimestamp()`
- ✅ Reusable across all subdomains (theme, welcome, settings)

### useUpdateShareOptions Hook

**File**: `@domains/event/settings/hooks/useUpdateShareOptions.ts`

**Purpose**: Update sharing configuration with deep merge for nested `socials` object.

**Implementation**:

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import * as Sentry from '@sentry/tanstackstart-react'
import { firestore } from '@/integrations/firebase/client'
import { sharingConfigSchema, type SharingConfig } from '../../shared/schemas'

/**
 * Update sharing options in event draft configuration
 *
 * Domain-specific hook for settings subdomain.
 * Handles deep merge for nested socials object.
 *
 * @example
 * ```tsx
 * const updateShareOptions = useUpdateShareOptions(projectId, eventId)
 *
 * // Update download option
 * await updateShareOptions.mutateAsync({ downloadEnabled: true })
 *
 * // Update social media options (deep merged)
 * await updateShareOptions.mutateAsync({
 *   socials: { instagram: true, facebook: true }
 * })
 * ```
 */
export function useUpdateShareOptions(projectId: string, eventId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updates: Partial<SharingConfig>) => {
      // Validate updates against sharing schema
      const validated = sharingConfigSchema.partial().parse(updates)

      return await runTransaction(firestore, async (transaction) => {
        const eventRef = doc(firestore, `projects/${projectId}/events`, eventId)

        // Read current event (all reads before writes)
        const eventDoc = await transaction.get(eventRef)
        if (!eventDoc.exists()) {
          throw new Error('Event not found')
        }

        const event = eventDoc.data()

        // Lazy initialization: create draftConfig and sharing defaults
        const currentDraft = event.draftConfig || { schemaVersion: 1 }
        const currentSharing = currentDraft.sharing || {
          downloadEnabled: true,
          copyLinkEnabled: true,
          socials: null,
        }

        // Deep merge sharing config (handle nested socials object)
        const updatedSharing: SharingConfig = {
          ...currentSharing,
          ...validated,
          // Special handling for nested socials
          ...(validated.socials && {
            socials: {
              ...currentSharing.socials,
              ...validated.socials,
            },
          }),
        }

        const currentVersion = event.draftVersion || 1

        // Update with incremented version
        transaction.update(eventRef, {
          draftConfig: {
            ...currentDraft,
            sharing: updatedSharing,
          },
          draftVersion: currentVersion + 1,
          updatedAt: serverTimestamp(),
        })

        return { eventId }
      })
    },
    onSuccess: () => {
      // Invalidate event query to refetch updated data
      queryClient.invalidateQueries({
        queryKey: ['projectEvent', projectId, eventId],
      })
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          domain: 'event/settings',
          action: 'update-share-options',
        },
        extra: {
          projectId,
          eventId,
        },
      })
    },
  })
}
```

**Why Not Use Shared Helper Here?**

This hook implements custom deep merge logic for `sharing.socials` instead of using `updateEventConfigField`.

**Rationale**:
- `sharing` has nested `socials` object that requires deep merge
- Updating `socials.instagram` should preserve other social flags
- Simple field replacement would lose existing social settings
- Domain-specific logic belongs in domain-specific hook

**Future Domain Hooks**:

For simple fields without nested objects, use the shared helper:

```typescript
// @domains/event/theme/hooks/useUpdateTheme.ts (FUTURE)
export function useUpdateTheme(projectId: string, eventId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (theme: Theme) => {
      const validated = themeSchema.parse(theme)
      return await updateEventConfigField(projectId, eventId, 'theme', validated)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['projectEvent', projectId, eventId],
      })
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: { domain: 'event/theme', action: 'update-theme' },
      })
    },
  })
}
```

**Key Features**:
- ✅ Domain ownership (settings domain owns hook)
- ✅ Type safety (validates `Partial<SharingConfig>`, not generic config)
- ✅ Deep merge (preserves existing socials when updating one platform)
- ✅ Lazy initialization (creates sharing defaults on first update)
- ✅ Increments `draftVersion` on every update
- ✅ Transaction ensures atomicity

### usePublishEvent Hook

**File**: `@domains/event/designer/hooks/usePublishEvent.ts`

**Purpose**: Publish draft configuration to make it live for guests.

**Implementation**:

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import * as Sentry from '@sentry/tanstackstart-react'
import { firestore } from '@/integrations/firebase/client'

/**
 * Publish event configuration mutation
 *
 * Copies draftConfig → publishedConfig atomically.
 * Updates publishedVersion and publishedAt timestamp.
 *
 * @example
 * ```tsx
 * const publishEvent = usePublishEvent(projectId, eventId)
 *
 * await publishEvent.mutateAsync()
 * toast.success('Event published!')
 * ```
 */
export function usePublishEvent(projectId: string, eventId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      return await runTransaction(firestore, async (transaction) => {
        const eventRef = doc(firestore, `projects/${projectId}/events`, eventId)

        // Read current event (all reads before writes)
        const eventDoc = await transaction.get(eventRef)
        if (!eventDoc.exists()) {
          throw new Error('Event not found')
        }

        const event = eventDoc.data()

        // Validate draftConfig exists
        if (!event.draftConfig) {
          throw new Error('No draft configuration to publish')
        }

        // Publish: copy draft → published
        transaction.update(eventRef, {
          publishedConfig: event.draftConfig,
          publishedVersion: event.draftVersion,
          publishedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })

        return { eventId }
      })
    },
    onSuccess: () => {
      // Invalidate event query to refetch and update UI
      queryClient.invalidateQueries({
        queryKey: ['projectEvent', projectId, eventId],
      })
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          domain: 'event',
          action: 'publish-event',
        },
        extra: {
          projectId,
          eventId,
        },
      })
    },
  })
}
```

**Key Features**:
- ✅ Copies `draftConfig` → `publishedConfig`
- ✅ Updates `publishedVersion` to match `draftVersion`
- ✅ Sets `publishedAt` timestamp
- ✅ Transaction ensures atomicity
- ✅ Invalidates query to update UI (remove "New changes" badge)

### Auto-Save Integration

**How it works**:

1. User edits sharing settings (clicks toggle card)
2. React Hook Form updates form state
3. User focuses out of form (blur event)
4. `useAutoSave` hook triggers after debounce (300ms)
5. `useAutoSave` detects changed fields
6. Calls `useUpdateShareOptions.mutateAsync()`
7. Mutation updates Firestore (deep merge for socials)
8. Query invalidation triggers re-render
9. `draftVersion` increments
10. Top bar shows "New changes" badge

**Flow Diagram**:

```
User clicks card → Form state updates → Blur event
                                           ↓
                                    Debounce 300ms
                                           ↓
                                  Detect changed fields
                                           ↓
                              useUpdateShareOptions.mutateAsync()
                                           ↓
                              Transaction: Update Firestore
                              - Deep merge sharing config
                              - draftConfig.sharing = {...merged}
                              - draftVersion++
                              - updatedAt = serverTimestamp()
                                           ↓
                              Query invalidation
                                           ↓
                              UI re-renders
                              - "New changes" badge appears
                              - Publish button enabled
```

## Draft/Publish State Machine

### States

1. **Never Published** (`publishedVersion === null`)
   - Badge: "New changes" (yellow)
   - Publish button: Enabled
   - Meaning: Event has draft config but never published

2. **Published, No Changes** (`draftVersion === publishedVersion`)
   - Badge: Hidden
   - Publish button: Disabled
   - Meaning: Draft and published are in sync

3. **Published, New Changes** (`draftVersion > publishedVersion`)
   - Badge: "New changes" (yellow)
   - Publish button: Enabled
   - Meaning: Draft has unpublished changes

4. **Publishing** (mutation in progress)
   - Badge: "New changes" (yellow)
   - Publish button: Disabled (loading spinner)
   - Meaning: Publish operation in progress

### State Transitions

```
Initial State (Never Published)
publishedVersion: null
draftVersion: 1
        ↓
   [User edits]
        ↓
draftVersion: 2
publishedVersion: null
hasChanges: true (show badge, enable publish)
        ↓
   [User clicks Publish]
        ↓
Publishing...
isPublishing: true (disable button)
        ↓
   [Success]
        ↓
publishedVersion: 2
draftVersion: 2
hasChanges: false (hide badge, disable publish)
        ↓
   [User edits again]
        ↓
draftVersion: 3
publishedVersion: 2
hasChanges: true (show badge, enable publish)
```

## Implementation Checklist

### Phase 1: Architecture Refactor

- [ ] Create `EventDesignerLayout.tsx` container
- [ ] Create `EventDesignerTopBar.tsx` component
- [ ] Update route file to use `EventDesignerLayout`
- [ ] Move top bar logic from route to event domain
- [ ] Test navigation and layout rendering

### Phase 2: Shared Transaction Helper & Mutation Hooks

- [ ] Create `updateEventConfigField.ts` shared helper in `@domains/event/shared/lib/`
- [ ] Add lazy initialization logic to helper
- [ ] Add generic type safety for field access
- [ ] Create `useUpdateShareOptions.ts` hook in `@domains/event/settings/hooks/`
- [ ] Add deep merge logic for nested socials object
- [ ] Create `usePublishEvent.ts` hook in `@domains/event/designer/hooks/`
- [ ] Add error handling and Sentry reporting to both hooks
- [ ] Test hooks with Firestore

### Phase 3: Sharing Settings UI

- [ ] Create `SettingsSharingPage.tsx` container
- [ ] Create `SharingOptionCard.tsx` component
- [ ] Implement toggle card visual states
- [ ] Integrate React Hook Form
- [ ] Integrate `useAutoSave` hook
- [ ] Test form state management

### Phase 4: Draft/Publish Integration

- [ ] Add `hasUnpublishedChanges` logic to layout
- [ ] Render "New changes" badge conditionally
- [ ] Wire up publish button to `usePublishEvent`
- [ ] Handle loading states during publish
- [ ] Test complete flow (edit → auto-save → publish)

### Phase 5: Polish & Testing

- [ ] Add toast notifications (success/error)
- [ ] Add loading indicators
- [ ] Test edge cases (no draft config, publish errors)
- [ ] Test accessibility (keyboard navigation)
- [ ] Verify auto-save debouncing works correctly

## Acceptance Criteria

### Architecture
- [ ] `EventDesignerLayout` is the top-level component in event domain
- [ ] Route file only loads data and passes to layout
- [ ] Top bar logic lives in event domain, not route
- [ ] EventDesignerPage remains focused on tabs navigation

### Sharing Settings UI
- [ ] All sharing options render as toggleable cards
- [ ] Cards have fixed width (`w-48`) and wrap automatically
- [ ] Cards change background color when toggled (muted → blue)
- [ ] Form integrates with React Hook Form
- [ ] Auto-save triggers on blur with 300ms debounce

### Draft/Publish Workflow
- [ ] "New changes" badge shows when `draftVersion > publishedVersion`
- [ ] Badge hidden when draft === published
- [ ] Publish button enabled only when changes exist
- [ ] Publish button shows loading state during mutation
- [ ] Clicking publish copies draft → published atomically
- [ ] After publish, badge disappears and button disables

### Data Mutations
- [ ] `updateEventConfigField` helper provides reusable transaction logic
- [ ] `updateEventConfigField` creates `draftConfig` on first update (lazy init)
- [ ] `updateEventConfigField` increments `draftVersion` on every update
- [ ] `useUpdateShareOptions` deep merges `sharing.socials` correctly
- [ ] `useUpdateShareOptions` validates against `SharingConfig` schema
- [ ] `usePublishEvent` copies draft → published atomically
- [ ] All hooks invalidate queries and trigger re-renders
- [ ] Errors reported to Sentry with correct tags and domain context

### Code Quality
- [ ] Follows DDD principles (domain owns UI)
- [ ] Follows mutation hook patterns (see reference hooks)
- [ ] TypeScript strict mode passes
- [ ] No console errors or warnings
- [ ] Accessible (keyboard navigation, focus states)

## Out of Scope

- ❌ **Preview functionality**: Preview button is a placeholder (no action)
- ❌ **Theme editor**: Theme tab remains WIP
- ❌ **Welcome editor**: Welcome tab remains WIP
- ❌ **Overlays upload**: Settings tab only has sharing for now
- ❌ **Publish confirmation dialog**: Direct publish without confirmation
- ❌ **Version history UI**: No UI for viewing past versions
- ❌ **Rollback**: No ability to revert to previous published version
- ❌ **Publish scheduling**: Publish happens immediately

## Future Considerations

- **Preview Mode**: Preview button should open guest view with draft config
- **Publish Confirmation**: Add confirmation dialog for destructive publishes
- **Version History**: Show timeline of published versions
- **Rollback**: Ability to revert to previous published config
- **Publish Scheduling**: Schedule publish for specific date/time
- **Change Summary**: Show diff between draft and published before publishing
- **Auto-Publish**: Option to auto-publish on save (no draft mode)

## References

- **Parent PRD**: `requirements/011-events-domain-backbone.md`
- **Auto-Save Hook**: `@apps/clementine-app/src/shared/forms/hooks/useAutoSave.ts`
- **Reference Hooks**:
  - `@domains/project/events/hooks/useRenameProjectEvent.ts`
  - `@domains/workspace/settings/hooks/useUpdateWorkspace.ts`
- **Event Schemas**: `@domains/event/shared/schemas/`
- **TopNavBar Component**: `@domains/navigation/components/TopNavBar.tsx`
- **Zod Standards**: `@standards/global/zod-validation.md`
- **DDD Standards**: `@standards/global/project-structure.md`

## Notes

### Design Decisions

1. **Fixed-width cards**: Ensures visual consistency and prevents layout shifts
2. **Flex wrap**: Responsive without media queries, adapts to container width
3. **Background color toggle**: Clear visual feedback without explicit toggle switch
4. **Version-based change detection**: Simpler than deep equality, more reliable
5. **No publish confirmation**: Not destructive (can always make new changes)
6. **Auto-save on blur**: Better UX than manual save button

### Technical Decisions

1. **Lazy initialization**: Don't create `draftConfig` until first edit
2. **Increment version every time**: Predictable, avoids deep equality complexity
3. **Domain-specific hooks**: Each subdomain owns its mutation hooks (theme, welcome, settings)
4. **Shared transaction helper**: `updateEventConfigField` for simple field updates, custom logic for complex merges
5. **Deep merge in hook**: `useUpdateShareOptions` handles nested `socials` object
6. **Transaction for publish**: Ensures atomicity with `serverTimestamp()`
7. **Query invalidation**: Trigger re-renders after mutations
8. **Domain-owned layout**: Thin routes, fat domains (DDD principle)
