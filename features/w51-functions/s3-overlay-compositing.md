### Stage 3: Overlay Compositing (Days 6-7)

**Goal**: Apply overlay images from Event configuration.

### Deliverables

**1. Overlay Configuration Types**

```tsx
// packages/shared/src/types/event.types.ts
export interface OverlayConfig {
  assetUrl: string;
  position:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "center";
  offsetX?: number;
  offsetY?: number;
  scale?: number; // 0-1, relative to output size
  opacity?: number; // 0-1
}

export interface Event {
  id: string;
  projectId: string;
  name: string;
  overlayAsset?: OverlayConfig;
  // ... other fields
}
```

**2. Overlay Service**

```tsx
// functions/src/services/overlayService.ts
import sharp from "sharp";

const GRAVITY_MAP: Record<OverlayConfig["position"], string> = {
  "top-left": "northwest",
  "top-right": "northeast",
  "bottom-left": "southwest",
  "bottom-right": "southeast",
  center: "center",
};

async function applyOverlay(
  inputBuffer: Buffer,
  overlayConfig: OverlayConfig,
  outputDimensions: { width: number; height: number }
): Promise<Buffer> {
  // Download overlay
  const overlayBuffer = await downloadAsBuffer(overlayConfig.assetUrl);

  // Resize overlay if scale specified
  let processedOverlay = sharp(overlayBuffer);

  if (overlayConfig.scale) {
    const overlayWidth = Math.round(
      outputDimensions.width * overlayConfig.scale
    );
    processedOverlay = processedOverlay.resize(overlayWidth);
  }

  // Apply opacity if specified
  if (overlayConfig.opacity && overlayConfig.opacity < 1) {
    processedOverlay = processedOverlay.ensureAlpha().modulate({
      // Sharp doesn't have direct opacity, use composite with blend
    });
  }

  const resizedOverlay = await processedOverlay.toBuffer();

  // Composite
  return sharp(inputBuffer)
    .composite([
      {
        input: resizedOverlay,
        gravity: GRAVITY_MAP[overlayConfig.position],
        top: overlayConfig.offsetY || 0,
        left: overlayConfig.offsetX || 0,
      },
    ])
    .toBuffer();
}
```

**3. Updated Pipeline with Overlay Step**

```tsx
// functions/src/services/pipelineService.ts
async function processMedia(sessionId: string): Promise<SessionOutputs> {
  const session = await getSession(sessionId);
  const config = await loadConfigs(session);

  // Step 1: Validation
  await updateProcessingState(sessionId, "running", "validation");
  await validateAssets(session.inputAssets);

  // Step 2: Generate base output (passthrough or compose)
  await updateProcessingState(sessionId, "running", "composing");
  let frames = await getProcessedFrames(session, config);

  // Step 3: Apply overlay (if configured)
  if (config.event.overlayAsset) {
    await updateProcessingState(sessionId, "running", "overlay");

    frames = await Promise.all(
      frames.map((frame) =>
        applyOverlay(frame, config.event.overlayAsset, {
          width: config.experience.outputWidth || 1080,
          height: config.experience.outputHeight || 1080,
        })
      )
    );

    logger.info("Overlay applied", {
      sessionId,
      overlayPosition: config.event.overlayAsset.position,
      framesProcessed: frames.length,
    });
  }

  // Step 4: Final encoding
  await updateProcessingState(sessionId, "running", "encoding");
  return await encodeOutput(session, frames, config);
}
```

**4. GIF with Overlay**

```tsx
// functions/src/services/gifService.ts
async function composeGifWithOverlay(
  session: Session,
  config: PipelineConfig
): Promise<SessionOutputs> {
  const frames = session.inputAssets.sort((a, b) => a.order - b.order);
  const tempDir = `/tmp/${session.id}`;
  await fs.mkdir(tempDir, { recursive: true });

  // Download and process frames
  let processedFrames: Buffer[] = [];

  for (const [i, frame] of frames.entries()) {
    let buffer = await downloadAsBuffer(frame.url);

    // Apply overlay to each frame
    if (config.event.overlayAsset) {
      buffer = await applyOverlay(buffer, config.event.overlayAsset, {
        width: config.experience.outputWidth || 1080,
        height: config.experience.outputHeight || 1080,
      });
    }

    // Save processed frame
    const framePath = `${tempDir}/frame-${i}.png`;
    await fs.writeFile(framePath, buffer);
    processedFrames.push(buffer);
  }

  // Generate sequence and create GIF
  const pattern = config.experience.framePattern || "1-2-3-4";
  const sequencePaths = generateFrameSequence(
    frames.map((_, i) => `${tempDir}/frame-${i}.png`),
    pattern
  );

  const outputPath = `${tempDir}/output.gif`;
  await createGifFromFrames(sequencePaths, outputPath, {
    frameDuration: config.experience.frameDuration || 0.5,
    width: config.experience.outputWidth || 1080,
    loop: 0,
  });

  // ... upload and return
}
```

### Testing Checkpoint

- [ ] Session with `event.overlayAsset` → output has overlay
- [ ] Session without `event.overlayAsset` → output unchanged
- [ ] Overlay positions correctly (test all 5 positions)
- [ ] Overlay scales correctly with `scale` param
- [ ] Multi-frame GIF: overlay on each frame
- [ ] Logs show overlay step timing

---
