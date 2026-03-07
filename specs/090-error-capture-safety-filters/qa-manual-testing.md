# QA Manual Testing: 090 — Error Capture & Safety Filters

Manual QA checklist for verifying that AI safety filter errors are correctly captured, stored, and surfaced to guests.

---

## Prerequisites

- Access to a deployed environment (staging or preview branch)
- Firebase Console access for Firestore inspection
- An experience configured with **AI Image** or **AI Video** outcome type
- A published experience with a shareable guest link

---

## 1. Image Safety Filter Triggers

### 1.1 Prompt-Level Block (checkPromptBlocked)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Create/edit an AI Image experience with a prompt likely to trigger safety filters (e.g., explicit violence, hate speech) | Prompt saves normally |
| 2 | As a guest, upload a photo and submit | Job transitions to `running`, then `failed` |
| 3 | Check Firestore `jobs/{jobId}` document | `error.code` = `SAFETY_FILTERED`, `error.metadata.blockReason` is set |
| 4 | Check the share page | Guest sees a user-friendly error message (not raw error details) |

### 1.2 Candidate-Level Block (throwNoImageError — finishReason=SAFETY)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Use a prompt that passes initial screening but generates unsafe content | Job fails after generation attempt |
| 2 | Check Firestore `jobs/{jobId}` document | `error.code` = `SAFETY_FILTERED`, `error.metadata.finishReason` = `SAFETY` |
| 3 | If `safetyRatings` are present in metadata | Only blocked ratings (where `blocked=true`) are included |

### 1.3 Successful Image Generation (Control)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Use a safe, well-formed prompt (e.g., "A person in a sunny park") | Job completes successfully |
| 2 | Check Firestore `jobs/{jobId}` document | `status` = `completed`, `error` = `null`, `output` is populated |
| 3 | Check the share page | Guest sees the generated image |

---

## 2. Video Safety Filter Triggers

### 2.1 RAI Media Filter (extractVideoUri — no generated videos)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Create an AI Video experience with a prompt likely to trigger video safety filters | Prompt saves normally |
| 2 | As a guest, upload a photo and submit | Job transitions to `running`, then `failed` |
| 3 | Check Firestore `jobs/{jobId}` document | `error.code` = `SAFETY_FILTERED`, `error.metadata.raiMediaFilteredCount` > 0 |
| 4 | Check `error.metadata.raiMediaFilteredReasons` | Array of filter reason strings |

### 2.2 Veo API Error (non-safety)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Trigger a non-safety Veo error (e.g., invalid model, bad input) | Job fails |
| 2 | Check Firestore `jobs/{jobId}` document | `error.code` = `PROCESSING_FAILED` (not `SAFETY_FILTERED`) |

### 2.3 Successful Video Generation (Control)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Use a safe prompt with valid source image | Job completes successfully |
| 2 | Check the share page | Guest sees the generated video with playback |

---

## 3. Firestore Verification

For any failed job, verify these fields in the `jobs/{jobId}` document:

| Field | Expected |
|-------|----------|
| `status` | `failed` |
| `error.code` | One of: `SAFETY_FILTERED`, `PROCESSING_FAILED`, `API_ERROR`, etc. |
| `error.message` | Human-readable, does NOT contain internal details (prompts, file paths, stack traces) |
| `error.step` | `outcome` (for AI generation failures) or `restart-guard` |
| `error.isRetryable` | `false` |
| `error.timestamp` | Positive integer (epoch ms) |
| `error.metadata` | Object with filter details (for `SAFETY_FILTERED`) or `null` |

Also verify the parent **session** document:

| Field | Expected |
|-------|----------|
| `jobStatus` | `failed` |
| `jobError.code` | Matches `jobs/{jobId}.error.code` |
| `jobError.message` | Matches `jobs/{jobId}.error.message` |

---

## 4. Frontend Verification (Share Page)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Navigate to the share page for a session with a failed job | Error state is displayed |
| 2 | Verify error message text | User-friendly message (e.g., "Content was blocked by safety filters.") |
| 3 | Verify NO internal details are exposed | No prompt text, no model name, no stack traces, no file paths |
| 4 | Verify the page remains functional | No broken layout, navigation still works |

---

## 5. Non-Safety Error Paths

### 5.1 Generic Processing Error

| Step | Action | Expected |
|------|--------|----------|
| 1 | Trigger a non-safety error (e.g., corrupt input image, storage failure) | Job fails |
| 2 | Check `error.code` | `PROCESSING_FAILED` |
| 3 | Check `error.message` | Sanitized: "An error occurred while processing your request." |
| 4 | Check `error.metadata` | `null` (no special metadata for generic errors) |

### 5.2 OutcomeError

| Step | Action | Expected |
|------|--------|----------|
| 1 | Trigger an outcome-specific error (e.g., missing capture step) | Job fails |
| 2 | Check `error.code` | Matches the OutcomeError code |
| 3 | Check `error.step` | `outcome` |

---

## 6. Edge Cases

### 6.1 Restart Guard (OOM Recovery)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Simulate a job that crashes twice (exceeds `attemptCount >= 2`) | Job fails on second restart |
| 2 | Check `error.code` | `PROCESSING_FAILED` |
| 3 | Check `error.step` | `restart-guard` |
| 4 | Verify session is updated | `jobStatus` = `failed` |

### 6.2 Already-Completed Job Guard

| Step | Action | Expected |
|------|--------|----------|
| 1 | If a duplicate task delivery arrives for a completed job | Handler skips silently (logs info, does not overwrite) |
| 2 | Check Firestore | Job document remains `completed`, output is preserved |

### 6.3 Already-Failed Job Guard

| Step | Action | Expected |
|------|--------|----------|
| 1 | If a duplicate task delivery arrives for a failed job | Handler skips silently |
| 2 | Check Firestore | Job document remains `failed`, error is preserved |

---

## Sign-Off

| Tester | Date | Environment | Pass/Fail | Notes |
|--------|------|-------------|-----------|-------|
| | | | | |
