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

## Domain Structure

### Complete Event Domain Structure

```
@domains/event/
├── designer/
│   ├── components/
│   │   └── EventDesignerTopBar.tsx         # Event-specific top bar (NEW)
│   ├── containers/
│   │   ├── EventDesignerLayout.tsx         # Main layout shell (NEW)
│   │   └── EventDesignerPage.tsx           # Tabs navigation + outlet (EXISTING)
│   └── hooks/
│       └── usePublishEvent.ts              # Publish mutation (NEW)
│
├── settings/
│   ├── components/
│   │   └── SharingOptionCard.tsx           # Toggle card component (NEW)
│   ├── containers/
│   │   └── SettingsSharingPage.tsx         # Settings page container (NEW)
│   └── hooks/
│       └── useUpdateShareOptions.ts        # Sharing mutation (NEW)
│
├── theme/
│   ├── components/                         # Future: Theme editor components
│   ├── containers/                         # Future: Theme page container
│   └── hooks/                              # Future: useUpdateTheme
│
├── welcome/
│   ├── components/                         # Future: Welcome editor components
│   ├── containers/                         # Future: Welcome page container
│   └── hooks/                              # Future: useUpdateWelcome
│
└── shared/
    ├── schemas/                            # Event config schemas (EXISTING)
    │   ├── project-event-config.schema.ts
    │   └── project-event-full.schema.ts
    ├── hooks/                              # Shared event hooks
    ├── types/                              # Shared types
    └── lib/
        └── updateEventConfigField.ts       # Shared transaction helper (NEW)
```

### Key Architectural Changes

**Before** (Route owns UI):
```tsx
// Route file is heavy
function EventLayout() {
  return (
    <>
      <TopNavBar {...} />          {/* Route handles top bar */}
      <EventDesignerPage />        {/* Domain handles tabs */}
    </>
  )
}
```

**After** (Domain owns UI):
```tsx
// Route file is thin (data loader only)
function EventLayout() {
  const { event, project } = Route.useLoaderData()
  return <EventDesignerLayout event={event} project={project} />
}
```

**Result**: Event domain is self-contained, route is responsible only for data loading.

## Architecture

### 1. EventDesignerLayout (NEW)

**File**: `@domains/event/designer/containers/EventDesignerLayout.tsx`

**Purpose**: Top-level layout component that owns the complete event designer UI.

**Responsibilities**:
- Renders EventDesignerTopBar with publish logic
- Manages draft/publish state detection
- Renders EventDesignerPage (tabs + content)
- Handles publish action

**Key Features**:
- Detects unpublished changes: `hasUnpublishedChanges = publishedVersion === null || draftVersion > publishedVersion`
- Passes publish handler to top bar
- Self-contained (no route file dependencies)

---

### 2. EventDesignerTopBar (NEW)

**File**: `@domains/event/designer/components/EventDesignerTopBar.tsx`

**Purpose**: Event-specific top bar with breadcrumbs, preview, and publish.

**Key Features**:
- **Breadcrumbs**: Project name → Event name
- **"New changes" badge**: Yellow circle + text when `hasUnpublishedChanges === true`
- **Preview button**: Placeholder (no functionality in this PRD)
- **Publish button**:
  - Enabled when changes exist
  - Disabled when draft === published
  - Shows loading state during publish

**Visual States**:
```
No changes:
[Project / Event]                    [Preview] [Publish (disabled)]

Unpublished changes:
[Project / Event]  [🟡 New changes]  [Preview] [Publish (enabled)]

Publishing:
[Project / Event]  [🟡 New changes]  [Preview] [Publish (loading...)]
```

---

### 3. SettingsSharingPage (NEW)

**File**: `@domains/event/settings/containers/SettingsSharingPage.tsx`

**Purpose**: Settings tab container for sharing configuration.

**Key Features**:
- React Hook Form for state management
- Auto-save on blur using `useAutoSave` hook
- Calls `useUpdateShareOptions` mutation hook
- Two sections: Main Options (download, copy link) + Social Media

**Layout**:
```
Sharing Settings
Configure how guests can share their photos

Main Options
[Download] [Copy Link]

Social Media
[Email] [Instagram] [Facebook] [LinkedIn] [Twitter] [TikTok] [Telegram]
```

---

### 4. SharingOptionCard (NEW)

**File**: `@domains/event/settings/components/SharingOptionCard.tsx`

**Purpose**: Toggleable card for individual sharing options.

**Design Specs**:
- **Fixed width**: `w-48` (192px) for visual consistency
- **Flex wrap**: Parent uses `flex flex-wrap gap-3` - cards automatically wrap to next row
- **Toggle on click**: No visible toggle switch, entire card is clickable
- **Visual states**:
  - **OFF**: `bg-muted`, gray border, gray text/icon
  - **ON**: `bg-blue-50 dark:bg-blue-950`, blue border, blue text/icon
- **Accessible**: Button with keyboard focus ring
- **Props**: `icon`, `label`, `description`, `name` (React Hook Form field path)

---

### 5. Domain-Specific Mutation Hooks

**Philosophy**: Each subdomain owns its mutation hooks for better type safety and domain ownership.

#### useUpdateShareOptions (NEW)

**File**: `@domains/event/settings/hooks/useUpdateShareOptions.ts`

**Purpose**: Update sharing configuration with deep merge for nested `socials` object.

**Key Features**:
- Validates against `SharingConfig` schema (not generic config)
- Deep merges `sharing.socials` to preserve other social flags
- Lazy initialization (creates defaults on first update)
- Increments `draftVersion` on every update
- Uses Firestore transaction for atomicity
- Invalidates query on success
- Reports errors to Sentry

**Usage**:
```typescript
const updateShareOptions = useUpdateShareOptions(projectId, eventId)
await updateShareOptions.mutateAsync({ socials: { instagram: true } })
```

#### usePublishEvent (NEW)

**File**: `@domains/event/designer/hooks/usePublishEvent.ts`

**Purpose**: Publish draft configuration to make it live for guests.

**Key Features**:
- Copies `draftConfig` → `publishedConfig`
- Updates `publishedVersion` to match `draftVersion`
- Sets `publishedAt` timestamp
- Validates `draftConfig` exists before publishing
- Uses transaction for atomicity
- Invalidates query on success

**Usage**:
```typescript
const publishEvent = usePublishEvent(projectId, eventId)
await publishEvent.mutateAsync()
```

---

### 6. Shared Transaction Helper (NEW)

**File**: `@domains/event/shared/lib/updateEventConfigField.ts`

**Purpose**: Reusable Firestore transaction logic for simple field updates.

**Key Features**:
- Generic over `ProjectEventConfig` keys (type-safe)
- Lazy initialization (creates `draftConfig` on first update)
- Increments `draftVersion` on every update
- Transaction ensures atomicity with `serverTimestamp()`
- Reusable by all subdomains

**When to Use**:
- ✅ Simple field replacement (theme, overlays)
- ❌ Complex deep merge (sharing with nested socials)

**Future Usage Example**:
```typescript
// Theme hook will use shared helper
const validated = themeSchema.parse(theme)
return await updateEventConfigField(projectId, eventId, 'theme', validated)
```

---

## Data Flow

### Auto-Save Flow

1. User clicks toggle card → Form state updates
2. User focuses out → Blur event triggers
3. `useAutoSave` debounces (300ms)
4. Detects changed fields
5. Calls `useUpdateShareOptions.mutateAsync(updates)`
6. Mutation updates Firestore (deep merge for socials)
7. `draftVersion` increments
8. Query invalidation → Re-render
9. Top bar shows "New changes" badge
10. Publish button enables

### Publish Flow

1. User clicks Publish button
2. `usePublishEvent.mutateAsync()` called
3. Transaction: Copy `draftConfig` → `publishedConfig`
4. Update `publishedVersion` and `publishedAt`
5. Query invalidation → Re-render
6. Badge disappears, publish button disables
7. Toast: "Event published successfully"

---

## Draft/Publish State Machine

### States

| State | Condition | Badge | Publish Button |
|-------|-----------|-------|----------------|
| **Never Published** | `publishedVersion === null` | 🟡 New changes | Enabled |
| **Published, In Sync** | `draftVersion === publishedVersion` | Hidden | Disabled |
| **Published, New Changes** | `draftVersion > publishedVersion` | 🟡 New changes | Enabled |
| **Publishing** | Mutation in progress | 🟡 New changes | Disabled (loading) |

### State Transitions

```
[Never Published]
publishedVersion: null, draftVersion: 1
        ↓ User edits
publishedVersion: null, draftVersion: 2
Badge: 🟡 New changes, Publish: Enabled
        ↓ User clicks Publish
[Publishing] isPublishing: true
        ↓ Success
publishedVersion: 2, draftVersion: 2
Badge: Hidden, Publish: Disabled
        ↓ User edits again
publishedVersion: 2, draftVersion: 3
Badge: 🟡 New changes, Publish: Enabled
```

---

## Implementation Phases

### Phase 1: Architecture Refactor
- Create `EventDesignerLayout` container
- Create `EventDesignerTopBar` component
- Update route file to use `EventDesignerLayout`
- Move top bar logic from route to event domain

### Phase 2: Shared Helper & Mutation Hooks
- Create `updateEventConfigField` shared helper
- Create `useUpdateShareOptions` hook with deep merge logic
- Create `usePublishEvent` hook
- Add error handling and Sentry reporting

### Phase 3: Sharing Settings UI
- Create `SettingsSharingPage` container
- Create `SharingOptionCard` component
- Integrate React Hook Form
- Integrate `useAutoSave` hook
- Update settings route

### Phase 4: Draft/Publish Integration
- Add `hasUnpublishedChanges` logic to layout
- Render "New changes" badge conditionally
- Wire up publish button to `usePublishEvent`
- Handle loading states
- Add toast notifications

### Phase 5: Polish & Testing
- Test complete flow (edit → auto-save → publish)
- Test edge cases (no draft config, publish errors)
- Test accessibility (keyboard navigation)
- Verify auto-save debouncing

---

## Acceptance Criteria

### Architecture
- [ ] `EventDesignerLayout` is the top-level component in event domain
- [ ] Route file only loads data and passes to layout
- [ ] Top bar logic lives in event domain, not route
- [ ] Domain structure follows DDD principles

### Sharing Settings UI
- [ ] All sharing options render as toggleable cards
- [ ] Cards have fixed width (`w-48`) and wrap automatically
- [ ] Cards change background color when toggled (muted → blue)
- [ ] Form integrates with React Hook Form
- [ ] Auto-save triggers on blur with 300ms debounce

### Draft/Publish Workflow
- [ ] "New changes" badge shows when `draftVersion > publishedVersion`
- [ ] Badge shows when never published (`publishedVersion === null`)
- [ ] Badge hidden when draft === published
- [ ] Publish button enabled only when changes exist
- [ ] Publish button shows loading state during mutation
- [ ] Clicking publish copies draft → published atomically
- [ ] After publish, badge disappears and button disables

### Data Mutations
- [ ] `updateEventConfigField` helper provides reusable transaction logic
- [ ] `updateEventConfigField` handles lazy initialization
- [ ] `updateEventConfigField` increments `draftVersion` on every update
- [ ] `useUpdateShareOptions` deep merges `sharing.socials` correctly
- [ ] `useUpdateShareOptions` validates against `SharingConfig` schema
- [ ] `usePublishEvent` copies draft → published atomically
- [ ] All hooks invalidate queries and trigger re-renders
- [ ] Errors reported to Sentry with correct tags

### Code Quality
- [ ] Follows DDD principles (domain owns UI and mutations)
- [ ] Follows mutation hook patterns (transaction, invalidation, error reporting)
- [ ] TypeScript strict mode passes
- [ ] No console errors or warnings
- [ ] Accessible (keyboard navigation, focus states, ARIA labels)

---

## Out of Scope

- ❌ **Preview functionality**: Preview button is a placeholder (no action)
- ❌ **Theme editor**: Theme tab remains WIP
- ❌ **Welcome editor**: Welcome tab remains WIP
- ❌ **Overlays upload**: Settings tab only has sharing for now
- ❌ **Publish confirmation dialog**: Direct publish without confirmation
- ❌ **Version history UI**: No UI for viewing past versions
- ❌ **Rollback**: No ability to revert to previous published version

---

## Future Considerations

- **Preview Mode**: Preview button should open guest view with draft config
- **Version History**: Show timeline of published versions
- **Rollback**: Ability to revert to previous published config
- **Change Summary**: Show diff between draft and published before publishing
- **Additional Settings**: Overlays upload in settings tab
- **Domain-Specific Hooks**: `useUpdateTheme`, `useUpdateWelcome`, `useUpdateOverlays`

---

## Key Design Decisions

### 1. Domain-Specific Mutation Hooks
**Decision**: Each subdomain owns its mutation hooks (useUpdateShareOptions, useUpdateTheme, etc.)

**Rationale**:
- Domain ownership (DDD principle)
- Type safety (validates specific schemas, not generic config)
- Clear intent (explicit hook names)
- Easy testing (isolated mutations)

### 2. Shared Transaction Helper
**Decision**: Extract common Firestore logic to `updateEventConfigField` helper.

**Rationale**:
- Avoids code duplication
- Ensures consistency (lazy init, version increment, transaction pattern)
- Simple fields use helper, complex fields implement custom logic

### 3. Version-Based Change Detection
**Decision**: Use `draftVersion > publishedVersion` instead of deep equality.

**Rationale**:
- Simpler logic (no deep comparison needed)
- More reliable (version always increments)
- Predictable behavior

### 4. No Publish Confirmation
**Decision**: Publish directly without confirmation dialog.

**Rationale**:
- Not destructive (can always make new changes)
- Faster workflow
- Can add confirmation later if needed

### 5. Lazy Initialization
**Decision**: Don't create `draftConfig` on event creation, create on first edit.

**Rationale**:
- Keeps event creation simple
- Avoids creating unused data
- Config created when actually needed

### 6. Auto-Save on Blur
**Decision**: Use blur event with debounce instead of manual save button.

**Rationale**:
- Better UX (no manual save needed)
- Familiar pattern (like Google Docs)
- Reduces cognitive load

### 7. Fixed-Width Cards with Flex Wrap
**Decision**: Cards are `w-48` and parent uses `flex flex-wrap`.

**Rationale**:
- Visual consistency (all cards same size)
- Responsive (wraps automatically)
- No media queries needed

---

## References

- **Parent PRD**: `requirements/011-events-domain-backbone.md`
- **Auto-Save Hook**: `@apps/clementine-app/src/shared/forms/hooks/useAutoSave.ts`
- **Reference Hooks**:
  - `@domains/project/events/hooks/useRenameProjectEvent.ts`
  - `@domains/workspace/settings/hooks/useUpdateWorkspace.ts`
- **Event Schemas**: `@domains/event/shared/schemas/`
- **TopNavBar Component**: `@domains/navigation/components/TopNavBar.tsx`
- **Standards**:
  - `@standards/global/zod-validation.md`
  - `@standards/global/project-structure.md`
  - `@standards/global/client-first-architecture.md`
