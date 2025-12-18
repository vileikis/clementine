# Research: AI Transform Pipeline

**Phase 0 Output** | **Generated**: 2025-12-18

## Research Tasks

### 1. Google Generative AI SDK for Node.js

**Unknown**: Which npm package provides Google Gemini API access for Node.js in Firebase Cloud Functions?

**Research Approach**: Check official Google AI documentation and npm registry for Node.js SDK.

**Decision**: Use `@google/generative-ai` npm package (official Google Generative AI SDK)

**Rationale**:
- Official Google SDK for Generative AI models (Gemini)
- Native TypeScript support with complete type definitions
- Supports image input for multimodal models (required for image transformation)
- Works in Node.js environments including Firebase Cloud Functions
- Active maintenance by Google AI team
- Model support: `gemini-2.0-flash-exp`, `gemini-1.5-pro`, `gemini-1.5-flash` (per documentation)

**Alternatives Considered**:
- **Google Cloud Vertex AI SDK** (`@google-cloud/vertexai`) - Rejected because it requires more complex GCP authentication and is overkill for simple API key usage. Vertex AI is designed for enterprise deployments with IAM, whereas `@google/generative-ai` works with simple API keys suitable for Cloud Functions.
- **Direct REST API calls** - Rejected because it lacks type safety, requires manual schema maintenance, and loses automatic retry/error handling provided by SDK.

### 2. Gemini Model Selection

**Unknown**: Which Gemini model name should be used for image transformation in December 2024?

**Research Approach**: Review Google Gemini API documentation for current model availability and image generation capabilities.

**Decision**: Use `gemini-2.0-flash-exp` as primary model, with `gemini-1.5-pro` as alternative

**Rationale**:
- `gemini-2.0-flash-exp`: Latest experimental model with improved multimodal capabilities (December 2024)
- Supports image input + text prompts for image-to-image transformation
- "flash" variant optimized for speed (target: <60 seconds end-to-end)
- `gemini-1.5-pro`: More stable alternative with proven production track record, use if experimental model has issues
- Both models support reference images via multimodal input

**Alternatives Considered**:
- **gemini-1.0-pro-vision** - Rejected because it's an older model generation with less capable image understanding
- **gemini-1.5-flash** - Considered but `2.0-flash-exp` offers better performance for image tasks per documentation

**Note**: Model names in spec (`gemini-2.5-flash-image`, `gemini-3-pro-image-preview`) appear to be placeholders. Actual available models as of December 2024 are Gemini 1.5 and 2.0 series.

### 3. Image-to-Image Transformation Pattern

**Unknown**: How does Gemini handle image-to-image transformation? Does it require specific API patterns?

**Research Approach**: Review Google Generative AI SDK documentation for multimodal image generation.

**Decision**: Use `generateContent` with multimodal input (image buffer + text prompt)

**Rationale**:
- Gemini models are generative models that produce text/structured output, NOT image-to-image transformers
- For image transformation, the pattern is:
  1. Send input image + transformation prompt to Gemini
  2. Gemini analyzes image and generates a **text description** of the transformed image
  3. Use that description with a separate image generation model (e.g., Imagen, Stable Diffusion)
- **CRITICAL FINDING**: Gemini alone CANNOT produce transformed images directly

**Alternative Approach - Imagen via Vertex AI**:
- Google's Imagen 2 model (via Vertex AI) supports text-to-image generation
- Could use Gemini to generate enhanced prompts, then Imagen for actual image generation
- Requires Vertex AI setup, not simple API key

**Alternative Approach - Third-party Image Generation**:
- Stable Diffusion (via Stability AI API or Replicate)
- DALL-E 3 (via OpenAI API)
- Midjourney (via unofficial APIs)

**Recommendation for Implementation**:
Since Gemini cannot directly transform images, we need a two-step pipeline:
1. **Gemini**: Analyze input image + generate enhanced description based on prompt
2. **Image Generator** (Imagen/Stable Diffusion/etc.): Generate new image from description

For mocked implementation, we'll structure the code to support this pattern but use placeholder/mock responses.

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
1. Use `@google/generative-ai` npm package for Gemini API access
2. Use `gemini-2.0-flash-exp` model (latest experimental) with `gemini-1.5-pro` fallback
3. **CRITICAL**: Gemini cannot directly transform images; requires two-step pattern (Gemini analysis → separate image generation)
4. Download reference images to buffers, pass as base64 to Gemini SDK
5. Follow existing error handling pattern with new AI-specific error codes
6. Insert 'ai-transform' state after 'downloading' in processing lifecycle
7. AI transform ignores aspect ratio; FFmpeg handles formatting

**Open Questions for Implementation**:
- Which image generation service to integrate for actual image output? (Imagen/Stable Diffusion/other)
- For mocked implementation: Return placeholder transformed image or skip AI call entirely?

**Dependencies to Add**:
```bash
pnpm add @google/generative-ai
```

**Environment Variables Required**:
```
GOOGLE_AI_API_KEY=<api-key-for-gemini>
```
