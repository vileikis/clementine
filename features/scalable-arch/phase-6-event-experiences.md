# **📄 PRD — Phase 6: Event Experiences & Extras (General Tab)**

**Status:** Draft
**Goal:** Implement the **General Tab** for Events, enabling attachment of guest-facing **Experiences** and **Extras** (special slot-based flows like pre-entry gates and pre-reward surveys).

---

# **1. Purpose**

Phase 6 transforms the placeholder "Experiences" tab (from Phase 5) into a functional **General Tab** with two sections:

1. **Experiences** — Guest-selectable flows attached to the event
2. **Extras** — Slot-based flows that run at specific points in the Experience Engine lifecycle

This phase enables event creators to:
- Link company Experiences to Events so guests can choose them
- Add optional "Extras" that run before experiences start (pre-entry gate) or before showing AI results (pre-reward)

**Key concept:**
- **Experiences** = What guests can choose
- **Extras** = Special logic around them (consent, surveys, legal notices)

---

# **2. Data Model Changes**

## **2.1 Updated Event Schema**

```ts
interface Event {
  id: string;
  projectId: string;
  companyId: string;
  name: string;

  publishStartAt?: number | null;
  publishEndAt?: number | null;

  // Guest-selectable experiences (existing, enhanced)
  experiences: EventExperienceLink[];

  // NEW: Slot-based extras
  extras: EventExtras;

  theme: EventTheme;
  deletedAt?: number | null;
  createdAt: number;
  updatedAt: number;
}
```

## **2.2 EventExperienceLink (Enhanced)**

```ts
interface EventExperienceLink {
  experienceId: string;      // FK to /experiences/{experienceId}
  label?: string | null;     // Optional display name override
  enabled: boolean;          // NEW: Toggle to enable/disable without removing
}
```

## **2.3 EventExtras (New)**

```ts
interface EventExtras {
  preEntryGate?: EventExtraSlot | null;
  preReward?: EventExtraSlot | null;
}
```

## **2.4 EventExtraSlot (New)**

```ts
type ExtraSlotFrequency = "always" | "once_per_session";

interface EventExtraSlot {
  experienceId: string;           // FK to /experiences/{experienceId}
  frequency: ExtraSlotFrequency;  // When to show this extra
}
```

---

# **3. Zod Schema Updates**

Add to `web/src/features/events/schemas/events.schemas.ts`:

```ts
/**
 * Frequency options for extra slots
 */
export const extraSlotFrequencySchema = z.enum(["always", "once_per_session"]);

/**
 * Event Extra Slot schema
 */
export const eventExtraSlotSchema = z.object({
  experienceId: z.string().min(1, "Experience ID is required"),
  frequency: extraSlotFrequencySchema,
});

/**
 * Event Extras schema (slot-based flows)
 */
export const eventExtrasSchema = z.object({
  preEntryGate: eventExtraSlotSchema.nullable().optional().default(null),
  preReward: eventExtraSlotSchema.nullable().optional().default(null),
});

/**
 * Enhanced Event-Experience link schema
 */
export const eventExperienceLinkSchema = z.object({
  experienceId: z.string().min(1, "Experience ID is required"),
  label: z.string().nullable().optional().default(null),
  enabled: z.boolean().default(true),
});

/**
 * Updated Event schema with extras
 */
export const eventSchema = z.object({
  id: z.string(),
  projectId: z.string().min(1, "Project ID is required"),
  companyId: z.string().min(1, "Company ID is required"),
  name: z.string()
    .min(NAME_LENGTH.MIN, "Name is required")
    .max(NAME_LENGTH.MAX, "Name too long"),
  publishStartAt: z.number().nullable().optional().default(null),
  publishEndAt: z.number().nullable().optional().default(null),
  experiences: z.array(eventExperienceLinkSchema).default([]),
  extras: eventExtrasSchema.default({ preEntryGate: null, preReward: null }),
  theme: eventThemeSchema,
  deletedAt: z.number().nullable().optional().default(null),
  createdAt: z.number(),
  updatedAt: z.number(),
});
```

### **Input Schemas**

```ts
/**
 * Add experience to event input
 */
export const addEventExperienceInputSchema = z.object({
  experienceId: z.string().min(1, "Experience ID is required"),
  label: z.string().nullable().optional(),
});

/**
 * Update event experience input (for label and enabled toggle)
 */
export const updateEventExperienceInputSchema = z.object({
  label: z.string().nullable().optional(),
  enabled: z.boolean().optional(),
});

/**
 * Set extra slot input
 */
export const setEventExtraInputSchema = z.object({
  slot: z.enum(["preEntryGate", "preReward"]),
  experienceId: z.string().min(1, "Experience ID is required"),
  frequency: extraSlotFrequencySchema,
});

/**
 * Remove extra slot input
 */
export const removeEventExtraInputSchema = z.object({
  slot: z.enum(["preEntryGate", "preReward"]),
});
```

---

# **4. Type Definitions**

Add to `web/src/features/events/types/event.types.ts`:

```ts
/**
 * Frequency options for extra slots
 */
export type ExtraSlotFrequency = "always" | "once_per_session";

/**
 * Extra slot configuration
 */
export interface EventExtraSlot {
  experienceId: string;
  frequency: ExtraSlotFrequency;
}

/**
 * Event extras container
 */
export interface EventExtras {
  preEntryGate?: EventExtraSlot | null;
  preReward?: EventExtraSlot | null;
}

/**
 * Enhanced Event-Experience link (with enabled toggle)
 */
export interface EventExperienceLink {
  experienceId: string;
  label?: string | null;
  enabled: boolean;
}
```

---

# **5. Server Actions**

Add to `web/src/features/events/actions/events.actions.ts`:

```ts
// ============================================================================
// Experience Management Actions
// ============================================================================

/**
 * Add an experience to an event
 */
async function addEventExperience(
  projectId: string,
  eventId: string,
  data: { experienceId: string; label?: string | null }
): Promise<ActionResult<Event>>

/**
 * Update an event experience (label, enabled toggle)
 */
async function updateEventExperience(
  projectId: string,
  eventId: string,
  experienceId: string,
  data: { label?: string | null; enabled?: boolean }
): Promise<ActionResult<Event>>

/**
 * Remove an experience from an event
 */
async function removeEventExperience(
  projectId: string,
  eventId: string,
  experienceId: string
): Promise<ActionResult<Event>>

// ============================================================================
// Extras Management Actions
// ============================================================================

/**
 * Set an extra slot (pre-entry gate or pre-reward)
 */
async function setEventExtra(
  projectId: string,
  eventId: string,
  data: {
    slot: "preEntryGate" | "preReward";
    experienceId: string;
    frequency: ExtraSlotFrequency;
  }
): Promise<ActionResult<Event>>

/**
 * Remove an extra from a slot
 */
async function removeEventExtra(
  projectId: string,
  eventId: string,
  slot: "preEntryGate" | "preReward"
): Promise<ActionResult<Event>>
```

---

# **6. UI Implementation**

## **6.1 Tab Rename**

Rename the Event detail page tabs:
- ~~"Experiences"~~ → **"General"**
- "Theme" stays as "Theme"

## **6.2 General Tab Layout**

```
┌────────────────────────────────────────────────────────────────────┐
│  [General]  [Theme]                                                │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  EXPERIENCES                                                       │
│  Choose which flows guests can run during this event.              │
│                                                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │
│  │     +       │  │ Experience  │  │ Experience  │                │
│  │             │  │   Name 1    │  │   Name 2    │                │
│  │    Add      │  │  ○ Enabled  │  │  ○ Disabled │                │
│  │ Experience  │  │             │  │             │                │
│  └─────────────┘  └─────────────┘  └─────────────┘                │
│                                                                    │
│  ─────────────────────────────────────────────────────────────     │
│                                                                    │
│  EXTRAS                                                            │
│  Add optional flows that run before or after your experiences,     │
│  such as consent screens, surveys, or legal notices.               │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  Pre-Entry Gate                                    ⓘ  [+]  │  │
│  │  (empty - click + to add)                                   │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  Pre-Reward                                        ⓘ  [+]  │  │
│  │  Survey Flow                              Always     [×]   │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

## **6.3 Experiences Section Components**

### **ExperiencesSection.tsx**

Container component for the Experiences section:
- Section header: "Experiences"
- Subtitle: "Choose which flows guests can run during this event."
- Grid layout for experience cards

### **AddExperienceCard.tsx**

First card in the grid (always visible):
- Plus icon
- "Add Experience" text
- On click: Opens `ExperiencePickerDrawer`

### **EventExperienceCard.tsx**

Card for attached experiences:
- Experience name (from linked Experience data)
- Enabled/Disabled toggle switch
- Click card (not toggle): Opens `EventExperienceDrawer` for editing
- Visual indicator for disabled state (muted/grayed)

### **ExperiencePickerDrawer.tsx**

Right-side drawer for selecting experiences:

**Initial View (Experience List):**
```
┌─────────────────────────────────────────┐
│  Add Experience                     [×] │
├─────────────────────────────────────────┤
│                                         │
│  Select an experience from your library │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  Photo Booth Classic              │  │
│  │  Transform photos with AI...      │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  Video Message                    │  │
│  │  Record and enhance videos...     │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  Survey Flow                      │  │
│  │  Collect guest feedback...        │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

**Detail View (after clicking an experience):**
```
┌─────────────────────────────────────────┐
│  ← Back                             [×] │
├─────────────────────────────────────────┤
│                                         │
│  Photo Booth Classic                    │
│  ─────────────────────────────────────  │
│                                         │
│  Description:                           │
│  Transform photos with AI magic...      │
│                                         │
│  [Open in Editor ↗]                     │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  Configuration                          │
│                                         │
│  Label (optional)                       │
│  ┌───────────────────────────────────┐  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│  Override display name for this event   │
│                                         │
│                                         │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │   Cancel    │  │  Add Experience │   │
│  └─────────────┘  └─────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

**"Open in Editor" Button:**
- Opens `/[companySlug]/exps/[expId]` in a new tab
- Allows quick access to edit the experience without leaving the event page

### **EventExperienceDrawer.tsx**

Drawer for editing an attached experience:

```
┌─────────────────────────────────────────┐
│  Edit Experience                    [×] │
├─────────────────────────────────────────┤
│                                         │
│  Photo Booth Classic                    │
│  ─────────────────────────────────────  │
│                                         │
│  Description:                           │
│  Transform photos with AI magic...      │
│                                         │
│  [Open in Editor ↗]                     │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  Configuration                          │
│                                         │
│  Label (optional)                       │
│  ┌───────────────────────────────────┐  │
│  │  Custom Display Name              │  │
│  └───────────────────────────────────┘  │
│  Override display name for this event   │
│                                         │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │       🗑 Remove Experience       │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │   Cancel    │  │  Save Changes   │   │
│  └─────────────┘  └─────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

**"Open in Editor" Button:**
- Opens `/[companySlug]/exps/[expId]` in a new tab
- Same behavior as in ExperiencePickerDrawer detail view

## **6.4 Extras Section Components**

### **ExtrasSection.tsx**

Container component for the Extras section:
- Section header: "Extras"
- Subtitle: "Add optional flows that run before or after your experiences, such as consent screens, surveys, or legal notices."
- Vertical stack of slot cards

### **ExtraSlotCard.tsx**

Card representing a single extra slot:

**Props:**
- `slot`: "preEntryGate" | "preReward"
- `slotName`: Display name
- `helpText`: Tooltip content
- `value`: EventExtraSlot | null
- `experienceName`: Resolved experience name (if value exists)

**Empty State:**
```
┌─────────────────────────────────────────────────────────────┐
│  Pre-Entry Gate                                    ⓘ  [+]  │
│  Click + to add an experience                               │
└─────────────────────────────────────────────────────────────┘
```

**Filled State:**
```
┌─────────────────────────────────────────────────────────────┐
│  Pre-Entry Gate                                    ⓘ       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Age Verification Flow          Always         [×]  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Slot Definitions:**

| Slot | Name | Help Text |
|------|------|-----------|
| `preEntryGate` | Pre-Entry Gate | Show important info before guests start any experience (e.g. age check, house rules, safety message). |
| `preReward` | Pre-Reward | Show short experiences (ex: 2–3 quick questions survey) before guests see their AI result. |

### **ExtraSlotDrawer.tsx**

Drawer for configuring an extra slot:

```
┌─────────────────────────────────────────┐
│  Configure Pre-Entry Gate           [×] │
├─────────────────────────────────────────┤
│                                         │
│  Select Experience                      │
│  ┌───────────────────────────────────┐  │
│  │  Age Verification Flow        ▼   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Frequency                              │
│  ┌───────────────────────────────────┐  │
│  │  ○ Always                         │  │
│  │    Show every time                │  │
│  │                                   │  │
│  │  ○ Once per session               │  │
│  │    Show only once per guest       │  │
│  └───────────────────────────────────┘  │
│                                         │
│                                         │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │   Cancel    │  │      Save       │   │
│  └─────────────┘  └─────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

---

# **7. Component File Structure**

```
features/events/components/
├── index.ts
├── EventCard.tsx                    # (existing)
├── designer/
│   ├── index.ts
│   └── EventThemeEditor.tsx         # (existing)
└── general/
    ├── index.ts
    ├── EventGeneralTab.tsx          # Main container for General tab
    │
    ├── experiences/
    │   ├── index.ts
    │   ├── ExperiencesSection.tsx   # Section container
    │   ├── AddExperienceCard.tsx    # "+ Add" card
    │   ├── EventExperienceCard.tsx  # Attached experience card
    │   ├── ExperiencePickerDrawer.tsx  # Drawer for adding
    │   └── EventExperienceDrawer.tsx   # Drawer for editing
    │
    └── extras/
        ├── index.ts
        ├── ExtrasSection.tsx        # Section container
        ├── ExtraSlotCard.tsx        # Individual slot card
        └── ExtraSlotDrawer.tsx      # Drawer for configuring slot
```

---

# **8. Hooks**

### **useCompanyExperiences**

Fetch all active experiences for the company (for picker):

```ts
function useCompanyExperiences(companyId: string): {
  experiences: Experience[];
  isLoading: boolean;
  error: Error | null;
}
```

### **useEventExperienceDetails**

Resolve experience details for attached event experiences:

```ts
function useEventExperienceDetails(
  experienceIds: string[]
): {
  experiencesMap: Map<string, Experience>;
  isLoading: boolean;
  error: Error | null;
}
```

---

# **9. Constants**

Add to `web/src/features/events/constants.ts`:

```ts
export const EXTRA_SLOTS = {
  preEntryGate: {
    name: "Pre-Entry Gate",
    helpText: "Show important info before guests start any experience (e.g. age check, house rules, safety message).",
  },
  preReward: {
    name: "Pre-Reward",
    helpText: "Show short experiences (ex: 2–3 quick questions survey) before guests see their AI result.",
  },
} as const;

export const EXTRA_FREQUENCIES = {
  always: {
    label: "Always",
    description: "Show every time",
  },
  once_per_session: {
    label: "Once per session",
    description: "Show only once per guest",
  },
} as const;
```

---

# **10. Out of Scope**

- 🚫 Experience Engine runtime integration (Phase 7)
- 🚫 Guest flow execution of extras (Phase 7)
- 🚫 Drag-and-drop reordering of experiences
- 🚫 Batch operations (enable/disable multiple)
- 🚫 Experience duplication within event
- 🚫 Additional extra slots beyond pre-entry and pre-reward
- 🚫 Conditional logic for extras (show based on user attributes)
- 🚫 Analytics/tracking for extras

---

# **11. Acceptance Criteria**

## **Data Model**
- [ ] `EventExperienceLink` includes `enabled` boolean field
- [ ] `EventExtras` type with `preEntryGate` and `preReward` slots
- [ ] `EventExtraSlot` type with `experienceId` and `frequency`
- [ ] Event schema updated with `extras` field
- [ ] Zod schemas for all new types and input validation
- [ ] Default event creation includes `extras: { preEntryGate: null, preReward: null }`

## **Server Actions**
- [ ] `addEventExperience` action works correctly
- [ ] `updateEventExperience` action updates label and enabled state
- [ ] `removeEventExperience` action removes experience from array
- [ ] `setEventExtra` action sets slot with experience and frequency
- [ ] `removeEventExtra` action clears a slot

## **UI - General Tab Layout**
- [ ] Tab renamed from "Experiences" to "General"
- [ ] Two distinct sections: Experiences and Extras
- [ ] Section headers with subtitles display correctly
- [ ] Visual separation between sections

## **UI - Experiences Section**
- [ ] Grid layout with cards
- [ ] "Add Experience" card always visible as first item
- [ ] Attached experiences show as cards with name and toggle
- [ ] Toggle enables/disables without removing
- [ ] Clicking card opens edit drawer
- [ ] Empty state shows only "Add Experience" card

## **UI - Experience Picker Drawer**
- [ ] Opens on "Add Experience" click
- [ ] Shows list of company experiences
- [ ] Clicking experience shows detail view with back navigation
- [ ] Detail view shows name, description, label field
- [ ] Cancel and Add buttons work correctly
- [ ] Adding experience closes drawer and updates list

## **UI - Event Experience Drawer**
- [ ] Opens when clicking attached experience card
- [ ] Shows experience name and description
- [ ] Label field editable
- [ ] Remove button with confirmation
- [ ] Cancel and Save buttons work correctly

## **UI - Extras Section**
- [ ] Two slot cards displayed vertically
- [ ] Each card shows slot name with info icon tooltip
- [ ] Empty slots show "+" button
- [ ] Filled slots show experience name, frequency, remove button
- [ ] Help text accessible via tooltip

## **UI - Extra Slot Drawer**
- [ ] Opens on "+" click for empty slot or edit for filled slot
- [ ] Experience dropdown/selector populated
- [ ] Frequency radio options (always, once per session)
- [ ] Save updates the slot
- [ ] Cancel closes without changes

---

# **12. Future Considerations**

## **Phase 7 Integration**

The Experience Engine will consume these configurations:

```ts
// Pseudo-code for Experience Engine flow
async function runEventFlow(event: Event, session: Session) {
  // 1. Check pre-entry gate
  if (event.extras.preEntryGate && shouldShowExtra(event.extras.preEntryGate, session)) {
    await runExperience(event.extras.preEntryGate.experienceId);
  }

  // 2. Show experience picker (enabled experiences only)
  const enabledExperiences = event.experiences.filter(e => e.enabled);
  const selectedExperience = await showExperiencePicker(enabledExperiences);

  // 3. Run selected experience
  const result = await runExperience(selectedExperience.experienceId);

  // 4. Check pre-reward
  if (event.extras.preReward && shouldShowExtra(event.extras.preReward, session)) {
    await runExperience(event.extras.preReward.experienceId);
  }

  // 5. Show reward/result
  await showReward(result);
}

function shouldShowExtra(slot: EventExtraSlot, session: Session): boolean {
  if (slot.frequency === "always") return true;
  if (slot.frequency === "once_per_session") {
    return !session.hasSeenExtra(slot.experienceId);
  }
  return false;
}
```

## **Potential Additional Slots (Future)**

- `postReward` — After showing result (share prompts, feedback)
- `onError` — Error recovery flows
- `timeout` — Timeout handling flows

---

# **13. Deliverables**

1. **Updated Types:** `EventExperienceLink`, `EventExtras`, `EventExtraSlot`, `ExtraSlotFrequency`
2. **Updated Schemas:** Enhanced event schema with extras, new input schemas
3. **Server Actions:** Experience and extras management actions
4. **Components:**
   - `EventGeneralTab`
   - `ExperiencesSection`, `AddExperienceCard`, `EventExperienceCard`
   - `ExperiencePickerDrawer`, `EventExperienceDrawer`
   - `ExtrasSection`, `ExtraSlotCard`, `ExtraSlotDrawer`
5. **Hooks:** `useCompanyExperiences`, `useEventExperienceDetails`
6. **Constants:** `EXTRA_SLOTS`, `EXTRA_FREQUENCIES`
7. **Updated Event creation** to include default extras
