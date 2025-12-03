# **📄 PRD — Phase 5: Events (Nested Time-Bound Instances)**

**Status:** Draft
**Goal:** Create **Events** as nested, time-bound instances under Projects with simplified schema (no status) and migrate theming from Project to Event level.

---

# **1. Purpose**

Phase 5 introduces **Events** as the core time-bound containers nested under Projects:

- Create `/projects/{projectId}/events/{eventId}` subcollection.
- **Migrate theme from Project to Event** (Event becomes the source of truth for theming).
- Simplified Event schema with no status field.
- Events link to Experiences via `experiences[]` array.
- Event page with two tabs: **Experiences** (WIP placeholder) and **Theme** (with ThemeEditor).

**Key simplification:** Events do not have status. The `activeEventId` on Project serves as the switchboard mechanism.

---

# **2. Scope (In-Scope)**

## **2.1 Data Model: Events Subcollection**

### **New Firestore path**

```
/projects/{projectId}/events/{eventId}
```

### **Event Schema (Simplified)**

```ts
interface Event {
  id: string;
  projectId: string;        // Parent project ID (derived from path)
  companyId: string;        // FK to companies (denormalized for query efficiency)
  name: string;             // 1-200 characters

  // NO STATUS FIELD - switchboard via Project.activeEventId

  // Optional scheduling (for future use)
  publishStartAt?: number | null; // Unix timestamp ms
  publishEndAt?: number | null;   // Unix timestamp ms

  // Linked experiences (embedded array)
  experiences: EventExperienceLink[];

  // Theme is now at Event level
  theme: EventTheme;

  // Soft delete
  deletedAt?: number | null;

  createdAt: number;
  updatedAt: number;
}
```

### **EventExperienceLink (embedded object)**

```ts
interface EventExperienceLink {
  experienceId: string;      // FK to /experiences/{experienceId}
  label?: string | null;     // Optional override for display name
}
```

### **EventTheme**

Migrated from `ProjectTheme` — exact same structure:

```ts
interface EventTheme {
  logoUrl?: string | null;
  fontFamily?: string | null;
  primaryColor: string;      // Hex color (e.g., "#6366F1")
  text: {
    color: string;           // Hex color
    alignment: "left" | "center" | "right";
  };
  button: {
    backgroundColor?: string | null; // Inherits primaryColor if null
    textColor: string;       // Hex color
    radius: "none" | "sm" | "md" | "full";
  };
  background: {
    color: string;           // Hex color
    image?: string | null;   // Full public URL
    overlayOpacity: number;  // 0-1
  };
}
```

---

## **2.2 Project Schema Changes**

### **Fields to KEEP (temporarily) in Project**

During Phase 5, **do not remove** these fields from Project schema:

- `theme: ProjectTheme` — Keep for backwards compatibility until all Projects have Events
- `publishStartAt`, `publishEndAt` — Keep for backwards compatibility

These will be removed in a future cleanup phase once all data is migrated.

### **Updated Project semantics**

- `activeEventId` now points to `/projects/{projectId}/events/{eventId}` (previously pointed to Experiences)

---

## **2.3 Feature Module Structure**

Create new feature module: `web/src/features/events/`

```
features/events/
├── actions/
│   ├── index.ts
│   └── events.actions.ts       # createEvent, updateEvent, deleteEvent, updateEventTheme
├── components/
│   ├── index.ts
│   ├── EventCard.tsx           # Card for events list
│   ├── EventExperiencesTab.tsx # WIP placeholder tab
│   └── designer/
│       ├── index.ts
│       └── EventThemeEditor.tsx  # MIGRATED from projects/ThemeEditor
├── hooks/
│   ├── index.ts
│   ├── useEvent.ts             # Single event hook
│   └── useEvents.ts            # List events for project
├── repositories/
│   ├── index.ts
│   └── events.repository.ts
├── schemas/
│   ├── index.ts
│   └── events.schemas.ts
├── types/
│   ├── index.ts
│   └── event.types.ts
├── constants.ts
└── index.ts
```

---

## **2.4 Frontend: Event Management UI**

### **Project Details Page - Events Tab**

Replace the current `ProjectEventsTab` placeholder with actual functionality:

**Events List View:**
- List of events for the current project
- Each event shows: name, creation date
- Active event indicator (highlighted if `project.activeEventId === event.id`)
- "Create Event" button
- Click event → navigate to Event detail page

**Empty State:**
- "No events yet" message
- "Create your first event" CTA button

### **Event Detail Page** (`/projects/{projectId}/events/{eventId}`)

**Header:**
- Left: Event name (editable inline or via dialog)
- Right: "Set as Active" button (if not already active)
  - Updates `project.activeEventId` to this event's ID

**Tabs:**
1. **Experiences** (WIP placeholder)
   - Same style as current `ProjectEventsTab` placeholder
   - Message: "Coming soon — link experiences to this event"
   - Icon + descriptive text

2. **Theme** (functional)
   - Migrate/adapt `ThemeEditor` from projects to work with Event
   - Same UI, but saves to `event.theme` instead of `project.theme`

---

## **2.5 Server Actions**

### **Event Actions**

```ts
// Create new event
async function createEvent(
  projectId: string,
  data: { name: string; companyId: string }
): Promise<ActionResult<Event>>

// Update event details
async function updateEvent(
  projectId: string,
  eventId: string,
  data: { name?: string; publishStartAt?: number | null; publishEndAt?: number | null }
): Promise<ActionResult<Event>>

// Update event theme
async function updateEventTheme(
  projectId: string,
  eventId: string,
  theme: Partial<EventTheme>
): Promise<ActionResult<Event>>

// Soft delete event
async function deleteEvent(
  projectId: string,
  eventId: string
): Promise<ActionResult<void>>

// Set event as active
async function setActiveEvent(
  projectId: string,
  eventId: string
): Promise<ActionResult<Project>>
```

---

## **2.6 Repository Layer**

### **Events Repository**

```ts
// Create event
async function createEvent(
  projectId: string,
  event: Omit<Event, "id" | "createdAt" | "updatedAt">
): Promise<Event>

// Get single event
async function getEvent(
  projectId: string,
  eventId: string
): Promise<Event | null>

// List events for project
async function listEvents(
  projectId: string,
  options?: { includeDeleted?: boolean }
): Promise<Event[]>

// Update event
async function updateEvent(
  projectId: string,
  eventId: string,
  data: Partial<Event>
): Promise<void>

// Soft delete event
async function softDeleteEvent(
  projectId: string,
  eventId: string
): Promise<void>
```

---

## **2.7 Hooks**

### **useEvent**
```ts
function useEvent(projectId: string, eventId: string): {
  event: Event | null;
  isLoading: boolean;
  error: Error | null;
}
```

### **useEvents**
```ts
function useEvents(projectId: string): {
  events: Event[];
  isLoading: boolean;
  error: Error | null;
}
```

---

## **2.8 Default Theme**

When creating a new Event, initialize with default theme:

```ts
const DEFAULT_EVENT_THEME: EventTheme = {
  logoUrl: null,
  fontFamily: null,
  primaryColor: "#6366F1",
  text: {
    color: "#1F2937",
    alignment: "center",
  },
  button: {
    backgroundColor: null, // Inherits primaryColor
    textColor: "#FFFFFF",
    radius: "md",
  },
  background: {
    color: "#FFFFFF",
    image: null,
    overlayOpacity: 0.5,
  },
};
```

---

# **3. Out of Scope**

- 🚫 Experiences linking UI (placeholder only — separate implementation)
- 🚫 Event scheduling logic / enforcement (publishStartAt/publishEndAt are stored but not enforced)
- 🚫 Removing theme from Project schema (kept for backwards compatibility)
- 🚫 Guest flow updates (will be Phase 7)
- 🚫 Multiple active events per project
- 🚫 Event duplication/cloning

---

# **4. Technical Notes**

### **4.1 Theme Migration Strategy**

**For existing Projects with theme:**
- Theme remains on Project (no automatic migration)
- When creating first Event for a Project, optionally copy Project theme as starting point
- Future: manual/automated migration script to move themes to Events

**For new Projects:**
- Project still has theme field (not removed from schema)
- First Event created gets default theme

### **4.2 companyId Denormalization**

Events store `companyId` directly for:
- Query efficiency (list all events for a company without join)
- Firestore security rules (company-scoped access)
- Future analytics/reporting

**Invariant:** `event.companyId` MUST always equal `project.companyId`

### **4.3 Switchboard Pattern**

No status on Events. Active event determination:
```
Project.activeEventId → Event.id
```

- Only ONE active event per project
- Setting new active event updates `Project.activeEventId`
- Guest flow: `sharePath` → Project → `activeEventId` → Event → theme/experiences

### **4.4 Theme Editor Adaptation**

The existing `ThemeEditor` component needs minimal changes:

1. Change props from `project: Project` to `event: Event`
2. Change action from `updateProjectTheme` to `updateEventTheme`
3. Update copy/labels from "Event Theme" to keep as is (already says "Event Theme")

---

# **5. Acceptance Criteria**

## **Data Model**
- [ ] `/projects/{projectId}/events/{eventId}` collection created
- [ ] Event schema implemented with no status field
- [ ] EventTheme schema matches ProjectTheme structure
- [ ] Event includes `companyId` (denormalized)
- [ ] Event includes `experiences[]` array (empty by default)
- [ ] Project schema retains `theme` field (backwards compatibility)

## **Backend**
- [ ] Events repository with CRUD operations
- [ ] Server actions: createEvent, updateEvent, updateEventTheme, deleteEvent, setActiveEvent
- [ ] Zod schemas for Event validation

## **Frontend - Project Events Tab**
- [ ] Events list view replaces placeholder
- [ ] Create Event button and flow
- [ ] Active event indicator
- [ ] Empty state when no events

## **Frontend - Event Detail Page**
- [ ] Route: `/projects/{projectId}/events/{eventId}`
- [ ] Header with event name and "Set as Active" button
- [ ] Two tabs: Experiences (WIP) and Theme
- [ ] Experiences tab shows placeholder message
- [ ] Theme tab shows functional theme editor

## **Theme Editor**
- [ ] ThemeEditor adapted for Events (EventThemeEditor)
- [ ] Saves to event.theme via updateEventTheme action
- [ ] Live preview works with event theme
- [ ] Keyboard shortcut (Cmd+S) works

---

# **6. Deliverables**

1. **New feature module:** `web/src/features/events/`
2. **Types:** Event, EventTheme, EventExperienceLink
3. **Schemas:** Zod schemas for event validation
4. **Repository:** Events repository with Firestore operations
5. **Actions:** Server actions for event CRUD
6. **Hooks:** useEvent, useEvents
7. **Components:**
   - EventCard
   - EventExperiencesTab (placeholder)
   - EventThemeEditor (adapted from ThemeEditor)
8. **Pages:**
   - Updated Project detail with functional Events tab
   - New Event detail page with tabs
9. **Updated Project actions:** setActiveEvent

---

# **7. UI Wireframes**

### **Project Detail - Events Tab (List)**

```
┌────────────────────────────────────────────────┐
│  Project: Summer Campaign 2025                 │
│  [Events] [Distribute]                         │
├────────────────────────────────────────────────┤
│                                                │
│  Events                          [+ New Event] │
│  ─────────────────────────────────────────     │
│                                                │
│  ┌──────────────────────────────────────────┐  │
│  │ ★ Launch Event              Dec 15, 2025 │  │
│  │   Active                                 │  │
│  └──────────────────────────────────────────┘  │
│                                                │
│  ┌──────────────────────────────────────────┐  │
│  │   Test Event                Dec 10, 2025 │  │
│  └──────────────────────────────────────────┘  │
│                                                │
└────────────────────────────────────────────────┘
```

### **Event Detail Page**

```
┌────────────────────────────────────────────────┐
│  ← Back                                        │
│                                                │
│  Launch Event              [Set as Active ✓]   │
│                                                │
│  [Experiences] [Theme]                         │
├────────────────────────────────────────────────┤
│                                                │
│  (If Experiences tab - WIP placeholder)        │
│                                                │
│        🔗                                      │
│        Coming Soon                             │
│        Link experiences to this event          │
│                                                │
├────────────────────────────────────────────────┤
│                                                │
│  (If Theme tab - ThemeEditor)                  │
│                                                │
│  Event Theme                                   │
│  Configure visual customization                │
│                                                │
│  [Identity]    [Primary Color]    [Text]       │
│  [Button]      [Background]                    │
│                                                │
│  [Live Preview Panel]                          │
│                                                │
│  [Save Changes]                                │
│                                                │
└────────────────────────────────────────────────┘
```

---

# **8. Migration Path**

### **From Phase 4 to Phase 5**

1. **Schema addition only** — no breaking changes to Project
2. Events subcollection is new (no migration of existing data)
3. Project.activeEventId semantics change:
   - Phase 4: Points to Experience ID
   - Phase 5: Points to nested Event ID
4. **Manual migration** for existing Projects:
   - Create first Event with Project's theme
   - Set as activeEventId
   - Future: script to automate this

### **Future cleanup (post-Phase 5)**

- Remove `theme` from Project schema
- Remove `publishStartAt/publishEndAt` from Project schema
- These become Event-only fields
