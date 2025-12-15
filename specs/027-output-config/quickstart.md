# Quickstart: Event Frame Overlay Configuration

**Feature**: 027-output-config
**Date**: 2025-12-15

## Overview

This quickstart guide provides the essential information to start implementing the Event Frame Overlay Configuration feature.

---

## Key Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `web/src/app/(workspace)/[companySlug]/[projectId]/[eventId]/overlays/page.tsx` | Overlays settings page |
| `web/src/features/events/components/overlay/OverlaySection.tsx` | Main overlay form component |
| `web/src/features/events/components/overlay/OverlayPreview.tsx` | Frame preview with aspect ratio switching |
| `web/src/features/events/components/overlay/FrameCard.tsx` | Per-aspect ratio configuration card |
| `web/src/features/events/components/overlay/index.ts` | Barrel export |

### Modified Files

| File | Changes |
|------|---------|
| `web/src/features/events/types/event.types.ts` | Add `EventOverlayConfig`, `FrameEntry` types |
| `web/src/features/events/schemas/events.schemas.ts` | Add overlay Zod schemas |
| `web/src/features/events/actions/events.actions.ts` | Add `updateEventOverlayAction` |
| `web/src/features/events/repositories/events.repository.ts` | Add `updateEventOverlay` |
| `web/src/features/events/constants.ts` | Add `DEFAULT_EVENT_OVERLAY`, `OVERLAY_ASPECT_RATIOS` |
| `web/src/lib/storage/actions.ts` | Add `"frames"` destination |

---

## Implementation Order

### Phase 1: Data Layer
1. Add types to `event.types.ts`
2. Add schemas to `events.schemas.ts`
3. Add constants to `constants.ts`
4. Add `"frames"` to storage destinations

### Phase 2: Backend
1. Add `updateEventOverlay` to repository
2. Add `updateEventOverlayAction` server action

### Phase 3: UI Components
1. Create `FrameCard` component
2. Create `OverlayPreview` component
3. Create `OverlaySection` component
4. Create barrel export

### Phase 4: Page Integration
1. Create `/overlays/page.tsx`
2. Wire up form state and autosave
3. Add validation loop (lint, type-check)

---

## Quick Reference

### Types

```typescript
// Add to event.types.ts
export type OverlayAspectRatio = "square" | "story"

export interface FrameEntry {
  enabled: boolean
  frameUrl: string | null
}

export interface EventOverlayConfig {
  frames: Record<OverlayAspectRatio, FrameEntry>
}

// Extend Event interface
export interface Event {
  // ...existing
  overlay?: EventOverlayConfig
}
```

### Schemas

```typescript
// Add to events.schemas.ts
export const frameEntrySchema = z.object({
  enabled: z.boolean(),
  frameUrl: z.string().url().nullable(),
})

export const overlayAspectRatioSchema = z.enum(["square", "story"])

export const eventOverlayConfigSchema = z.object({
  frames: z.record(overlayAspectRatioSchema, frameEntrySchema),
})

export const updateEventOverlayInputSchema = z.object({
  square: z.object({
    enabled: z.boolean().optional(),
    frameUrl: z.string().url().nullable().optional(),
  }).optional(),
  story: z.object({
    enabled: z.boolean().optional(),
    frameUrl: z.string().url().nullable().optional(),
  }).optional(),
})
```

### Constants

```typescript
// Add to constants.ts
export const OVERLAY_ASPECT_RATIOS = {
  square: { label: "Square", ratio: "1:1", cssAspect: "1/1" },
  story: { label: "Story", ratio: "9:16", cssAspect: "9/16" },
} as const

export const DEFAULT_EVENT_OVERLAY: EventOverlayConfig = {
  frames: {
    square: { enabled: false, frameUrl: null },
    story: { enabled: false, frameUrl: null },
  },
}
```

### Server Action

```typescript
// Add to events.actions.ts
export async function updateEventOverlayAction(
  projectId: string,
  eventId: string,
  data: UpdateEventOverlayInput
): Promise<ActionResponse<void>> {
  const auth = await verifyAdminSecret()
  if (!auth.success) {
    return { success: false, error: { code: "UNAUTHORIZED", message: "Not authorized" } }
  }

  const validation = updateEventOverlayInputSchema.safeParse(data)
  if (!validation.success) {
    return { success: false, error: { code: "VALIDATION_ERROR", message: validation.error.message } }
  }

  try {
    await updateEventOverlay(projectId, eventId, validation.data)
    revalidatePath(`/${auth.data.companySlug}/${projectId}/${eventId}/overlays`)
    return { success: true, data: undefined }
  } catch (error) {
    return { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to update overlay" } }
  }
}
```

---

## Component Patterns

### FrameCard Usage

```tsx
<FrameCard
  ratio="square"
  frame={overlay.frames.square}
  onFrameUpload={(url) => handleUpdate("square", { frameUrl: url })}
  onEnabledChange={(enabled) => handleUpdate("square", { enabled })}
  onRemove={() => handleUpdate("square", { frameUrl: null, enabled: false })}
  disabled={isPending}
/>
```

### OverlayPreview Usage

```tsx
<OverlayPreview
  overlay={overlay}
  selectedRatio={selectedRatio}
  onRatioChange={setSelectedRatio}
/>
```

### Page Layout

```tsx
<div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr] items-start">
  {/* Form */}
  <div className="space-y-6">
    <FrameCard ratio="square" ... />
    <FrameCard ratio="story" ... />
  </div>

  {/* Preview */}
  <div className="hidden lg:block lg:sticky lg:top-4">
    <OverlayPreview ... />
  </div>
</div>
```

---

## Testing Checklist

- [ ] Upload frame image for square aspect ratio
- [ ] Upload frame image for story aspect ratio
- [ ] Enable/disable frame without losing URL
- [ ] Preview shows frame when enabled
- [ ] Preview hides frame when disabled
- [ ] Switch preview between square and story
- [ ] Remove frame clears URL and disables
- [ ] Error handling for upload failures
- [ ] Mobile layout works (stacked form)
- [ ] Run `pnpm lint && pnpm type-check`

---

## Related Documentation

- [spec.md](./spec.md) - Feature specification
- [plan.md](./plan.md) - Implementation plan
- [research.md](./research.md) - Pattern research
- [data-model.md](./data-model.md) - Data model details
- [contracts/server-actions.md](./contracts/server-actions.md) - API contracts
