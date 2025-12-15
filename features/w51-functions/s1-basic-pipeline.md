### Stage 1: Basic Pipeline - No Manipulation (Days 2-3)

**Goal**: End-to-end flow for passthrough processing. When no manipulations are configured, output the original media (single image) or composed media (GIF/video from burst).

### Key Principle

> When there are no manipulations (overlay, bg removal, AI transform), the output should be:
>
> - **Single image**: Original image URL
> - **Burst/multi-frame**: Composed GIF or video from original frames

### Deliverables

**1. API Endpoint**

```tsx
// functions/src/functions/processMedia.ts
import { onRequest, HttpsError } from "firebase-functions/v2/https";
import { Session } from "@clementine/shared";

export const processMedia = onRequest(
  {
    minInstances: 1, // Keep warm for user-facing requests
    timeoutSeconds: 30,
    cors: true,
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method not allowed");
      return;
    }

    const { sessionId } = req.body;

    // 1. Validate session exists and not already processing
    const session = await getSession(sessionId);
    if (!session) {
      throw new HttpsError("not-found", "Session not found");
    }

    if (session.processing?.state === "running") {
      res.json({ sessionId, status: "already_processing" });
      return;
    }

    // 2. Mark as pending
    await updateSession(sessionId, {
      processing: {
        state: "pending",
        currentStep: "queued",
        startedAt: new Date(),
        updatedAt: new Date(),
        attemptNumber: 1,
        taskId: `task-${sessionId}-${Date.now()}`,
      },
    });

    // 3. Queue Cloud Task
    await queueProcessingTask(sessionId);

    res.json({ sessionId, status: "queued" });
  }
);
```

**2. Task Processor**

```tsx
// functions/src/functions/processMediaJob.ts
import { onTaskDispatched } from "firebase-functions/v2/tasks";
import { logger } from "firebase-functions";

export const processMediaJob = onTaskDispatched(
  {
    retryConfig: {
      maxAttempts: 3,
      minBackoffSeconds: 30,
    },
    rateLimits: {
      maxConcurrentDispatches: 10,
    },
    timeoutSeconds: 1800, // 30 min for heavy processing
    minInstances: 0, // Cold starts OK for background jobs
  },
  async (req) => {
    const { sessionId } = req.data;

    logger.info("Processing started", { sessionId });

    try {
      // Update to running
      await updateProcessingState(sessionId, "running", "loading");

      // Load session and config
      const session = await getSession(sessionId);
      const config = await loadConfigs(session);

      // Determine output type
      const outputType = determineOutputType(session.inputAssets, config);

      // Process based on type
      let output: SessionOutputs;

      if (outputType === "passthrough-single") {
        output = await passthroughSingleImage(session);
      } else if (outputType === "compose-gif") {
        output = await composeGif(session, config);
      } else if (outputType === "compose-video") {
        output = await composeVideo(session, config);
      }

      // Save outputs and clear processing state
      await completeProcessing(sessionId, output);

      logger.info("Processing completed", { sessionId, format: output.format });
    } catch (error) {
      await handleProcessingError(sessionId, error, "unknown");
      throw error; // Re-throw for Cloud Tasks retry
    }
  }
);
```

**3. Output Type Determination**

```tsx
// functions/src/services/pipelineService.ts
type OutputType = "passthrough-single" | "compose-gif" | "compose-video";

function determineOutputType(
  inputAssets: InputAsset[],
  config: PipelineConfig
): OutputType {
  const hasManipulations =
    config.experience.aiImageTransform ||
    config.experience.backgroundRemoval ||
    config.event.overlayAsset;

  // Single image
  if (inputAssets.length === 1) {
    return "passthrough-single"; // Stage 1: no manipulation
  }

  // Multiple images - compose based on config
  if (config.experience.outputFormat === "mp4") {
    return "compose-video";
  }

  return "compose-gif"; // Default for multi-frame
}
```

**4. Passthrough Single Image**

```tsx
// functions/src/services/mediaService.ts
async function passthroughSingleImage(
  session: Session
): Promise<SessionOutputs> {
  const input = session.inputAssets[0];

  // For passthrough, just copy to outputs bucket and generate thumbnail
  const primaryUrl = await copyToOutputsBucket(input.url, session.id);
  const thumbnailUrl = await generateThumbnail(input.url, session.id);
  const metadata = await getImageMetadata(input.url);

  return {
    primaryUrl,
    thumbnailUrl,
    format: "image",
    dimensions: { width: metadata.width, height: metadata.height },
    sizeBytes: metadata.size,
    completedAt: new Date(),
    processingTimeMs: Date.now() - session.processing!.startedAt.getTime(),
  };
}
```

**5. GIF Composition (No Manipulation)**

```tsx
// functions/src/services/gifService.ts
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";

ffmpeg.setFfmpegPath(ffmpegPath);

async function composeGif(
  session: Session,
  config: PipelineConfig
): Promise<SessionOutputs> {
  const frames = session.inputAssets.sort((a, b) => a.order - b.order);
  const pattern = config.experience.framePattern || "1-2-3-4"; // e.g., "1-2-3-4-3-2-1"
  const frameDuration = config.experience.frameDuration || 0.5;

  // Download frames to temp
  const tempDir = `/tmp/${session.id}`;
  await fs.mkdir(tempDir, { recursive: true });

  const localFrames = await Promise.all(
    frames.map(async (frame, i) => {
      const localPath = `${tempDir}/frame-${i}.jpg`;
      await downloadFile(frame.url, localPath);
      return localPath;
    })
  );

  // Generate frame sequence from pattern
  const sequence = generateFrameSequence(localFrames, pattern);

  // Create GIF
  const outputPath = `${tempDir}/output.gif`;
  await createGifFromFrames(sequence, outputPath, {
    frameDuration,
    width: config.experience.outputWidth || 1080,
    loop: 0, // infinite loop
  });

  // Upload and cleanup
  const primaryUrl = await uploadToStorage(
    outputPath,
    `outputs/${session.id}/output.gif`
  );
  const thumbnailUrl = await generateThumbnail(localFrames[0], session.id);
  const stats = await fs.stat(outputPath);

  await fs.rm(tempDir, { recursive: true });

  return {
    primaryUrl,
    thumbnailUrl,
    format: "gif",
    dimensions: { width: config.experience.outputWidth || 1080, height: 1080 },
    sizeBytes: stats.size,
    completedAt: new Date(),
    processingTimeMs: Date.now() - session.processing!.startedAt.getTime(),
  };
}

function generateFrameSequence(frames: string[], pattern: string): string[] {
  // pattern: "1-2-3-4" or "1-2-3-4-3-2-1" for boomerang
  return pattern.split("-").map((n) => frames[parseInt(n) - 1]);
}

async function createGifFromFrames(
  frames: string[],
  outputPath: string,
  options: GifOptions
): Promise<void> {
  return new Promise((resolve, reject) => {
    const cmd = ffmpeg();

    frames.forEach((frame) => {
      cmd
        .input(frame)
        .inputOptions(["-loop", "1", "-t", String(options.frameDuration)]);
    });

    cmd
      .complexFilter([
        `concat=n=${frames.length}:v=1:a=0[v]`,
        `[v]scale=${options.width}:-1:flags=lanczos[scaled]`,
        `[scaled]split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse[out]`,
      ])
      .outputOptions(["-loop", String(options.loop)])
      .output(outputPath)
      .on("end", resolve)
      .on("error", reject)
      .run();
  });
}
```

**6. Video Composition**

```tsx
// functions/src/services/videoService.ts
async function composeVideo(
  session: Session,
  config: PipelineConfig
): Promise<SessionOutputs> {
  const frames = session.inputAssets.sort((a, b) => a.order - b.order);
  const fps = config.experience.fps || 5;

  const tempDir = `/tmp/${session.id}`;
  await fs.mkdir(tempDir, { recursive: true });

  // Download frames
  const localFrames = await Promise.all(
    frames.map(async (frame, i) => {
      const localPath = `${tempDir}/frame-${String(i).padStart(4, "0")}.jpg`;
      await downloadFile(frame.url, localPath);
      return localPath;
    })
  );

  // Create video
  const outputPath = `${tempDir}/output.mp4`;
  await createVideoFromFrames(tempDir, outputPath, {
    fps,
    width: config.experience.outputWidth || 1080,
  });

  const primaryUrl = await uploadToStorage(
    outputPath,
    `outputs/${session.id}/output.mp4`
  );
  const thumbnailUrl = await generateThumbnail(localFrames[0], session.id);
  const stats = await fs.stat(outputPath);

  await fs.rm(tempDir, { recursive: true });

  return {
    primaryUrl,
    thumbnailUrl,
    format: "mp4",
    dimensions: { width: config.experience.outputWidth || 1080, height: 1080 },
    sizeBytes: stats.size,
    completedAt: new Date(),
    processingTimeMs: Date.now() - session.processing!.startedAt.getTime(),
  };
}

async function createVideoFromFrames(
  inputDir: string,
  outputPath: string,
  options: VideoOptions
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(`${inputDir}/frame-%04d.jpg`)
      .inputFPS(options.fps)
      .outputOptions([
        "-c:v libx264",
        "-pix_fmt yuv420p",
        "-movflags +faststart",
        `-vf scale=${options.width}:-2`,
      ])
      .output(outputPath)
      .on("end", resolve)
      .on("error", reject)
      .run();
  });
}
```

**7. Client Real-time Subscription**

```tsx
// web/src/hooks/useSessionProcessing.ts
import { doc, onSnapshot } from "firebase/firestore";
import { Session } from "@clementine/shared";

export function useSessionProcessing(sessionId: string) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<
    "idle" | "processing" | "complete" | "error"
  >("idle");

  useEffect(() => {
    if (!sessionId) return;

    const unsubscribe = onSnapshot(doc(db, "sessions", sessionId), (doc) => {
      const data = doc.data() as Session;
      setSession(data);

      if (data.outputs) {
        setStatus("complete");
      } else if (data.processing?.state === "failed") {
        setStatus("error");
      } else if (data.processing) {
        setStatus("processing");
      }
    });

    return () => unsubscribe();
  }, [sessionId]);

  return { session, status };
}
```

**8. Helper Functions**

```tsx
// functions/src/services/processingService.ts
async function updateProcessingState(
  sessionId: string,
  state: ProcessingState["state"],
  step: string
): Promise<void> {
  await db.doc(`sessions/${sessionId}`).update({
    "processing.state": state,
    "processing.currentStep": step,
    "processing.updatedAt": FieldValue.serverTimestamp(),
  });

  logger.info("Processing state updated", {
    sessionId,
    state,
    step,
    labels: { component: "media-processor" },
  });
}

async function completeProcessing(
  sessionId: string,
  outputs: SessionOutputs
): Promise<void> {
  await db.doc(`sessions/${sessionId}`).update({
    outputs,
    processing: FieldValue.delete(), // Clear temporary state
  });

  logger.info("Processing completed", {
    sessionId,
    format: outputs.format,
    sizeBytes: outputs.sizeBytes,
    processingTimeMs: outputs.processingTimeMs,
    labels: { component: "media-processor", status: "success" },
  });
}
```

### Testing Checkpoint

- [ ] Single image session → outputs original image URL
- [ ] 4-image burst → outputs composed GIF
- [ ] Burst with `outputFormat: 'mp4'` → outputs MP4
- [ ] Client receives real-time updates (pending → running → complete)
- [ ] Logs show sessionId, step, and timing

---
