# Transform Pipeline QA Test Cases

Manual QA test cases for the transform pipeline HTTP endpoint and Cloud Task handler.

## Prerequisites

1. Start emulators: `pnpm functions:serve`
2. Seed test data: `pnpm functions:seed`
3. Emulator UI: http://localhost:4000

## Seeded Test Data

### Entities

| Entity | ID | Path | Purpose |
|--------|-----|------|---------|
| Workspace | `workspace-test-001` | `/workspaces/workspace-test-001` | Parent for experiences |
| Project | `project-test-001` | `/projects/project-test-001` | Parent for sessions/jobs |
| Experience (with transform) | `experience-with-transform` | `/workspaces/.../experiences/...` | Valid transform config |
| Experience (no transform) | `experience-no-transform` | `/workspaces/.../experiences/...` | Transform = null |
| Experience (draft only) | `experience-draft-only` | `/workspaces/.../experiences/...` | Published = null |
| Session (ready) | `session-ready` | `/projects/.../sessions/...` | Ready to process (draft config) |
| Session (published) | `session-published` | `/projects/.../sessions/...` | Uses published config |
| Session (with active job) | `session-with-job` | `/projects/.../sessions/...` | Has job in progress |
| Session (no transform) | `session-no-transform` | `/projects/.../sessions/...` | References no-transform experience |
| Session (draft only exp) | `session-draft-only` | `/projects/.../sessions/...` | Uses published but experience has none |

---

## Happy Path Tests

### TC-001: Start transform pipeline (draft config)

**Description**: Successfully start a transform pipeline job using draft config.

**Preconditions**:
- Session `session-ready` exists with `configSource: 'draft'`
- Experience has valid `draft.transform` config

**Request**:
```bash
curl -X POST "http://localhost:5001/clementine-7568d/europe-west1/startTransformPipeline?projectId=project-test-001" \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "session-ready", "stepId": "transform-step-1"}'
```

**Expected Response** (200):
```json
{
  "success": true,
  "jobId": "<generated-job-id>",
  "message": "Transform pipeline job created"
}
```

**Verification**:
1. Job document created at `/projects/project-test-001/jobs/{jobId}`
2. Job status = `pending` initially, then `running`, then `completed`
3. Session updated with `jobId` and `jobStatus`
4. Job has `snapshot` with session inputs and transform config

---

### TC-002: Start transform pipeline (published config)

**Description**: Successfully start a transform pipeline job using published config.

**Preconditions**:
- Session `session-published` exists with `configSource: 'published'`
- Experience has valid `published.transform` config

**Request**:
```bash
curl -X POST "http://localhost:5001/clementine-7568d/europe-west1/startTransformPipeline?projectId=project-test-001" \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "session-published", "stepId": "transform-step-1"}'
```

**Expected Response** (200):
```json
{
  "success": true,
  "jobId": "<generated-job-id>",
  "message": "Transform pipeline job created"
}
```

**Verification**:
1. Job snapshot contains `published` config version
2. `snapshot.versions.experienceVersion` matches `publishedVersion`

---

### TC-003: Job lifecycle tracking

**Description**: Verify job progresses through lifecycle states.

**Steps**:
1. Start pipeline (TC-001)
2. Immediately check job status (should be `pending` or `running`)
3. Wait for completion (~2 seconds with stub)
4. Verify final job state

**Verification** (after completion):
```bash
# Check job document in Firestore Emulator UI
# Or query directly in emulator
```

- Job status = `completed`
- Job has `output` with `assetId`, `url`, `format`, `dimensions`
- Job has `completedAt` timestamp
- Session `jobStatus` = `completed`

---

## Unhappy Path Tests

### TC-101: Session not found

**Description**: Request with non-existent session ID returns 404.

**Request**:
```bash
curl -X POST "http://localhost:5001/clementine-7568d/europe-west1/startTransformPipeline?projectId=project-test-001" \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "non-existent-session", "stepId": "step-1"}'
```

**Expected Response** (404):
```json
{
  "success": false,
  "error": {
    "code": "SESSION_NOT_FOUND",
    "message": "Session not found"
  }
}
```

---

### TC-102: Experience not found

**Description**: Session references non-existent experience.

**Preconditions**:
- Create a session with invalid `experienceId`

**Expected Response** (404):
```json
{
  "success": false,
  "error": {
    "code": "TRANSFORM_NOT_FOUND",
    "message": "Experience not found"
  }
}
```

---

### TC-103: Experience without transform config

**Description**: Experience exists but has no transform configuration.

**Request**:
```bash
curl -X POST "http://localhost:5001/clementine-7568d/europe-west1/startTransformPipeline?projectId=project-test-001" \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "session-no-transform", "stepId": "step-1"}'
```

**Expected Response** (404):
```json
{
  "success": false,
  "error": {
    "code": "TRANSFORM_NOT_FOUND",
    "message": "Experience has no transform configuration"
  }
}
```

---

### TC-104: Job already in progress

**Description**: Cannot start a new job when one is already running.

**Request**:
```bash
curl -X POST "http://localhost:5001/clementine-7568d/europe-west1/startTransformPipeline?projectId=project-test-001" \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "session-with-job", "stepId": "step-1"}'
```

**Expected Response** (409):
```json
{
  "success": false,
  "error": {
    "code": "JOB_IN_PROGRESS",
    "message": "A job is already in progress for this session"
  }
}
```

---

### TC-105: Published config not available

**Description**: Session uses `configSource: 'published'` but experience has no published config.

**Request**:
```bash
curl -X POST "http://localhost:5001/clementine-7568d/europe-west1/startTransformPipeline?projectId=project-test-001" \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "session-draft-only", "stepId": "step-1"}'
```

**Expected Response** (404):
```json
{
  "success": false,
  "error": {
    "code": "TRANSFORM_NOT_FOUND",
    "message": "Experience has no transform configuration"
  }
}
```

---

### TC-106: Missing projectId query parameter

**Description**: Request without projectId query param.

**Request**:
```bash
curl -X POST "http://localhost:5001/clementine-7568d/europe-west1/startTransformPipeline" \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "session-ready", "stepId": "step-1"}'
```

**Expected Response** (400):
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Missing projectId query parameter"
  }
}
```

---

### TC-107: Invalid request body

**Description**: Request with missing required field.

**Request**:
```bash
curl -X POST "http://localhost:5001/clementine-7568d/europe-west1/startTransformPipeline?projectId=project-test-001" \
  -H "Content-Type: application/json" \
  -d '{"stepId": "step-1"}'
```

**Expected Response** (400):
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid request: ..."
  }
}
```

---

### TC-108: Wrong HTTP method

**Description**: GET request instead of POST.

**Request**:
```bash
curl -X GET "http://localhost:5001/clementine-7568d/europe-west1/startTransformPipeline?projectId=project-test-001"
```

**Expected Response** (405):
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Method not allowed"
  }
}
```

---

## Data Verification Checklist

After running tests, verify in Firestore Emulator UI:

### Job Document Structure
- [ ] `id` - Auto-generated
- [ ] `projectId` - Matches request
- [ ] `sessionId` - Matches request
- [ ] `experienceId` - From session
- [ ] `stepId` - From request (nullable)
- [ ] `status` - Lifecycle progression
- [ ] `progress` - Shows step/percentage during processing
- [ ] `output` - Has `assetId`, `url`, `format`, `dimensions`, `sizeBytes`
- [ ] `error` - null on success
- [ ] `snapshot.sessionInputs` - Has answers/capturedMedia
- [ ] `snapshot.transformConfig` - Has nodes/variableMappings
- [ ] `snapshot.versions` - Has experienceVersion
- [ ] Timestamps: `createdAt`, `updatedAt`, `startedAt`, `completedAt`

### Session Updates
- [ ] `jobId` - Set to job document ID
- [ ] `jobStatus` - Synced with job status
- [ ] `updatedAt` - Updated on each status change

---

## Quick Test Script

Run all happy path tests:

```bash
#!/bin/bash
BASE_URL="http://localhost:5001/clementine-7568d/europe-west1"
PROJECT_ID="project-test-001"

echo "=== TC-001: Draft config ==="
curl -s -X POST "${BASE_URL}/startTransformPipeline?projectId=${PROJECT_ID}" \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "session-ready", "stepId": "transform-step-1"}' | jq .

echo ""
echo "=== TC-002: Published config ==="
curl -s -X POST "${BASE_URL}/startTransformPipeline?projectId=${PROJECT_ID}" \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "session-published", "stepId": "transform-step-1"}' | jq .
```

---

## Notes

- The stub pipeline adds ~2 second delay to simulate real processing
- Jobs are created in `/projects/{projectId}/jobs/{jobId}`
- Cloud Tasks are queued immediately (`scheduleDelaySeconds: 0`)
- Max retries = 0 (no automatic retry on failure)
- Timeout = 600 seconds (10 minutes)
