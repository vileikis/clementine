# Quickstart: Media Processing Pipeline

**Feature**: Media Processing Pipeline (Stage 1)
**Date**: 2025-12-16

## Overview

This guide helps you set up and test the media processing pipeline locally and in production.

## Prerequisites

- Node.js 20.x or later
- pnpm 8.x or later
- Firebase CLI installed (`npm install -g firebase-tools`)
- Firebase project with Firestore, Storage, and Cloud Functions enabled
- Access to Google Cloud Console for Cloud Tasks configuration

## Local Development Setup

### 1. Install Dependencies

```bash
# From repository root
cd functions
pnpm install
```

### 2. Configure Environment

Create `.env` file in `functions/` directory:

```bash
# Firebase Admin SDK (for local emulator)
GOOGLE_APPLICATION_CREDENTIALS=../path/to/service-account-key.json

# Cloud Tasks configuration (for local testing)
CLOUD_TASKS_PROJECT_ID=your-project-id
CLOUD_TASKS_LOCATION=europe-west1
CLOUD_TASKS_QUEUE=media-processing
```

### 3. Start Firebase Emulators

```bash
# From repository root
firebase emulators:start --only functions,firestore,storage
```

Emulator URLs:
- Functions: http://localhost:5001
- Firestore UI: http://localhost:4000/firestore
- Storage UI: http://localhost:4000/storage

### 4. Test Locally

#### Seed Test Data

Create a test session in Firestore emulator:

```bash
# Use Firebase CLI or Firestore UI
# Create session document: /sessions/test-session-1
{
  "id": "test-session-1",
  "projectId": "test-project",
  "eventId": "test-event",
  "companyId": "test-company",
  "inputAssets": [
    {
      "url": "projects/test-project/inputs/1702745600000-photo1.jpg",
      "filename": "photo1.jpg",
      "mimeType": "image/jpeg",
      "sizeBytes": 245678,
      "uploadedAt": "2025-12-16T10:00:00Z"
    }
  ],
  "createdAt": "2025-12-16T09:55:00Z"
}
```

Upload test image to Storage emulator at the path specified in inputAssets.

#### Trigger Processing

```bash
curl -X POST http://localhost:5001/your-project-id/europe-west1/processMedia \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session-1",
    "outputFormat": "image",
    "aspectRatio": "square"
  }'
```

Expected response:

```json
{
  "taskId": "projects/.../tasks/...",
  "message": "Processing job queued successfully"
}
```

#### Verify Results

1. Check Firestore session document for `outputs` field
2. Check Storage for processed files in `projects/test-project/results/`
3. Access URLs in `outputs.primaryUrl` and `outputs.thumbnailUrl`

## Production Deployment

### 1. Configure Cloud Tasks Queue

```bash
# Create task queue
gcloud tasks queues create media-processing \
  --location=europe-west1 \
  --max-attempts=3 \
  --min-backoff=30s \
  --max-concurrent-dispatches=10
```

### 2. Configure Storage Bucket

Make output files publicly accessible:

```bash
# Set default object ACL for public read
gsutil defacl set public-read gs://your-bucket-name
```

Or configure in Firebase Console:
- Go to Storage > Rules
- Allow public read for `projects/{projectId}/results/` path

### 3. Deploy Cloud Functions

```bash
# From repository root
cd functions
firebase deploy --only functions:processMedia,functions:processMediaJob
```

Deployment will output function URLs:
```
✔ functions[processMedia(europe-west1)] https://europe-west1-your-project.cloudfunctions.net/processMedia
✔ functions[processMediaJob(europe-west1)] (task queue function)
```

### 4. Test Production

Use the deployed function URL:

```bash
curl -X POST https://europe-west1-your-project.cloudfunctions.net/processMedia \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "real-session-id",
    "outputFormat": "image",
    "aspectRatio": "square"
  }'
```

## Testing Scenarios

### Test Case 1: Single Image Processing

**Input**:
- 1 photo in inputAssets
- outputFormat: "image"
- aspectRatio: "square"

**Expected Output**:
- Single 1080x1080 JPEG image
- Thumbnail (300px wide)
- Processing completes in <10 seconds

### Test Case 2: GIF Creation

**Input**:
- 4 photos in inputAssets
- outputFormat: "gif"
- aspectRatio: "story"

**Expected Output**:
- Animated GIF (1080x1920, 4 frames, 0.5s per frame, infinite loop)
- Thumbnail from first frame
- Processing completes in <30 seconds
- GIF file size <5MB

### Test Case 3: Video Creation

**Input**:
- 4 photos in inputAssets
- outputFormat: "video"
- aspectRatio: "square"

**Expected Output**:
- MP4 video (1080x1080, H.264, yuv420p, 5fps, fast start)
- Thumbnail from first frame
- Processing completes in <45 seconds
- Video size ~30% smaller than equivalent GIF

## Debugging

### View Cloud Function Logs

```bash
# Real-time logs
firebase functions:log --only processMedia

# Or use Google Cloud Console
# Logging > Logs Explorer
# Filter: resource.type="cloud_function"
```

### Check Cloud Task Queue

```bash
# List tasks
gcloud tasks list --queue=media-processing --location=europe-west1

# View task details
gcloud tasks describe TASK_ID --queue=media-processing --location=europe-west1
```

### Common Issues

**Issue**: "Session not found"
- Verify sessionId exists in Firestore
- Check Firestore security rules allow Admin SDK reads

**Issue**: "Session is already being processed"
- Check `session.processing.state` field
- Wait for current processing to complete or manually clear the field

**Issue**: FFmpeg error "Invalid codec"
- Verify ffmpeg-static package is installed
- Check Cloud Function has sufficient memory (increase to 1GB if needed)

**Issue**: Storage upload fails
- Verify Storage bucket exists
- Check Storage security rules
- Verify sufficient quota

**Issue**: Task queue not executing
- Verify queue exists: `gcloud tasks queues describe media-processing`
- Check task queue IAM permissions
- Verify function has `cloudtasks.tasks.create` permission

## Performance Monitoring

### Key Metrics to Track

1. **Processing Duration**: p50, p90, p99 latency per output format
2. **Error Rate**: Failed tasks / total tasks
3. **Retry Rate**: Tasks requiring retries / total tasks
4. **Storage Usage**: Total size of processed outputs
5. **Concurrent Processing**: Active tasks at any given time

### Monitoring Setup

```bash
# Create log-based metrics in Google Cloud Console
# Logging > Logs-based Metrics > Create Metric

# Example metric: Processing duration
# Filter: jsonPayload.step="processing_complete"
# Field: jsonPayload.processingTimeMs
```

## Cost Estimation

**Per Processing Job (4-frame GIF, square)**:
- Cloud Functions invocations: 2 (HTTP + task) = $0.0000008
- Cloud Functions compute (30s, 1GB): ~$0.0003
- Firestore reads: 2 = $0.0000012
- Firestore writes: 5 = $0.0000009
- Storage downloads (4x 2MB): 8MB = $0.0000008
- Storage uploads (1x 3MB): 3MB = $0.0000003
- Storage storage (3MB/month): $0.000078

**Total per job**: ~$0.0005 (< $1 per 2000 jobs)

## Next Steps

After Stage 1 is working:

1. **Stage 2**: Add AI transformation integration (background removal, style transfer)
2. **Stage 3**: Add overlay application (logos, frames, text)
3. **Stage 4**: Optimize performance (parallel frame processing, caching)
4. **Stage 5**: Add progress tracking (real-time percentage updates)

## Resources

- [Firebase Cloud Functions v2 Docs](https://firebase.google.com/docs/functions)
- [Cloud Tasks Documentation](https://cloud.google.com/tasks/docs)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [fluent-ffmpeg NPM Package](https://www.npmjs.com/package/fluent-ffmpeg)
