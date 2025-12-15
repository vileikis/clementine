# Research: Event Frame Overlay Configuration

**Feature**: 027-output-config
**Date**: 2025-12-15

## Research Summary

No NEEDS CLARIFICATION markers were identified in the Technical Context. The codebase has well-established patterns for event configuration, image uploads, and preview components. This research documents the patterns that will be reused and confirms implementation decisions.

---

## 1. Event Data Extension Pattern

### Decision
Extend the Event interface with an `overlay` field as a nested object containing frame configurations keyed by aspect ratio.

### Rationale
- Follows existing pattern: `Event.theme`, `Event.welcome`, `Event.extras` are all nested objects on the Event document
- Avoids separate Firestore collection - keeps overlay config colocated with event
- Enables atomic updates using Firestore dot-notation (e.g., `overlay.square.enabled`)

### Alternatives Considered
1. **Separate `eventOverlays` collection**: Rejected - adds complexity, requires additional reads, breaks atomic event updates
2. **Store in Experience instead of Event**: Rejected - PRD explicitly states overlays are event-wide, not per-experience

### Reference Pattern
From `web/src/features/events/types/event.types.ts`:
```typescript
export interface Event {
  // ...existing fields
  theme: Theme
  welcome?: EventWelcome
  extras: EventExtras
  // NEW: overlay?: EventOverlayConfig
}
```

---

## 2. Image Upload Pattern

### Decision
Use existing `ImageUploadField` component with a new destination type `"frames"` for overlay frame images.

### Rationale
- Existing `ImageUploadField` handles file validation, upload progress, error states
- Server action `uploadImage` already supports multiple destination types
- Images stored as full public URLs per Firebase Architecture Standards

### Storage Path
```
media/{companyId}/frames/{timestamp}-{filename}
```

This follows the existing pattern where:
- `media/{companyId}/backgrounds/` stores theme backgrounds
- `media/{companyId}/logos/` stores company logos

### Reference
From `web/src/components/shared/ImageUploadField.tsx` and `web/src/lib/storage/actions.ts`

---

## 3. Preview Component Pattern

### Decision
Create `OverlayPreview` component using `PreviewShell` with aspect ratio switching for square/story modes.

### Rationale
- `PreviewShell` provides consistent preview experience (viewport switching, fullscreen)
- Frame overlay compositing done client-side with CSS absolute positioning
- Use placeholder image when no generated output exists (per spec FR-009)

### Implementation Approach
```tsx
// Frame compositing with absolute positioning
<div className="relative" style={{ aspectRatio: selectedRatio }}>
  {/* Base image (placeholder or real) */}
  <img src={baseImageUrl} className="absolute inset-0 w-full h-full object-cover" />

  {/* Frame overlay (only if enabled and frameUrl exists) */}
  {frame.enabled && frame.frameUrl && (
    <img src={frame.frameUrl} className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
  )}
</div>
```

### Reference Pattern
From `web/src/features/events/components/welcome/WelcomePreview.tsx` and `web/src/features/theming/components/ThemedBackground.tsx`

---

## 4. Form State Management Pattern

### Decision
Use `useReducer` for complex overlay state management with autosave on field changes.

### Rationale
- Follows `EventThemeEditor` pattern which uses `useReducer` for theme state
- Multiple interdependent fields (enabled toggle affects preview, frameUrl affects enabled state)
- Autosave with `useAutoSave` hook for blur-based persistence

### Reference Pattern
From `web/src/features/events/components/designer/EventThemeEditor.tsx`:
```typescript
type OverlayAction =
  | { type: "SET_FRAME_URL"; ratio: AspectRatio; url: string | null }
  | { type: "SET_ENABLED"; ratio: AspectRatio; enabled: boolean }
  | { type: "REMOVE_FRAME"; ratio: AspectRatio }

function overlayReducer(state: EventOverlayConfig, action: OverlayAction): EventOverlayConfig
```

---

## 5. Server Action Pattern

### Decision
Create `updateEventOverlayAction` following existing action patterns with partial updates.

### Rationale
- Follows existing `updateEventThemeAction`, `updateEventWelcomeAction` patterns
- Uses Zod validation for input schema
- Uses Admin SDK via repository for Firestore updates
- Supports partial updates (update single aspect ratio without touching others)

### Action Signature
```typescript
export async function updateEventOverlayAction(
  projectId: string,
  eventId: string,
  data: UpdateEventOverlayInput
): Promise<ActionResponse<void>>
```

### Reference
From `web/src/features/events/actions/events.actions.ts`

---

## 6. Repository Pattern for Nested Updates

### Decision
Use Firestore dot-notation for partial overlay updates.

### Rationale
- Enables updating single aspect ratio without overwriting entire overlay object
- Follows existing pattern in `updateEventTheme` repository function
- Prevents race conditions when updating different aspect ratios concurrently

### Implementation
```typescript
// Partial update for single aspect ratio
const updateData: Record<string, unknown> = {
  updatedAt: Date.now(),
};

if (data.square !== undefined) {
  if (data.square.enabled !== undefined) {
    updateData["overlay.square.enabled"] = data.square.enabled;
  }
  if (data.square.frameUrl !== undefined) {
    updateData["overlay.square.frameUrl"] = data.square.frameUrl;
  }
}
// Similar for story...

await eventRef.update(updateData);
```

### Reference
From `web/src/features/events/repositories/events.repository.ts` - `updateEventTheme` function

---

## 7. Route Structure

### Decision
Create new route at `web/src/app/(workspace)/[companySlug]/[projectId]/[eventId]/overlays/page.tsx`

### Rationale
- PRD specifies "Separate page from Outro & Share settings"
- Follows existing pattern: `general/`, `theme/` pages under event routes
- Consistent with workspace layout that provides event context

### Page Structure
```tsx
// Server Component fetches event data
export default async function OverlaysPage({ params }) {
  const event = await getEvent(params.projectId, params.eventId)
  return <EventOverlaysTab event={event} />
}

// Client Component handles form state and preview
function EventOverlaysTab({ event }: { event: Event }) {
  // Two-column layout: form left, preview right
}
```

---

## 8. Aspect Ratio Constants

### Decision
Define aspect ratio constants in `events/constants.ts` matching spec values.

### Rationale
- Consistent naming convention with existing constants
- Type-safe enum for validation
- Single source of truth for supported aspect ratios

### Values
```typescript
export const OVERLAY_ASPECT_RATIOS = {
  square: { label: "Square", ratio: "1:1", cssAspect: "1/1" },
  story: { label: "Story", ratio: "9:16", cssAspect: "9/16" },
} as const

export type OverlayAspectRatio = keyof typeof OVERLAY_ASPECT_RATIOS
```

---

## 9. Default Values

### Decision
Events without overlay configuration default to empty/disabled state per aspect ratio.

### Rationale
- Matches PRD: "If no frame entry exists for an aspect ratio → no frame is applied"
- Non-breaking change - existing events continue to work without overlays
- Schema allows optional overlay field with nullable frame entries

### Default
```typescript
export const DEFAULT_EVENT_OVERLAY: EventOverlayConfig = {
  frames: {
    square: { enabled: false, frameUrl: null },
    story: { enabled: false, frameUrl: null },
  },
}
```

---

## 10. Mobile-First Layout

### Decision
Stack form and preview vertically on mobile, side-by-side on desktop.

### Rationale
- Constitution Principle I: Mobile-first responsive design
- Follows existing patterns in `EventGeneralTab` and `EventThemeEditor`
- Preview still accessible on mobile via scroll or collapsible section

### Implementation
```tsx
<div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr] items-start">
  {/* Left: Form sections - full width on mobile */}
  <div className="space-y-6">
    <FrameCard ratio="square" ... />
    <FrameCard ratio="story" ... />
  </div>

  {/* Right: Preview - hidden on mobile, sticky on desktop */}
  <div className="hidden lg:block lg:sticky lg:top-4">
    <OverlayPreview ... />
  </div>
</div>
```

---

## Summary of Decisions

| Area | Decision | Pattern Source |
|------|----------|----------------|
| Data Model | Nested `overlay` field on Event | `Event.theme`, `Event.welcome` |
| Storage | `media/{companyId}/frames/` path | `media/{companyId}/backgrounds/` |
| Upload | Extend `ImageUploadField` destinations | Existing component |
| Preview | `PreviewShell` + CSS frame compositing | `WelcomePreview` |
| Form State | `useReducer` with autosave | `EventThemeEditor` |
| Server Action | `updateEventOverlayAction` | `updateEventThemeAction` |
| Repository | Dot-notation partial updates | `updateEventTheme` |
| Route | `/overlays/page.tsx` | `/general/page.tsx` |
| Layout | Two-column, mobile-first | `EventGeneralTab` |

All patterns confirmed from existing codebase - no new abstractions required.
