Here’s the **new Firestore data model** as an evolution of your current one, but aligned with all the decisions we just made.

I’ll keep the style similar to your existing `DATA_MODEL.md`.

---

# Firestore Data Model (v5)

This document describes the **updated** Firestore collections and schemas for the Clementine platform, evolving from the previous model.

Key changes:

- **Company** is the main context for everything.
- Introduced **Projects** as containers of Events.
- **Events** are now nested under Projects and hold **theme** (event-level only).
- **Experiences** (formerly Journeys conceptually) are **company-scoped flows**.
- **Steps** are now under **Experiences**, not Events.
- Added `ai-transform` step type, and **removed `experience-picker` step**.
- Old AI “Experiences” module is refactored into **`aiPresets`** (dormant for now).

---

## 1. Overview

### Root collections

| Collection      | Path                          | Description                                   |
| --------------- | ----------------------------- | --------------------------------------------- |
| **Companies**   | `/companies/{companyId}`      | Brand / organization accounts                 |
| **Projects**    | `/projects/{projectId}`       | Containers of events per company              |
| **Experiences** | `/experiences/{experienceId}` | Company-scoped flow definitions (step graphs) |
| **AiPresets**   | `/aiPresets/{aiPresetId}`     | (Refactored old AI module; parked for future) |

### Nested collections

| Collection | Path                                         | Description                        |
| ---------- | -------------------------------------------- | ---------------------------------- |
| **Events** | `/projects/{projectId}/events/{eventId}`     | Time-bound, themed event instances |
| **Steps**  | `/experiences/{experienceId}/steps/{stepId}` | UI / logic nodes in an Experience  |

> **Note:** Event → Experience linking is handled via `experiences[]` array embedded in the Event document (no separate subcollection).

---

## 2. Companies

**Collection**: `/companies/{companyId}`

Companies represent brands or organizations that own projects, events, and experiences.

### Schema

```ts
interface Company {
  id: string;
  name: string; // 1-100 characters. Ex: Turn Page Oy
  slug: slug; // NEW Ex: turn-page-oy
  status: "active" | "deleted";
  deletedAt: number | null; // Unix timestamp ms (soft delete)
  contactEmail: string | null;
  termsUrl: string | null;
  privacyUrl: string | null;
  createdAt: number; // Unix timestamp ms
  updatedAt: number;
}
```

_(Same spirit as v1; no theme here yet — theme is event-level only.)_

---

## 3. Projects

**Collection**: `/projects/{projectId}`

Projects are **company-scoped containers** for events (e.g. "Brand X Summer Tour", "Pop-up Campaign 2025").

> **Migration Note (Phase 4):** The Project schema evolves from the old Event schema. During Phase 4, some old Event fields are temporarily preserved (like `theme`) for backwards compatibility. Phase 5 will complete the migration by moving theme to nested Events.

### Schema (Final State - Post Phase 5)

```ts
interface Project {
  id: string;
  name: string; // 1-200 characters
  status: "draft" | "live" | "archived" | "deleted";
  companyId: string | null; // FK to companies (renamed from ownerId)
  sharePath: string; // e.g., "abc123" or "/join/abc123" (renamed from joinPath)
  qrPngPath: string; // Firebase Storage path for QR code
  activeEventId?: string | null; // Switchboard: currently active event (points to nested event)
  deletedAt?: number | null; // Unix timestamp ms (soft delete)
  createdAt: number;
  updatedAt: number;
}
```

### Notes

- **No theme at project level** - theme is event-specific (on nested Event documents)
- **No scheduling at project level** - scheduling is event-specific (`publishStartAt/EndAt` moved to Events)
- **Switchboard pattern:** `activeEventId` points to the currently live event under this project
- **Guest flow:** `sharePath` → loads `activeEventId` → loads Event (with theme) → loads `experiences[]`

---

## 4. Events

**Collection**: `/projects/{projectId}/events/{eventId}`

> **Phase 5:** Events are **time-bound, themed instances** nested under Projects. This is the **future** schema - not implemented in Phase 4.

Events are **simplified containers** that link to Experiences and apply event-specific theming.

### Schema

```ts
interface Event {
  id: string;
  projectId: string; // Parent project ID
  companyId: string; // FK to companies
  name: string; // 1-200 characters

  status: "draft" | "scheduled" | "active" | "ended" | "deleted";

  publishStartAt?: number | null; // Unix timestamp ms
  publishEndAt?: number | null; // Unix timestamp ms

  // Linked experiences (embedded array, no subcollection)
  experiences: EventExperienceLink[]; // Links to /experiences/{experienceId}

  // Theming is defined only at event level (Phase 5+)
  theme: EventTheme;

  deletedAt?: number | null;
  createdAt: number;
  updatedAt: number;
}
```

### EventExperienceLink (embedded object)

```ts
interface EventExperienceLink {
  experienceId: string; // FK to /experiences/{experienceId}
  label?: string | null; // Optional override for display name in this event
  // Future fields: sortOrder, isEnabled, customConfig, etc.
}
```

### EventTheme

```ts
interface EventTheme {
  logoUrl?: string | null;
  fontFamily?: string | null;
  primaryColor: string; // Hex color (e.g., "#6366F1")
  text: {
    color: string; // Hex color
    alignment: "left" | "center" | "right";
  };
  button: {
    backgroundColor?: string | null; // Inherits primaryColor if null
    textColor: string; // Hex color
    radius: "none" | "sm" | "md" | "full";
  };
  background: {
    color: string; // Hex color
    image?: string | null; // Full public URL
    overlayOpacity: number; // 0-1
  };
}
```

### Constraints / Rules

- Exactly **one active event per project** at a time (enforced at application level).
- Join logic:
  - Guest opens `Project.sharePath` → server/app resolves `project.activeEventId` → loads that Event → loads linked experiences.

---

## 5. Experiences (Flow Library)

**Collection**: `/experiences/{experienceId}`

Experiences are **company-scoped flows** (step graphs) that can be reused across events. They replace the “Journey” concept as the main flow definition.

### Schema

```ts
interface Experience {
  id: string;
  companyId: string; // FK to companies
  name: string; // 1-100 characters
  description?: string | null;
  isPublic: boolean; // Public template vs. company-private
  enabled: boolean;

  previewMediaUrl?: string | null; // For library cards
  previewType?: "image" | "gif" | "video" | null;

  stepOrder: string[]; // Ordered array of step IDs in this experience

  tags?: string[];
  createdAt: number;
  updatedAt: number;
}
```

### Notes

- Previously, **Journeys** were under `/events/{eventId}/journeys`.
  Now, **Experiences** are **top-level, company-scoped**, reusable across projects & events.
- `stepOrder` replaces `Journey.stepOrder[]` from the old model.

---

## 6. Steps (per Experience)

**Collection**:
`/experiences/{experienceId}/steps/{stepId}`

Steps are **individual UI/logic nodes** that define the flow of an Experience.

They are no longer stored under Events; they belong directly to an Experience.

### Base Schema

```ts
type StepType =
  | "info"
  | "capture"
  | "short_text"
  | "long_text"
  | "multiple_choice"
  | "yes_no"
  | "opinion_scale"
  | "email"
  | "processing"
  | "reward"
  | "ai-transform"; // NEW
// NOTE: "experience-picker" REMOVED

interface StepBase {
  id: string;
  experienceId: string; // Parent experience ID (implicit from path but useful)
  type: StepType;
  title?: string | null; // max 200 chars
  description?: string | null; // max 1000 chars
  mediaUrl?: string | null;
  mediaType?: "image" | "gif" | "video" | "lottie" | null;
  ctaLabel?: string | null; // max 50 chars
  createdAt: number;
  updatedAt: number;
}
```

Most of the old step types can be **reused exactly as before**, with `eventId`/`journeyId` removed and replaced by `experienceId`. For brevity, I’ll list just the changed / key parts.

#### 6.1 Info Step

```ts
interface StepInfo extends StepBase {
  type: "info";
}
```

#### 6.2 Capture Step

Still a camera capture screen, but now **bound to the Experience** rather than dynamic experience picking.

```ts
interface StepCapture extends StepBase {
  type: "capture";
  config: {
    variable: string; // Where to store captured media in session
    cameraFacing: "front" | "back" | "both";
    countdown: number; // 0 = disabled, 1-10 seconds
    overlayUrl?: string | null;
  };
}
```

> Note: old `config.source` referencing `$experienceId` is no longer needed, since the Experience is fixed.

#### 6.3 Input Steps

Same shapes as before (short_text, long_text, multiple_choice, yes_no, opinion_scale, email), but with `experienceId` instead of `eventId`/`journeyId`.

#### 6.4 Processing Step

Same as old:

```ts
interface StepProcessing extends StepBase {
  type: "processing";
  config: {
    messages: string[]; // 1-10 messages
    estimatedDuration: number; // 5-300 seconds
  };
}
```

#### 6.5 Reward Step

Same as old, used for final sharing screen.

```ts
interface StepReward extends StepBase {
  type: "reward";
  config: {
    allowDownload: boolean;
    allowSystemShare: boolean;
    allowEmail: boolean;
    socials: ShareSocial[]; // instagram, facebook, twitter, etc.
  };
}
```

#### 6.6 NEW: AiTransform Step

New step type that encapsulates the AI "preset" behavior inline.

```ts
interface StepAiTransform extends StepBase {
  type: "ai-transform";
  config: {
    mode: "photo" | "video"; // Determines output type AND available models
    model: string; // Model selection depends on mode (photo vs video models)
    prompt: string; // Max ~1000 chars
    negativePrompt?: string | null;
    aspectRatio?: "1:1" | "3:4" | "4:5" | "9:16" | "16:9" | null;
  };
}
```

> **Simplified from original design:**
>
> - `mode` determines both input handling and output format (no separate `outputFormat`)
> - Photo mode → image output, Video mode → video output (no GIF at this stage)
> - Model selection is filtered by mode (photo models vs video models are different)
> - Variable bindings deferred to future iteration
> - Advanced settings (steps, guidanceScale, seed) removed for MVP simplicity

#### 6.7 Removed: Experience Picker Step

The old:

```ts
type: "experience-picker";
```

step is **removed** from the schema and renderer registry. Experience selection happens at the **Event level** via `experiences[]` array, not as a step.

---

## 7. AiPresets (Dormant, Future Use)

**Collection**: `/aiPresets/{aiPresetId}`

This is the **refactored old `experiences` module** (AI configs). It’s preserved for future use but **not used** in the new flow yet.

### Schema (conceptual)

```ts
interface AiPreset {
  id: string;
  companyId: string; // FK to companies

  name: string;
  enabled: boolean;

  // Legacy fields from BaseExperience / PhotoExperience / VideoExperience / GifExperience...
  type: "photo" | "video" | "gif";

  captureConfig?: unknown;
  aiPhotoConfig?: unknown;
  aiVideoConfig?: unknown;

  createdAt: number;
  updatedAt: number;
}
```

> You can keep the more specific `PhotoExperience`, `VideoExperience`, `GifExperience` types internally, but the key point for the new model:
> **Nothing in the new flow depends on `aiPresets` yet.**

---

## 8. Relationships

### Phase 4 (Transition - Projects with temporary fields)

During Phase 4, Projects temporarily retain some old Event fields:

```text
Companies (1)
  ├── (*) Projects (with theme, activeJourneyId→activeEventId, publishDates - temporary)
  └── (*) Experiences (renamed from Journeys in Phase 2)
         └── (*) Steps

Companies (1)
  └── (*) AiPresets (legacy AI config, unused)
```

**Temporary schema during Phase 4:**
- Projects keep `theme` temporarily (will move to Events in Phase 5)
- Projects keep `publishStartAt/EndAt` temporarily (will move to Events in Phase 5)
- `activeJourneyId` renamed to `activeEventId` (preparing for Phase 5, points to Experiences temporarily)

### Phase 5+ (Target - Projects with Nested Events)

```text
Companies (1)
  ├── (*) Projects
  │       └── (*) Events (nested)
  │             └── experiences[] → (*) Experiences
  │                                      └── (*) Steps
  └── (*) Experiences
         └── (*) Steps

Companies (1)
  └── (*) AiPresets (legacy AI config, unused for now)
```

- **Company → Projects**: one company has many projects
- **Project → Events**: one project has many events (nested subcollection)
- **Event → Experiences**: events link to experiences via `experiences[]` array (embedded objects with `experienceId`, `label`, etc.)
- **Company → Experiences**: experiences are shared across a company
- **Experience → Steps**: one experience has many steps
- **AiPresets**: standalone, company-scoped; future AI library

---

If you want, next I can:

- Draft **example JSON documents** for each collection (company, project, event, experience, step, eventExperience) to sanity-check how this looks in real data, or
- Help map the migration steps from **old paths** → **new paths** so you have a clear checklist when you actually refactor the database + code.
