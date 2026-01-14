# Research: Event-Experience Integration

**Feature**: 025-event-exp-integration
**Date**: 2026-01-14

## Overview

Research findings for implementing experience-to-event connection functionality. All technical questions resolved through codebase exploration.

---

## 1. Slide-over Drawer Component

### Decision
Use existing `Sheet` component from `@/ui-kit/ui/sheet.tsx` (shadcn/ui)

### Rationale
- Already available in the codebase with proper animations and accessibility
- Built on Radix UI Dialog primitive
- Supports `side="right"` for slide-in from right
- Includes overlay, close button, header/footer patterns
- Consistent with design system

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Custom drawer | Reinventing existing component, inconsistent UX |
| Dialog/Modal | Not slide-over pattern, spec requires drawer |
| Inline panel | Would require layout restructuring |

### Implementation Notes
```tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/ui-kit/ui/sheet'

<Sheet open={isOpen} onOpenChange={setIsOpen}>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Connect Experience</SheetTitle>
    </SheetHeader>
    {/* Content */}
  </SheetContent>
</Sheet>
```

---

## 2. Drag-and-Drop Pattern

### Decision
Use existing @dnd-kit pattern from `StepList.tsx`

### Rationale
- Already implemented in experience designer for step reordering
- Uses `DndContext`, `SortableContext`, `useSortable` hooks
- Includes keyboard accessibility with `sortableKeyboardCoordinates`
- Proven pattern with PointerSensor (8px activation distance)

### Existing Pattern Reference
File: `domains/experience/designer/components/StepList.tsx`

```tsx
import { DndContext, PointerSensor, KeyboardSensor, closestCenter, useSensors } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'

const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
)
```

---

## 3. Experience Data Fetching

### Decision
Create independent `useExperiencesForSlot` hook with direct Firestore queries

### Rationale
- Hook is specific to event-experience integration feature
- Independent implementation allows querying exactly what's needed per slot
- Can use Firestore `where('profile', 'in', [...])` for OR filtering
- Includes real-time updates via onSnapshot
- Search filtering is a **UI concern** - handled in `ConnectExperienceDrawer` component

### Implementation
File: `domains/event/experiences/hooks/useExperiencesForSlot.ts`

```tsx
import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'

export function useExperiencesForSlot(workspaceId: string, slot: SlotType) {
  const queryClient = useQueryClient()
  const allowedProfiles = SLOT_PROFILES[slot]

  // Set up real-time listener
  useEffect(() => {
    const experiencesRef = collection(
      firestore,
      `workspaces/${workspaceId}/experiences`
    )

    // Query with profile IN filter for slot compatibility
    const q = query(
      experiencesRef,
      where('status', '==', 'active'),
      where('profile', 'in', allowedProfiles),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const experiences = snapshot.docs.map((doc) =>
        convertFirestoreDoc(doc, experienceSchema)
      )
      queryClient.setQueryData(
        ['experiences', 'slot', workspaceId, slot],
        experiences
      )
    })

    return () => unsubscribe()
  }, [workspaceId, slot, allowedProfiles, queryClient])

  return useQuery({
    queryKey: ['experiences', 'slot', workspaceId, slot],
    queryFn: async () => /* initial fetch */,
    staleTime: Infinity,
  })
}
```

### Slot-to-Profile Mapping
| Slot | Allowed Profiles | Firestore Query |
|------|------------------|-----------------|
| main | freeform, survey | `where('profile', 'in', ['freeform', 'survey'])` |
| pregate | survey, story | `where('profile', 'in', ['survey', 'story'])` |
| preshare | survey, story | `where('profile', 'in', ['survey', 'story'])` |

---

## 4. Event Config Schema Extension

### Decision
Add `experiences` field to `projectEventConfigSchema`

### Rationale
- Schema already uses `z.looseObject()` for forward compatibility
- Follows existing nullable pattern with `.default(null)`
- Consistent with how `welcome`, `share`, `overlays` are structured

### Schema Design
```typescript
// New experience reference schema
export const experienceReferenceSchema = z.object({
  experienceId: z.string().min(1),
  enabled: z.boolean().default(true),
})

export const mainExperienceReferenceSchema = experienceReferenceSchema.extend({
  applyOverlay: z.boolean().default(true),
})

// Experiences config
export const experiencesConfigSchema = z.object({
  main: z.array(mainExperienceReferenceSchema).default([]),
  pregate: experienceReferenceSchema.nullable().default(null),
  preshare: experienceReferenceSchema.nullable().default(null),
})

// Add to projectEventConfigSchema
experiences: experiencesConfigSchema.nullable().default(null),
```

---

## 5. Welcome Tab Integration Pattern

### Decision
Add "Experiences" section to WelcomeConfigPanel following existing EditorSection pattern

### Rationale
- WelcomeConfigPanel already uses EditorSection containers
- 2-column layout (sidebar + preview) already established
- Auto-save with 2000ms debounce already implemented

### Existing Pattern Reference
File: `domains/event/welcome/containers/WelcomeEditorPage.tsx`

```tsx
<div className="flex h-full">
  <aside className="w-80 shrink-0 border-r overflow-y-auto">
    <WelcomeConfigPanel />
  </aside>
  <div className="flex-1 min-w-0">
    <PreviewShell>
      <WelcomePreview />
    </PreviewShell>
  </div>
</div>
```

---

## 6. Settings Tab Integration

### Decision
Add "Guest Flow" section with pregate/preshare slots

### Rationale
- Settings tab handles advanced configuration (overlays, sharing)
- Pregate/preshare are "advanced" guest flow options
- Single-slot mode (0-1 items) simplifies UI vs main array

### Location
File: `domains/event/settings/containers/EventSettingsPage.tsx`

---

## 7. Search Implementation

### Decision
Client-side filtering with debounced input (300ms)

### Rationale
- Experience list typically < 100 items per workspace
- Client-side filtering is responsive (< 100ms after debounce)
- No need for server-side search complexity
- Case-insensitive name matching is sufficient

### Implementation
```tsx
const [searchQuery, setSearchQuery] = useState('')
const debouncedSearch = useDebouncedValue(searchQuery, 300)

const filteredExperiences = useMemo(() =>
  experiences.filter(exp =>
    exp.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  ),
  [experiences, debouncedSearch]
)
```

---

## 8. Profile Badge Component

### Decision
Reuse existing `ProfileBadge` from experience library

### Rationale
- Already exists at `domains/experience/library/components/ProfileBadge.tsx`
- Consistent visual treatment across app
- Handles all profile types (freeform, survey, story)

---

## 9. Experience List Item Component

### Decision
Create new `ExperienceSlotItem` component, adapting from `ExperienceListItem`

### Rationale
- Existing `ExperienceListItem` is navigation-focused (links to editor)
- Slot item needs different controls: drag handle, enable toggle, overlay toggle, context menu
- Different use case warrants separate component to avoid over-generalization

### Key Differences
| ExperienceListItem | ExperienceSlotItem |
|--------------------|-------------------|
| Links to editor | No navigation |
| Shows publish status | Shows enabled/overlay state |
| No drag handle | Drag handle (list mode) |
| Rename/Delete actions | Edit (new tab)/Remove actions |

---

## 10. Context Menu Actions

### Decision
Use existing DropdownMenu pattern with Edit and Remove actions

### Rationale
- Edit opens experience editor in new tab (preserves event designer state)
- Remove only disconnects from event (doesn't delete experience)
- Pattern consistent with other context menus in codebase

### Implementation
```tsx
// Edit action
window.open(`/workspace/${workspaceSlug}/experiences/${experienceId}`, '_blank')

// Remove action - calls onUpdate with filtered array
onUpdate(experiences.filter(exp => exp.experienceId !== experienceId))
```

---

## 11. Atomic Updates with Transactions

### Decision
Use Firestore transactions for `useUpdateEventExperiences` to ensure atomic updates

### Rationale
- Experience array updates (add, remove, reorder) must be atomic
- Prevents race conditions when multiple updates happen quickly
- Ensures data consistency if update fails partway through
- Transaction reads current state, applies changes, writes atomically

### Implementation
File: `domains/event/experiences/hooks/useUpdateEventExperiences.ts`

```tsx
import { runTransaction, doc } from 'firebase/firestore'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useUpdateEventExperiences({ projectId, eventId }: Params) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateExperiencesInput) => {
      const eventRef = doc(firestore, `projects/${projectId}/events/${eventId}`)

      await runTransaction(firestore, async (transaction) => {
        const eventDoc = await transaction.get(eventRef)
        if (!eventDoc.exists()) throw new Error('Event not found')

        const currentConfig = eventDoc.data().draftConfig ?? {}
        const currentExperiences = currentConfig.experiences ?? {
          main: [],
          pregate: null,
          preshare: null,
        }

        // Merge input with current state
        const updatedExperiences = {
          ...currentExperiences,
          ...input,
        }

        transaction.update(eventRef, {
          'draftConfig.experiences': updatedExperiences,
          updatedAt: Date.now(),
        })
      })
    },
    onSuccess: () => {
      // Invalidate event query to refresh data
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(projectId, eventId) })
    },
  })
}
```

### Transaction Benefits
| Scenario | Without Transaction | With Transaction |
|----------|---------------------|------------------|
| Rapid add/remove | May lose updates | All updates applied |
| Concurrent edits | Last write wins | Consistent merge |
| Partial failure | Corrupted state | Rollback to clean |

---

## Summary

All technical decisions align with existing codebase patterns:
- **UI Components**: Sheet (drawer), DropdownMenu (context), Badge (profile)
- **Data**: TanStack Query, Zod schemas, Firestore
- **Patterns**: 2-column layout, @dnd-kit, debounced search
- **Structure**: Vertical slice under `domains/event/experiences/`

No external research required - all dependencies and patterns already exist in the codebase.
