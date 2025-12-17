# Event Outro & Share Configuration

## Objective

Allow event organizers to configure the **end-of-experience screen** (Outro) and **sharing options** at the event level, with live preview.

---

## Problem

Currently, events have a configurable **Welcome** screen but lack a structured way to define:

- What users see after they complete an experience
- Whether and how results can be shared or downloaded

This leads to:

- Inconsistent end-user experience
- No clear place to manage sharing permissions
- No previewable “end state” for event creators

---

## Scope

### In Scope

- Add `EventOutro` and `EventShareOptions` to the `Event` model
- Create a dedicated **Event Outro & Share** configuration page
- Provide a **live preview** of the Outro screen

### Out of Scope

- Email flows or CRM integrations
- Per-experience overrides
- Advanced analytics on sharing behavior

---

## Functional Requirements

### 1. Event Model Extensions

#### EventOutro

Event-level configuration for the end-of-experience message.

Fields:

- `title` (optional)
- `description` (optional)
- `ctaLabel` (optional)
- `ctaUrl` (optional)

Behavior:

- If fields are empty, Outro screen still renders but only shows result + share options
- CTA is optional; if missing, no primary CTA is shown

#### EventShareOptions

Controls what sharing actions are available to guests.

Fields:

- `allowDownload` (boolean)
- `allowSystemShare` (boolean)
- `allowEmail` (boolean)
- `socials` (list of enabled social platforms)

Behavior:

- Disabled options are hidden from the guest UI
- At least one sharing option may be enabled, but none is required

---

### 2. Configuration Page

Location:

- Event-level settings section
- Separate page (not embedded in Experience editor)

Capabilities:

- Edit Outro copy fields
- Enable/disable sharing options
- Select allowed social platforms

---

### 3. Preview

- Live preview of the **Outro screen**
- Preview reflects:

  - Current theme
  - Outro copy
  - Enabled/disabled share options

- Preview does not require a real generated asset (uses placeholder)

---

## Success Criteria

- Event creators can fully configure and preview the end-of-experience screen
- Sharing permissions are explicit and event-scoped
- Outro configuration feels symmetrical to existing Welcome configuration

---

## Implementation Details

### Feature Module

Implement within the existing `web/src/features/events/` module.

### Admin Route

Add new route at:

```
web/src/app/(workspace)/[companySlug]/[projectId]/[eventId]/outro/
```

### Guest-Facing Components

Implement outro screen and related components in `web/src/features/guest/` following the pattern established by `web/src/features/guest/components/welcome/`.

### Reference Implementation

Use `web/src/features/events/components/EventGeneralTab.tsx` as reference for:

- Two-column layout (form + live preview)
- Form state management with react-hook-form
- Autosave integration with useAutoSave hook
- Real-time preview updates via form.watch()
