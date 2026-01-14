# Component Contracts: Event-Experience Integration

**Feature**: 025-event-exp-integration
**Date**: 2026-01-14

## Overview

This document defines the TypeScript interfaces and props for all new components in the event-experience integration feature.

---

## 1. ExperienceSlotManager

Main orchestrator component for managing experiences in a slot.

```typescript
interface ExperienceSlotManagerProps {
  /**
   * Slot mode - determines cardinality and UI behavior
   * - 'list': Multiple items, drag-to-reorder, "Add" always visible
   * - 'single': 0 or 1 item, no reorder, "Add" only when empty
   */
  mode: 'list' | 'single'

  /**
   * Slot identifier - determines profile filtering
   * - 'main': freeform, survey profiles
   * - 'pregate': survey, story profiles
   * - 'preshare': survey, story profiles
   */
  slot: 'main' | 'pregate' | 'preshare'

  /** Workspace ID for fetching available experiences */
  workspaceId: string

  /** Workspace slug for navigation (edit/create links) */
  workspaceSlug: string

  /** Current experience references for this slot */
  experiences: ExperienceReference[]

  /**
   * Callback when experiences are modified
   * Called on: add, remove, reorder, toggle enabled, toggle overlay
   */
  onUpdate: (experiences: ExperienceReference[]) => void

  /** Optional loading state (e.g., while fetching experience details) */
  isLoading?: boolean
}
```

### Behavior Contract

| Mode | Drag Handle | Add Button | Max Items |
|------|-------------|------------|-----------|
| `list` | Visible | Always visible | Unlimited |
| `single` | Hidden | Only when empty | 1 |

---

## 2. ExperienceSlotItem

Individual experience item within a slot.

```typescript
interface ExperienceSlotItemProps {
  /** Experience reference data */
  reference: ExperienceReference | MainExperienceReference

  /** Full experience data (fetched separately) */
  experience: Experience | null

  /** Slot type - controls which toggles are shown */
  slot: 'main' | 'pregate' | 'preshare'

  /** Whether in list mode (shows drag handle) */
  isListMode: boolean

  /** Workspace slug for edit link */
  workspaceSlug: string

  /** Callback when enabled state changes */
  onToggleEnabled: (enabled: boolean) => void

  /** Callback when overlay state changes (main slot only) */
  onToggleOverlay?: (applyOverlay: boolean) => void

  /** Callback when item is removed */
  onRemove: () => void

  /** Callback for opening edit in new tab */
  onEdit: () => void
}
```

### Visual Elements

| Element | Condition | Action |
|---------|-----------|--------|
| Drag handle | `isListMode === true` | Triggers drag |
| Thumbnail | Always | Display only |
| Name | Always | Display only |
| Profile badge | Always | Display only |
| Overlay toggle | `slot === 'main'` | Calls `onToggleOverlay` |
| Enable toggle | Always | Calls `onToggleEnabled` |
| Context menu | Always | Edit/Remove actions |

---

## 3. ConnectExperienceDrawer

Slide-over drawer for selecting experiences to connect.

```typescript
interface ConnectExperienceDrawerProps {
  /** Controlled open state */
  open: boolean

  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void

  /** Slot being configured - determines profile filtering */
  slot: 'main' | 'pregate' | 'preshare'

  /** Workspace ID for fetching experiences */
  workspaceId: string

  /** Workspace slug for create link */
  workspaceSlug: string

  /** IDs of experiences already assigned to any slot in this event */
  assignedExperienceIds: string[]

  /** Callback when experience is selected */
  onSelect: (experienceId: string) => void
}
```

### Internal State

```typescript
interface DrawerState {
  /** Search query (debounced) */
  searchQuery: string

  /** Filtered and sorted experience list */
  filteredExperiences: Experience[]

  /** Loading state for experience list */
  isLoading: boolean
}
```

### Filtering Logic

```typescript
// Profile filtering by slot
const SLOT_PROFILES: Record<Slot, ExperienceProfile[]> = {
  main: ['freeform', 'survey'],
  pregate: ['survey', 'story'],
  preshare: ['survey', 'story'],
}

// Apply profile filter
const profileFiltered = experiences.filter(exp =>
  SLOT_PROFILES[slot].includes(exp.profile)
)

// Apply search filter
const searchFiltered = profileFiltered.filter(exp =>
  exp.name.toLowerCase().includes(searchQuery.toLowerCase())
)
```

---

## 4. ExperienceCard

Card component for displaying experience in welcome screen preview.

```typescript
interface ExperienceCardProps {
  /** Experience data to display */
  experience: Experience

  /** Layout mode - affects card dimensions and arrangement */
  layout: 'list' | 'grid'

  /**
   * Display mode
   * - 'edit': Non-interactive, shows enabled state
   * - 'run': Interactive, calls onClick
   */
  mode: 'edit' | 'run'

  /** Whether experience is enabled (affects opacity in edit mode) */
  enabled?: boolean

  /** Click handler (only used in run mode) */
  onClick?: () => void
}
```

### Layout Dimensions

| Layout | Card Width | Card Height | Thumbnail |
|--------|------------|-------------|-----------|
| `list` | Full width | Auto | 64x64px |
| `grid` | 50% - gap | Auto | Aspect 16:9 |

---

## 5. ExperienceSlotEmpty

Empty state component when no experiences are connected.

```typescript
interface ExperienceSlotEmptyProps {
  /** Slot type for context message */
  slot: 'main' | 'pregate' | 'preshare'

  /** Mode determines button visibility */
  mode: 'list' | 'single'

  /** Callback when add button is clicked */
  onAdd: () => void
}
```

### Empty State Messages

| Slot | Message |
|------|---------|
| `main` | "No experiences added. Add experiences to let guests choose what to do." |
| `pregate` | "No pregate experience. Add one to collect info before welcome screen." |
| `preshare` | "No preshare experience. Add one to show content before sharing." |

---

## 6. ConnectExperienceItem

List item within the connect drawer.

```typescript
interface ConnectExperienceItemProps {
  /** Experience data */
  experience: Experience

  /** Whether this experience is already assigned (disabled state) */
  isAssigned: boolean

  /** Callback when selected */
  onSelect: () => void
}
```

### Visual States

| State | Appearance | Interaction |
|-------|------------|-------------|
| Available | Normal | Clickable |
| Assigned | Dimmed, "(in use)" badge | Disabled |

---

## Hook Contracts

### useExperiencesForSlot

Fetches experiences for a specific slot with direct Firestore queries.

```typescript
/**
 * Fetches experiences filtered by slot-compatible profiles.
 *
 * Implementation:
 * - Uses direct Firestore queries with `where('profile', 'in', [...])`
 * - Includes real-time updates via onSnapshot listener
 * - Independent from useWorkspaceExperiences (event domain specific)
 * - Search filtering is NOT included (handled in ConnectExperienceDrawer)
 *
 * @param workspaceId - Workspace to fetch experiences from
 * @param slot - Slot type determines allowed profiles
 * @returns TanStack Query result with filtered experiences
 */
function useExperiencesForSlot(
  workspaceId: string,
  slot: SlotType
): UseQueryResult<Experience[]>
```

### useUpdateEventExperiences

Mutation hook for updating event experiences configuration. **Uses Firestore transaction for atomic updates**.

```typescript
interface UseUpdateEventExperiencesParams {
  projectId: string
  eventId: string
}

interface UpdateExperiencesInput {
  main?: MainExperienceReference[]
  pregate?: ExperienceReference | null
  preshare?: ExperienceReference | null
}

/**
 * Updates event experiences configuration atomically.
 *
 * Implementation:
 * - Uses runTransaction for atomic read-modify-write
 * - Prevents race conditions during rapid updates
 * - Merges input with existing experiences config
 * - Invalidates event query on success
 *
 * @param params - Project and event identifiers
 * @returns TanStack Mutation result
 */
function useUpdateEventExperiences(
  params: UseUpdateEventExperiencesParams
): UseMutationResult<void, Error, UpdateExperiencesInput>
```

---

## Constant Definitions

```typescript
/**
 * Slot to profile mapping for filtering
 */
export const SLOT_PROFILES: Record<SlotType, ExperienceProfile[]> = {
  main: ['freeform', 'survey'],
  pregate: ['survey', 'story'],
  preshare: ['survey', 'story'],
}

/**
 * Slot type definition
 */
export type SlotType = 'main' | 'pregate' | 'preshare'

/**
 * Slot mode definition
 */
export type SlotMode = 'list' | 'single'
```
