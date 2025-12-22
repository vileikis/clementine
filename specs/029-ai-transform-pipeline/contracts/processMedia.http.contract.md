# API Contract: processMedia HTTP Endpoint

**Endpoint**: `POST /processMedia`
**Cloud Function**: `processMedia` (HTTP trigger)
**Region**: `europe-west1`

## Overview

HTTP endpoint to queue media processing jobs with optional AI transformation. Validates request, checks session exists, and enqueues Cloud Task for async processing.

## Request

### HTTP Method
`POST`

### Headers
```
Content-Type: application/json
```

### Body Schema

```json
{
  "sessionId": "string (required)",
  "outputFormat": "image" | "gif" | "video" (required),
  "aspectRatio": "square" | "story" (required),
  "overlay": boolean (optional, default: false),
  "aiTransform": boolean (optional, default: false)
}
```

### Field Descriptions

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| `sessionId` | string | Yes | - | Non-empty string | Firestore session document ID |
| `outputFormat` | enum | Yes | - | 'image', 'gif', 'video' | Desired output media format |
| `aspectRatio` | enum | Yes | - | 'square', 'story' | Output dimensions (square: 1:1, story: 9:16) |
| `overlay` | boolean | No | false | - | Apply overlay frame to output |
| `aiTransform` | boolean | No | false | - | **NEW**: Apply AI transformation before processing |

### Example Requests

**Minimal Request (No AI Transform)**:
```json
{
  "sessionId": "session-abc123",
  "outputFormat": "image",
  "aspectRatio": "square"
}
```

**Request with AI Transform**:
```json
{
  "sessionId": "session-abc123",
  "outputFormat": "image",
  "aspectRatio": "square",
  "overlay": true,
  "aiTransform": true
}
```

**Request with AI Transform for GIF (ignored)**:
```json
{
  "sessionId": "session-def456",
  "outputFormat": "gif",
  "aspectRatio": "square",
  "aiTransform": true
}
```
Note: `aiTransform` will be ignored for GIF output format (warning logged).

---

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Processing queued",
  "sessionId": "session-abc123",
  "outputFormat": "image",
  "aspectRatio": "square",
  "overlay": false,
  "aiTransform": true
}
```

### Error Responses

#### 400 Bad Request - Invalid Request Body
```json
{
  "error": "Invalid request",
  "details": [
    {
      "path": ["aiTransform"],
      "message": "Expected boolean, received string"
    }
  ]
}
```

**Trigger**: Zod validation fails (invalid types, missing required fields)

---

#### 400 Bad Request - Session Has No Input Assets
```json
{
  "error": "Session has no input assets"
}
```

**Trigger**: Session document exists but `inputAssets` array is empty

---

#### 404 Not Found - Session Not Found
```json
{
  "error": "Session not found"
}
```

**Trigger**: No session document exists at `/sessions/{sessionId}`

---

#### 405 Method Not Allowed
```json
{
  "error": "Method not allowed"
}
```

**Trigger**: HTTP method is not POST (e.g., GET, PUT, DELETE)

---

#### 409 Conflict - Session Already Processing
```json
{
  "error": "Session is already being processed"
}
```

**Trigger**: Session `processing.state` is not null (already queued or in progress)

---

#### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "Failed to enqueue Cloud Task: ..."
}
```

**Trigger**: Unexpected error (Cloud Task enqueue failure, Firestore error, etc.)

---

## Behavior

### AI Transform Logic

1. **Validation**: `aiTransform` flag is validated as boolean (optional, defaults to false)
2. **Queueing**: Flag is passed to Cloud Task payload unchanged
3. **Pipeline Routing**: processMediaJob handler reads flag and passes to appropriate pipeline
4. **Format-Specific Behavior**:
   - `outputFormat: 'image'` + `aiTransform: true` → AI transformation applied
   - `outputFormat: 'gif'` + `aiTransform: true` → AI transformation ignored (warning logged)
   - `outputFormat: 'video'` + `aiTransform: true` → AI transformation ignored (warning logged)

### Session State Updates

1. **Before queueing**: Session state marked as `pending` with attempt count incremented
2. **After queueing**: Cloud Task is enqueued with payload
3. **Async processing**: processMediaJob handler updates session state through lifecycle

---

## Rate Limits

None at HTTP endpoint level. Rate limiting handled by Cloud Tasks configuration:
- Max concurrent dispatches: 10
- Retry config: 0 max attempts (no retries)

---

## Authentication

**Current**: None (endpoint is public)
**Future**: Firebase Auth token required in Authorization header

---

## CORS

**Enabled**: `cors: true` in Cloud Function config
**Allowed Origins**: All origins (*)

---

## Example cURL Commands

### Basic Request with AI Transform
```bash
curl -X POST https://europe-west1-clementine-dev.cloudfunctions.net/processMedia \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-abc123",
    "outputFormat": "image",
    "aspectRatio": "square",
    "aiTransform": true
  }'
```

### Request with AI Transform + Overlay
```bash
curl -X POST https://europe-west1-clementine-dev.cloudfunctions.net/processMedia \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-abc123",
    "outputFormat": "image",
    "aspectRatio": "square",
    "overlay": true,
    "aiTransform": true
  }'
```

### Local Emulator Request
```bash
curl -X POST http://localhost:5001/clementine-dev/europe-west1/processMedia \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-abc123",
    "outputFormat": "image",
    "aspectRatio": "square",
    "aiTransform": true
  }'
```

---

## Change Summary

### What Changed
- Added `aiTransform` boolean field to request schema (optional, default: false)
- Response echoes `aiTransform` value in success response

### Backward Compatibility
- **Fully compatible**: Existing clients without `aiTransform` field work unchanged
- **Default behavior**: `aiTransform` defaults to false (no AI transformation)
- **No breaking changes**: All existing fields and validation unchanged

### Migration Required
**None**. Feature is opt-in via new field.
