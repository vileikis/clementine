# Quickstart: AI Transform Pipeline

**Feature**: AI Transform Pipeline | **Branch**: `029-ai-transform-pipeline`

## Overview

This guide explains how the AI Transform Pipeline feature works, how to use it, and how to test it locally.

---

## What Does It Do?

When processing a single image, you can now add an `aiTransform: true` flag to transform the image using AI before applying overlays and encoding. The system:

1. **Accepts AI flag**: New `aiTransform` boolean field in processMedia requests
2. **Validates inputs**: Checks that reference images exist in Firebase Storage
3. **Transforms image**: Uses Google Gemini to apply AI transformation based on mocked prompt
4. **Integrates seamlessly**: AI-transformed image flows through existing overlay and encoding pipeline
5. **Handles errors**: Specific error codes for AI failures (AI_TRANSFORM_FAILED, REFERENCE_IMAGE_NOT_FOUND)

**Supported**: Single image output only
**Not Supported**: GIF and video outputs (flag is ignored)

---

## Architecture Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. HTTP Request: POST /processMedia                            │
│    Body: { sessionId, outputFormat: "image", aiTransform: true }│
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Validation: Zod schema validates aiTransform boolean        │
│    → Queue Cloud Task with aiTransform flag                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. processMediaJob: Extract payload, pass to pipeline          │
│    → pipelineOptions = { aspectRatio, overlay, aiTransform }    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. processSingleImage: Check aiTransform flag                  │
│    IF aiTransform === true:                                     │
│      → Call transformImage(inputBuffer, MOCKED_AI_CONFIG)       │
│      → Update state: 'ai-transform'                             │
│    ELSE:                                                        │
│      → Skip to FFmpeg processing                                │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. AI Transform Service: Orchestrate transformation            │
│    → Validate config (prompt, referenceImages)                  │
│    → Load reference images from Storage                         │
│    → Call GoogleGeminiProvider.transformImage()                 │
│    → Return transformed image buffer                            │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. Continue Pipeline: Use transformed buffer                   │
│    → FFmpeg scale/crop (aspectRatio)                            │
│    → FFmpeg overlay (if overlay: true)                          │
│    → Generate thumbnail                                         │
│    → Upload to Storage                                          │
│    → Mark session complete                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Usage

### Basic Request (No AI Transform)
```bash
curl -X POST http://localhost:5001/clementine-dev/europe-west1/processMedia \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-test-001",
    "outputFormat": "image",
    "aspectRatio": "square"
  }'
```

### Request with AI Transform
```bash
curl -X POST http://localhost:5001/clementine-dev/europe-west1/processMedia \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-test-001",
    "outputFormat": "image",
    "aspectRatio": "square",
    "aiTransform": true
  }'
```

### Request with AI Transform + Overlay
```bash
curl -X POST http://localhost:5001/clementine-dev/europe-west1/processMedia \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-test-001",
    "outputFormat": "image",
    "aspectRatio": "square",
    "overlay": true,
    "aiTransform": true
  }'
```

### Request with AI Transform for GIF (Ignored)
```bash
curl -X POST http://localhost:5001/clementine-dev/europe-west1/processMedia \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-test-002",
    "outputFormat": "gif",
    "aspectRatio": "square",
    "aiTransform": true
  }'
```
**Result**: Warning logged, AI transform skipped, standard GIF produced

---

## Local Development Setup

### 1. Prerequisites
- Node.js 22+
- pnpm 10+
- Firebase CLI installed
- Firebase emulators configured

### 2. Install Dependencies
```bash
# From repo root
pnpm install

# Add Google GenAI SDK
cd functions
pnpm add @google/genai
```

### 3. Set Environment Variables
Create `functions/.env` file:
```
GOOGLE_AI_API_KEY=your-gemini-api-key-here
```

Get API key: https://makersuite.google.com/app/apikey

### 4. Seed Reference Images
Upload reference images to Firebase Storage emulator:

```bash
# Start emulators
pnpm functions:serve

# In another terminal, upload reference images
gsutil -m cp \
  functions/seed-data/ai-reference/hobbit-costume.jpg \
  functions/seed-data/ai-reference/black-magic-wand.jpg \
  gs://clementine-dev.appspot.com/media/company-test-001/ai-reference/
```

Or manually via Emulator UI: http://localhost:4000/storage

### 5. Seed Test Session
```bash
pnpm functions:seed
```

This creates a test session with ID `session-test-001` containing a single input image.

### 6. Test AI Transform
```bash
curl -X POST http://localhost:5001/clementine-dev/europe-west1/processMedia \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-test-001",
    "outputFormat": "image",
    "aspectRatio": "square",
    "aiTransform": true
  }'
```

### 7. Monitor Processing
**Emulator UI**: http://localhost:4000
- **Firestore**: Watch session document update through states:
  - `pending` → `initializing` → `downloading` → `ai-transform` → `processing` → `uploading` → `completed`
- **Logs**: View Cloud Function logs for transformation progress

---

## Configuration

### Mocked AI Config

**Location**: `functions/src/services/ai/config.ts`

```typescript
export const MOCKED_AI_CONFIG: AiTransformConfig = {
  provider: 'google',
  model: 'gemini-3-pro-image-preview',
  prompt: 'Transform this person into a hobbit from Lord of the Rings. Apply fantasy costume, hairy feet, and whimsical background. Maintain facial features and pose.',
  referenceImages: [
    'media/company-test-001/ai-reference/hobbit-costume.jpg',
    'media/company-test-001/ai-reference/black-magic-wand.jpg'
  ],
  temperature: 0.7
};
```

**To customize**:
1. Edit `MOCKED_AI_CONFIG` constant
2. Update `prompt` text
3. Add/remove reference image paths
4. Change `model` (e.g., to `gemini-2.5-flash`)

---

## Testing Strategy

### Manual Integration Tests

**Manual Testing Steps**:

1. **Success Path**:
   - Create session with single image
   - Call processMedia with `aiTransform: true`
   - Verify session completes with transformed output
   - Verify output dimensions match aspectRatio

2. **Skip Path (GIF)**:
   - Create session with 4+ images
   - Call processMedia with `aiTransform: true` + `outputFormat: "gif"`
   - Verify warning logged
   - Verify GIF produced without AI transformation

3. **Error Path (Missing Reference Image)**:
   - Delete one reference image from Storage
   - Call processMedia with `aiTransform: true`
   - Verify session fails with `REFERENCE_IMAGE_NOT_FOUND`

4. **Error Path (Invalid API Key)**:
   - Set `GOOGLE_AI_API_KEY` to invalid value
   - Call processMedia with `aiTransform: true`
   - Verify session fails with `AI_TRANSFORM_FAILED`

---

## Error Handling

### Session Error Codes

| Code | Description | Trigger |
|------|-------------|---------|
| `AI_TRANSFORM_FAILED` | Gemini API error | API call failed, invalid response |
| `REFERENCE_IMAGE_NOT_FOUND` | Reference image missing | Storage path does not exist |
| `AI_CONFIG_INVALID` | Config validation failed | Empty prompt, invalid paths |

### Error Flow

```
AI Transform Error
    ↓
Catch in processSingleImage()
    ↓
Map to session error code
    ↓
markSessionFailed(sessionId, code, message)
    ↓
Update Firestore: processing.state = 'failed'
                  processing.errorCode = code
                  processing.errorMessage = message
    ↓
Re-throw error (Cloud Tasks retry mechanism)
```

### Debugging Errors

**Check Logs**:
```bash
# Emulator logs
tail -f firebase-debug.log

# Look for:
[AI Transform] Failed transformation for session {id}
Error Code: {code}
Error Message: {message}
```

**Check Firestore**:
- Open Emulator UI: http://localhost:4000/firestore
- Navigate to `/sessions/{sessionId}`
- Check `processing` object for error details

---

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| End-to-end latency | <60s | From request to output URL |
| AI transformation | <50s | Gemini API call |
| Reference image loading | <2s | 2 images in parallel |
| Memory usage | <10MB | Peak memory per transformation |

**Monitor**:
```bash
# Check processing time in session document
# Field: outputs.processingTimeMs
```

---

## Production Deployment

### Environment Setup

**Required**:
1. Google AI API key in Firebase Functions config:
   ```bash
   firebase functions:config:set google.ai_api_key="YOUR_KEY"
   ```

2. Reference images uploaded to Production Storage:
   ```
   gs://clementine-prod.appspot.com/media/company-test-001/ai-reference/
   ```

### Rollout Strategy

**Phase 1**: Deploy to development environment
- Test with internal sessions
- Monitor error rates and latency
- Validate reference image loading

**Phase 2**: Enable for beta users
- Add feature flag check (future enhancement)
- Gradual rollout to 10% of users
- Monitor cost (Gemini API usage)

**Phase 3**: General availability
- Remove feature flag
- Document in API docs
- Update frontend to expose toggle

---

## Cost Monitoring

### Gemini API Pricing (Estimated)

| Model | Input Price | Output Price | Est. Cost per Transform |
|-------|-------------|--------------|-------------------------|
| gemini-2.5-flash | $0.00015/1K tokens | $0.0006/1K tokens | ~$0.05 |
| gemini-3-pro-image-preview | $0.00125/1K tokens | $0.005/1K tokens | ~$0.40 |

**Note**: Image inputs count as tokens based on size/resolution

**Monitor Usage**:
- Check Google AI Studio dashboard for daily usage
- Set billing alerts at $100/day threshold
- Log Gemini API calls for audit trail

---

## Troubleshooting

### Issue: "REFERENCE_IMAGE_NOT_FOUND"

**Cause**: Reference image paths in config don't exist in Storage

**Fix**:
1. Check config paths: `functions/src/services/ai/config.ts`
2. Upload missing images to Storage:
   ```bash
   gsutil cp image.jpg gs://bucket/media/company-test-001/ai-reference/
   ```
3. Verify paths match exactly (case-sensitive)

---

### Issue: "AI_TRANSFORM_FAILED" with "401 Unauthorized"

**Cause**: Invalid or missing `GOOGLE_AI_API_KEY`

**Fix**:
1. Verify API key is set:
   ```bash
   firebase functions:config:get google.ai_api_key
   ```
2. If missing, set key:
   ```bash
   firebase functions:config:set google.ai_api_key="YOUR_KEY"
   ```
3. Redeploy functions:
   ```bash
   pnpm functions:deploy
   ```

---

### Issue: AI transform timeout (>60s)

**Cause**: Large input images or slow Gemini API

**Fix**:
1. Check input image size (should be <2MB)
2. Try different model (gemini-2.5-flash is faster than gemini-3-pro-image-preview)
3. Reduce reference image count in config

---

### Issue: Warning "AI transform not supported for GIF format"

**Expected Behavior**: This is intentional! AI transform only works for single images.

**No Fix Needed**: GIF output will be generated normally without AI transformation.

---

## Next Steps

After implementing this feature:

1. **Run validation loop**:
   ```bash
   pnpm lint
   pnpm type-check
   ```

2. **Test locally**: Follow "Local Development Setup" section above

3. **Update documentation**:
   - Add API docs for `aiTransform` field
   - Update MANUAL-TESTING.md with new test cases

4. **Deploy to development**:
   ```bash
   pnpm functions:deploy
   ```

5. **Monitor metrics**:
   - Error rates by code (Firestore queries)
   - Processing latency (P50, P95, P99)
   - Gemini API usage (Google AI Studio dashboard)

---

## Related Documents

- **Spec**: [spec.md](./spec.md) - Feature requirements and user stories
- **Plan**: [plan.md](./plan.md) - Implementation plan and architecture
- **Data Model**: [data-model.md](./data-model.md) - Entity schemas and relationships
- **API Contract**: [contracts/processMedia.http.contract.md](./contracts/processMedia.http.contract.md) - HTTP endpoint specification
- **Service Contract**: [contracts/ai-transform-service.internal.contract.md](./contracts/ai-transform-service.internal.contract.md) - Internal service API
