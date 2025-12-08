# **📄 Clementine — High-Level Roadmap & Refactoring Plan (Phases 0–7)**

**Goal:** Move from legacy Events / Journeys / Steps / ExperiencePicker / AI Presets → to a clean, scalable model centered around **Company → Project → Event → Experience → Steps** with a unified **Experience Engine**.

## DATA Models

- Old features/scalable-arch/old-data-model-v4.md
- New features/scalable-arch/new-data-model-v5.md

## PLanned feature modules

- features/scalable-arch/feature-modules.md

---

## **🎯 Phase 0 — Establish Company Context (Foundation)**

**Purpose:** Make _Company_ the top-level scope for everything.

- Add `/companies` collection.
- Add **companyId** to all top-level entities: Projects, Events, Experiences, AiPresets.
- Introduce **Company Workspace** UI:

  - Company list → select → all views scoped to active company.

- All new data structures and UX start inside this company context.

---

## **🎯 Phase 1 — Refactor Old `experiences` → `aiPresets` (Dormant Library)**

**Purpose:** Free the name “Experience” and park the old AI module.

- Rename old `experiences` to `/aiPresets`.
- Update types & services accordingly.
- Do **not** build UI or use it in flows.
- This preserves future ability to build a preset marketplace, without polluting the MVP.

---

## **🎯 Phase 2 — Journeys → Experiences (New Flow Definitions)**

**Purpose:** Turn legacy journeys into reusable, company-scoped **Experiences**.

- Domain rename: `Journey` → `Experience`.
- Create `/experiences` collection with:

  - `companyId`, `name`, `isPublic`, `previewMedia`, `stepOrder[]`.

- Build **Experience Library** UI inside company workspace.
- Experiences become **top-level flow templates** reusable by events.

---

## **🎯 Phase 3 — Steps Consolidation (Reuse + New AI Step + Remove ExperiencePicker)**

**Purpose:** Normalize all steps and integrate AI into the flow.

- Reuse existing Step types (info, capture, inputs, etc.).
- Add new **`ai-transform`** step:

  - Contains model, prompt, variables, advanced options.
  - AI output fully defined inside the step.

- **Remove legacy `experience-picker` step** entirely.
- Steps now live at: `/experiences/{experienceId}/steps/{stepId}`.
- Add **Test Panel** in editor for `ai-transform` to preview AI results.

  **Note:** This phase focuses on data model changes. The steps module will still
  contain editors and renderers. The architectural split (moving renderers to
  experience-engine, potentially moving editors to experiences) will happen in
  Phase 7 when building the unified runtime.

---

## **🎯 Phase 4 — Projects (Rename Events → Projects)**

**Purpose:** Rename the Events feature module to Projects as a foundation for future nested Events.

**Strategy:** This is a **rename/refactor** with temporary field preservation. Some old Event fields (`theme`, `publishStartAt/EndAt`) are kept temporarily and will be moved to nested Events in Phase 5.

### Data Model Changes

- **Firestore path:** `/events/{eventId}` → `/projects/{projectId}`
- **Schema changes:**
  - `Event` → `Project`
  - `EventTheme` → `ProjectTheme` (temporary - will move to Event in Phase 5)
  - `ownerId` → `companyId`
  - `joinPath` → `sharePath`
  - `activeJourneyId` → `activeEventId` (renamed for Phase 5 prep, but still points to Experiences in Phase 4)
- **Fields temporarily preserved (will move to Events in Phase 5):**
  - `theme: ProjectTheme` (will become Event.theme)
  - `publishStartAt`, `publishEndAt` (will become Event scheduling)
- **Fields kept:** `name`, `status`, `qrPngPath`, `deletedAt`, timestamps

### Code Refactoring

- **Feature module:** Rename `web/src/features/events/` → `web/src/features/projects/`
- **All files:**
  - Types: `Event` → `Project`, `EventTheme` → `ProjectTheme`
  - Components: `EventCard` → `ProjectCard`, `EventForm` → `ProjectForm`, etc.
  - Actions: `createEvent` → `createProject`, `updateEvent` → `updateProject`, etc.
  - Repositories: `getEvent` → `getProject`, `listEvents` → `listProjects`, etc.
  - Schemas: `eventSchema` → `projectSchema`
  - Field: `activeJourneyId` → `activeEventId` (but type stays `string | null`, points to Experience ID)
- **Preserve all business logic:** Status transitions, soft delete, theme management, QR generation

### UI Implementation

**Projects List Page** (`/projects` or similar):

- Reuse/rename `components/studio/EventCard` → `ProjectCard`
- Show list of projects for active company
- Create new project button
- On create success → navigate to project details page

**Project Details Page** (`/projects/{projectId}`):

- **Header:**
  - Left: Project name/title
  - Right: Project status switcher (draft/live/archived)
- **Tabs:**
  - **Events** tab: Empty state with "Coming in Phase 5" message (WIP)
  - **Distribute** tab:
    - Share link display (project `sharePath`)
    - QR code display (project `qrPngPath`)
    - Copy link button
    - Download QR button

### Migration Notes

- **Backwards compatibility:** Not required - this is a breaking rename
- **Guest flow:** Continues to work via `sharePath` → resolves `activeEventId` (which points to an Experience in Phase 4)
- **Temporary inconsistency:** `activeEventId` is named for Events but points to Experiences until Phase 5
- **Phase 5 cleanup:** Theme, scheduling, and `activeEventId` semantics will be corrected when nested Events are introduced

---

## **🎯 Phase 5 — Events (New Nested Time-Bound Instances)**

**Purpose:** Create NEW Events as nested, time-bound instances under Projects. Clean up temporary Phase 4 fields.

**Note:** This is a new Event type, different from the old Events (which became Projects in Phase 4).

### Data Model Changes

- **Firestore path:** `/projects/{projectId}/events/{eventId}` (nested subcollection)
- **New Event schema:**
  - `id`, `projectId`, `companyId`, `name`
  - `status`: `draft | scheduled | active | ended | deleted`
  - `publishStartAt`, `publishEndAt` (moved from Project)
  - `experiences: EventExperienceLink[]` (embedded array - replaces Project's `activeEventId` pointing to single Experience)
  - `theme: EventTheme` (moved from Project)
  - timestamps, soft delete
- **EventExperienceLink:** `{ experienceId: string, label?: string | null }`

### Changes to Projects (Cleanup Phase 4 temporary fields)

- **Remove:** `theme` (moved to Event)
- **Remove:** `publishStartAt`, `publishEndAt` (moved to Event)
- **Update:** `activeEventId` now points to actual nested Events (was pointing to Experiences in Phase 4)
- **Keep:** `sharePath`, `qrPngPath`, `status`, etc.

### Final Project Schema

```ts
interface Project {
  id: string;
  name: string;
  status: "draft" | "live" | "archived" | "deleted";
  companyId: string | null;
  sharePath: string;
  qrPngPath: string;
  activeEventId?: string | null; // NOW points to /projects/{projectId}/events/{eventId}
  deletedAt?: number | null;
  createdAt: number;
  updatedAt: number;
}
```

### Scheduling Rules

- **1 active event per project** at a time (enforced at application level)
- Project's `activeEventId` determines which event guests see

### UI Implementation

- **Project Details Page - Events Tab:** List of events under the project, create event button
- **Event Editor:** Configure event name, schedule, theme, linked experiences
- **Guest Flow Update:** `sharePath` → loads `activeEventId` → loads Event (with theme) → loads `experiences[]`

---

## **🎯 Phase 6 — Attach Experiences to Events (Merged into Phase 5)**

**Status:** Merged into Phase 5 - the `experiences[]` array is part of the Event schema.

~~**Purpose:** Events define which Experiences guests can access.~~

~~- Path: `/projects/{projectId}/events/{eventId}/eventExperiences`.~~

**New approach:**

- Experiences are linked via embedded `experiences: EventExperienceLink[]` array in Event document
- No separate subcollection needed
- UI: Event Editor → Add Experience button → Picker from Experience Library → Updates `experiences[]` array

---

## **🎯 Phase 7 — Experience Engine (Preview + Guest Runtime)**

**Architectural Refactor:**

- Extract step renderers from `features/steps/components/preview` →
  `features/experience-engine/components/renderers/`
- Steps module becomes pure definitions (schemas, types, constants only)

**Runtime Implementation:**
**Purpose:** A unified engine that powers both admin preview & guest flow.

- Shared runtime that:

  - Loads event theme.
  - Loads selected experience and its steps.
  - Walks through steps sequentially.
  - Handles `ai-transform` execution.
  - Emits callbacks (`onStart`, `onStepChange`, `onComplete`, `onDataUpdate`).

- **Admin Preview**: test whole experience or from a specific step.
- **Guest Runtime**: accessed via project share link → loads active event → loads chosen experience(s).

---

## **🎯 Phase 8 — Camera Module (Reusable Capture Flow)**

**Purpose:** Extract camera functionality into a self-contained, reusable module.

**Problem:** Camera logic is currently coupled to guest flow step renderers, making it hard to reuse and test.

**Solution:** Create `features/camera/` module with:

- **CameraCapture container** - Self-contained component handling full flow:
  - Permission request → Camera viewfinder → Photo review → Submit
- **Lifecycle callbacks** - `onPhoto`, `onSubmit`, `onRetake`, `onCancel`, `onError`
- **Configuration props** - `enableCamera`, `enableLibrary`, `cameraFacing`, `aspectRatio`
- **Analytics support** - `CapturedPhoto.method` indicates "camera" or "library"

**Integration:**

- `CaptureStep` in Experience Engine becomes thin consumer
- Just renders `<CameraCapture onSubmit={...} />` and reacts to callbacks
- All state machine logic (permissions, capture, review) encapsulated in camera module

**See:** `features/scalable-arch/camera-module.md` for full PRD.

---

## **🎯 Phase 9 — Guest Flow (Persisted Sessions)**

**Purpose:** Wire up the full guest experience using Experience Engine with Firestore persistence.

**Implementation:**

- Refactor `features/guest/` to mount Experience Engine with `persistSession: true`
- Session storage: `/projects/{projectId}/sessions/{sessionId}`
- Real-time sync via `onDataUpdate` callback → Firestore
- Transform integration with `waitUntil` for background processing
- Firestore subscription for `transformStatus` updates

**Guest Entry Flow:**

```
/join/{projectId}
  → Load Project
    → Resolve activeEventId
      → Load Event (theme, experiences[])
        → Initialize session in Firestore
          → Mount ExperienceEngine(persistSession: true)
```

---

# **🏁 End State After Phase 9**

### **Clean, modern architecture:**

```
Company
  → Projects (containers with sharePath, QR, activeEventId)
      → Events (nested, theme + schedule + experiences[])
      → Sessions (guest interaction records)
  → Experiences (company-scoped flows)
      → Steps (including ai-transform)
  → AiPresets (legacy AI library, unused)
```

### **Feature Modules:**

```
features/
  ├── companies/           # Company management
  ├── projects/            # Project containers
  ├── events/              # Time-bound instances
  ├── experiences/         # Flow templates
  ├── steps/               # Step definitions (schemas, types, constants)
  ├── sessions/            # Session persistence & actions
  ├── experience-engine/   # Unified runtime + step renderers
  ├── camera/              # Reusable camera capture flow
  ├── guest/               # Guest entry point (mounts Engine)
  └── admin-preview/       # Admin testing (mounts Engine)
```

### **Guest Flow:**

```
Guest clicks sharePath
  → Loads Project
    → Resolves activeEventId
      → Loads Event (with theme)
        → Loads experiences[] array
          → Creates Session in Firestore
            → Mounts Experience Engine (persistSession: true)
              → CameraCapture handles photo capture
                → AI Transform via waitUntil
                  → Session updated via Firestore subscription
```

### **What we gain:**

- **Multi-tenant, scalable organization:** Company → Projects → Events hierarchy
- **Clear separation of concerns:**
  - Projects = Long-running containers (campaigns, tours)
  - Events = Time-bound activations (specific dates/times)
  - Experiences = Reusable flow templates (company-wide library)
  - Sessions = Guest interaction records (under projects)
- **AI fully integrated** as a step with local "Test" capability
- **Unified runtime** (Experience Engine) powering admin preview + guest experience
- **Reusable camera module** with self-contained state management
- **Clean naming:** No legacy confusion between old "Events" (now Projects) and new Events
- **Flexible architecture:** Switchboard at Project level (activeEventId), array linking at Event level (experiences[])
