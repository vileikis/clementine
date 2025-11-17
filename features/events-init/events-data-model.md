Here’s the **final data model** for `events` and all its subcollections, plus behaviour/acceptance criteria for each.

## Overall Firestore structure

```txt
/events/{eventId}
  /experiences/{experienceId}
  /experienceItems/{itemId}
  /sessions/{sessionId}
  /shares/{shareId}
  /surveySteps/{stepId}
  /surveyResponses/{responseId}
  /participants/{participantId}
```

Exactly **one subcollection level** under each event.

---

## 1. `events` collection

### Type

```ts
type EventStatus = "draft" | "live" | "archived";

type Event = {
  id: string;
  title: string;
  brandColor: string;

  status: EventStatus;
  companyId: string | null;

  joinPath: string; // e.g. "/join/abc123"
  qrPngPath: string; // path in Storage

  // Publish window
  publishStartAt?: number; // ms timestamp
  publishEndAt?: number; // ms timestamp

  // Welcome screen
  welcomeTitle?: string;
  welcomeDescription?: string;
  welcomeCtaLabel?: string;
  welcomeBackgroundImagePath?: string;
  welcomeBackgroundColorHex?: string;

  // Result / end screen
  endHeadline?: string;
  endBody?: string;
  endCtaLabel?: string;
  endCtaUrl?: string;

  // Share config
  shareAllowDownload: boolean;
  shareAllowSystemShare: boolean;
  shareAllowEmail: boolean;
  shareSocials: Array<
    | "instagram"
    | "tiktok"
    | "facebook"
    | "x"
    | "snapchat"
    | "whatsapp"
    | "custom"
  >;

  // Survey config
  surveyEnabled: boolean; // survey in flow or not
  surveyRequired: boolean; // if enabled, must complete (vs optional)
  surveyStepsCount: number; // denormalized
  surveyStepsOrder: string[]; // ordered list of stepIds
  surveyVersion: number; // config version for analytics/migrations

  // Counters (denormalized)
  experiencesCount: number;
  sessionsCount: number;
  readyCount: number;
  sharesCount: number;

  createdAt: number;
  updatedAt: number;
};
```

### Behaviour / acceptance criteria

- **Joinability**

  - Event is _joinable_ if:

    ```ts
    const isJoinable =
      event.status === "live" &&
      (!event.publishStartAt || now >= event.publishStartAt) &&
      (!event.publishEndAt || now <= event.publishEndAt);
    ```

  - `draft` and `archived` must never be joinable, regardless of dates.

- **Welcome screen**

  - If `welcomeTitle`/`welcomeDescription`/`welcomeCtaLabel` are not set, sensible defaults are used.
  - If `welcomeBackgroundImagePath` exists → use image.
  - Else if `welcomeBackgroundColorHex` exists → use color.
  - Else → default app theme background.
  - If **more than one enabled experience** exists → show experience picker on welcome.
  - If exactly **one enabled experience** → can auto-skip picker and go straight to capture (implementation choice).

- **Ending screen**

  - Always shows final media for the session (AI or original, depending on `experience.aiEnabled`).
  - Only shows available share options based on:

    - `shareAllowDownload`
    - `shareAllowSystemShare`
    - `shareAllowEmail`
    - `shareSocials`

  - Optional CTA (`endCtaLabel` + `endCtaUrl`).

- **Survey behaviour**

  - Survey **exists** if `surveyStepsCount > 0`.
  - Survey is **off** if `surveyEnabled === false`, even if steps exist.
  - If `surveyEnabled === true` and `surveyRequired === true`:

    - Guests must complete survey before ending screen _unless_ they are a participant with `surveyCompleted === true` for this event.

  - If `surveyEnabled === true` and `surveyRequired === false`:

    - Guests are **offered** the survey but can skip it.

  - `surveyStepsOrder` must:

    - Contain each stepId **at most once**.
    - When non-empty, define the exact order of survey steps in UI.

- **Counters**

  - `experiencesCount` reflects enabled + disabled experiences (or just enabled, but must be consistent).
  - `sessionsCount`, `readyCount`, `sharesCount` are updated by backend/Cloud Functions and never trusted from client writes.

---

## 2. `experiences` subcollection

**Path:** `/events/{eventId}/experiences/{experienceId}`

### Type

```ts
type ExperienceType = "photo" | "video" | "gif" | "wheel";

type Experience = {
  id: string;
  eventId: string;

  label: string;
  type: ExperienceType;

  enabled: boolean;

  // Preview for welcome picker
  previewPath?: string;
  previewType?: "image" | "gif" | "video";

  // Capture options
  allowCamera?: boolean;
  allowLibrary?: boolean;

  // Video-specific
  maxDurationMs?: number;

  // GIF-specific (for capture)
  frameCount?: number; // number of frames to capture
  captureIntervalMs?: number; // interval between captures

  // Overlays (simple)
  overlayFramePath?: string;
  overlayLogoPath?: string;

  // AI config
  aiEnabled: boolean;
  aiModel?: string; // e.g. "nanobanana", "sdxl"
  aiPrompt?: string;
  aiReferenceImagePaths?: string[]; // 0..N reference images

  createdAt: number;
  updatedAt: number;
};
```

### Behaviour / acceptance criteria

- An event must have **at least one experience** to be usable.
- Only experiences with `enabled === true` should be shown to guests.
- `previewPath` is optional:

  - If present → used as visual card in picker.
  - `previewType` helps renderer decide between `<img>` vs `<video>` (you _can_ infer from file extension, but keeping type explicit is allowed).

- `type` behaviour:

  - `"photo"` → single photo capture.
  - `"video"` → video capture limited by `maxDurationMs` (if set).
  - `"gif"` → multi-photo capture (`frameCount` & `captureIntervalMs`).
  - `"wheel"` → uses related `experienceItems` of `kind === "wheel_sector"`.

- If `aiEnabled === false`:

  - Capture still happens.
  - Output is original media with overlays applied (if configured).

- If `aiEnabled === true`:

  - Input sent to AI model defined by `aiModel`, `aiPrompt`, `aiReferenceImagePaths`.

---

## 3. `experienceItems` subcollection

**Path:** `/events/{eventId}/experienceItems/{itemId}`

### Type

```ts
type ExperienceItemKind = "wheel_sector" | "choice" | "reward" | "generic";

type ExperienceItem = {
  id: string;
  eventId: string;
  experienceId: string;

  kind: ExperienceItemKind;

  label: string; // shown to guest
  value?: string; // machine-readable: tag, code, URL, etc.

  // For random/weighted selection (wheel etc.)
  weight?: number; // default: 1 if omitted

  // UI ordering (e.g. wheel position, list order)
  order?: number;

  // Lightweight extension point
  meta?: Record<string, unknown>;

  createdAt: number;
  updatedAt: number;
};
```

### Behaviour / acceptance criteria

- For `Experience.type === "wheel"`:

  - At least one `ExperienceItem` with `kind === "wheel_sector"` must exist.
  - `weight` defines selection probability (normalized by total weight).
  - `order` can be used to render segments around the circle.

- `value` and/or `meta` define outcome meaning:

  - e.g. `"experience:exp_neon"`, `"tag:vip"`, `"url:https://..."`.

- Other future experiences (e.g. multi-choice pickers) can reuse this collection with different `kind` values.

---

## 4. `sessions` subcollection

**Path:** `/events/{eventId}/sessions/{sessionId}`

### Type

```ts
type SessionState = "created" | "processing" | "ready" | "error";
type InputType = "photo" | "video" | "gif";
type OutputMediaType = "image" | "video" | "gif";

type Session = {
  id: string;
  eventId: string;
  experienceId: string;
  userId?: string | null; // optional authenticated user

  // Lifecycle
  state: SessionState;
  errorCode?: string; // short code, e.g. "AI_TIMEOUT"

  // Capture input (no GIF input, only multi-photo)
  inputType: InputType;
  inputImagePaths?: string[]; // 1 for photo, >1 for gif
  inputVideoPath?: string; // for video

  // Output media
  outputMediaType?: OutputMediaType;
  outputMediaPath?: string;
  outputThumbnailPath?: string;

  // Outcome from experienceItems (e.g. wheel result)
  experienceItemId?: string | null;
  experienceItemLabel?: string | null;

  // Survey status for this session
  surveyCompleted: boolean;
  surveySkipped: boolean;

  // Share summary (counters only)
  shareDownloadCount: number;
  shareEmailCount: number;
  shareSocialCount: number;
  shareSystemCount: number;
  lastSharedAt?: number;

  createdAt: number;
  updatedAt: number;
};
```

### Behaviour / acceptance criteria

- `state`:

  - `"created"`: session initialized, input not yet fully captured.
  - `"processing"`: capture done, AI/overlay pipeline running.
  - `"ready"`: `outputMediaPath` available.
  - `"error"`: something went wrong; `errorCode` is set.

- Input rules:

  - If `inputType === "photo"` → `inputImagePaths` must exist and have exactly 1 item.
  - If `inputType === "multi_photo"` → `inputImagePaths` must exist and have ≥ 2 items.
  - If `inputType === "video"` → `inputVideoPath` must exist.

- Output rules:

  - `outputMediaType` must be consistent with actual media (`image`/`video`/`gif`).
  - If `state === "ready"` → `outputMediaPath` must be defined.

- Survey per session:

  - `surveyCompleted`/`surveySkipped` reflect only **this session’s** behaviour.
  - Global “don’t show survey again” logic is handled via `participants`, not sessions alone.

- Share counters:

  - Incremented by backend or client when `Share` docs are created/processed.
  - Used for fast per-session share stats without querying `shares`.

---

## 5. `shares` subcollection

**Path:** `/events/{eventId}/shares/{shareId}`

### Type

```ts
type ShareChannel =
  | "download"
  | "email"
  | "system"
  | "instagram"
  | "tiktok"
  | "facebook"
  | "x"
  | "whatsapp"
  | "custom";

type ShareStatus = "pending" | "sent" | "failed";

type Share = {
  id: string;
  eventId: string;
  sessionId: string;
  experienceId: string;
  userId?: string | null;

  channel: ShareChannel;
  target?: string; // e.g. email address, phone, or label

  status: ShareStatus;
  errorCode?: string; // if failed, e.g. "SMTP_ERROR"

  openCount: number;
  lastOpenedAt?: number;

  createdAt: number;
  processedAt?: number;
};
```

### Behaviour / acceptance criteria

- `status` / `processedAt`:

  - For instant local actions (`download`, `system`), you can set `status = "sent"` immediately.
  - For background operations (`email`, some `custom`), a worker:

    - Reads `pending` shares,
    - Attempts sending,
    - Sets `status` to `"sent"` or `"failed"` and fills `processedAt`.

- Reach / opens:

  - Each share link contains its `shareId` and hits a tracking endpoint.
  - On open:

    - Increment `openCount`.
    - Update `lastOpenedAt`.

- Optionally, a Cloud Function can also increment event-level reach counters if you add them later.

---

## 6. `surveySteps` subcollection

**Path:** `/events/{eventId}/surveySteps/{stepId}`

### Type

```ts
type SurveyStepType =
  | "short_text"
  | "long_text"
  | "multiple_choice"
  | "opinion_scale"
  | "email"
  | "statement";

type SurveyStep = {
  id: string;
  eventId: string;

  type: SurveyStepType;

  title?: string;
  description?: string;

  // Common config
  placeholder?: string;

  // Multiple choice
  options?: string[];
  allowMultiple?: boolean;

  // Opinion scale
  scaleMin?: number; // e.g. 1
  scaleMax?: number; // e.g. 5 or 10

  // Validation
  required?: boolean; // step-level requirement

  createdAt: number;
  updatedAt: number;
};
```

### Behaviour / acceptance criteria

- Order is **not** stored on the step; it lives in `event.surveyStepsOrder`.
- When rendering:

  - Fetch all steps for the event.
  - Sort by `surveyStepsOrder`.
  - If additional steps exist that aren’t in `surveyStepsOrder` (edge cases), they can be appended or ignored – but builder should keep them in sync.

- `surveyStepsCount` must always match the number of step documents (maintained by backend/builder).
- If `type === "multiple_choice"`:

  - `options` must exist and have at least 1 value.

- If `type === "opinion_scale"`:

  - Both `scaleMin` and `scaleMax` must be defined, and `scaleMin < scaleMax`.

---

## 7. `surveyResponses` subcollection

**Path:** `/events/{eventId}/surveyResponses/{responseId}`

### Type

```ts
type SurveyResponse = {
  id: string;
  eventId: string;
  sessionId: string;
  experienceId: string | null;

  stepId: string;
  surveyVersion: number;
  type: SurveyStepType;

  // Primary answer:
  // - short_text / long_text / email / statement → string
  // - multiple_choice (single) → string
  // - opinion_scale → number
  value: string | number | null;

  // For multiple_choice with multiple answers
  valueOptions?: string[];

  createdAt: number;
};
```

### Behaviour / acceptance criteria

- Each document is **one answer to one step**:

  - 1 survey completion with N steps → N `surveyResponses` docs.

- `surveyVersion` must match the `Event.surveyVersion` at the time of answering:

  - Allows you to segment analytics by survey version.

- Analytics:

  - To aggregate responses for a question:

    - Query by `eventId` + `stepId`.
    - Use `type` to interpret `value` correctly.

  - For multi-select:

    - Use `valueOptions` (or `[value]` if single-select with `valueOptions` undefined).

---

## 8. `participants` subcollection

**Path:** `/events/{eventId}/participants/{participantId}`

You can choose `participantId` to be `userId` (for authenticated users) or some generated id if you later support anonymous tracking. For now, assume authenticated users.

### Type

```ts
type Participant = {
  id: string; // usually same as userId
  eventId: string;
  userId: string;

  firstSeenAt: number;
  lastSeenAt: number;

  // Whether this user has ever completed the survey for this event
  surveyCompleted: boolean;
  lastSurveySessionId?: string;

  lastSessionId?: string;
  sessionsCount: number;
};
```

### Behaviour / acceptance criteria

- There is at most **one `Participant` per (eventId, userId)**.
- On each session by an authenticated user:

  - If participant doesn’t exist → create with `firstSeenAt = now`.
  - Always update `lastSeenAt`, `lastSessionId`, increment `sessionsCount`.
  - If session has `surveyCompleted === true` → set `surveyCompleted = true` and `lastSurveySessionId = sessionId`.

- When starting a new session:

  - If event-level `surveyEnabled === true && surveyRequired === true`:

    - Check `Participant.surveyCompleted`.
    - If `true`, skip survey for this user on subsequent sessions.

- This gives you **confident global survey-completion logic per user per event**, not just per session.
