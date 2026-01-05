# Research: Event Settings - Sharing Configuration & Draft/Publish

**Feature**: 012-event-settings-sharing-publish
**Date**: 2026-01-05
**Status**: Complete

## Overview

This document consolidates research findings for implementing the event settings sharing configuration and draft/publish workflow. All technical decisions are based on existing codebase patterns and proven solutions.

## Research Areas

### 1. Firestore Transaction Patterns for Config Updates

**Question**: How should we handle Firestore updates for nested configuration objects with lazy initialization and version tracking?

**Research Sources**:
- Existing mutation hooks: `useRenameProjectEvent.ts`, `useUpdateWorkspace.ts`
- Firebase documentation on transactions
- Current event schemas: `project-event-config.schema.ts`, `project-event-full.schema.ts`

**Decision**: Use `runTransaction()` with `serverTimestamp()` for all config updates

**Rationale**:
- **Atomicity**: Transactions ensure lazy initialization and version increment happen together
- **Timestamp resolution**: Using `runTransaction()` ensures `serverTimestamp()` resolves before real-time listeners fire, preventing Zod validation errors
- **Proven pattern**: All existing mutation hooks use this pattern successfully
- **Type safety**: TypeScript + Zod validation catches errors at compile time and runtime

**Implementation Pattern**:
```typescript
return await runTransaction(firestore, async (transaction) => {
  const eventRef = doc(firestore, `projects/${projectId}/events`, eventId)
  const eventDoc = await transaction.get(eventRef)

  if (!eventDoc.exists()) {
    throw new Error(`Event ${eventId} not found`)
  }

  const currentEvent = eventDoc.data() as ProjectEventFull
  const currentDraft = currentEvent.draftConfig ?? {}
  const currentVersion = currentEvent.draftVersion ?? 0

  // Deep merge for nested objects like sharing.socials
  const updatedDraft: ProjectEventConfig = {
    ...currentDraft,
    sharing: {
      ...currentDraft.sharing,
      ...validated, // Validated sharing config
    },
  }

  transaction.update(eventRef, {
    draftConfig: updatedDraft,
    draftVersion: currentVersion + 1,
    updatedAt: serverTimestamp(),
  })
})
```

**Alternatives Considered**:
- ❌ **updateDoc without transaction**: Risk of race conditions with concurrent updates
- ❌ **Server-side Cloud Function**: Violates client-first architecture, adds latency
- ❌ **Optimistic updates only**: Inconsistent state if update fails

---

### 2. Deep Merge Strategy for Nested Sharing Config

**Question**: How should we handle partial updates to `sharing.socials` without overwriting other social flags?

**Research Sources**:
- `sharingConfigSchema` in `project-event-config.schema.ts`
- Existing update patterns in workspace and project mutations
- React Hook Form field-level updates

**Decision**: Implement deep merge for `sharing.socials`, shallow merge for top-level fields

**Rationale**:
- **Preserve user data**: Updating `instagram: true` shouldn't reset `facebook: false`
- **Firestore limitation**: Firestore doesn't support partial object updates without merge: true
- **Transaction control**: Manual deep merge in transaction gives full control over merge logic
- **Type safety**: Zod validation ensures merged object matches schema

**Implementation Pattern**:
```typescript
// In useUpdateShareOptions mutation
const validated = sharingConfigSchema.parse(input)
const currentSharing = currentEvent.draftConfig?.sharing ?? {}

const updatedSharing: SharingConfig = {
  downloadEnabled: validated.downloadEnabled ?? currentSharing.downloadEnabled ?? true,
  copyLinkEnabled: validated.copyLinkEnabled ?? currentSharing.copyLinkEnabled ?? true,
  socials: {
    ...currentSharing.socials, // Preserve existing flags
    ...validated.socials,      // Apply updates
  },
}
```

**Alternatives Considered**:
- ❌ **Shallow merge only**: Would overwrite nested socials object entirely
- ❌ **Firestore merge: true**: Not granular enough for nested objects
- ❌ **Always send full object**: Inefficient, requires client to track all fields

---

### 3. Auto-Save Integration with React Hook Form

**Question**: How should we integrate auto-save with React Hook Form for optimal UX?

**Research Sources**:
- Existing `useAutoSave` hook in `src/shared/forms/hooks/useAutoSave.ts`
- `form-diff.ts` utility for change detection
- React Hook Form documentation on blur events

**Decision**: Use existing `useAutoSave` hook with blur events and 300ms debounce

**Rationale**:
- **Proven solution**: Already used successfully in workspace/project forms
- **UX familiarity**: Blur-based auto-save matches Google Docs behavior
- **Performance**: 300ms debounce prevents excessive Firestore writes
- **Type safety**: Hook is fully typed with React Hook Form generics

**Implementation Pattern**:
```typescript
const form = useForm<SharingFormValues>({
  defaultValues: {
    downloadEnabled: event.draftConfig?.sharing?.downloadEnabled ?? true,
    copyLinkEnabled: event.draftConfig?.sharing?.copyLinkEnabled ?? true,
    socials: event.draftConfig?.sharing?.socials ?? {},
  },
})

const { handleBlur } = useAutoSave({
  form,
  originalValues: event.draftConfig?.sharing ?? {},
  onUpdate: async (updates) => {
    await updateShareOptions.mutateAsync(updates)
  },
  fieldsToCompare: ['downloadEnabled', 'copyLinkEnabled', 'socials'],
  debounceMs: 300,
})

return <form onBlur={handleBlur}>...</form>
```

**Alternatives Considered**:
- ❌ **onChange auto-save**: Too aggressive, causes excessive writes
- ❌ **Manual save button**: More cognitive load, less modern UX
- ❌ **Fixed interval auto-save**: Writes even when no changes, wastes resources

---

### 4. Version-Based Change Detection

**Question**: How should we detect unpublished changes for the "New changes" badge?

**Research Sources**:
- Existing `draftVersion` and `publishedVersion` fields in `project-event-full.schema.ts`
- Git-style version tracking patterns
- TanStack Query cache synchronization

**Decision**: Compare `draftVersion > publishedVersion` for change detection

**Rationale**:
- **Simple logic**: Integer comparison is fast and reliable
- **No deep comparison**: Avoids expensive object diffing on every render
- **Version increments**: Every auto-save increments `draftVersion`, making changes instantly visible
- **Reliable**: Version numbers never lie (unlike deep equality which can miss changes)

**Implementation Pattern**:
```typescript
// In EventDesignerLayout
const hasUnpublishedChanges = useMemo(() => {
  if (event.publishedVersion === null) return true // Never published
  return event.draftVersion > event.publishedVersion // New changes
}, [event.draftVersion, event.publishedVersion])
```

**Alternatives Considered**:
- ❌ **Deep equality check**: Expensive, can miss semantic changes
- ❌ **Timestamp comparison**: Unreliable with concurrent users
- ❌ **Dirty flag**: Requires manual tracking, error-prone

---

### 5. Component Library Usage (shadcn/ui vs Custom)

**Question**: Which UI components should we use for the sharing option cards?

**Research Sources**:
- `apps/clementine-app/CLAUDE.md` - Component library standards
- shadcn/ui documentation
- Radix UI primitives
- Existing button patterns in codebase

**Decision**: Use shadcn/ui Button as base, custom SharingOptionCard component

**Rationale**:
- **shadcn/ui Button**: Provides accessibility, focus states, variants out of the box
- **Custom card logic**: Toggle behavior is domain-specific, needs custom implementation
- **Radix patterns**: Card click handling follows Radix accessible button patterns
- **Design system compliance**: Using shadcn Button ensures consistency with other actions

**Implementation Pattern**:
```tsx
import { Button } from '@/ui-kit/components/button'
import { cn } from '@/lib/utils'

function SharingOptionCard({ icon, label, description, enabled, onClick }) {
  return (
    <Button
      variant="outline"
      className={cn(
        'w-48 h-auto flex-col items-start gap-2 p-4',
        enabled ? 'bg-blue-50 dark:bg-blue-950 border-blue-500' : 'bg-muted'
      )}
      onClick={onClick}
      aria-pressed={enabled}
    >
      <div className={cn('h-10 w-10', enabled ? 'text-blue-600' : 'text-muted-foreground')}>
        {icon}
      </div>
      <span className="font-medium">{label}</span>
      <span className="text-sm text-muted-foreground">{description}</span>
    </Button>
  )
}
```

**Alternatives Considered**:
- ❌ **Radix Switch component**: Doesn't match card-based design spec
- ❌ **Radix Card + Checkbox**: Overcomplicated for simple toggle
- ❌ **Fully custom button**: Loses shadcn accessibility and consistency

---

### 6. Route Refactoring Strategy (Thin Routes)

**Question**: How should we refactor the route file to follow DDD principles with domain-owned UI?

**Research Sources**:
- Existing route structure in `$eventId.tsx`
- DDD patterns in `apps/clementine-app/CLAUDE.md`
- TanStack Router documentation on layouts

**Decision**: Create `EventDesignerLayout` container in event domain, route becomes thin wrapper

**Rationale**:
- **Domain ownership**: Event domain owns complete UI, route only handles data loading
- **DDD compliance**: Follows vertical slice architecture (domain = feature)
- **Testability**: Layout can be tested independently of routing
- **Reusability**: Layout could be reused in different routing contexts if needed

**Implementation Pattern**:
```tsx
// Route file: $eventId.tsx (BEFORE - heavy)
export const Route = createFileRoute('...')({
  loader: ({ params, context }) => {
    // Data loading logic
  },
  component: EventLayout,
})

function EventLayout() {
  const { event, project } = Route.useLoaderData()
  return (
    <>
      <TopNavBar breadcrumbs={...} actions={...} />  {/* Route owns top bar */}
      <EventDesignerPage />  {/* Domain owns tabs */}
    </>
  )
}

// Route file: $eventId.tsx (AFTER - thin)
import { EventDesignerLayout } from '@/domains/event/designer'

export const Route = createFileRoute('...')({
  loader: ({ params, context }) => {
    // Data loading logic (same as before)
  },
  component: EventLayout,
})

function EventLayout() {
  const { event, project } = Route.useLoaderData()
  return <EventDesignerLayout event={event} project={project} />
}
```

**Alternatives Considered**:
- ❌ **Keep logic in route**: Violates DDD (route file = infrastructure, not domain)
- ❌ **Split into multiple files in app/**: Spreads domain logic across non-domain files
- ❌ **Server-side layout logic**: Violates client-first architecture

---

### 7. Query Invalidation After Mutations

**Question**: Which TanStack Query cache keys should be invalidated after share options update and publish?

**Research Sources**:
- Existing query key conventions in `useProjectEvent.ts`
- TanStack Query invalidation patterns in `useRenameProjectEvent.ts`
- Real-time subscription behavior in `useProjectEvent`

**Decision**: Invalidate `['project-event', projectId, eventId]` for both mutations

**Rationale**:
- **Real-time sync**: Invalidation triggers re-fetch, updates cache before onSnapshot fires
- **Optimistic UI**: Cache updates immediately, UI reflects changes instantly
- **Consistency**: All event mutations follow same pattern (single entity invalidation)
- **Minimal invalidation**: Only invalidate affected entity, not broad patterns

**Implementation Pattern**:
```typescript
// In useUpdateShareOptions
onSuccess: () => {
  queryClient.invalidateQueries({
    queryKey: ['project-event', projectId, eventId],
  })
}

// In usePublishEvent
onSuccess: () => {
  queryClient.invalidateQueries({
    queryKey: ['project-event', projectId, eventId],
  })
}
```

**Alternatives Considered**:
- ❌ **Invalidate all events**: Too broad, unnecessary re-fetches
- ❌ **No invalidation**: Real-time updates only, misses edge cases
- ❌ **Manual cache update**: Error-prone, harder to maintain

---

### 8. Error Handling and Sentry Reporting

**Question**: How should we handle errors in mutations and what should be reported to Sentry?

**Research Sources**:
- Existing error handling patterns in `useDeleteProjectEvent.ts`
- Sentry tagging conventions in mutation hooks
- Zod validation error patterns

**Decision**: Report all errors to Sentry with domain-specific tags, no filtering for expected errors

**Rationale**:
- **Unexpected errors only**: Validation errors are caught by Zod before mutation, so Firestore errors are unexpected
- **Debugging context**: Domain and action tags help filter Sentry issues
- **No false positives**: Since validation happens upfront, all Firestore errors indicate real problems
- **User feedback**: Toast notifications show user-friendly error messages

**Implementation Pattern**:
```typescript
// In useUpdateShareOptions
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
}

// In usePublishEvent
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
}
```

**Alternatives Considered**:
- ❌ **Filter validation errors**: Not needed since Zod validates before Firestore call
- ❌ **No Sentry reporting**: Lose visibility into production errors
- ❌ **Client-side only error handling**: Debugging production issues becomes impossible

---

### 9. TypeScript Types for Partial Updates

**Question**: How should we type partial sharing config updates while maintaining type safety?

**Research Sources**:
- Zod's `.partial()` and `.pick()` utilities
- Existing schema patterns in workspace/project updates
- TypeScript utility types (Partial, Pick)

**Decision**: Create domain-specific update schema using Zod `.pick()` and `.partial()`

**Rationale**:
- **Type safety**: Zod infers TypeScript types automatically
- **Runtime validation**: Validates input at runtime, not just compile time
- **Flexibility**: Allows partial updates while ensuring valid structure
- **Consistency**: Matches existing update schema patterns

**Implementation Pattern**:
```typescript
// In schemas/sharing.schemas.ts (new file, or in project-event-config.schema.ts)
export const updateShareOptionsSchema = sharingConfigSchema.partial()

export type UpdateShareOptionsInput = z.infer<typeof updateShareOptionsSchema>

// In useUpdateShareOptions
const validated = updateShareOptionsSchema.parse(input)
```

**Alternatives Considered**:
- ❌ **TypeScript Partial only**: No runtime validation, unsafe
- ❌ **Accept full object**: Forces client to send all fields every time
- ❌ **No validation**: Runtime errors from malformed data

---

---

### 10. Settings Page Modularity (Section-Based Architecture)

**Question**: How should we structure the settings page to support multiple settings sections (sharing, overlays, etc.)?

**Research Sources**:
- DDD principles in `apps/clementine-app/CLAUDE.md`
- Single Responsibility Principle from constitution
- Future requirements for overlays, theme presets

**Decision**: Use section-based architecture with dedicated section components

**Rationale**:
- **Modularity**: Each settings section is self-contained (SharingSection, OverlaysSection, etc.)
- **Single Responsibility**: Page handles data loading, sections handle UI logic
- **Extensibility**: New sections can be added without modifying existing code
- **Testability**: Sections can be tested independently with mock data
- **Clean separation**: Page-level header, section-level content

**Implementation Pattern**:
```tsx
// SettingsSharingPage (container)
export function SettingsSharingPage() {
  const { projectId, eventId } = useParams()
  const { data: event } = useProjectEvent(projectId!, eventId!)

  return (
    <div>
      <h2>Settings</h2>
      <SharingSection event={event} projectId={projectId} eventId={eventId} />
      {/* Future: <OverlaysSection ... /> */}
    </div>
  )
}

// SharingSection (self-contained)
export function SharingSection({ event, projectId, eventId }) {
  const form = useForm(...)
  const { handleBlur } = useAutoSave(...)

  return (
    <form onBlur={handleBlur}>
      <h3>Sharing Options</h3>
      {/* Cards */}
    </form>
  )
}
```

**Alternatives Considered**:
- ❌ **Monolithic page component**: Hard to extend, mixed responsibilities
- ❌ **Tab-based sections**: Adds complexity, not needed for this feature
- ❌ **Separate routes for sections**: Over-engineered, increases routing complexity

---

## Summary of Key Decisions

| Decision Area | Choice | Rationale |
|---------------|--------|-----------|
| **Transaction Pattern** | `runTransaction()` with `serverTimestamp()` | Atomicity, timestamp resolution, proven pattern |
| **Nested Object Merge** | Deep merge for `sharing.socials` | Preserves user data, type-safe |
| **Auto-Save** | Blur event + 300ms debounce | UX familiarity, performance, proven solution |
| **Change Detection** | Version comparison (`draftVersion > publishedVersion`) | Simple, reliable, no deep equality |
| **Component Library** | shadcn/ui Button + custom card | Accessibility, design system compliance |
| **Route Architecture** | `EventDesignerLayout` container in domain | DDD compliance, domain ownership |
| **Settings Modularity** | Section-based components (SharingSection, OverlaysSection) | Extensibility, single responsibility, testability |
| **Query Invalidation** | Single entity key (`['project-event', ...]`) | Consistency, minimal invalidation |
| **Error Handling** | Sentry with domain tags, all errors reported | Debugging visibility, no expected errors |
| **Type Safety** | Zod update schemas with `.partial()` | Runtime validation, TypeScript inference |

---

## Implementation Readiness

All research areas have been resolved. No NEEDS CLARIFICATION items remain. The implementation can proceed directly to Phase 1 (Design) with confidence.

**Next Steps**:
1. ✅ Phase 0 complete (this document)
2. → Phase 1: Generate data-model.md (Firestore schema design)
3. → Phase 1: Generate quickstart.md (implementation guide)
4. → Phase 1: Update agent context
