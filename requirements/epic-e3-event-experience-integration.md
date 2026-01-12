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
- Main experiences in Welcome tab
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
}
```

### 3.2 Mode Behavior

| Mode | Behavior |
|------|----------|
| `list` | Multiple items, drag-to-reorder, "Add" always visible |
| `single` | 0 or 1 item, no reorder, "Add" only when empty |

### 3.3 Internal State Machine

```
default → ConnectExperiencePanel → CreateExperiencePanel → default
    ↑______________|_______________________|
```

States:
- **default**: Shows experience list/item
- **connecting**: Shows experience picker
- **creating**: Shows create experience form

---

## 4. Experience List Item

### 4.1 Layout

```
┌─────────────────────────────────────────────────┐
│ ⋮⋮  [thumb] Experience Name  [badge]  [toggle] ⋯│
└─────────────────────────────────────────────────┘
     ↑      ↑          ↑          ↑        ↑     ↑
  drag   media      name      profile  enable  menu
```

### 4.2 Elements

| Element | Visibility | Action |
|---------|------------|--------|
| Drag handle | List mode only | Reorder |
| Thumbnail | Always | Visual identifier |
| Name | Always | - |
| Profile badge | Always | Visual indicator |
| Toggle | Always | Enable/disable |
| Context menu | Always | Edit (new tab), Remove |

### 4.3 Context Menu Actions

- **Edit**: Opens experience editor in new browser tab
- **Remove**: Removes from event (does not delete experience)

---

## 5. ConnectExperiencePanel

### 5.1 Layout

```
┌─────────────────────────────────────┐
│ ← Back                              │
├─────────────────────────────────────┤
│ Select Experience                   │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [thumb] Exp 1        [freeform] │ │
│ ├─────────────────────────────────┤ │
│ │ [thumb] Exp 2 (in use) [survey] │ │ ← disabled
│ ├─────────────────────────────────┤ │
│ │ [thumb] Exp 3        [freeform] │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [+ Create New Experience]           │
└─────────────────────────────────────┘
```

### 5.2 Filtering

- Shows only experiences matching slot's allowed profiles
- Experiences already assigned to this event are disabled
- Shows profile badge on each item

### 5.3 Actions

- **Back**: Return to default state
- **Select**: Assigns experience to slot, returns to default
- **Create New**: Navigates to creating state

---

## 6. CreateExperiencePanel

### 6.1 Layout

```
┌─────────────────────────────────────┐
│ ← Back                              │
├─────────────────────────────────────┤
│ Create Experience                   │
│                                     │
│ Name                                │
│ [________________________]          │
│                                     │
│ Profile                             │
│ ○ Freeform - Full flexibility       │
│ ● Survey - Data collection          │
│ ○ Story - Display only              │
│                                     │
│ [Create]                            │
└─────────────────────────────────────┘
```

### 6.2 Profile Options

Filtered by slot compatibility:
- **main**: freeform, survey
- **pregate**: survey, story
- **preshare**: survey, story

### 6.3 Actions

- **Back**: Return to connecting state
- **Create**: Creates experience, assigns to slot, returns to default

---

## 7. Welcome Tab Integration

### 7.1 WelcomeConfigPanel Updates

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

### 7.2 Callout

If pregate or preshare experiences are configured, show info callout with link to Settings tab.

---

## 8. Settings Tab Integration

### 8.1 Guest Flow Section

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

## 9. Welcome Screen WYSIWYG

### 9.1 Preview Updates

The welcome preview (center column) should show actual experience cards from `draftConfig.experiences.main`.

### 9.2 ExperienceCard Component

Shared component for displaying experience in welcome screen:

```typescript
interface ExperienceCardProps {
  experience: Experience
  layout: 'list' | 'grid'
  mode: 'edit' | 'run'
  onClick?: () => void  // Only in run mode
}
```

### 9.3 Edit Mode Behavior

- Shows experience thumbnail, name, profile badge
- Non-interactive (clicking does nothing)
- Reflects enabled/disabled state (dimmed if disabled)
- Updates immediately when experiences added/removed/reordered

---

## 10. Implementation Phases

### Phase 1: Schema Updates

Add experiences field to event config schema. Handle migration for existing events (default to empty).

### Phase 2: ExperienceSlotManager

Build reusable slot manager component with state machine, list/single modes.

### Phase 3: Experience List Item

Build list item with thumbnail, badge, toggle, drag handle, context menu.

### Phase 4: Connect & Create Panels

Build experience picker and create form panels with proper filtering.

### Phase 5: Welcome Tab Integration

Integrate slot manager into WelcomeConfigPanel, add callout for extras.

### Phase 6: Settings Tab Integration

Add Guest Flow section to Settings with pregate/preshare slot managers.

### Phase 7: Welcome WYSIWYG

Update welcome preview to show actual experience cards from draft config.

---

## 11. Acceptance Criteria

### Must Have

- [ ] Event config includes experiences field (main, pregate, preshare)
- [ ] Admin can add main experiences from Welcome tab
- [ ] Admin can reorder main experiences via drag-and-drop
- [ ] Admin can enable/disable experiences
- [ ] Admin can remove experiences from event
- [ ] Admin can add pregate experience from Settings
- [ ] Admin can add preshare experience from Settings
- [ ] Experience picker filters by slot-compatible profiles
- [ ] Already-assigned experiences are disabled in picker
- [ ] Admin can create new experience from picker
- [ ] "Edit" opens experience editor in new tab
- [ ] Welcome preview shows actual experience cards
- [ ] Callout appears when pregate/preshare configured

### Nice to Have

- [ ] Bulk enable/disable all experiences
- [ ] Copy experiences between events

---

## 12. Technical Notes

### Folder Structure

```
domains/event/
├── experiences/
│   ├── components/
│   │   ├── ExperienceSlotManager.tsx
│   │   ├── ExperienceListItem.tsx
│   │   ├── ConnectExperiencePanel.tsx
│   │   ├── CreateExperiencePanel.tsx
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

## 13. Out of Scope

| Item | Epic |
|------|------|
| Step editing | E2 |
| Guest welcome screen | E6 |
| Runtime execution | E7 |
| Share screen | E4, E8 |
