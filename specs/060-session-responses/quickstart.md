# Quickstart: Testing Session Responses

**Feature**: 060-session-responses
**Date**: 2026-02-04

## Prerequisites

1. Local development server running: `pnpm app:dev`
2. Firebase emulators running (optional for local testing)
3. Test experience with various step types created

## Manual Testing Scenarios

### Scenario 1: Text Input Response

**Steps**:
1. Navigate to a guest experience with a short text input step
2. Enter text value (e.g., "Blue")
3. Click Next to submit
4. Check browser DevTools Network tab for Firestore write

**Expected Result**:
- Response stored in `responses[]` array
- Response has: stepId, stepName="[step name]", stepType="input.shortText", value="Blue"
- `createdAt` and `updatedAt` timestamps present
- `context` is null

### Scenario 2: Scale Input Response

**Steps**:
1. Navigate to a guest experience with a scale input step (1-5)
2. Select rating 4
3. Click Next to submit

**Expected Result**:
- Response stored with value="4" (string)
- stepType="input.scale"

### Scenario 3: Yes/No Input Response

**Steps**:
1. Navigate to a guest experience with a yes/no input step
2. Select "Yes"
3. Click Next to submit

**Expected Result**:
- Response stored with value="yes" (lowercase string)
- stepType="input.yesNo"

### Scenario 4: Multi-Select Input Response

**Steps**:
1. Navigate to a guest experience with a multi-select input step
2. Select multiple options (e.g., "Cat" and "Dog")
3. Click Next to submit

**Expected Result**:
- Response stored with value=["cat", "dog"] (array)
- stepType="input.multiSelect"
- `context` contains array of MultiSelectOption objects with value and promptFragment

### Scenario 5: Photo Capture Response

**Steps**:
1. Navigate to a guest experience with a photo capture step
2. Allow camera access
3. Take a photo
4. Click Next to submit

**Expected Result**:
- Response stored with value=null
- stepType="capture.photo"
- `context` contains array with single MediaReference:
  - mediaAssetId: [asset ID]
  - url: [public URL]
  - filePath: [storage path]
  - displayName: [step name]

### Scenario 6: Video Capture Response

**Steps**:
1. Navigate to a guest experience with a video capture step
2. Allow camera access
3. Record a video
4. Click Next to submit

**Expected Result**:
- Response stored with value=null
- stepType="capture.video"
- `context` contains array with single MediaReference

### Scenario 7: Re-answer Step (Back Navigation)

**Steps**:
1. Complete a text input step with value "Blue"
2. Proceed to next step
3. Navigate back to text input step
4. Change value to "Red"
5. Click Next to submit

**Expected Result**:
- Only ONE response in array for that stepId (not duplicated)
- Response value updated to "Red"
- `updatedAt` timestamp updated, `createdAt` unchanged

### Scenario 8: Complete Experience

**Steps**:
1. Complete all steps in an experience
2. View final share/result screen

**Expected Result**:
- All responses present in `responses[]` array
- Session status="completed"
- `answers[]` and `capturedMedia[]` arrays remain empty (deprecated)

## Verification Methods

### Browser DevTools

1. Open Network tab
2. Filter by "firestore" or "sessions"
3. Check request payload for `responses` array

### Firebase Console (Production)

1. Navigate to Firestore Database
2. Find session document: `/projects/{projectId}/sessions/{sessionId}`
3. Verify `responses[]` array contains expected data

### Local Emulator UI

1. Open Firebase Emulator UI (usually http://localhost:4000)
2. Navigate to Firestore
3. Find session document and verify responses

## Troubleshooting

### Response not stored

- Check browser console for errors
- Verify step definition has id, name, and type
- Check Firestore security rules allow write

### Duplicate responses

- Verify setResponse uses stepId for matching
- Check store implementation replaces (not appends) existing response

### Missing timestamps

- Verify Date.now() called in response builder
- Check schema default values

### Empty context for captures

- Verify MediaReference array passed correctly
- Check media upload completed before setResponse called
