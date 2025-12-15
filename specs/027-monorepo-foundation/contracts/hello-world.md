# API Contract: Hello World Function

**Feature**: 027-monorepo-foundation
**Date**: 2025-12-15

## Overview

A simple HTTP endpoint to verify that Firebase Functions are deployed correctly and can import shared types from the `@clementine/shared` package.

## Endpoint

```
GET /helloWorld
```

## Request

No request body or parameters required.

## Response

### Success (200 OK)

```json
{
  "message": "Functions operational",
  "sharedTypesWorking": true,
  "testSession": {
    "id": "test",
    "projectId": "test-project"
  },
  "timestamp": "2025-12-15T14:30:00.000Z"
}
```

**Fields**:
| Field | Type | Description |
|-------|------|-------------|
| `message` | string | Status message confirming function is running |
| `sharedTypesWorking` | boolean | Confirms shared package imports work |
| `testSession` | object | Partial Session object to verify type imports |
| `timestamp` | string | ISO 8601 timestamp of response |

### Error (500 Internal Server Error)

```json
{
  "error": "Internal server error",
  "message": "Failed to initialize function"
}
```

## Usage

### cURL

```bash
curl https://us-central1-clementine-7568d.cloudfunctions.net/helloWorld
```

### Expected Behavior

1. Function receives HTTP GET request
2. Creates a mock Session object using imported types from `@clementine/shared`
3. Returns JSON response confirming operational status

## Purpose

This endpoint serves as a **smoke test** to verify:

1. **Firebase Functions deployment** - Function is accessible at the expected URL
2. **Shared package integration** - `@clementine/shared` types can be imported and used
3. **TypeScript compilation** - Types compile correctly for Node.js runtime

Once verified, this endpoint can be removed or repurposed in subsequent pipeline stages.
