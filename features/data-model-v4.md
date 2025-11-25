Of course. Here is the complete, finalized Data Model Document for the Clementine App.

This document incorporates all our architectural decisions:

1.  **Strict Firestore Flattening:** No nested sub-collections.
2.  **Terminology:** "Journey" (Playlist), "Experience" (AI/HW Asset), "Step" (UI Screen).
3.  **Dynamic Injection:** Capture steps load Experiences at runtime based on user selection.
4.  **Atomic Experiences:** Experiences define their own required form inputs.

---

# Clementine Data Model Specification v1.0

## 1\. Architecture Overview

Clementine uses a **Normalized Firestore Architecture**. To ensure scalability, simplify data migration (to SQL in the future), and adhere to Firestore best practices, we **do not nest sub-collections** beyond one level of depth.

All data related to an event is organized under root collections, linked by an `eventId`.

### Collection Map

| Collection Path | Purpose                                                                                                            | Key Role                                                 |
| :-------------- | :----------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------- |
| `/events`       | **Root Container.** Stores high-level settings and the real-time "Switchboard" state.                              | The single source of truth for what is currently active. |
| `/experiences`  | **Experience Library.** Stores reusable configurations for AI rules, hardware settings, and required user inputs.  | The "Recipe book" for AI experiences.                    |
| `/journeys`     | **Playlist Sequence.** Defines a linear ordering of steps. It does not contain step content.                       | The skeleton of an experience.                           |
| `/steps`        | **Screen Content.** Stores the configuration for individual UI screens (Welcome, Selection, Capture, Form).        | The building blocks of the user interface.               |
| `/sessions`     | **Guest Runs.** Transactional records of a single user's progress, answers, and generated media through a Journey. | The "save state" for a guest.                            |

### Relationship Diagram

---

## 2\. Collection Definitions (TypeScript Interfaces)

### 2.1. ROOT: Events Collection

**Path:** `/events/{eventId}`

This is the entry point for any guest. The client subscribes to this document in real-time to know which Journey to load.

```typescript
interface Event {
  id: string;
  ownerId: string; // ID of the Host/Brand user
  slug: string; // Unique URL-friendly identifier (e.g., "nike-air-max")
  name: string; // Internal name

  status: "draft" | "published" | "archived";

  // === THE SWITCHBOARD ===
  // This controls the live experience for all connected guests.
  // - If string: Clients load this specific Journey ID.
  // - If null: Clients show a "Waiting for Host" screen.
  activeJourneyId: string | null;

  // Branding & Theming
  branding: {
    logoUrl?: string;
    primaryColor: string; // Hex code
    fontFamily?: string;
    backgroundImageUrl?: string;
  };

  createdAt: number; // UTC Timestamp (ms)
  updatedAt: number;
}
```

---

### 2.2. EXPERIENCE: Experiences Collection

**Path:** `/experiences/{experienceId}`

A Experience is an atomic, self-contained configuration for a specific AI experience (e.g., "80s Movie Star", "Cyberpunk Hero"). It defines the output type, required inputs, hardware rules, and the AI prompt template.

```typescript
// Shared definition for form fields (used here and in Form Steps)
export type FieldType = "short_text" | "select";

export interface FieldConfig {
  id: string; // Variable name used in prompt (e.g., "guest_name")
  type: FieldType;
  label: string; // UI Label (e.g., "What is your name?")
  defaultValue?: string;
  // Only for type: 'select'
  options?: Array<{ label: string; value: string }>;
}

interface Experience {
  id: string;
  companyId: string; // The event this experience belongs to
  name: string; // Internal name
  // 1. The source of truth for how to render the player
  previewType?: "image" | "gif" | "video",

  // 2. The heavy asset (The actual Image, GIF or Video file)
  previewMediaUrl?: string,

  enabled: boolean;


  // 1. THE ENGINE (Output Type)
  // Determines which camera UI to load.
  type: "photo" | "video" | "gif";

  // 2. REQUIRED INPUTS (Just-in-Time Form)
  // These fields are rendered on the capture screen to collect data
  // needed for the prompt.
  inputFields: FieldConfig[];

  // 3. HARDWARE CONFIGURATION
  captureConfig: {
    countdown: number; // seconds
    cameraFacing: "front" | "back" | "both";

    overlayUrl?: string; // PNG frame applied over camera

    // Video/GIF specific
    minDuration?: number;
    maxDuration?: number;
    frameCount?: number; // number of gifs
  };

  // 4. AI CONFIGURATION
  aiConfig: {
    enabled: boolean,
    model: "nanobanano", "stable-diffusion-xl" | "flux" | "kling-video";
    // Handlebars syntax used to inject values from inputFields
    // e.g., "A portrait of {{guest_name}} in the style of {{selected_vibe}}"
    prompt: string;
    negativePrompt?: string;
    referenceImageUrls: string[],
    aspectRatio?: "9:16" | "1:1" | "4:3";
  };

  createdAt: number;
}
```

---

### 2.3. PLAYLIST: Journeys Collection

**Path:** `/journeys/{journeyId}`

Formerly "Activations" or "Flows". A Journey is a lightweight wrapper that defines a linear sequence of steps. It determines the _order_ of screens.

```typescript
interface Journey {
  id: string;
  eventId: string;
  name: string; // e.g., "Evening Party Flow"

  // The ordered sequence of Step IDs to execute.
  // The client fetches this array, then queries the 'steps' collection.
  stepOrder: string[]; // e.g., ["step_welcome_1", "step_select_2", "step_capture_3"]

  // Metadata for analytics or filtering in the host dashboard
  tags?: string[]; // ["photobooth", "ai", "survey"]

  createdAt: number;
}
```

---

### 2.4. CONTENT: Steps Collection

**Path:** `/steps/{stepId}`

Steps are the actual screens a user interacts with. We use a **Discriminated Union** to define the specific configuration for each step type while sharing a common base.

#### The Base Interface (Universal UI)

All steps share these common layout properties.

```typescript
export type StepType =
  | "welcome"
  | "selection"
  | "capture"
  | "form"
  | "processing"
  | "result";

interface StepBase {
  id: string;
  eventId: string;
  journeyId: string; // The parent journey
  type: StepType;

  // Universal Layout Props (handled by a generic StepWrapper component)
  title?: string; // Main Header
  description?: string; // Subtitle / Helper Text
  mediaUrl?: string; // Hero image/video for the screen
  ctaLabel?: string; // Override for the main action button (e.g. "Next", "Snap")
}
```

#### Specific Step Implementations

**1. The Selection Step (The Router)**
Allows the user to choose a path, which sets a variable in their session.

```typescript
interface StepSelection extends StepBase {
  type: "selection";
  config: {
    layout: "grid" | "list" | "carousel";
    variableName: string; // The session key to save the choice to (e.g. "selected_experience_id")

    options: Array<{
      id: string; // Unique ID for this option
      label: string; // Display text
      value: string; // The value saved to the variable (e.g. a Experience ID: "experience_hero_123")
      imageUrl?: string; // Custom icon for the button
    }>;
  };
}
```

**2. The Capture Step (The Consumer)**
This step is a chameleon. It looks at a session variable (set by a previous Selection step) to find a Experience ID, loads that Experience, and then configures the camera and AI accordingly.

```typescript
interface StepCapture extends StepBase {
  type: "capture";
  config: {
    // The name of the session variable that holds the Experience ID.
    // e.g., "selected_experience_id" from the Selection Step above.
    sourceVariable: string;

    // Optional default in case the variable isn't set.
    fallbackExperienceId?: string;
  };
  // Note: No hardcoded hardware/AI config here. It's all injected at runtime from the Experience.
}
```

**3. The Form Step (Blocking Input)**
A dedicated screen for collecting data, separate from the capture process.

```typescript
import { FieldConfig } from "../experiences"; // Reusing the field definition

interface StepForm extends StepBase {
  type: "form";
  config: {
    // A list of fields to present on this screen.
    fields: FieldConfig[];
  };
}
```

_(Other types like `welcome`, `processing`, and `result` would follow a similar pattern with minimal configs)._

---

### 2.5. STATE: Sessions Collection

**Path:** `/sessions/{sessionId}`

A transient record of a single guest's interaction with a Journey. It stores their progress and the data they have generated.

```typescript
interface Session {
  id: string;
  eventId: string;
  journeyId: string;
  guestId: string; // Anonymous ID or Authenticated User ID

  status: "in_progress" | "processing_ai" | "completed" | "abandoned";

  // THE DATA STORE
  // A key-value map of all data collected during the session.
  // Keys correspond to 'variableName' in steps or 'id' in fields.
  data: {
    // From Selection Steps:
    selected_experience_id?: string; // e.g., "experience_hero_123"

    // From Form Steps or Experience Inputs:
    guest_name?: string; // e.g., "Alex"

    // From Capture Steps (The raw media info):
    capture_result_raw?: {
      type: "photo" | "video";
      url: string;
      mimeType: string;
    };

    // From AI Processing (The final output):
    ai_result_final?: {
      url: string;
      generationId: string;
    };

    [key: string]: any; // Allow flexibility
  };

  currentIndex: number; // The current step index in the journey's stepOrder
  startedAt: number;
  completedAt?: number;
}
```

This concludes the data model specification for Clementine v1.0.
