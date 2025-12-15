# Event Overlay Configuration (Frame Overlays)

## Objective

Allow event organizers to configure a **frame overlay** applied to generated images at the event level, with per–aspect ratio control.

---

## Problem

Brands often require visual framing of generated photos (logos, borders, themed frames).
Currently, there is no centralized, reusable way to apply such overlays across an event.

---

## Scope

### In Scope

- Add `EventOverlayConfig` to the `Event` model
- Support **image-only frame overlays**
- Allow configuration per supported aspect ratio
- Create a dedicated **Overlays** configuration page with preview

### Out of Scope

- Watermarks
- Positioning controls
- Video output overlays
- Per-experience overrides

---

## Functional Requirements

### 1. Event Model Extension

#### EventOverlayConfig

Fields:

frames — map keyed by aspect ratio

Supported aspect ratios:

square (1:1)

story (9:16)

Each frame entry contains:

enabled (boolean)

frameUrl (optional string)

Behavior:

If enabled === true and frameUrl is set → frame is applied

If enabled === false → frame is ignored even if frameUrl exists

If no frame entry exists for an aspect ratio → no frame is applied

Frame overlays apply only to images

Frames are event-wide and affect all image outputs of the matching aspect ratio

Rationale:

Enables fast A/B toggling or temporary disabling

Avoids forcing users to delete and re-upload assets

Supports experimentation without data loss

---

### 2. Configuration Page

Location:

- Event-level settings section
- Separate page from Outro & Share settings

Capabilities:

Capabilities:

- Upload or set a frame image per aspect ratio
- Toggle frame enabled / disabled per aspect ratio
- Remove frame (clears frameUrl and disables)
- Clearly indicate:
  - frame present
  - frame enabled/disabled
  - affected aspect ratio
- UX expectation:
  - Enable toggle is visible even when a frame is uploaded
  - Disabled frames remain visible in the editor but inactive in output

---

### 3. Preview

- Preview of generated image with frame applied
- User can switch preview between:

  - Square
  - Story

- Preview uses placeholder image if no real output exists

---

## Success Criteria

- Event creators can apply consistent visual framing across an event
- Users can temporarily disable frames without losing configuration
- Frame configuration is simple and limited to clear use cases
- Aspect-ratio-specific behavior is predictable and previewable

---

## Implementation Notes

### Feature Module

Implement within the existing **Events** feature module:

```
web/src/features/events/
├── schemas/       # Add overlay config schema
├── types/         # Add overlay config types
├── components/    # Add overlay config UI components
└── hooks/         # Add overlay config hooks if needed
```

### Route

```
web/src/app/(workspace)/[companySlug]/[projectId]/[eventId]/overlays/
└── page.tsx
```

This creates a dedicated "Overlays" page in the event settings section, separate from Outro & Share settings as specified.
