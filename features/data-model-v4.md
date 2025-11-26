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

| Collection Path | Purpose                                                                                                                 | Key Role                                                 |
| :-------------- | :---------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------- |
| `/events`       | **Root Container.** Stores high-level settings and the real-time "Switchboard" state.                                   | The single source of truth for what is currently active. |
| `/experiences`  | **Experience Library.** Stores reusable configurations for AI rules, hardware settings, and required user inputs.       | The "Recipe book" for AI experiences.                    |
| `/journeys`     | **Playlist Sequence.** Defines a linear ordering of steps. It does not contain step content.                            | The skeleton of an experience.                           |
| `/steps`        | **Screen Content.** Stores the configuration for individual UI screens (Info, Experience Picker, Capture, Input, etc.). | The building blocks of the user interface.               |
| `/sessions`     | **Guest Runs.** Transactional records of a single user's progress, answers, and generated media through a Journey.      | The "save state" for a guest.                            |

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
  companyId: string; // The company that owns this experience
  eventIds: string[]; // Array of event IDs that use this experience
  name: string; // Internal name

  // 1. The source of truth for how to render the player
  previewType?: "image" | "gif" | "video";

  // 2. The heavy asset (The actual Image, GIF or Video file)
  previewMediaUrl?: string;

  enabled: boolean;

  // 1. THE ENGINE (Output Type)
  // Determines which camera UI to load.
  type: "photo" | "video" | "gif";

  // 2. REQUIRED INPUTS (Just-in-Time Form)
  // These fields are rendered on the capture screen to collect data
  // needed for the prompt. Nullable - full implementation deferred.
  inputFields?: FieldConfig[] | null;

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

  // 4. AI CONFIGURATION (Type-specific)
  // Photo/GIF experiences use aiPhotoConfig
  // Video experiences use aiVideoConfig
  aiPhotoConfig?: {
    enabled: boolean;
    model?: string | null; // e.g., "stable-diffusion-xl", "flux"
    prompt?: string | null;
    referenceImageUrls?: string[] | null;
    aspectRatio?: "9:16" | "1:1" | "4:3";
  };

  aiVideoConfig?: {
    enabled: boolean;
    model?: string | null; // e.g., "kling-video", "runway"
    prompt?: string | null;
    referenceImageUrls?: string[] | null;
    aspectRatio?: "9:16" | "1:1" | "4:3";
    duration?: number | null; // Output length in seconds
    fps?: number | null; // Frames per second
  };

  createdAt: number;
  updatedAt: number;
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

#### Step Type Categories

| Category             | Types                                                                            | Purpose                                              |
| :------------------- | :------------------------------------------------------------------------------- | :--------------------------------------------------- |
| **Navigation**       | `info`, `experience-picker`                                                      | Guide users through the journey                      |
| **Media Capture**    | `capture`                                                                        | Camera/photo/video capture (loads Experience config) |
| **Input Collection** | `short_text`, `long_text`, `multiple_choice`, `yes_no`, `opinion_scale`, `email` | Collect user data                                    |
| **Completion**       | `processing`, `reward`                                                           | Show results and final content                       |

#### The Base Interface (Universal UI)

All steps share these common layout properties.

```typescript
export type StepType =
  // Navigation
  | "info" // Universal message/welcome screen
  | "experience-picker" // Choose an Experience
  // Media Capture
  | "capture" // Camera capture (loads Experience config at runtime)
  // Input Collection (one question per screen)
  | "short_text"
  | "long_text"
  | "multiple_choice"
  | "yes_no"
  | "opinion_scale"
  | "email"
  // Completion
  | "processing" // Optional custom loading/generation screen
  | "reward"; // Final result display

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

---

**1. Info Step (Universal Message)**
A flexible screen for welcome messages, instructions, transitions, or any informational content. Replaces the old `welcome` and `statement` step types.

```typescript
interface StepInfo extends StepBase {
  type: "info";
  // Uses base properties only: title, description, mediaUrl, ctaLabel
  // No additional config needed
}
```

---

**2. Experience Picker Step (The Router)**
Allows the user to choose an Experience, which sets a variable in their session.

```typescript
interface StepExperiencePicker extends StepBase {
  type: "experience-picker";
  config: {
    layout: "grid" | "list" | "carousel";
    variable: string; // The session key to save the choice to (e.g., "selected_experience_id")
    options: Array<{
      id: string; // Unique ID for this option
      label: string; // Display text
      value: string; // The value saved to the variable (e.g., an Experience ID: "experience_hero_123")
      imageUrl?: string; // Custom thumbnail for the option
    }>;
  };
}
```

---

**3. Capture Step (The Consumer)**
This step is a chameleon. It looks at a session variable (set by a previous Experience Picker step) to find an Experience ID, loads that Experience, and then configures the camera and AI accordingly.

```typescript
interface StepCapture extends StepBase {
  type: "capture";
  config: {
    // The session variable key that holds the Experience ID.
    // e.g., "selected_experience_id" from the Experience Picker Step above.
    sourceVariable: string;

    // Optional default Experience ID if the variable isn't set.
    fallbackExperienceId?: string;
  };
  // Note: No hardcoded hardware/AI config here. It's all injected at runtime from the Experience.
}
```

---

**4. Input Steps (One Question Per Screen)**
Each input type is its own step, allowing granular control over the user journey. All input steps save their value to session data using a `variable` key.

**Short Text Input**

```typescript
interface StepShortText extends StepBase {
  type: "short_text";
  config: {
    variable: string; // Session key to save the response (e.g., "guest_name")
    placeholder?: string;
    maxLength?: number; // Default: 500
    required?: boolean; // Default: true
  };
}
```

**Long Text Input**

```typescript
interface StepLongText extends StepBase {
  type: "long_text";
  config: {
    variable: string;
    placeholder?: string;
    maxLength?: number; // Default: 2000
    required?: boolean;
  };
}
```

**Multiple Choice**

```typescript
interface StepMultipleChoice extends StepBase {
  type: "multiple_choice";
  config: {
    variable: string;
    options: Array<{
      label: string;
      value: string;
    }>;
    allowMultiple?: boolean; // Default: false
    required?: boolean;
  };
}
```

**Yes/No**

```typescript
interface StepYesNo extends StepBase {
  type: "yes_no";
  config: {
    variable: string;
    yesLabel?: string; // Default: "Yes"
    noLabel?: string; // Default: "No"
    required?: boolean;
  };
}
```

**Opinion Scale**

```typescript
interface StepOpinionScale extends StepBase {
  type: "opinion_scale";
  config: {
    variable: string;
    scaleMin: number; // e.g., 1
    scaleMax: number; // e.g., 10
    minLabel?: string; // e.g., "Not likely"
    maxLabel?: string; // e.g., "Very likely"
    required?: boolean;
  };
}
```

**Email**

```typescript
interface StepEmail extends StepBase {
  type: "email";
  config: {
    variable: string;
    placeholder?: string; // Default: "your@email.com"
    required?: boolean;
  };
}
```

---

**5. Processing Step (Optional Loading Screen)**
An optional step to show a custom loading/generation screen with branded visuals and messaging while AI processing occurs. If omitted, the Reward step handles its own loading state.

```typescript
interface StepProcessing extends StepBase {
  type: "processing";
  config: {
    // Optional: Rotating messages during generation
    messages?: string[]; // e.g., ["Generating your image...", "Almost there..."]
    estimatedDuration?: number; // Seconds - for progress indication
  };
  // Note: Use base `mediaUrl` for custom loading animation (Lottie, GIF, video)
}
```

---

**6. Reward Step (Final Result)**
The final screen showing the generated result with sharing options.

```typescript
type ShareSocial =
  | "instagram"
  | "tiktok"
  | "facebook"
  | "x"
  | "snapchat"
  | "whatsapp"
  | "custom";

interface StepReward extends StepBase {
  type: "reward";
  config: {
    // Share settings
    allowDownload?: boolean; // Default: true
    allowSystemShare?: boolean; // Default: true - native OS share sheet
    allowEmail?: boolean; // Default: false
    socials?: ShareSocial[]; // Default: [] - specific social platforms to show
  };
  // Note: If AI result is not ready, shows loading state automatically
}
```

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
  // Keys correspond to 'variableName' in steps.
  data: {
    // From Experience Picker Steps:
    selected_experience_id?: string; // e.g., "experience_hero_123"

    // From Input Steps (short_text, long_text, email, etc.):
    guest_name?: string; // e.g., "Alex"
    guest_email?: string; // e.g., "alex@example.com"

    // From Capture Steps (The raw media info):
    capture_result_raw?: {
      type: "photo" | "video";
      url: string;
      mimeType: string;
    };

    // From AI Processing (The final output for Reward step):
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
