# Firestore Schema Contracts: Error Capture & Safety Filter Reporting

**Feature**: 090-error-capture-safety-filters
**Date**: 2026-03-06

No new API endpoints are added by this feature. All changes are to internal pipeline behavior, Firestore document schemas, and frontend display logic.

## Document Schema Changes

### `/projects/{projectId}/jobs/{jobId}` — `error` field

**Before**:
```json
{
  "error": {
    "code": "PROCESSING_FAILED",
    "message": "An error occurred while processing your request.",
    "step": "outcome",
    "isRetryable": false,
    "timestamp": 1709740800000
  }
}
```

**After**:
```json
{
  "error": {
    "code": "SAFETY_FILTERED",
    "message": "Content was blocked by safety filters.",
    "step": "outcome",
    "isRetryable": false,
    "timestamp": 1709740800000,
    "details": {
      "raiMediaFilteredCount": 1,
      "raiMediaFilteredReasons": ["violence"]
    }
  }
}
```

**New field**: `details` — `Record<string, unknown> | null`. Defaults to `null`. Contains provider-specific metadata for operational analysis. Never exposed to guests.

---

### `/projects/{projectId}/sessions/{sessionId}` — `jobErrorCode` field

**Before**:
```json
{
  "jobId": "abc123",
  "jobStatus": "failed",
  "updatedAt": 1709740800000
}
```

**After**:
```json
{
  "jobId": "abc123",
  "jobStatus": "failed",
  "jobErrorCode": "SAFETY_FILTERED",
  "updatedAt": 1709740800000
}
```

**New field**: `jobErrorCode` — `string | null`. Defaults to `null`. Written only when `jobStatus` is `"failed"`. Contains the same error code as `job.error.code`.

## Security Considerations

- The `details` field in job documents may contain provider-specific filter reasons. Firestore security rules already restrict job document access to authenticated admin/server operations. No rule changes needed.
- The `jobErrorCode` field on sessions is a sanitized code string (e.g., `"SAFETY_FILTERED"`), not raw metadata. Safe for client-side read access under existing session security rules.
- Guest-facing share page reads `jobErrorCode` but never displays it directly — maps to predefined copy strings.
