# Manual Testing Guide - processMedia Function

## Setup

```bash
# Terminal 1: Start emulators
pnpm functions:serve

# Terminal 2: Seed test data
pnpm functions:seed
```

Then open **Emulator UI**: http://localhost:4000

---

## ✅ POSITIVE TEST CASES

### Test 1: Single Image → Square Image

```bash
curl -X POST http://127.0.0.1:5003/clementine-7568d/europe-west1/processMedia \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-single-image",
    "outputFormat": "image",
    "aspectRatio": "square",
    "overlay": true
  }'
```

**Expected Response (200 OK):**

```json
{
  "success": true,
  "message": "Processing queued",
  "sessionId": "session-single-image",
  "outputFormat": "image",
  "aspectRatio": "square"
}
```

**Check in Emulator UI:**

- **Firestore** → `sessions/session-single-image`
  - Look for `processing` field (should be added)
  - `processing.state` should be `"pending"`
  - `processing.attemptNumber` should be `1`

---

### Test 2: Single Image → Story (9:16) Image

```bash
curl -X POST http://127.0.0.1:5003/clementine-7568d/europe-west1/processMedia \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-single-image",
    "outputFormat": "image",
    "aspectRatio": "story",
    "overlay": true
  }'
```

**Expected Response (200 OK):**

```json
{
  "success": true,
  "message": "Processing queued",
  "sessionId": "session-single-image",
  "outputFormat": "image",
  "aspectRatio": "story"
}
```

**Check in Emulator UI:**

- Same as Test 1, verify `processing` field updated

---

### Test 3: Four Images → Square GIF

```bash
curl -X POST http://127.0.0.1:5003/clementine-7568d/europe-west1/processMedia \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-four-images",
    "outputFormat": "gif",
    "aspectRatio": "square"
  }'
```

**Expected Response (200 OK):**

```json
{
  "success": true,
  "message": "Processing queued",
  "sessionId": "session-four-images",
  "outputFormat": "gif",
  "aspectRatio": "square"
}
```

**Check in Emulator UI:**

- **Firestore** → `sessions/session-four-images`
  - Verify `inputAssets` array has 4 items
  - Verify `processing.state` = `"pending"`

---

### Test 4: Four Images → Story GIF

```bash
curl -X POST http://127.0.0.1:5003/clementine-7568d/europe-west1/processMedia \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-four-images",
    "outputFormat": "gif",
    "aspectRatio": "square",
    "overlay": true
  }'
```

```bash
curl -X POST http://127.0.0.1:5003/clementine-7568d/europe-west1/processMedia \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-four-images",
    "outputFormat": "gif",
    "aspectRatio": "story",
    "overlay": true
  }'
```

**Expected Response (200 OK):**

- Same structure as Test 3

---

### Test 5: All Images (12) → Square Video

```bash
curl -X POST http://127.0.0.1:5003/clementine-7568d/europe-west1/processMedia \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-all-images",
    "outputFormat": "video",
    "aspectRatio": "square"
  }'
```

**Expected Response (200 OK):**

```json
{
  "success": true,
  "message": "Processing queued",
  "sessionId": "session-all-images",
  "outputFormat": "video",
  "aspectRatio": "square"
}
```

**Check in Emulator UI:**

- **Firestore** → `sessions/session-all-images`
  - Verify `inputAssets` array has 12 items
  - Verify `processing.state` = `"pending"`

---

### Test 6: All Images → Story Video

```bash
curl -X POST http://127.0.0.1:5003/clementine-7568d/europe-west1/processMedia \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-all-images",
    "outputFormat": "video",
    "aspectRatio": "story"
  }'
```

**Expected Response (200 OK):**

- Same structure as Test 5

---

### Test 6.1: Single Image with AI Transform → Square Image

```bash
curl -X POST http://127.0.0.1:5003/clementine-7568d/europe-west1/processMedia \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-single-image",
    "outputFormat": "image",
    "aspectRatio": "square",
    "overlay": true,
    "aiTransform": true
  }'
```

**Expected Response (200 OK):**

```json
{
  "success": true,
  "message": "Processing queued",
  "sessionId": "session-single-image",
  "outputFormat": "image",
  "aspectRatio": "square",
  "overlay": true,
  "aiTransform": true
}
```

**Check in Emulator UI:**

- **Firestore** → `sessions/session-single-image`
  - `processing.state` should progress through: `pending` → `initializing` → `downloading` → `ai-transform` → `processing` → `uploading` → `completed`
- **Logs**: Look for AI transformation logs
  - `[AI Transform] Starting transformation`
  - `[AI Transform] Reference images loaded`
  - `[AI Transform] Transformation completed`

---

### Test 6.2: GIF with AI Transform (Should Skip AI Transform)

```bash
curl -X POST http://127.0.0.1:5003/clementine-7568d/europe-west1/processMedia \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-four-images",
    "outputFormat": "gif",
    "aspectRatio": "square",
    "aiTransform": true
  }'
```

**Expected Response (200 OK):**

```json
{
  "success": true,
  "message": "Processing queued",
  "sessionId": "session-four-images",
  "outputFormat": "gif",
  "aspectRatio": "square",
  "overlay": false,
  "aiTransform": true
}
```

**Check in Logs:**

- Should see warning: `[GIF Pipeline] AI transform not supported for GIF format`
- GIF processing continues normally without AI transformation
- No `ai-transform` state in processing lifecycle

---

### Test 6.3: AI Transform with Overlay Combination

```bash
curl -X POST http://127.0.0.1:5003/clementine-7568d/europe-west1/processMedia \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-single-image",
    "outputFormat": "image",
    "aspectRatio": "story",
    "overlay": true,
    "aiTransform": true
  }'
```

**Expected Behavior:**

- AI transformation applied first
- Overlay applied to AI-transformed image
- Both transformations visible in final output

---

## ❌ NEGATIVE TEST CASES

### Test 7: Session Not Found

```bash
curl -X POST http://127.0.0.1:5003/clementine-7568d/europe-west1/processMedia \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "non-existent-session-id",
    "outputFormat": "image",
    "aspectRatio": "square"
  }'
```

**Expected Response (404 Not Found):**

```json
{
  "error": "Session not found"
}
```

**Check in Emulator UI:**

- **Firestore** → Verify `sessions/non-existent-session-id` does NOT exist

---

### Test 8: Empty sessionId

```bash
curl -X POST http://127.0.0.1:5003/clementine-7568d/europe-west1/processMedia \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "",
    "outputFormat": "image",
    "aspectRatio": "square"
  }'
```

**Expected Response (400 Bad Request):**

```json
{
  "error": "Invalid request",
  "details": [
    {
      "code": "too_small",
      "message": "sessionId is required",
      "path": ["sessionId"]
    }
  ]
}
```

---

### Test 9: Invalid outputFormat

```bash
curl -X POST http://127.0.0.1:5003/clementine-7568d/europe-west1/processMedia \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-single-image",
    "outputFormat": "invalid-format",
    "aspectRatio": "square"
  }'
```

**Expected Response (400 Bad Request):**

```json
{
  "error": "Invalid request",
  "details": [
    {
      "code": "invalid_enum_value",
      "message": "Invalid enum value. Expected 'image' | 'gif' | 'video'",
      "path": ["outputFormat"]
    }
  ]
}
```

---

### Test 10: Invalid aspectRatio

```bash
curl -X POST http://127.0.0.1:5003/clementine-7568d/europe-west1/processMedia \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-single-image",
    "outputFormat": "image",
    "aspectRatio": "invalid-ratio"
  }'
```

**Expected Response (400 Bad Request):**

```json
{
  "error": "Invalid request",
  "details": [
    {
      "code": "invalid_enum_value",
      "message": "Invalid enum value. Expected 'square' | 'story'",
      "path": ["aspectRatio"]
    }
  ]
}
```

---

### Test 11: Missing outputFormat

```bash
curl -X POST http://127.0.0.1:5003/clementine-7568d/europe-west1/processMedia \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-single-image",
    "aspectRatio": "square"
  }'
```

**Expected Response (400 Bad Request):**

```json
{
  "error": "Invalid request",
  "details": [
    {
      "code": "invalid_type",
      "message": "Required",
      "path": ["outputFormat"]
    }
  ]
}
```

---

### Test 12: Missing aspectRatio

```bash
curl -X POST http://127.0.0.1:5003/clementine-7568d/europe-west1/processMedia \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-single-image",
    "outputFormat": "image"
  }'
```

**Expected Response (400 Bad Request):**

```json
{
  "error": "Invalid request",
  "details": [
    {
      "code": "invalid_type",
      "message": "Required",
      "path": ["aspectRatio"]
    }
  ]
}
```

---

### Test 13: Wrong HTTP Method (GET instead of POST)

```bash
curl -X GET http://127.0.0.1:5003/clementine-7568d/europe-west1/processMedia
```

**Expected Response (405 Method Not Allowed):**

```json
{
  "error": "Method not allowed"
}
```

---

### Test 14: AI Transform with Missing API Key

**Setup:** Unset or remove `GOOGLE_AI_API_KEY` environment variable

```bash
curl -X POST http://127.0.0.1:5003/clementine-7568d/europe-west1/processMedia \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-single-image",
    "outputFormat": "image",
    "aspectRatio": "square",
    "aiTransform": true
  }'
```

**Expected Behavior:**

- Request queued successfully (200 OK)
- Processing fails during `ai-transform` state
- **Firestore** → `sessions/session-single-image`
  - `processing.state` = `"failed"`
  - `processing.errorCode` = `"AI_CONFIG_INVALID"`
  - `processing.errorMessage` contains "GOOGLE_AI_API_KEY"

---

### Test 15: AI Transform with Missing Reference Images

**Setup:** Delete reference images from Storage:
- `media/company-test-001/ai-reference/hobbit-costume.jpg`
- `media/company-test-001/ai-reference/black-magic-wand.jpg`

```bash
curl -X POST http://127.0.0.1:5003/clementine-7568d/europe-west1/processMedia \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-single-image",
    "outputFormat": "image",
    "aspectRatio": "square",
    "aiTransform": true
  }'
```

**Expected Behavior:**

- Request queued successfully (200 OK)
- Processing fails during `ai-transform` state
- **Firestore** → `sessions/session-single-image`
  - `processing.state` = `"failed"`
  - `processing.errorCode` = `"REFERENCE_IMAGE_NOT_FOUND"`
  - `processing.errorMessage` contains image path

---

## 📋 Testing Checklist

For each test, verify:

- [ ] HTTP response status code matches expected
- [ ] Response JSON structure matches expected
- [ ] In Firestore emulator UI:
  - [ ] Session document exists/doesn't exist as expected
  - [ ] `processing` field is added/updated correctly
  - [ ] `processing.state` is set to `"pending"` for successful requests
  - [ ] `processing.attemptNumber` increments correctly
- [ ] In Storage emulator UI:
  - [ ] Input assets exist at expected paths
  - [ ] No unexpected files created

## 🎯 Summary

| Category           | Count |
| ------------------ | ----- |
| **Positive Tests** | 9     |
| **Negative Tests** | 9     |
| **Total**          | 18    |

### Coverage:

- ✅ All 3 output formats (image, gif, video)
- ✅ Both aspect ratios (square, story)
- ✅ All 3 seeded sessions
- ✅ AI transformation (single image only)
- ✅ AI transform + overlay combination
- ✅ AI transform skip for GIF/video
- ✅ AI transform error scenarios (missing API key, missing reference images)
- ✅ Validation errors (missing/invalid fields)
- ✅ Not found errors
- ✅ Method not allowed
