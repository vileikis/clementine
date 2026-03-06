## Brief: Error Capture & Safety Filter Reporting

**Objective**
Improve error visibility across the AI generation pipeline by capturing safety filter reasons from Google APIs, propagating meaningful error details to the job and session documents, and surfacing actionable error messages to the guest-facing share page.

---

### Issue 1: Safety Filter Reason Capture

**Context**
Both `aiGenerateVideo.ts` and `aiGenerateImage.ts` can fail silently when Google's safety filters block content. In `extractVideoUri`, an empty `generatedVideos` response is treated as "Video was filtered by safety policy" with no detail. The Veo API provides `operation.response?.raiMediaFilteredCount` and `operation.response?.raiMediaFilteredReasons` which are currently ignored. Image generation via Gemini can also be filtered (empty candidates), and similar reason data may be available.

**Acceptance Criteria**

- **Video generation**: When `generatedVideos` is empty or filtered, read `raiMediaFilteredCount` and `raiMediaFilteredReasons` from the operation response. Include these in the thrown error message so they appear in Cloud Function logs.
- **Image generation**: When `extractImageFromResponse` finds no candidates or no image data, capture any available safety/filter metadata from the Gemini response and include it in the error.
- **Structured error propagation**: Introduce a new error code (e.g. `SAFETY_FILTERED`) in `SANITIZED_ERROR_MESSAGES` in `functions/src/repositories/job.ts`. When a safety filter is detected, use this code instead of generic `PROCESSING_FAILED`.
- **Job document**: The `jobErrorSchema` already has `code`, `message`, and `step`. The filter reasons should be stored in the job error so they are queryable. Consider adding an optional `details` field to `jobErrorSchema` in `packages/shared` (e.g. `details: z.record(z.unknown()).nullable().default(null)`) to hold structured metadata like `raiMediaFilteredReasons` without leaking to the guest.

---

### Issue 2: Meaningful Error Propagation to Job & Session

**Context**
In `transformPipelineTask.ts`, `handleJobFailure` always calls `createSanitizedError('PROCESSING_FAILED', 'outcome')` regardless of what actually went wrong. The real error is only logged, not stored. The session gets `jobStatus: 'failed'` with no error data at all (`updateSessionJobStatus` only writes `jobId` and `jobStatus`).

**Acceptance Criteria**

- **Job error codes**: `handleJobFailure` should inspect the caught error and map it to an appropriate code:
  - `SAFETY_FILTERED` — content blocked by safety filters
  - `AI_MODEL_ERROR` — API errors (429, 503, timeouts)
  - `PROCESSING_FAILED` — general pipeline failures
  - Existing codes (`TIMEOUT`, `STORAGE_ERROR`, etc.) where applicable
- **Session error data**: Add an optional `jobErrorCode` field (or similar) to the session schema (`packages/shared/src/schemas/session/session.schema.ts`) so the frontend can distinguish error types without fetching the job document. Update `updateSessionJobStatus` in `functions/src/repositories/session.ts` to accept and write this field when the status is `failed`.
- **Preserve logging**: Continue logging the full error stack to Cloud Functions logs for debugging. The job/session documents should only contain the sanitized error code and user-safe message.

---

### Issue 3: Guest-Facing Error Display

**Context**
`SharePage.tsx` shows a generic "Something went wrong" / "We couldn't process your image" for all failure states. With error codes now available on the session, we can show more helpful messages.

**Acceptance Criteria**

- **Read error code from session**: The share page should read the new `jobErrorCode` (or equivalent) from the session document.
- **Differentiated messages**: Map error codes to guest-friendly copy:
  - `SAFETY_FILTERED` — "Your photo couldn't be processed because it didn't meet our content guidelines. Please try a different photo."
  - `TIMEOUT` — "Processing took longer than expected. Please try again."
  - Default — "Something went wrong. Please try again." (current behavior)
- **No technical details exposed**: Error messages shown to guests must never include filter reasons, API error details, or internal codes.

---

### Files to Touch

**Backend (`functions/`)**
- `src/services/transform/operations/aiGenerateVideo.ts` — capture RAI filter data in `extractVideoUri`
- `src/services/transform/operations/aiGenerateImage.ts` — capture filter data in `extractImageFromResponse`
- `src/repositories/job.ts` — add `SAFETY_FILTERED` error code, update `createSanitizedError` to accept optional details
- `src/tasks/transformPipelineTask.ts` — map errors to appropriate codes in `handleJobFailure`
- `src/repositories/session.ts` — extend `updateSessionJobStatus` to write error code on failure

**Shared (`packages/shared/`)**
- `src/schemas/job/job.schema.ts` — add optional `details` field to `jobErrorSchema`
- `src/schemas/session/session.schema.ts` — add optional `jobErrorCode` field

**Frontend (`apps/clementine-app/`)**
- `src/domains/guest/containers/SharePage.tsx` — read error code, show differentiated messages
