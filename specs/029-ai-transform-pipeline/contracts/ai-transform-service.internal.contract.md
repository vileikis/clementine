# Internal Contract: AI Transform Service

**Module**: `ai-transform.service.ts`
**Purpose**: Orchestrates AI image transformation with reference images and error handling

## Overview

Internal service layer that coordinates AI transformation workflow:
1. Validates AI configuration
2. Loads reference images from Firebase Storage
3. Delegates to AI provider (Gemini)
4. Handles errors and retries

## Public API

### Function: `transformImage`

**Signature**:
```typescript
export async function transformImage(
  inputBuffer: Buffer,
  config: AiTransformConfig
): Promise<Buffer>
```

**Purpose**: Transform an image using AI provider with reference images

**Parameters**:
- `inputBuffer` (Buffer, required) - Input image as buffer (JPEG/PNG format)
- `config` (AiTransformConfig, required) - AI transformation configuration

**Returns**: `Promise<Buffer>` - Transformed image as buffer (JPEG format)

**Throws**:
- `AiTransformError` with code:
  - `INVALID_CONFIG` - Config validation failed
  - `REFERENCE_IMAGE_NOT_FOUND` - Reference image missing in Storage
  - `API_ERROR` - AI provider error
  - `INVALID_INPUT_IMAGE` - Input buffer invalid/corrupt
  - `TIMEOUT` - Transformation exceeded 60 seconds

**Behavior**:
1. Validate `config` object (non-empty prompt, valid referenceImages paths)
2. Validate `inputBuffer` is non-empty and valid image format
3. Load reference images from Firebase Storage paths
4. Instantiate AI provider (currently GoogleGeminiProvider)
5. Call provider's `transformImage()` method
6. Return transformed image buffer
7. On error: wrap in AiTransformError with appropriate code and re-throw

**Example Usage**:
```typescript
import { transformImage } from './ai-transform.service';
import { MOCKED_AI_CONFIG } from './config';

const inputBuffer = await fs.readFile('input.jpg');
const transformedBuffer = await transformImage(inputBuffer, MOCKED_AI_CONFIG);
await fs.writeFile('output.jpg', transformedBuffer);
```

---

## Dependencies

### Internal Dependencies
- `AiProvider` interface from `./ai-providers/types`
- `GoogleGeminiProvider` from `./ai-providers/gemini.provider`
- Firebase Admin Storage SDK for reference image loading

### External Dependencies
- `@google/generative-ai` (Gemini SDK)
- `firebase-admin/storage` (Storage access)

---

## Configuration

### Mocked AI Config

**Location**: `functions/src/services/media-pipeline/config.ts`

**Constant**: `MOCKED_AI_CONFIG`

```typescript
export const MOCKED_AI_CONFIG: AiTransformConfig = {
  provider: 'google',
  model: 'gemini-2.0-flash-exp',
  prompt: 'Transform this person into a hobbit from Lord of the Rings. Apply fantasy costume, hairy feet, and whimsical background. Maintain facial features and pose.',
  referenceImages: [
    'media/company-test-001/ai-reference/hobbit-costume.jpg',
    'media/company-test-001/ai-reference/black-magic-wand.jpg'
  ],
  temperature: 0.7
};
```

**Usage**: Passed to `transformImage()` function when `aiTransform: true` in pipeline

---

## Error Handling

### Error Codes

| Code | HTTP Equivalent | Description | Trigger |
|------|----------------|-------------|---------|
| `INVALID_CONFIG` | 400 | Config validation failed | Empty prompt, invalid paths |
| `REFERENCE_IMAGE_NOT_FOUND` | 404 | Reference image missing | Storage path does not exist |
| `INVALID_INPUT_IMAGE` | 400 | Input buffer invalid | Empty buffer, corrupt image |
| `API_ERROR` | 502 | AI provider error | Gemini API failure |
| `TIMEOUT` | 504 | Transformation timeout | Exceeds 60 seconds |

### Error Propagation

```typescript
try {
  const transformed = await transformImage(inputBuffer, config);
} catch (error) {
  if (error instanceof AiTransformError) {
    // Map to session error code
    const sessionErrorCode = mapToSessionErrorCode(error.code);
    await markSessionFailed(sessionId, sessionErrorCode, error.message);
  }
  throw error; // Re-throw for Cloud Tasks retry
}
```

---

## Performance Characteristics

### Timing Breakdown (Target)

| Step | Target Duration | Notes |
|------|----------------|-------|
| Config validation | <100ms | Synchronous checks |
| Reference image loading | <2s | Parallel downloads (2 images) |
| Gemini API call | <50s | Depends on input size, model latency |
| Buffer processing | <1s | Image encoding |
| **Total** | **<60s** | End-to-end target per spec |

### Memory Usage

| Component | Memory | Notes |
|-----------|--------|-------|
| Input image buffer | ~2MB | Typical JPEG (1080p) |
| Reference images (2x) | ~4MB | 2 images @ 2MB each |
| Transformed output | ~3MB | JPEG output |
| **Peak** | **~10MB** | Acceptable for Cloud Functions |

---

## Integration Points

### Called By
- `image.pipeline.ts` → `processSingleImage()` function
  - When `options.aiTransform === true`
  - After downloading input asset, before FFmpeg processing

### Calls
- `GoogleGeminiProvider.transformImage()` - AI provider implementation
- Firebase Admin Storage - Reference image downloads

---

## Testing Strategy

### Unit Tests (`ai-transform.service.test.ts`)

**Test Cases**:
1. ✅ **Success path**: Transform image with valid config and reference images
2. ✅ **Invalid config**: Empty prompt throws `INVALID_CONFIG`
3. ✅ **Invalid config**: Empty referenceImages array throws `INVALID_CONFIG`
4. ✅ **Missing reference image**: Non-existent path throws `REFERENCE_IMAGE_NOT_FOUND`
5. ✅ **Invalid input buffer**: Empty buffer throws `INVALID_INPUT_IMAGE`
6. ✅ **API error**: Gemini failure throws `API_ERROR`
7. ✅ **Timeout**: Long-running transformation throws `TIMEOUT`

**Mocking**:
- Mock Firebase Admin Storage: `file.download()` returns test buffers
- Mock GoogleGeminiProvider: `transformImage()` returns fixed buffer
- Mock environment: `GOOGLE_AI_API_KEY` set

### Integration Tests

**Test Cases**:
1. ✅ **End-to-end**: Real Gemini API call with test image (skip in CI if no API key)
2. ✅ **Reference images**: Load actual reference images from test Storage bucket

---

## Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `GOOGLE_AI_API_KEY` | Yes | Google AI API key for Gemini | `AIzaSyD...` |

**Note**: For local development, set in `.env` file (Firebase emulators support .env via dotenv)

---

## Logging

### Log Entries

**Start**:
```
[AI Transform] Starting transformation for session {sessionId}
Model: {model}
Reference Images: {count}
```

**Success**:
```
[AI Transform] Completed transformation for session {sessionId}
Duration: {durationMs}ms
Output Size: {sizeBytes} bytes
```

**Error**:
```
[AI Transform] Failed transformation for session {sessionId}
Error Code: {code}
Error Message: {message}
Cause: {cause}
```

### Monitoring Metrics

- **Latency**: P50, P95, P99 transformation duration
- **Error Rate**: % of transformations failing by error code
- **API Usage**: Number of Gemini API calls per day
- **Cost**: Gemini API cost per transformation

---

## Security Considerations

### API Key Protection
- `GOOGLE_AI_API_KEY` stored in Firebase Functions config (encrypted at rest)
- Never logged or exposed in error messages
- Rotated quarterly

### Input Validation
- Validate image buffer size (<10MB) to prevent DoS
- Validate reference image paths match expected pattern (prevent path traversal)
- Validate config object to prevent injection attacks in prompts

### Rate Limiting
- Cloud Tasks max concurrent dispatches: 10
- Prevents overwhelming Gemini API quota
- Prevents cost overruns

---

## Future Enhancements

### Planned Changes (Out of Scope for This Feature)
1. **Multiple AI Providers**: Support Stable Diffusion, DALL-E, Midjourney
2. **Config from Firestore**: Load AI config from `/aiTransformConfigs/{id}` instead of mocked constant
3. **Caching**: Cache transformed images by input hash + config hash
4. **Retries**: Retry Gemini API calls on transient failures (currently 0 retries)
5. **Prompt Templates**: Parameterized prompts with variables (e.g., "Transform into {character}")

---

## Change Summary

### New Files
- `functions/src/services/media-pipeline/ai-transform.service.ts` - This service
- `functions/src/services/media-pipeline/ai-providers/types.ts` - Interfaces and types
- `functions/src/services/media-pipeline/ai-providers/gemini.provider.ts` - Gemini implementation

### Modified Files
- `functions/src/services/media-pipeline/config.ts` - Add `MOCKED_AI_CONFIG` constant
- `functions/src/services/media-pipeline/index.ts` - Re-export `transformImage` function
