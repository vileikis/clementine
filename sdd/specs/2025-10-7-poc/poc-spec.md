# Clementine — POC Spec v0.2 (Unified)

## 0) Scope & Goal

**Goal:** Ship an end-to-end:

> **Organizer creates event → configures scene → shares link/QR → Guest joins → captures photo → AI transform → shares result**

**POC Constraints**

- No auth.
- Organizer UI is open (optionally gated by shared admin key).
- Guest joins via link or QR.
- **Only Photo mode**; Video/GIF/Boomerang visible, disabled.
- **AI effects:** `background_swap` or `deep_fake` (one active scene).
- Supports **one reference image per scene**.
- Branding: event title overlay + brand color (theming).
- Sharing: public result link + QR.
- Core infra:

  - **Next.js 16, React 19, Tailwind, shadcn/ui, Vercel**
  - **Firebase:** Firestore + Storage
  - Optional (for analytics later): BigQuery (via export/events).

---

## 1) Roles & Flows

### Roles

**Organizer (no login in POC)**

- Create event.
- Configure **scene** (mode, effect, prompt, reference image).
- Configure branding.
- Get join link + QR.
- (Future) View gallery + stats.

**Guest**

- Scan QR / open join link.
- Give camera permission.
- Capture photo (3–2–1).
- Wait for AI transform.
- See result, Retake, or Share.

---

### Guest Happy Path (Single Session)

1. Open `/join/:eventId`
2. See greeting with event title & branding.
3. Allow camera → live preview.
4. Tap **Start** → 3–2–1 → capture.
5. Upload input → create `session` tied to **currentSceneId**.
6. Backend calls AI (Nano Banana or mock) → writes `resultImagePath`.
7. Show result:

   - **Retake** → new session (or reuse) from capture step.
   - **Next** → Share screen.

8. Share:

   - Copy link to result.
   - Show result QR.
   - **Close** → back to greeting.

---

## 2) Data Model (Firestore)

Top-level: all event-scoped data lives under `/events/{eventId}` with **flat subcollections**:

- `/events/{eventId}/scenes`
- `/events/{eventId}/sessions`
- `/events/{eventId}/media`
- `/events/{eventId}/stats`

No deep nesting.

### 2.1 `events/{eventId}`

```json
{
  "id": "auto",
  "title": "Clementine Launch Pop-up",
  "brandColor": "#0EA5E9",
  "showTitleOverlay": true,

  "status": "live", // "draft" | "live" | "archived"
  "currentSceneId": "sc_001", // FK to /events/{eventId}/scenes/{sceneId}

  "joinPath": "/join/abc123",
  "joinUrl": "https://clementine.app/join/abc123",
  "qrPngPath": "events/abc123/qr/join.png",

  "createdAt": 1730899200000,
  "updatedAt": 1730899300000
}
```

**Notes**

- One **active** scene per event via `currentSceneId`.
- All organizer UI reads from this + its scene.

---

### 2.2 `events/{eventId}/scenes/{sceneId}`

Represents **one version** of the creative setup.
POC: you can treat it as “the” scene; versioning is ready when needed.

```json
{
  "id": "sc_001",
  "label": "Default Scene v1",
  "mode": "photo", // POC: only "photo"
  "effect": "background_swap", // "background_swap" | "deep_fake"

  "prompt": "Apply clean studio background with brand color accents.",
  "defaultPrompt": "Apply clean studio background with brand color accents.",

  "referenceImagePath": "events/abc123/refs/bg.jpg", // optional

  "flags": {
    "customTextTool": false,
    "stickersTool": false
  },

  "status": "active", // "active" | "deprecated"
  "createdAt": 1730899200000,
  "updatedAt": 1730899200000
}
```

**Behavior**

- Organizer edits scene (effect, prompt, reference image).
- To “version” later: create new scene doc + set `currentSceneId`; old sessions still point at old scene.

---

### 2.3 `events/{eventId}/sessions/{sessionId}`

One **guest run** through capture/transform/share.

```json
{
  "id": "sess_001",
  "eventId": "abc123", // duplicated for convenience
  "sceneId": "sc_001", // snapshot pointer

  "state": "ready", // "created" | "captured" | "transforming" | "ready" | "error"

  "inputImagePath": "events/abc123/sessions/sess_001/input.jpg",
  "resultImagePath": "events/abc123/sessions/sess_001/result.jpg",

  "error": null,

  "createdAt": 1730899255000,
  "updatedAt": 1730899278000
}
```

**Notes**

- Anonymous. No PII.
- Drives gallery + analytics later.

---

### 2.4 `events/{eventId}/media/{mediaId}` (Future/Gallery-ready)

Each **final asset** (currently mapped 1:1 to sessions with result).

```json
{
  "id": "m_001",
  "sessionId": "sess_001",
  "sceneId": "sc_001",
  "resultImagePath": "events/abc123/sessions/sess_001/result.jpg",
  "createdAt": 1730899278000,
  "width": 1080,
  "height": 1350,
  "sizeBytes": 234567
}
```

Use this collection for:

- Gallery list
- Bulk export / top photos
- Collection group queries across events if needed

(POC can skip writing this and just use `sessions`, or write both—it’s low effort.)

---

### 2.5 `events/{eventId}/stats/*` (Precomputed, Optional)

Materialized aggregates to keep dashboards snappy.

**`/stats/overview`**

```json
{
  "sessions": 120,
  "captures": 120,
  "transforms": 115,
  "shares": 60,
  "downloads": 40,
  "uniqueGuests": 110,

  "captureRate": 0.8,
  "transformSuccessRate": 0.95,
  "shareRate": 0.5,

  "topMedia": [
    {
      "mediaId": "m_001",
      "sessionId": "sess_001",
      "resultImagePath": "events/abc123/sessions/sess_001/result.jpg",
      "score": 12,
      "shares": 5,
      "downloads": 3,
      "views": 4
    }
  ],

  "updatedAt": 1730900000000
}
```

**`/stats/timeHeatmap`**: buckets by hour or minute as needed.

POC: structure now, compute later via Cloud Function / BigQuery.

---

## 3) Firebase Storage Layout

```text
events/{eventId}/refs/{file}                    // scene reference image(s)
events/{eventId}/sessions/{sessionId}/input.jpg
events/{eventId}/sessions/{sessionId}/result.jpg
events/{eventId}/qr/join.png
```

(If using `media`, just point to the `result.jpg` paths.)

---

## 4) Security (POC)

POC = wide open, **NOT** for production.

Firestore (dev):

- Allow read/write on `events`, `scenes`, `sessions` (and `media`, `stats` if present).

Storage (dev):

- Allow read/write within `events/*`.

Add optional `POC_ADMIN_KEY` check in server actions for **event creation & config** to avoid drive-by griefing in semi-public demos.

Tighten later with:

- RLS-style rules per event.
- Restrict writes to server-side only for transforms & stats.

---

## 5) Routes & Pages (Next.js App Router)

### Organizer

- `/events`

  - List of events (title, status, joinUrl, quick actions).

- `/events/new`

  - Create event: `title`, `brandColor`, `showTitleOverlay`.
  - On submit:

    - Create event.
    - Create default scene (`sc_001`) with **photo + background_swap + defaultPrompt**.

- `/events/[eventId]`

  - Tabs:

    1. **Scene**

       - Mode selector: show `Photo` active, others disabled.
       - Effect picker: `background_swap`, `deep_fake`.
       - Prompt editor + “reset to default”.
       - Reference image uploader (1 file).

    2. **Branding**

       - Title overlay toggle.
       - Brand color picker with live preview.

    3. **Distribution**

       - Show join URL.
       - Show QR (load from Storage or generate on demand).
       - “Open guest view” button (`/join/:eventId` in new tab).

    4. _(Optional later)_ **Gallery**
    5. _(Optional later)_ **Analytics**

### Guest

- `/join/[eventId]`

  - Greeting → Camera permission → Capture → Transform → Review → Share.

- `/s/[sessionId]` (optional redirect)

  - 302 → public result URL in Storage (tokenized).
  - Used for prettier share links.

---

## 6) Components (shadcn/ui + Tailwind)

Organizer:

- `EventCard`
- `EventForm`
- `SceneForm` (Mode, EffectPicker, PromptEditor, RefImageUploader)
- `BrandingForm` (BrandColorPicker, TitleOverlayToggle, Preview)
- `QRPanel`

Guest:

- `BrandThemeProvider` (injects `--brand` from event)
- `GreetingScreen`
- `CameraView`
- `Countdown` (3–2–1)
- `CaptureButton`
- `RetakeButton`
- `NextButton`
- `ResultViewer` (with skeleton while transforming)
- `SharePanel` (copy link, QR, Web Share API if available)
- Simple **error banners** for denied camera / failed transform.

---

## 7) Theming

- Base: light theme, shadcn defaults.
- On `/join/:eventId`:

  - Fetch event.
  - Apply `brandColor` to CSS var `--brand`.
  - Use `--brand` for primary buttons, links, accents.

- Organizer previews use exact same theme logic (shared provider).

---

## 8) AI Integration (Nano Banana Adapter)

Single integration surface, swappable later.

```ts
export type TransformParams = {
  effect: "background_swap" | "deep_fake";
  prompt: string;
  inputImageUrl: string; // signed URL
  referenceImageUrl?: string;
  brandColor?: string;
};

export async function transformWithNanoBanana(
  params: TransformParams
): Promise<Buffer>; // or Uint8Array/Blob
```

**Flow**

1. Guest capture → upload to Storage.
2. Server action:

   - Creates/updates `session` → `state: "transforming"`.
   - Generates signed URLs.
   - Calls Nano Banana (or future model) according to `effect`.
   - On success: uploads `result.jpg` → sets `session.state = "ready"` + `resultImagePath`.
   - On error: `state = "error"`, set `error` message (simple string).

3. Guest polls or subscribes to session until `ready`.

**Dev mode**

- Mock transform: take input, overlay colored tint/text to prove pipeline.

---

## 9) Server Actions / Repos

Group calls behind a small data-access layer.

**Events**

- `createEvent({ title, brandColor, showTitleOverlay }) → eventId`

  - Also creates default scene.

- `listEvents() → Event[]`
- `getEvent(eventId) → Event`
- `updateEventBranding(eventId, { brandColor, showTitleOverlay })`
- `getCurrentScene(eventId) → Scene`

**Scenes**

- `updateScene(eventId, sceneId, { effect, prompt, referenceImagePath })`
- (Later) `createScene(eventId, payload)` & `setCurrentScene(eventId, sceneId)`

**Sessions**

- `startSession(eventId) → sessionId`
- `saveCapture(eventId, sessionId, file) → inputImagePath`
- `triggerTransform(eventId, sessionId) → { state, resultImagePath }`
- `getSession(eventId, sessionId) → Session`

**QR & Share**

- `createJoinQr(eventId) → qrPngPath`
- `getShareLink(sessionId) → /s/:sessionId` (redirect handler → Storage URL)

Optional: add `logEvent()` to support analytics later (shares, views, downloads).

---

## 10) Guest State Machine (Authoritative)

```txt
GREETING
  → CAMERA_PERMISSION_GRANTED? yes → READY_TO_CAPTURE
  → no → PERMISSION_ERROR

READY_TO_CAPTURE
  → START → COUNTDOWN

COUNTDOWN
  → SNAP → CAPTURED

CAPTURED
  → SAVE_INPUT → TRANSFORMING
  → RETAKE → READY_TO_CAPTURE

TRANSFORMING
  → SUCCESS → REVIEW_READY
  → FAIL → ERROR

REVIEW_READY
  → RETAKE → READY_TO_CAPTURE
  → NEXT → SHARE

SHARE
  → COPY_LINK | SHOW_QR
  → CLOSE → GREETING
```

`session.state` mirrors this machine on the backend.

---

## 11) Analytics & Gallery (Future-Ready)

Already baked into structure, even if POC doesn’t fully implement:

- Use `sessions` (and optional `media`) as source.
- Optionally log interactions (`event_logs`) to:

  - Firestore `event_logs` or directly to BigQuery.

- Periodic job / Cloud Function:

  - Compute overview metrics & top media.
  - Persist into `/events/{eventId}/stats/overview`, `/stats/timeHeatmap`, `/stats/daily`.

- Gallery page later:

  - Reads `/media` + `/stats/overview.topMedia`.

- Bulk download:

  - HTTP function zips `media.resultImagePath`s → returns signed URL.

All of this runs **without changing the app schema** defined above.

---

## 12) Acceptance Criteria (POC)

**Organizer**

- Create event with:

  - Title
  - Brand color
  - Title overlay toggle

- See join URL + QR for event.
- Configure scene:

  - Must see Photo as only active mode.
  - Can switch between `background_swap` / `deep_fake`.
  - Can edit prompt + reset.
  - Can upload a single reference image.

- Changes persist in `events` and `scenes`.

**Guest**

- Open join URL:

  - Sees event branding (title + colors).

- Camera permission:

  - On grant: live preview front camera.

- Capture:

  - 3–2–1 countdown.
  - Photo saved → session created.

- Transform:

  - Loader while processing.
  - Shows AI result using current scene config.

- Retake:

  - Returns to capture; new transform works.

- Share:

  - Copy link to result.
  - See QR for result (or join, depending on implementation).
  - Close → back to greeting.

**System**

- Data stored according to defined collections & paths.
- `currentSceneId` used consistently.
- Guest UI themed by `brandColor`.
- Runs on modern mobile Safari & Chrome.

---

## 13) Out of Scope (POC)

- Auth, roles, orgs, billing.
- Multi-scene switching UI.
- Video / GIF / Boomerang pipelines.
- Moderation & content filters.
- Full analytics dashboards (only structure prepared).
- Bulk exports & ZIP service (nice-to-have later).

---

If you’d like next, I can:

1. Turn this into **TypeScript types + `zod` schemas + repo stubs**, or
2. Generate a **concrete task checklist** you can drop into Linear/Jira for the first implementation loop.
