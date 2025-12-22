# Research: AI Transform Pipeline

**Phase 0 Output** | **Generated**: 2025-12-18

## Research Tasks

### 1. Google GenAI SDK for Node.js

**Unknown**: Which npm package provides Google Gemini API access for Node.js in Firebase Cloud Functions?

**Research Approach**: Check official Google AI documentation and npm registry for Node.js SDK.

**Decision**: Use `@google/genai` npm package (latest official Google GenAI SDK)

**Rationale**:
- Official Google SDK for Generative AI models (Gemini 2.0+)
- Replaces deprecated `@google/generative-ai` package
- Native TypeScript support with complete type definitions
- Supports multimodal image-to-image transformations (required for AI transform feature)
- Works in Node.js 20+ environments including Firebase Cloud Functions v2
- Active maintenance by Google AI team
- Model support: `gemini-3-pro-image-preview`, `gemini-2.5-flash` and other Gemini 2.0+ models

**Alternatives Considered**:
- **Deprecated `@google/generative-ai`** - Rejected because it has been deprecated in favor of `@google/genai`
- **Google Cloud Vertex AI SDK** (`@google-cloud/vertexai`) - Rejected because it requires more complex GCP authentication and is overkill for simple API key usage. Vertex AI is designed for enterprise deployments with IAM, whereas `@google/genai` works with simple API keys suitable for Cloud Functions.
- **Direct REST API calls** - Rejected because it lacks type safety, requires manual schema maintenance, and loses automatic retry/error handling provided by SDK.

### 2. Gemini Model Selection

**Unknown**: Which Gemini model name should be used for image transformation in December 2024?

**Research Approach**: Review Google Gemini API documentation for current model availability and image transformation capabilities.

**Decision**: Use `gemini-3-pro-image-preview` as primary model, with `gemini-2.5-flash` as fallback

**Rationale**:
- `gemini-3-pro-image-preview`: Latest Gemini 3 preview model with advanced multimodal image transformation capabilities
- Supports image-to-image transformations with prompts and reference images
- Optimized for image generation and transformation tasks
- `gemini-2.5-flash`: Fast, reliable fallback model with good multimodal support (target: <60 seconds end-to-end)
- Both models support reference images via multimodal input
- Available via `@google/genai` SDK (Gemini 2.0+ models)

**Alternatives Considered**:
- **gemini-1.5-pro** - Rejected because it's an older generation with less capable image transformation
- **gemini-2.0-flash-exp** - Considered but `3-pro-image-preview` and `2.5-flash` offer better image transformation capabilities

### 3. Image-to-Image Transformation Pattern

**Unknown**: How does Gemini handle image-to-image transformation? Does it require specific API patterns?

**Research Approach**: Review Google GenAI SDK documentation for multimodal image generation.

**Decision**: Use `models.generateContent()` with multimodal input (image buffer + text prompt + reference images)

**Rationale**:
- Gemini 2.0+ models support direct image-to-image transformations via multimodal API
- Pattern for transformation:
  1. Send input image buffer as multimodal input
  2. Provide transformation prompt describing desired output
  3. Optionally include reference images to guide style/content
  4. Model generates transformed image directly
- Uses `GoogleGenAI` client from `@google/genai` package:
  ```typescript
  const ai = new GoogleGenAI({apiKey: process.env.GOOGLE_AI_API_KEY});
  const model = ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: [inputImage, prompt, ...referenceImages]
  });
  ```

**Key SDK Features**:
- Streaming responses for progress tracking
- Function calling for structured outputs
- Multimodal inputs (images, audio, video)
- Built-in retry and error handling

**Implementation Notes**:
- For mocked implementation: Use simplified mock response pattern
- Reference images passed as base64 inline data
- Model handles aspect ratio internally; FFmpeg post-processing handles final formatting

### 4. Reference Image Handling in Firebase Storage

**Unknown**: Best practices for reading reference images from Firebase Storage and passing to AI provider

**Research Approach**: Review Firebase Admin Storage SDK and Google Generative AI SDK for image input patterns.

**Decision**: Download reference images to memory buffers, pass buffers to Gemini SDK

**Rationale**:
- Google Generative AI SDK accepts images as buffers or base64 strings
- Firebase Admin Storage SDK provides `file.download()` method returning buffer
- Avoids temp file I/O overhead (images already in-memory during processing)
- Reference images are small (<5MB each) so memory usage acceptable
- Pattern:
  ```typescript
  const [buffer] = await storage.bucket().file(refImagePath).download();
  const imagePart = {
    inlineData: {
      data: buffer.toString('base64'),
      mimeType: 'image/jpeg'
    }
  };
  ```

**Alternatives Considered**:
- **Signed URLs** - Rejected because Gemini SDK does not accept URLs, requires local access
- **Temp files** - Rejected because unnecessary I/O when buffers work directly

### 5. Error Handling Patterns

**Unknown**: How should AI transformation errors be categorized and handled?

**Research Approach**: Review existing error handling in `image.pipeline.ts` and `session.ts` for consistency.

**Decision**: Follow existing `markSessionFailed()` pattern with specific error codes

**Rationale**:
- Existing pipeline uses error codes: `PROCESSING_FAILED` (generic)
- Add new AI-specific codes:
  - `AI_TRANSFORM_FAILED` - Gemini API error
  - `REFERENCE_IMAGE_NOT_FOUND` - Reference image missing in Storage
  - `AI_CONFIG_INVALID` - Mocked config validation failure
- Re-throw errors after marking session failed (matches existing pattern in processMediaJob.ts:98-112)
- Log errors with context (session ID, model, error message)

**Alternatives Considered**:
- **Silent failure with fallback** - Rejected because user expects AI transformation when requested, silent fallback breaks expectations
- **Generic error codes** - Rejected because specific codes enable better debugging and monitoring

### 6. Processing State Lifecycle

**Unknown**: Where in the state lifecycle should 'ai-transform' state be inserted?

**Research Approach**: Review existing states in `session.ts` and `image.pipeline.ts` flow.

**Decision**: Insert 'ai-transform' state after 'downloading' and before 'processing'

**Rationale**:
- Current flow: initializing → downloading → processing → uploading → completed
- AI transform happens on downloaded input before FFmpeg processing
- Logical sequence: download input → AI transform → FFmpeg (scale/crop/overlay) → upload
- New flow: initializing → downloading → **ai-transform** → processing → uploading → completed

**Alternatives Considered**:
- **After processing** - Rejected because AI transform should happen on full-resolution input, not scaled output
- **Combined with processing** - Rejected because they are distinct operations with different failure modes

### 7. Aspect Ratio Handling

**Unknown**: Should AI transformation respect aspect ratio from pipelineOptions or use its own?

**Research Approach**: Review spec requirement FR-011 and existing pipeline config.

**Decision**: AI transformation ignores aspect ratio; use pipelineOptions aspectRatio for subsequent FFmpeg steps

**Rationale**:
- FR-011 explicitly states: "Use aspect ratio from pipelineOptions (not from AI config) as single source of truth"
- AI transform produces full output (likely square or original aspect)
- FFmpeg steps (scale/crop) handle aspect ratio enforcement
- Cleaner separation of concerns: AI transform = content generation, FFmpeg = formatting

**Alternatives Considered**:
- **AI-aware aspect ratio** - Rejected because adds complexity to AI prompt engineering and may not be respected by model

## Summary

**Key Decisions**:
1. Use `@google/genai` npm package for Gemini API access (replaces deprecated `@google/generative-ai`)
2. Use `gemini-3-pro-image-preview` model (primary) with `gemini-2.5-flash` fallback
3. Gemini 2.0+ models support direct image-to-image transformations via multimodal API
4. Download reference images to buffers, pass as base64 to Gemini SDK
5. Follow existing error handling pattern with new AI-specific error codes
6. Insert 'ai-transform' state after 'downloading' in processing lifecycle
7. AI transform ignores aspect ratio; FFmpeg handles formatting

**Open Questions for Implementation**:
- For mocked implementation: Return placeholder transformed image or skip AI call entirely?

**Dependencies to Add**:
```bash
pnpm add @google/genai
```

**Environment Variables Required**:
```
GOOGLE_AI_API_KEY=<api-key-for-gemini>
```
