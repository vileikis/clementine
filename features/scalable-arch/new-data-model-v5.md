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

| Collection           | Path                                                           | Description                        |
| -------------------- | -------------------------------------------------------------- | ---------------------------------- |
| **Events**           | `/projects/{projectId}/events/{eventId}`                       | Time-bound, themed event instances |
| **EventExperiences** | `/projects/{projectId}/events/{eventId}/eventExperiences/{id}` | Links events → experiences         |
| **Steps**            | `/experiences/{experienceId}/steps/{stepId}`                   | UI / logic nodes in an Experience  |

---

## 2. Companies

**Collection**: `/companies/{companyId}`

Companies represent brands or organizations that own projects, events, and experiences.

### Schema

```ts
interface Company {
  id: string;
  name: string; // 1-100 characters. Ex: Turn Page Oy
  slug: slug; // Ex: turn-page-oy
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

Projects are **company-scoped containers** for events (e.g. “Brand X Summer Tour”, “Pop-up Campaign 2025”).

### Schema

```ts
interface Project {
  id: string;
  companyId: string; // FK to companies
  name: string; // 1-200 characters
  status: "active" | "archived";
  sharePath: string; // e.g., "/join/abc123" (project-level join link)
  activeEventId?: string | null; // Currently live event for this project
  createdAt: number;
  updatedAt: number;
}
```

### Notes

- All **events** live under a project.
- Guests typically join via the project `sharePath`, which resolves to its `activeEventId`.

---

## 4. Events

**Collection**: `/projects/{projectId}/events/{eventId}`

Events are **time-bound, themed containers** that use Experiences as their flow building blocks.

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

  // Theming is defined only at event level (MVP)
  theme: EventTheme;

  deletedAt?: number | null;
  createdAt: number;
  updatedAt: number;
}
```

### EventTheme (unchanged in spirit)

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

  - Guest opens `Project.sharePath` → server/app resolves `project.activeEventId` → loads that Event.

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

## 6. EventExperiences (linking Events → Experiences)

**Collection**:
`/projects/{projectId}/events/{eventId}/eventExperiences/{eventExperienceId}`

These documents link an Event to one or more Experiences from the company’s Experience library.

### Schema

```ts
interface EventExperience {
  id: string;
  eventId: string;
  projectId: string;
  companyId: string;
  experienceId: string; // FK to /experiences/{experienceId}
  isEnabled: boolean; // Simple on/off toggle (MVP)
  createdAt: number;
  updatedAt: number;
}
```

### Notes

- No overrides or ordering in MVP.
- Guest runtime can:

  - Show a single chosen Experience, or
  - Offer a simple “experience choice” screen built from these docs (not via a step).

---

## 7. Steps (per Experience)

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

#### 7.1 Info Step

```ts
interface StepInfo extends StepBase {
  type: "info";
}
```

#### 7.2 Capture Step

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

#### 7.3 Input Steps

Same shapes as before (short_text, long_text, multiple_choice, yes_no, opinion_scale, email), but with `experienceId` instead of `eventId`/`journeyId`.

#### 7.4 Processing Step

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

#### 7.5 Reward Step

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

#### 7.6 NEW: AiTransform Step

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

#### 7.7 Removed: Experience Picker Step

The old:

```ts
type: "experience-picker";
```

step is **removed** from the schema and renderer registry. Experience selection happens at the **Event level** via `eventExperiences`, not as a step.

---

## 8. AiPresets (Dormant, Future Use)

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

## 9. Relationships (New World)

```text
Companies (1)
  ├── (*) Projects
  │       └── (*) Events
  │             └── (*) EventExperiences
  │                    └── (1) Experiences
  │                          └── (*) Steps
  └── (*) Experiences
         └── (*) Steps

Companies (1)
  └── (*) AiPresets (legacy AI config, unused for now)
```

- **Company → Projects**: one company has many projects.
- **Project → Events**: one project has many events.
- **Event → EventExperiences**: one event can expose multiple experiences.
- **Company → Experiences**: experiences are shared across a company.
- **Experience → Steps**: one experience has many steps.
- **AiPresets**: standalone, company-scoped; future AI library.

---

If you want, next I can:

- Draft **example JSON documents** for each collection (company, project, event, experience, step, eventExperience) to sanity-check how this looks in real data, or
- Help map the migration steps from **old paths** → **new paths** so you have a clear checklist when you actually refactor the database + code.
