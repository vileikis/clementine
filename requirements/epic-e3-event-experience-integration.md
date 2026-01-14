# Epic E3: Event-Experience Integration

> **Epic Series:** Experience System
> **Dependencies:** E1 (Data Layer & Library)
> **Enables:** E6 (Guest Access & Welcome)

---

## 1. Goal

Enable admins to connect workspace experiences to events, managing which experiences appear in the welcome screen and guest flow.

**This epic delivers:**

- Experience assignment UI in event designer
- ExperienceSlotManager component (reusable)
- ConnectExperienceDrawer (slide-over panel with search)
- Main experiences in Welcome tab (with overlay toggle)
- Pregate/preshare experiences in Settings tab
- Welcome screen WYSIWYG (shows actual experience cards)
- Event config schema updates for experiences field

**This epic does NOT include:**

- Experience editing (E2)
- Guest runtime (E5+)
- Share screen (E4, E8)

---

## 2. Event Config Schema Updates

### 2.1 Experiences Field

Add to `projectEventConfigSchema`:

```typescript
experiences: {
  main: Array<{
    experienceId: string
    enabled: boolean
    applyOverlay: boolean  // Whether to apply event overlay on result media
  }>
  pregate: {
    experienceId: string
    enabled: boolean
  } | null
  preshare: {
    experienceId: string
    enabled: boolean
  } | null
}
```

### 2.2 Slot Definitions

| Slot | Cardinality | Allowed Profiles | Location |
|------|-------------|------------------|----------|
| `main` | Array (0-n) | freeform, survey | Welcome tab |
| `pregate` | Single (0-1) | survey, story | Settings tab |
| `preshare` | Single (0-1) | survey, story | Settings tab |

---

## 3. ExperienceSlotManager Component

### 3.1 Interface

```typescript
interface ExperienceSlotManagerProps {
  mode: 'list' | 'single'
  slot: 'main' | 'pregate' | 'preshare'
  workspaceId: string
  experiences: ExperienceReference[]
  onUpdate: (experiences: ExperienceReference[]) => void
}

interface ExperienceReference {
  experienceId: string
  enabled: boolean
  applyOverlay?: boolean  // Only for main slot
}

// Default values when connecting an experience:
// - enabled: true
// - applyOverlay: true (main slot only)
```

### 3.2 Mode Behavior

| Mode | Behavior |
|------|----------|
| `list` | Multiple items, drag-to-reorder, "Add" always visible |
| `single` | 0 or 1 item, no reorder, "Add" only when empty |

### 3.3 Panel Management

The slot manager controls opening/closing of the ConnectExperienceDrawer:

```
default ←→ ConnectExperienceDrawer (slide-over)
```

States:
- **default**: Shows experience list/item with "Add" button
- **drawer open**: ConnectExperienceDrawer slides in from right

Note: Creating new experiences opens a new browser tab to `/workspace/$workspaceSlug/experiences/new`

---

## 4. Experience List Item

### 4.1 Layout

```
┌───────────────────────────────────────────────────────────────┐
│ ⋮⋮  [thumb] Experience Name  [badge]  [overlay] [toggle] ⋯   │
└───────────────────────────────────────────────────────────────┘
     ↑      ↑          ↑          ↑         ↑        ↑      ↑
  drag   media      name      profile   overlay   enable  menu
```

### 4.2 Elements

| Element | Visibility | Action |
|---------|------------|--------|
| Drag handle | List mode only | Reorder |
| Thumbnail | Always | Visual identifier |
| Name | Always | - |
| Profile badge | Always | Visual indicator |
| Overlay toggle | Main slot only | Toggle applyOverlay flag |
| Enable toggle | Always | Enable/disable experience |
| Context menu | Always | Edit (new tab), Remove |

### 4.3 Context Menu Actions

- **Edit**: Opens experience editor in new browser tab
- **Remove**: Removes from event (does not delete experience)

---

## 5. ConnectExperienceDrawer

A slide-over drawer panel that opens from the right side when user clicks "Add" to connect an experience.

### 5.1 Layout

```
┌─────────────────────────────────────┐
│ Connect Experience              ✕   │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 🔍 Search experiences...        │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Available Experiences               │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [thumb] Exp 1        [freeform] │ │ ← click to connect
│ ├─────────────────────────────────┤ │
│ │ [thumb] Exp 2 (in use) [survey] │ │ ← disabled, already assigned
│ ├─────────────────────────────────┤ │
│ │ [thumb] Exp 3        [freeform] │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ─────────────────────────────────── │
│                                     │
│ [+ Create New Experience ↗]         │ ← opens new tab
└─────────────────────────────────────┘
```

### 5.2 Search

- Search field with magnifying glass icon at the top
- **Filter as-you-type** with 300ms debounce
- Filters experiences by name (case-insensitive)
- Shows "No experiences found" when search has no results
- Clear button (×) appears when search has text

### 5.3 Filtering

- Shows only experiences matching slot's allowed profiles
- Experiences already assigned to this event are disabled with "(in use)" indicator
- Shows profile badge on each item

### 5.4 Actions

- **Close (✕)**: Closes drawer, returns to default state
- **Select item**: Connects experience to slot, closes drawer
- **Create New Experience**: Opens `/workspace/$workspaceSlug/experiences/new` in new browser tab (drawer remains open)

---

## 6. Welcome Tab Integration

### 6.1 WelcomeConfigPanel Updates

Add "Experiences" section below existing welcome config:

```
┌─────────────────────────────────────┐
│ Welcome Screen                      │
├─────────────────────────────────────┤
│ Title: [____________________]       │
│ Description: [______________]       │
│ Layout: ○ List  ● Grid              │
├─────────────────────────────────────┤
│ Experiences                         │
│                                     │
│ [ExperienceSlotManager mode=list]   │
│                                     │
├─────────────────────────────────────┤
│ ℹ️ Pregate/preshare configured      │ ← callout if extras exist
│    View in Settings →               │
└─────────────────────────────────────┘
```

### 6.2 Callout

If pregate or preshare experiences are configured, show info callout with link to Settings tab.

---

## 7. Settings Tab Integration

### 7.1 Guest Flow Section

Add "Guest Flow" section to EventSettingsPage:

```
┌─────────────────────────────────────┐
│ Guest Flow                          │
├─────────────────────────────────────┤
│ Before Welcome (Pregate)            │
│ Runs before guest sees welcome      │
│                                     │
│ [ExperienceSlotManager mode=single] │
│                                     │
├─────────────────────────────────────┤
│ Before Share (Preshare)             │
│ Runs after experience, before share │
│                                     │
│ [ExperienceSlotManager mode=single] │
└─────────────────────────────────────┘
```

---

## 8. Welcome Screen WYSIWYG

### 8.1 Preview Updates

The welcome preview (center column) should show actual experience cards from `draftConfig.experiences.main`.

### 8.2 ExperienceCard Component

Shared component for displaying experience in welcome screen:

```typescript
interface ExperienceCardProps {
  experience: Experience
  layout: 'list' | 'grid'
  mode: 'edit' | 'run'
  onClick?: () => void  // Only in run mode
}
```

### 8.3 Edit Mode Behavior

- Shows experience thumbnail, name, profile badge
- Non-interactive (clicking does nothing)
- Reflects enabled/disabled state (dimmed if disabled)
- Updates immediately when experiences added/removed/reordered

---

## 9. Implementation Phases

### Phase 1: Schema Updates

Add experiences field to event config schema. Handle migration for existing events (default to empty).

### Phase 2: ExperienceSlotManager

Build reusable slot manager component with list/single modes and drawer state management.

### Phase 3: Experience List Item

Build list item with thumbnail, badge, enable toggle, overlay toggle (main slot only), drag handle, context menu.

### Phase 4: ConnectExperienceDrawer

Build slide-over drawer with search, experience list, profile filtering, and "Create New" link (opens new tab).

### Phase 5: Welcome Tab Integration

Integrate slot manager into WelcomeConfigPanel, add callout for extras.

### Phase 6: Settings Tab Integration

Add Guest Flow section to Settings with pregate/preshare slot managers.

### Phase 7: Welcome WYSIWYG

Update welcome preview to show actual experience cards from draft config.

---

## 10. Acceptance Criteria

### Must Have

- [ ] Event config includes experiences field (main, pregate, preshare)
- [ ] Main experiences include applyOverlay flag (defaults to true)
- [ ] Admin can add main experiences from Welcome tab
- [ ] Admin can reorder main experiences via drag-and-drop
- [ ] Admin can enable/disable experiences
- [ ] Admin can toggle applyOverlay for main experiences
- [ ] Admin can remove experiences from event
- [ ] Admin can add pregate experience from Settings
- [ ] Admin can add preshare experience from Settings
- [ ] Connect drawer opens as slide-over panel from right
- [ ] Connect drawer has search field with as-you-type filtering
- [ ] Experience picker filters by slot-compatible profiles
- [ ] Already-assigned experiences are disabled in picker
- [ ] "Create New Experience" opens create page in new browser tab
- [ ] "Edit" opens experience editor in new tab
- [ ] Welcome preview shows actual experience cards
- [ ] Callout appears when pregate/preshare configured

### Nice to Have

- [ ] Bulk enable/disable all experiences
- [ ] Copy experiences between events

---

## 11. Technical Notes

### Folder Structure

```
domains/event/
├── experiences/
│   ├── components/
│   │   ├── ExperienceSlotManager.tsx
│   │   ├── ExperienceListItem.tsx
│   │   ├── ConnectExperienceDrawer.tsx   # Slide-over with search
│   │   └── ExperienceCard.tsx
│   └── hooks/
│       └── useExperiencesForSlot.ts
├── welcome/
│   └── components/
│       └── WelcomeConfigPanel.tsx  # Updated
├── settings/
│   └── containers/
│       └── EventSettingsPage.tsx   # Updated
└── shared/
    └── schemas/
        └── project-event-config.schema.ts  # Updated
```

### Shared Components

`ExperienceCard` may be moved to `src/shared/components/` if needed by guest domain later.

---

## 12. Out of Scope

| Item | Epic |
|------|------|
| Step editing | E2 |
| Guest welcome screen | E6 |
| Runtime execution | E7 |
| Share screen | E4, E8 |
