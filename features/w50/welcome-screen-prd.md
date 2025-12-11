# Welcome Screen Customization PRD

**Status:** Draft
**Week:** W50 (December 2024)
**Goal:** Enable event creators to customize the guest welcome/landing screen with personalized content and flexible experience display layouts.

---

## 1. Purpose

Extend the Event General tab to support welcome screen customization, giving event creators control over the first impression guests see when they visit an event link. This feature adds:

1. **Welcome Content** — Customizable title, description, and hero media
2. **Experience Layout** — Choice of how linked experiences are displayed (list or grid)
3. **Live Preview** — Real-time preview of the welcome screen with event theming applied
4. **Autosave** — Changes are saved automatically as the user edits

---

## 2. User Stories

### US-1: Customize Welcome Content

**As an** event creator
**I want to** customize the title, description, and media shown on the welcome screen
**So that** guests see branded, event-specific content when they arrive

**Acceptance Criteria:**
- User can set a custom welcome title (optional, falls back to event name if empty)
- User can set a custom welcome description (optional)
- User can upload hero media (image or video) for the welcome screen
- All fields are optional — empty fields gracefully fall back to defaults or are hidden

### US-2: Choose Experience Layout

**As an** event creator
**I want to** choose how experiences are displayed on the welcome screen
**So that** the layout matches my event's visual style and number of experiences

**Acceptance Criteria:**
- User can choose between two layout options:
  - **List** — Single column, vertical stack of experience cards
  - **Grid** — Two-column grid of experience cards
- Default layout is "List"
- Layout choice is persisted per event
- Preview updates to reflect the selected layout

### US-3: Preview Welcome Screen

**As an** event creator
**I want to** see a live preview of the welcome screen as I make changes
**So that** I can verify the appearance before guests see it

**Acceptance Criteria:**
- Preview panel displays on the same screen as the configuration controls
- Preview renders using the `preview-shell` module (device frame, viewport switching)
- Preview applies the event's theme via the `theming` module
- Preview updates in real-time as welcome content or layout changes
- Preview shows experience cards in the selected layout format

### US-4: Autosave Changes

**As an** event creator
**I want** my changes to save automatically
**So that** I don't lose work and don't need to remember to click save

**Acceptance Criteria:**
- Changes are automatically saved after the user stops typing/editing (debounced)
- Visual indicator shows when changes are being saved
- Visual indicator confirms when changes are saved successfully
- Failed saves show an error notification with option to retry

---

## 3. Functional Requirements

### FR-1: Welcome Content Fields

The General tab must support configuring the following welcome screen content:

| Field | Type | Constraints | Default |
|-------|------|-------------|---------|
| Welcome Title | Text input | Optional, max 100 characters | Event name |
| Welcome Description | Textarea | Optional, max 500 characters | Empty |
| Welcome Media | Media upload | Optional, image or video | None |
| Welcome Media Type | Auto-detected | image / video | Based on upload |

**Notes:**
- Title field shows placeholder with event name when empty
- Description is displayed below the title on the welcome screen
- Media is displayed as a hero element above or behind the welcome content

### FR-2: Experience Layout Options

The General tab must support configuring the experience display layout:

| Layout | Description | Best For |
|--------|-------------|----------|
| **List** | Single column, full-width experience cards stacked vertically | Events with 1-3 experiences, longer experience names |
| **Grid** | Two-column grid of experience cards | Events with 4+ experiences, visual variety |

**Notes:**
- Layout selection is a simple toggle or segmented control
- Only enabled experiences (from the experiences array) are shown in preview
- Experience cards display the experience name (or custom label if set)

### FR-3: Preview Panel

The preview panel must leverage existing modules:

**Using `preview-shell` module:**
- `PreviewShell` component with device frame
- Optional viewport switching (mobile/tablet)
- Optional fullscreen mode

**Using `theming` module:**
- `ThemeProvider` wrapping preview content
- `ThemedBackground` for background rendering
- `useEventTheme` hook for accessing theme values

**Preview content must show:**
- Hero media (if configured)
- Welcome title
- Welcome description
- Experience cards in the selected layout

**Behavior:**
- Updates instantly when any setting changes
- Reflects current theme settings from event

### FR-4: Autosave Behavior

The autosave system must:

- Debounce changes (500ms delay after last edit)
- Show saving indicator while persisting
- Show success confirmation briefly after save completes
- Show error notification if save fails
- Not interrupt user editing flow
- Handle concurrent edits gracefully (last write wins)

### FR-5: General Tab Layout

The General tab layout must be reorganized to:

1. **Welcome Section** (new)
   - Welcome title input
   - Welcome description textarea
   - Welcome media upload
   - Layout selector (list/grid toggle)

2. **Experiences Section** (existing)
   - Add experience card
   - Attached experience cards with enable/disable toggle

3. **Extras Section** (existing)
   - Pre-entry gate slot
   - Pre-reward slot

4. **Preview Panel** (new)
   - Uses `PreviewShell` with live welcome screen preview

---

## 4. Edge Cases (Admin Preview)

| Scenario | Preview Behavior |
|----------|------------------|
| No title set | Show event name as title |
| No description set | Hide description area |
| No media set | Show plain background (theme background applies) |
| No experiences linked | Show empty state with message |
| Single experience | Show single card regardless of layout |
| All experiences disabled | Show empty state |

---

## 5. Out of Scope

- Guest-facing welcome screen implementation (separate feature)
- Custom CSS or advanced styling beyond theme settings
- Animation or transition customization
- Multiple welcome screen variants (A/B testing)
- Conditional content based on guest attributes
- Rich text formatting in description
- Media gallery (multiple hero images/videos)
- Scheduling different welcome content for different times
- Experience card customization (thumbnail, description) beyond label

---

## 6. Success Criteria

- [ ] Welcome title field available and persists correctly
- [ ] Welcome description field available and persists correctly
- [ ] Welcome media upload works for images and videos
- [ ] Layout toggle switches between list and grid views
- [ ] Preview panel renders using `PreviewShell` component
- [ ] Preview applies theme using `theming` module
- [ ] Preview updates in real-time on content/layout changes
- [ ] Autosave triggers after editing stops (debounced)
- [ ] Saving indicator visible during persistence
- [ ] Success/error feedback shown after save attempt

---

## 7. Data Schema

### New Types

```typescript
/**
 * Experience layout options for the welcome screen
 */
export type ExperienceLayout = "list" | "grid";

/**
 * Welcome screen content configuration
 */
export interface EventWelcome {
  title?: string | null;        // Max 100 chars, falls back to event.name in UI
  description?: string | null;  // Max 500 chars
  mediaUrl?: string | null;     // Hero image/video URL (Firebase Storage)
  mediaType?: "image" | "video" | null;
  layout: ExperienceLayout;     // Default: "list"
}
```

### Updated Event Interface

```typescript
export interface Event {
  id: string;
  projectId: string;
  companyId: string;
  name: string;

  publishStartAt?: number | null;
  publishEndAt?: number | null;

  experiences: EventExperienceLink[];
  extras: EventExtras;
  theme: Theme;  // From theming module

  welcome: EventWelcome;  // NEW

  deletedAt?: number | null;
  createdAt: number;
  updatedAt: number;
}
```

### Default Values

```typescript
const DEFAULT_WELCOME: EventWelcome = {
  title: null,
  description: null,
  mediaUrl: null,
  mediaType: null,
  layout: "list",
};
```

### Field Constraints

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `welcome.title` | string \| null | No | Max 100 characters |
| `welcome.description` | string \| null | No | Max 500 characters |
| `welcome.mediaUrl` | string \| null | No | Valid URL |
| `welcome.mediaType` | enum \| null | No | "image" \| "video" |
| `welcome.layout` | enum | Yes | "list" \| "grid", default "list" |

---

## 8. Dependencies

- `preview-shell` module — Device frame and preview infrastructure
- `theming` module — Theme types, provider, and styled components
- Event experiences array (existing)
- Media upload infrastructure (existing)

---

## 9. Related Documentation

- [Phase 6: Event Experiences & Extras](../scalable-arch/phase-6-event-experiences.md) — Current General tab implementation
- [Preview Shell PRD](./preview-shell-prd.md) — Preview infrastructure
- [Data Model v5](../scalable-arch/new-data-model-v5.md) — Event schema reference
