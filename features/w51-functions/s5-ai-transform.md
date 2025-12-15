# Original PLan

- see ./plan.md

### Stage 5: AI Transformation (Days 10-11)

**Goal**: Integrate AI image transformation with provider abstraction.

### Deliverables

**1. AI Config Types**

```tsx
// packages/shared/src/types/experience.types.ts
export interface AITransformConfig {
  enabled: boolean;
  provider: "gemini" | "stable-diffusion" | "replicate";
  prompt: string;
  negativePrompt?: string;
  strength?: number; // 0-1, how much to transform
  parameters?: Record<string, any>; // Provider-specific
  fallbackToOriginal?: boolean;
}
```

**2. Provider Interface & Factory**

```tsx
// functions/src/services/ai/types.ts
export interface AIProvider {
  name: string;
  transform(imageBuffer: Buffer, config: AITransformConfig): Promise<Buffer>;
}

// functions/src/services/ai/providerFactory.ts
import { GeminiProvider } from "./geminiProvider";
import { StableDiffusionProvider } from "./stableDiffusionProvider";

export function getAIProvider(providerName: string): AIProvider {
  switch (providerName) {
    case "gemini":
      return new GeminiProvider();
    case "stable-diffusion":
      return new StableDiffusionProvider();
    default:
      throw new Error(`Unknown AI provider: ${providerName}`);
  }
}
```

**3. Gemini Provider Implementation**

```tsx
// functions/src/services/ai/geminiProvider.ts
import { VertexAI } from "@google-cloud/vertexai";

export class GeminiProvider implements AIProvider {
  name = "gemini";
  private client: VertexAI;

  constructor() {
    this.client = new VertexAI({
      project: process.env.GCLOUD_PROJECT,
      location: "us-central1",
    });
  }

  async transform(
    imageBuffer: Buffer,
    config: AITransformConfig
  ): Promise<Buffer> {
    const startTime = Date.now();

    try {
      const base64Image = imageBuffer.toString("base64");

      const model = this.client.getGenerativeModel({
        model: "gemini-1.5-pro-vision",
      });

      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { mimeType: "image/jpeg", data: base64Image } },
              { text: config.prompt },
            ],
          },
        ],
      });

      // Extract generated image from response
      const generatedImage =
        result.response.candidates?.[0]?.content?.parts?.find(
          (p) => p.inlineData
        );

      if (!generatedImage?.inlineData?.data) {
        throw new Error("No image generated");
      }

      logger.info("AI transform completed", {
        provider: "gemini",
        promptLength: config.prompt.length,
        durationMs: Date.now() - startTime,
      });

      return Buffer.from(generatedImage.inlineData.data, "base64");
    } catch (error) {
      logger.error("Gemini transform failed", {
        error: error.message,
        durationMs: Date.now() - startTime,
      });
      throw error;
    }
  }
}
```

**4. AI Transform Service**

```tsx
// functions/src/services/aiTransformService.ts
async function performAITransform(
  frames: Buffer[],
  config: AITransformConfig
): Promise<Buffer[]> {
  const provider = getAIProvider(config.provider);
  const results: Buffer[] = [];

  for (const [i, frame] of frames.entries()) {
    try {
      const transformed = await provider.transform(frame, config);
      results.push(transformed);

      logger.info("Frame transformed", {
        frameIndex: i,
        provider: config.provider,
      });
    } catch (error) {
      if (config.fallbackToOriginal) {
        logger.warn("AI transform failed, using original", {
          frameIndex: i,
          error: error.message,
        });
        results.push(frame);
      } else {
        throw error;
      }
    }
  }

  return results;
}
```

**5. Updated Pipeline**

```tsx
// functions/src/services/pipelineService.ts
async function processMedia(sessionId: string): Promise<SessionOutputs> {
  const session = await getSession(sessionId);
  const config = await loadConfigs(session);

  // Step 1: Validation
  await updateProcessingState(sessionId, "running", "validation");

  // Step 2: Load frames
  await updateProcessingState(sessionId, "running", "loading");
  let frames = await loadFramesAsBuffers(session.inputAssets);

  // Step 3: AI Transform (if configured) - FIRST
  if (config.experience.aiImageTransform?.enabled) {
    await updateProcessingState(sessionId, "running", "ai-transform");
    frames = await performAITransform(
      frames,
      config.experience.aiImageTransform
    );
  }

  // Step 4: Background removal (if configured)
  if (config.experience.backgroundRemoval?.enabled) {
    await updateProcessingState(sessionId, "running", "background-removal");
    frames = await Promise.all(
      frames.map((frame) =>
        processBackground(frame, config.experience.backgroundRemoval!)
      )
    );
  }

  // Step 5: Overlay (if configured)
  if (config.event.overlayAsset) {
    await updateProcessingState(sessionId, "running", "overlay");
    frames = await Promise.all(
      frames.map((frame) =>
        applyOverlay(frame, config.event.overlayAsset!, dimensions)
      )
    );
  }

  // Step 6: Final encoding
  await updateProcessingState(sessionId, "running", "encoding");
  return await encodeOutput(session, frames, config);
}
```

### Testing Checkpoint

- [ ] AI transform with Gemini works
- [ ] Prompt correctly passed to provider
- [ ] `fallbackToOriginal: true` + AI failure → original returned
- [ ] Works combined with background removal and overlay
- [ ] Provider can be swapped via config
- [ ] Logs show AI processing time

---
