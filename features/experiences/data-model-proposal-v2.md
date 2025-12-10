# Experience Data Model Proposal v2

**Date**: December 2024
**Status**: Draft Proposal
**Scope**: Simplified experience model with flat discriminated union types

---

## Executive Summary

This proposal introduces a cleaner experience model that:

1. **Flat discriminated union** - Each experience type has its own shape, no nested configs
2. **Simple `type` discriminator** - `type: "photo" | "gif" | "ai_photo" | "survey" | ...`
3. **System experiences for simple captures** - Photo, GIF, Video exist once globally
4. **Company experiences for custom flows** - AI transformations, surveys, wheels
5. **Event-level frame overlay** - Single overlay applied to all media outputs
6. **Event-level sharing config** - Default sharing for all outputs
7. **Unified InfoScreen** - Reusable for intros, endings, and in-between survey content

---

## 1. Experience Types Overview

| Type | Scope | Purpose | Produces Media |
|------|-------|---------|----------------|
| `photo` | System | Simple photo capture | Yes |
| `gif` | System | Burst capture → GIF | Yes |
| `video` | System | Video recording | Yes |
| `ai_photo` | Company | Photo → AI image | Yes |
| `ai_gif` | Company | Burst → AI GIF | Yes |
| `ai_video` | Company | Photo → AI video | Yes |
| `survey` | Company | Data collection | No |
| `wheel` | Company | Gamification | No |

Future types: `quiz`, `ar`, `photo_collage`, etc.

---

## 2. Core Schema

### 2.1 Experience Base

```typescript
interface ExperienceBase {
  id: string;

  // Ownership
  companyId: string | null;       // null = system experience
  isSystem: boolean;              // true = system, can't edit/delete

  // Display
  name: string;                   // 1-200 chars
  description?: string | null;    // max 1000 chars

  // Library preview
  previewMediaUrl?: string | null;
  previewType?: "image" | "gif" | "video" | null;

  // Status
  status: "active" | "deleted";
  deletedAt?: number | null;

  // Timestamps
  createdAt: number;
  updatedAt: number;
}
```

### 2.2 Experience Union Type

```typescript
type Experience =
  // Simple captures (system)
  | PhotoExperience
  | GifExperience
  | VideoExperience
  // AI captures (company)
  | AiPhotoExperience
  | AiGifExperience
  | AiVideoExperience
  // Data/Gamification (company)
  | SurveyExperience
  | WheelExperience;

// Discriminator field
type ExperienceType = Experience["type"];
// = "photo" | "gif" | "video" | "ai_photo" | "ai_gif" | "ai_video" | "survey" | "wheel"
```

---

## 3. Experience Type Definitions

### 3.1 Photo Experience (System)

Simple single photo capture.

```typescript
interface PhotoExperience extends ExperienceBase {
  type: "photo";

  // Always system-level
  isSystem: true;
  companyId: null;

  // Output aspect ratio for frame overlay matching
  outputAspectRatio: AspectRatio;
}
```

### 3.2 GIF Experience (System)

Burst capture compiled into animated GIF.

```typescript
interface GifExperience extends ExperienceBase {
  type: "gif";

  // Always system-level
  isSystem: true;
  companyId: null;

  // Burst settings (flat, not nested)
  frameCount: number;             // 2-10, default: 4
  intervalMs: number;             // 200-2000, default: 500

  // Output aspect ratio
  outputAspectRatio: AspectRatio;
}
```

### 3.3 Video Experience (System)

Short video recording.

```typescript
interface VideoExperience extends ExperienceBase {
  type: "video";

  // Always system-level
  isSystem: true;
  companyId: null;

  // Video settings (flat)
  maxDurationSec: number;         // 3-60, default: 15

  // Output aspect ratio
  outputAspectRatio: AspectRatio;
}
```

**System Experiences (seeded in database or hardcoded):**

| ID | Type | Config | Aspect Ratio |
|----|------|--------|--------------|
| `system:photo` | `photo` | - | 3:4 |
| `system:gif` | `gif` | `frameCount: 4, intervalMs: 500` | 3:4 |
| `system:video` | `video` | `maxDurationSec: 15` | 9:16 |

### 3.4 AI Photo Experience (Company)

Capture single photo, transform with AI to image.

```typescript
interface AiPhotoExperience extends ExperienceBase {
  type: "ai_photo";

  // Always company-level
  isSystem: false;
  companyId: string;

  // Camera settings (capture is always single photo - no config needed)
  cameraFacing: "user" | "environment" | "both";
  countdown: number;              // 0-10 seconds

  // AI transformation settings
  aiConfig: AiConfig;

  // Input questions for AI context (shown before capture)
  inputQuestions: Question[];

  // Processing UX (flat, not nested)
  processingMessages: string[];   // 1-10 rotating messages
  estimatedDurationSec: number;   // 5-300

  // Optional intro screen
  intro?: InfoScreen | null;
}
```

### 3.5 AI GIF Experience (Company)

Capture burst photos, transform each with AI, compile to GIF.

```typescript
interface AiGifExperience extends ExperienceBase {
  type: "ai_gif";

  // Always company-level
  isSystem: false;
  companyId: string;

  // Camera settings (capture is burst)
  cameraFacing: "user" | "environment" | "both";
  countdown: number;              // 0-10 seconds
  frameCount: number;             // 2-10
  intervalMs: number;             // 200-2000

  // AI transformation settings
  aiConfig: AiConfig;

  // Input questions for AI context (shown before capture)
  inputQuestions: Question[];

  // Processing UX
  processingMessages: string[];   // 1-10 rotating messages
  estimatedDurationSec: number;   // 5-300

  // Optional intro screen
  intro?: InfoScreen | null;
}
```

### 3.6 AI Video Experience (Company)

Capture single photo, transform with AI to video.

```typescript
interface AiVideoExperience extends ExperienceBase {
  type: "ai_video";

  // Always company-level
  isSystem: false;
  companyId: string;

  // Camera settings (capture is single photo - AI generates video from it)
  cameraFacing: "user" | "environment" | "both";
  countdown: number;              // 0-10 seconds

  // AI transformation settings
  aiConfig: AiConfig;

  // Input questions for AI context (shown before capture)
  inputQuestions: Question[];

  // Processing UX
  processingMessages: string[];   // 1-10 rotating messages
  estimatedDurationSec: number;   // 5-300

  // Optional intro screen
  intro?: InfoScreen | null;
}
```

### 3.7 Survey Experience (Company)

Data collection with questions and info screens interleaved.

```typescript
interface SurveyExperience extends ExperienceBase {
  type: "survey";

  // Can be system (generic templates) or company (custom)
  isSystem: boolean;
  companyId: string | null;

  // Flow items: questions AND info screens interleaved
  items: SurveyItem[];

  // Screens
  intro?: InfoScreen | null;
  ending: InfoScreen;             // Thank you / completion screen
}

// Survey can contain questions OR info screens
type SurveyItem = Question | SurveyInfoItem;

interface SurveyInfoItem {
  type: "info";
  id: string;
  title: string;
  description?: string | null;
  mediaUrl?: string | null;
  mediaType?: "image" | "gif" | "video" | "lottie" | null;
  ctaLabel?: string | null;       // default: "Continue"
}
```

### 3.8 Wheel Experience (Company)

Gamified spinning wheel with prizes.

```typescript
interface WheelExperience extends ExperienceBase {
  type: "wheel";

  // Always company-level (custom wheel config)
  isSystem: false;
  companyId: string;

  // Wheel configuration (flat, not nested in wheelConfig)
  sectors: WheelSector[];         // 2-12 sectors
  spinDurationMs: number;         // 2000-8000
  pointerPosition: "top" | "right";
  showConfetti: boolean;

  // Screens
  intro?: InfoScreen | null;
  resultScreen: WheelResultScreen;
}

interface WheelSector {
  id: string;
  label: string;                  // 1-50 chars, shown on wheel
  value: string;                  // 1-100 chars, stored result
  weight: number;                 // 1-100, probability weight

  // Visual
  backgroundColor?: string | null;
  textColor?: string | null;
  icon?: string | null;           // Emoji or icon name

  // Prize (optional)
  prize?: {
    type: "coupon" | "discount" | "freebie" | "points" | "none";
    code?: string | null;
    description?: string | null;
  } | null;
}

interface WheelResultScreen {
  titleTemplate: string;          // "You won {{prize}}!"
  descriptionTemplate?: string | null;
  showPrizeCode: boolean;
}
```

---

## 4. Shared Types

### 4.1 AI Config

```typescript
interface AiConfig {
  model: string | null;
  prompt: string;                 // max 2000 chars, supports {{variable}}
  negativePrompt?: string | null;
  outputAspectRatio: AspectRatio;
  referenceImageUrls: string[];   // max 5

  // Advanced (optional)
  seed?: number | null;
  guidanceScale?: number | null;
}
```

### 4.2 Question Type (Shared by AI inputs & Surveys)

```typescript
type Question =
  | ShortTextQuestion
  | LongTextQuestion
  | MultipleChoiceQuestion
  | YesNoQuestion
  | OpinionScaleQuestion
  | EmailQuestion;

interface QuestionBase {
  id: string;
  variableKey: string;            // Used in prompts as {{variableKey}}
  title: string;                  // max 200 chars
  description?: string | null;    // max 1000 chars
  required: boolean;
}

interface ShortTextQuestion extends QuestionBase {
  type: "short_text";
  placeholder?: string | null;
  maxLength: number;              // 1-500
}

interface LongTextQuestion extends QuestionBase {
  type: "long_text";
  placeholder?: string | null;
  maxLength: number;              // 1-2000
}

interface MultipleChoiceQuestion extends QuestionBase {
  type: "multiple_choice";
  options: { label: string; value: string }[];  // 2-10 options
  allowMultiple: boolean;
}

interface YesNoQuestion extends QuestionBase {
  type: "yes_no";
  yesLabel: string;               // default: "Yes"
  noLabel: string;                // default: "No"
}

interface OpinionScaleQuestion extends QuestionBase {
  type: "opinion_scale";
  scaleMin: number;               // 0-10
  scaleMax: number;               // 2-10
  minLabel?: string | null;
  maxLabel?: string | null;
}

interface EmailQuestion extends QuestionBase {
  type: "email";
  placeholder?: string | null;
}
```

### 4.3 InfoScreen (Unified)

Reusable for intros, endings, and in-between content. Same structure as existing `InfoStep`.

```typescript
interface InfoScreen {
  title: string;                  // max 200 chars
  description?: string | null;    // max 1000 chars
  mediaUrl?: string | null;
  mediaType?: "image" | "gif" | "video" | "lottie" | null;
  ctaLabel?: string | null;       // default: "Continue" or "Get Started"
}
```

### 4.4 Aspect Ratio

```typescript
type AspectRatio = "1:1" | "3:4" | "4:3" | "4:5" | "5:4" | "9:16" | "16:9";
```

---

## 5. Event Schema

### 5.1 Event Document

```typescript
interface Event {
  id: string;
  projectId: string;
  companyId: string;
  name: string;                   // 1-200 chars

  // Scheduling
  publishStartAt?: number | null;
  publishEndAt?: number | null;

  // Visual theme (existing)
  theme: EventTheme;

  // ----- Experiences -----
  // See Section 6 for two approaches

  // ----- Frame Overlay (applied to ALL media outputs) -----
  frameOverlay?: FrameOverlay | null;

  // Future: frameOverlays by aspect ratio
  // frameOverlays?: Record<AspectRatio, FrameOverlay> | null;

  // ----- Default Sharing Config -----
  sharingConfig: SharingConfig;

  // ----- Extras -----
  extras: EventExtras;

  // Status
  deletedAt?: number | null;
  createdAt: number;
  updatedAt: number;
}

interface FrameOverlay {
  url: string;                    // Firebase Storage URL
  type: "image" | "gif" | "video";
}

interface SharingConfig {
  allowDownload: boolean;
  allowEmail: boolean;
  socials: ShareSocial[];
}

type ShareSocial = "instagram" | "facebook" | "twitter" | "linkedin" | "tiktok" | "whatsapp";

interface EventExtras {
  preEntryGate?: EventExperienceLink | null;
  preReward?: EventExperienceLink | null;
}
```

---

## 6. System Experiences: Two Approaches

### Approach A: Unified `experiences[]` Array

System and company experiences in one array.

```typescript
interface Event {
  // ...

  // All experiences in one array
  experiences: EventExperienceLink[];
}

interface EventExperienceLink {
  experienceId: string;           // "system:photo" or company experience ID
  label?: string | null;          // Override display name
  enabled: boolean;

  // Future: per-experience overrides
  // sharingOverride?: Partial<SharingConfig> | null;
}
```

**Example:**
```typescript
const event = {
  experiences: [
    { experienceId: "system:photo", label: "Take a Photo", enabled: true },
    { experienceId: "system:gif", label: "Make a GIF", enabled: false },
    { experienceId: "abc123", label: "Hobbitify Me", enabled: true },
  ],
};
```

**Pros:**
- Uniform handling in UI and guest flow
- Single list to manage
- Easy to reorder all experiences together

**Cons:**
- Need to filter/validate system experiences (only one per type)
- Slightly more complex queries

**Constraints:**
- Only one of each system capture type (photo, gif, video) allowed per event
- Validated at application level

---

### Approach B: Separate `systemCaptures` Map

System captures in dedicated map, company experiences in array.

```typescript
interface Event {
  // ...

  // System captures (max one per type)
  systemCaptures: {
    photo?: SystemCaptureConfig | null;
    gif?: SystemCaptureConfig | null;
    video?: SystemCaptureConfig | null;
  };

  // Company experiences only
  experiences: EventExperienceLink[];
}

interface SystemCaptureConfig {
  enabled: boolean;
  label?: string | null;          // Override display name

  // Future: type-specific overrides
  // gifOverrides?: { frameCount?: number; intervalMs?: number };
  // videoOverrides?: { maxDurationSec?: number };
}
```

**Example:**
```typescript
const event = {
  systemCaptures: {
    photo: { enabled: true, label: "Take a Photo" },
    gif: { enabled: true, label: "Fun GIF" },
    video: null,
  },
  experiences: [
    { experienceId: "abc123", label: "Hobbitify Me", enabled: true },
  ],
};
```

**Pros:**
- Clear separation of system vs company
- Type-safe: impossible to add duplicate system captures
- No need to seed system experiences in database
- Easier to add type-specific config in future

**Cons:**
- Two places to manage experiences
- Guest flow needs to merge both sources
- UI needs to handle two sections

---

### Recommendation

**Start with Approach B** for MVP:
- Simpler validation (no duplicate system captures possible)
- No database seeding required
- Clear type-safe structure
- Can migrate to Approach A later if needed

**Approach A** makes sense when:
- You want uniform drag-drop reordering of all experiences
- System experiences need the same features as company experiences
- You plan to have many system experience variants

---

## 7. Guest Flow Logic

### 7.1 Experience Resolution

```typescript
function getAvailableExperiences(event: Event): ExperienceOption[] {
  const options: ExperienceOption[] = [];

  // Add enabled system captures (Approach B)
  if (event.systemCaptures.photo?.enabled) {
    options.push({
      type: "system",
      captureType: "photo",
      label: event.systemCaptures.photo.label ?? "Photo",
    });
  }
  if (event.systemCaptures.gif?.enabled) {
    options.push({
      type: "system",
      captureType: "gif",
      label: event.systemCaptures.gif.label ?? "GIF",
    });
  }
  if (event.systemCaptures.video?.enabled) {
    options.push({
      type: "system",
      captureType: "video",
      label: event.systemCaptures.video.label ?? "Video",
    });
  }

  // Add enabled company experiences
  for (const link of event.experiences) {
    if (link.enabled) {
      options.push({
        type: "company",
        experienceId: link.experienceId,
        label: link.label,  // Resolved from experience if null
      });
    }
  }

  return options;
}
```

### 7.2 Flow Execution

```
Guest arrives at event
    │
    ├── preEntryGate extra? → Run gate experience
    │
    ▼
How many experiences available?
    │
    ├── 0 → Show "No experiences" error
    ├── 1 → Go directly to that experience
    └── 2+ → Show experience picker

    ▼
Run selected experience by type:
    │
    ├── photo      → Camera (single) → Apply overlay → Output
    ├── gif        → Camera (burst) → Compile GIF → Apply overlay → Output
    ├── video      → Camera (video) → Apply overlay → Output
    │
    ├── ai_photo   → Intro? → Inputs? → Camera (single) → Processing* → Apply overlay → Output
    ├── ai_gif     → Intro? → Inputs? → Camera (burst) → Processing* → Apply overlay → Output
    ├── ai_video   → Intro? → Inputs? → Camera (single) → Processing* → Apply overlay → Output
    │
    ├── survey     → Intro? → Items (questions + info) → Ending
    └── wheel      → Intro? → Spin → Result

    * During AI processing, if preReward extra exists, run it

    ▼
For media outputs:
    │
    ├── Apply frame overlay (if configured)
    ├── Show sharing options (from event.sharingConfig)
    └── Option to start over
```

---

## 8. Database Structure

### 8.1 Collections

```
/experiences/{experienceId}
├── Company AI experiences (type: "ai_photo" | "ai_gif" | "ai_video")
├── Company surveys (type: "survey")
├── Company wheels (type: "wheel")
└── Optional: System survey templates (isSystem: true)

/projects/{projectId}/events/{eventId}
├── Event config
├── systemCaptures: { photo, gif, video }
├── experiences: EventExperienceLink[]
├── frameOverlay
├── sharingConfig
└── extras
```

Note: System captures (photo, gif, video) are NOT stored in `/experiences` collection.
They are hardcoded in the application with `system:photo`, `system:gif`, `system:video` IDs.

### 8.2 Example Documents

**AI Photo Experience:**
```json
{
  "id": "exp_abc123",
  "type": "ai_photo",
  "companyId": "comp_xyz",
  "isSystem": false,
  "name": "Hobbitify Me",
  "description": "Transform into a hobbit character",
  "status": "active",

  "cameraFacing": "user",
  "countdown": 3,

  "aiConfig": {
    "model": "flux-schnell",
    "prompt": "Transform this person into a hobbit from Lord of the Rings. They are holding a {{pet}}. Background: {{background}}. Style: cinematic, detailed.",
    "outputAspectRatio": "3:4",
    "referenceImageUrls": []
  },

  "inputQuestions": [
    {
      "id": "q1",
      "type": "multiple_choice",
      "variableKey": "pet",
      "title": "What pet should you hold?",
      "options": [
        { "label": "Cat", "value": "a fluffy cat" },
        { "label": "Dog", "value": "a loyal dog" },
        { "label": "Chicken", "value": "a brown chicken" }
      ],
      "allowMultiple": false,
      "required": true
    },
    {
      "id": "q2",
      "type": "multiple_choice",
      "variableKey": "background",
      "title": "Choose your background",
      "options": [
        { "label": "Hobbit Hole", "value": "cozy hobbit hole interior" },
        { "label": "The Shire", "value": "rolling green hills of the Shire" },
        { "label": "Rivendell", "value": "elven architecture of Rivendell" }
      ],
      "allowMultiple": false,
      "required": true
    }
  ],

  "processingMessages": [
    "Entering Middle-earth...",
    "Finding your hobbit self...",
    "Adding the finishing touches..."
  ],
  "estimatedDurationSec": 30,

  "intro": {
    "title": "Become a Hobbit!",
    "description": "We'll transform your photo into a character from the Shire",
    "ctaLabel": "Let's Go!"
  },

  "createdAt": 1702000000000,
  "updatedAt": 1702000000000
}
```

**Survey Experience (with interleaved info):**
```json
{
  "id": "exp_survey_feedback",
  "type": "survey",
  "companyId": "comp_xyz",
  "isSystem": false,
  "name": "Event Feedback",
  "description": "Quick feedback survey",
  "status": "active",

  "intro": {
    "title": "Quick Feedback",
    "description": "Help us improve! This takes 30 seconds.",
    "ctaLabel": "Start"
  },

  "items": [
    {
      "id": "q1",
      "type": "opinion_scale",
      "variableKey": "rating",
      "title": "How was your experience today?",
      "scaleMin": 1,
      "scaleMax": 5,
      "minLabel": "Poor",
      "maxLabel": "Excellent",
      "required": true
    },
    {
      "id": "info1",
      "type": "info",
      "title": "Thanks! Just two more questions...",
      "ctaLabel": "Continue"
    },
    {
      "id": "q2",
      "type": "yes_no",
      "variableKey": "recommend",
      "title": "Would you recommend this to a friend?",
      "yesLabel": "Yes!",
      "noLabel": "Not really",
      "required": true
    },
    {
      "id": "q3",
      "type": "long_text",
      "variableKey": "feedback",
      "title": "Any other feedback?",
      "placeholder": "Tell us what you think...",
      "maxLength": 500,
      "required": false
    }
  ],

  "ending": {
    "title": "Thank You!",
    "description": "Your feedback helps us improve."
  },

  "createdAt": 1702000000000,
  "updatedAt": 1702000000000
}
```

**Event with Approach B:**
```json
{
  "id": "evt_123",
  "projectId": "proj_456",
  "companyId": "comp_xyz",
  "name": "Holiday Party 2024",

  "systemCaptures": {
    "photo": { "enabled": true, "label": "Quick Photo" },
    "gif": { "enabled": true, "label": "Fun GIF" },
    "video": null
  },

  "experiences": [
    { "experienceId": "exp_abc123", "label": "Hobbitify Me", "enabled": true },
    { "experienceId": "exp_def456", "label": "Winter Wonderland", "enabled": true }
  ],

  "frameOverlay": {
    "url": "https://storage.../frames/holiday-2024.png",
    "type": "image"
  },

  "sharingConfig": {
    "allowDownload": true,
    "allowEmail": true,
    "socials": ["instagram", "facebook", "twitter"]
  },

  "extras": {
    "preEntryGate": null,
    "preReward": { "experienceId": "exp_survey_feedback", "enabled": true }
  },

  "theme": { },
  "createdAt": 1702000000000,
  "updatedAt": 1702000000000
}
```

---

## 9. Migration from Current Model

### 9.1 Schema Changes

| Current | New |
|---------|-----|
| `Experience.experienceType` | `Experience.type` (simpler) |
| `Experience.stepsOrder[]` | Removed - flow determined by `type` |
| `Steps` subcollection | Removed - config embedded in experience |
| Nested `captureConfig`, `aiConfig` | Flattened into experience |
| `Event.experiences[]` | Split into `systemCaptures` + `experiences[]` |

### 9.2 Migration Steps

1. **Add new fields** to Event schema (`systemCaptures`, `frameOverlay`, `sharingConfig`)
2. **Create new experience types** with flat structure
3. **Migrate existing experiences** - Convert step-based to typed experiences
4. **Deprecate steps** - Keep for backwards compat, stop creating new
5. **Update Experience Engine** - Execute by type, not by steps

### 9.3 Backwards Compatibility

- Existing step-based experiences work as `type: "legacy"`
- Legacy experiences use old step-by-step execution
- New experiences use type-based execution
- Gradual migration path

---

## 10. Open Questions

1. **System capture config expansion** - When to add settings like countdown, camera facing to system captures?

2. **Frame overlay aspect ratio matching** - How to handle mismatched aspect ratios between capture and overlay?

3. **Sharing config per experience** - Is event-level default sufficient, or need per-experience override?

4. **Survey as preReward** - Should preReward be limited to survey type, or allow any experience?

5. **Experience ordering** - In Approach B, how to order system captures relative to company experiences in picker?

---

## 11. Summary

### Key Decisions

| Decision | Choice |
|----------|--------|
| Discriminator field | `type` (not `experienceType`) |
| Experience structure | Flat discriminated union - no nested configs |
| Simple captures | System-level, not per-company |
| Steps | Removed - config embedded in experience type |
| Frame overlay | Event-level, single overlay (future: by aspect ratio) |
| Sharing config | Event-level default |
| System experience storage | Approach B: separate `systemCaptures` map |
| Info screens | Unified `InfoScreen` type for intros, endings, survey interstitials |

### Experience Types

| Type | Scope | Media Output | Reusable |
|------|-------|--------------|----------|
| `photo` | System | Yes | N/A (built-in) |
| `gif` | System | Yes | N/A (built-in) |
| `video` | System | Yes | N/A (built-in) |
| `ai_photo` | Company | Yes | Yes |
| `ai_gif` | Company | Yes | Yes |
| `ai_video` | Company | Yes | Yes |
| `survey` | Company | No | Yes |
| `wheel` | Company | No | Yes |

### Next Steps

1. Finalize choice between Approach A vs B
2. Define Zod schemas for all types
3. Plan migration from step-based model
4. Design Experience Engine execution by type
5. Build UI for new experience creation flow
