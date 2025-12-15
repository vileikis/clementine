### Stage 4: Background Removal (Days 8-9)

**Goal**: Remove or replace backgrounds using external API.

### Deliverables

**1. Background Config Types**

```tsx
// packages/shared/src/types/experience.types.ts
export interface BackgroundConfig {
  enabled: boolean;
  mode: "remove" | "replace-color" | "replace-image";
  replaceColor?: string; // hex color for replace-color mode
  replaceImageUrl?: string; // for replace-image mode
  fallbackToOriginal?: boolean; // if API fails
}

export interface Experience {
  id: string;
  name: string;
  backgroundRemoval?: BackgroundConfig;
  // ... other fields
}
```

**2. Background Removal Service**

```tsx
// functions/src/services/backgroundService.ts
import sharp from "sharp";

// Using remove.bg API as example
const REMOVEBG_API_KEY = process.env.REMOVEBG_API_KEY;
const REMOVEBG_URL = "https://api.remove.bg/v1.0/removebg";

async function removeBackground(inputBuffer: Buffer): Promise<Buffer> {
  const formData = new FormData();
  formData.append("image_file", new Blob([inputBuffer]), "image.png");
  formData.append("size", "auto");

  const response = await fetch(REMOVEBG_URL, {
    method: "POST",
    headers: {
      "X-Api-Key": REMOVEBG_API_KEY,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Background removal failed: ${error.errors?.[0]?.title}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function processBackground(
  inputBuffer: Buffer,
  config: BackgroundConfig
): Promise<Buffer> {
  if (!config.enabled) {
    return inputBuffer;
  }

  try {
    // Step 1: Remove background
    const transparent = await removeBackground(inputBuffer);

    // Step 2: Apply replacement based on mode
    switch (config.mode) {
      case "remove":
        return transparent; // Keep transparent

      case "replace-color":
        return replaceWithColor(transparent, config.replaceColor!);

      case "replace-image":
        return replaceWithImage(transparent, config.replaceImageUrl!);

      default:
        return transparent;
    }
  } catch (error) {
    logger.error("Background processing failed", { error: error.message });

    if (config.fallbackToOriginal) {
      logger.info("Falling back to original image");
      return inputBuffer;
    }

    throw error;
  }
}

async function replaceWithColor(
  transparentBuffer: Buffer,
  color: string
): Promise<Buffer> {
  const { width, height } = await sharp(transparentBuffer).metadata();

  // Create solid color background
  const background = await sharp({
    create: {
      width: width!,
      height: height!,
      channels: 3,
      background: color,
    },
  })
    .png()
    .toBuffer();

  // Composite transparent image on colored background
  return sharp(background)
    .composite([{ input: transparentBuffer }])
    .png()
    .toBuffer();
}

async function replaceWithImage(
  transparentBuffer: Buffer,
  backgroundUrl: string
): Promise<Buffer> {
  const { width, height } = await sharp(transparentBuffer).metadata();

  // Download and resize background image
  const bgBuffer = await downloadAsBuffer(backgroundUrl);
  const resizedBg = await sharp(bgBuffer)
    .resize(width, height, { fit: "cover" })
    .toBuffer();

  // Composite
  return sharp(resizedBg)
    .composite([{ input: transparentBuffer }])
    .png()
    .toBuffer();
}
```

**3. Updated Pipeline**

```tsx
// functions/src/services/pipelineService.ts
async function processMedia(sessionId: string): Promise<SessionOutputs> {
  const session = await getSession(sessionId);
  const config = await loadConfigs(session);

  // Step 1: Validation
  await updateProcessingState(sessionId, "running", "validation");
  await validateAssets(session.inputAssets);

  // Step 2: Load frames
  await updateProcessingState(sessionId, "running", "loading");
  let frames = await loadFramesAsBuffers(session.inputAssets);

  // Step 3: Background removal (if configured)
  if (config.experience.backgroundRemoval?.enabled) {
    await updateProcessingState(sessionId, "running", "background-removal");

    frames = await Promise.all(
      frames.map((frame) =>
        processBackground(frame, config.experience.backgroundRemoval!)
      )
    );

    logger.info("Background processed", {
      sessionId,
      mode: config.experience.backgroundRemoval.mode,
      framesProcessed: frames.length,
    });
  }

  // Step 4: Overlay (if configured)
  if (config.event.overlayAsset) {
    await updateProcessingState(sessionId, "running", "overlay");
    frames = await Promise.all(
      frames.map((frame) =>
        applyOverlay(frame, config.event.overlayAsset!, dimensions)
      )
    );
  }

  // Step 5: Final encoding
  await updateProcessingState(sessionId, "running", "encoding");
  return await encodeOutput(session, frames, config);
}
```

### Testing Checkpoint

- [ ] `backgroundRemoval.enabled: true` → background removed
- [ ] `mode: 'replace-color'` → solid color background
- [ ] `mode: 'replace-image'` → custom background image
- [ ] `fallbackToOriginal: true` + API failure → original returned
- [ ] Multi-frame: background removed from all frames
- [ ] Works combined with overlay

---
