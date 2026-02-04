# Data Model: Session Responses

**Feature**: 060-session-responses
**Date**: 2026-02-04

## Entities

### SessionResponse

A unified response to any experience step (input or capture).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `stepId` | string | Yes | Unique identifier of the step |
| `stepName` | string | Yes | Human-readable name from step definition |
| `stepType` | string | Yes | Step type (e.g., "input.shortText", "capture.photo") |
| `value` | string \| string[] \| null | No | Response value for input steps; null for captures |
| `context` | unknown \| null | No | Rich context data (MediaReference[] for captures, MultiSelectOption[] for multi-select) |
| `createdAt` | number | Yes | Unix timestamp (ms) when response was created |
| `updatedAt` | number | Yes | Unix timestamp (ms) when response was last updated |

**Validation Rules**:
- `stepId` must be non-empty string
- `stepName` must be non-empty string
- `stepType` must be valid step type from registry
- `value` is null for capture steps, populated for input steps
- `context` contains type-specific structured data
- Timestamps are positive integers (Unix ms)

### MediaReference

Reference to a captured media asset, stored in response `context` for capture steps.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `mediaAssetId` | string | Yes | Unique identifier of the media asset |
| `url` | string | Yes | Public URL for display |
| `filePath` | string | Yes | Storage path for Cloud Functions processing |
| `displayName` | string | Yes | Human-readable name (from step name) |

**Validation Rules**:
- All fields must be non-empty strings
- `url` should be a valid URL
- `filePath` should be a valid storage path

### MultiSelectOption (existing)

Option metadata for multi-select responses, stored in response `context`.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `value` | string | Yes | Option identifier |
| `promptFragment` | string \| null | No | Text for prompt expansion |
| `promptMedia` | unknown \| null | No | Media for prompt expansion |

## Session Schema Updates

### Current Schema (deprecated fields)

```typescript
sessionSchema = {
  // ... identity fields ...
  answers: Answer[]           // @deprecated - use responses
  capturedMedia: CapturedMedia[]  // @deprecated - use responses
  // ... other fields ...
}
```

### Updated Schema

```typescript
sessionSchema = {
  // ... identity fields ...

  /** @deprecated Use responses instead */
  answers: Answer[],

  /** @deprecated Use responses instead */
  capturedMedia: CapturedMedia[],

  /** Unified responses from all steps (input + capture) */
  responses: SessionResponse[],

  // ... other fields ...
}
```

## Response Shape by Step Type

| Step Type | `value` | `context` |
|-----------|---------|-----------|
| `input.shortText` | `"user text"` | `null` |
| `input.longText` | `"user text"` | `null` |
| `input.scale` | `"1"` to `"5"` | `null` |
| `input.yesNo` | `"yes"` or `"no"` | `null` |
| `input.multiSelect` | `["opt1", "opt2"]` | `MultiSelectOption[]` |
| `capture.photo` | `null` | `MediaReference[]` (1 item) |
| `capture.video` | `null` | `MediaReference[]` (1 item) |

## Firestore Document Structure

**Path**: `/projects/{projectId}/sessions/{sessionId}`

```json
{
  "id": "session-123",
  "projectId": "project-456",
  "experienceId": "exp-789",
  "mode": "guest",
  "status": "active",

  "answers": [],
  "capturedMedia": [],
  "responses": [
    {
      "stepId": "step-1",
      "stepName": "Your Name",
      "stepType": "input.shortText",
      "value": "John",
      "context": null,
      "createdAt": 1706745600000,
      "updatedAt": 1706745600000
    },
    {
      "stepId": "step-2",
      "stepName": "Your Photo",
      "stepType": "capture.photo",
      "value": null,
      "context": [{
        "mediaAssetId": "asset-abc",
        "url": "https://storage.../photo.jpg",
        "filePath": "projects/proj-1/sessions/sess-1/captures/photo.jpg",
        "displayName": "Your Photo"
      }],
      "createdAt": 1706745601000,
      "updatedAt": 1706745601000
    }
  ],

  "resultMedia": null,
  "createdAt": 1706745590000,
  "updatedAt": 1706745601000
}
```

## State Transitions

### Response Lifecycle

```
[No Response] -> setResponse() -> [Response Created]
                                       |
                                       v
[Response Created] -> setResponse() -> [Response Updated]
                                       (same stepId)
```

### Session Response Array

- New response: Appended to array
- Existing response (same stepId): Replaced in place
- Never duplicated for same stepId
