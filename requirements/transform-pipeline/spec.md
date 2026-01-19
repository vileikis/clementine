# Transform Pipeline - Technical Specification

## 1. Architecture Overview

### 1.1 Client-Server Split

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT SIDE                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Experience Config (draft/published)                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ steps: [                                                            │ │
│  │   { id: "step1", type: "input.multiSelect", config: {...} },       │ │
│  │   { id: "step2", type: "capture.photo", config: {...} },           │ │
│  │   { id: "step3", type: "transform.pipeline", config: {             │ │
│  │       // REDACTED - Only metadata visible to client                │ │
│  │       nodeCount: 3,                                                 │ │
│  │       estimatedDurationSec: 30,                                     │ │
│  │       outputFormat: "image"                                         │ │
│  │   }}                                                                │ │
│  │ ]                                                                   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  Session (subscribed via Firestore)                                      │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ answers: [...],                                                     │ │
│  │ capturedMedia: [...],                                               │ │
│  │ jobId: "job123" | null,                                             │ │
│  │ jobStatus: "pending" | "running" | "completed" | "failed" | null,   │ │
│  │ resultMedia: { url, assetId, ... } | null                           │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                             SERVER SIDE                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Transform Config (Firestore - separate collection or subcollection)     │
│  Path: /experiences/{experienceId}/transformConfigs/{stepId}             │
│     OR /projects/{projectId}/transformConfigs/{stepId}                   │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ stepId: "step3",                                                    │ │
│  │ nodes: [                                                            │ │
│  │   { type: "removeBackground", input: "capture:step2", ... },        │ │
│  │   { type: "aiImage", prompt: "...", references: [...], ... },       │ │
│  │   { type: "applyOverlay", overlayAssetId: "...", ... }              │ │
│  │ ],                                                                  │ │
│  │ outputFormat: "image",                                              │ │
│  │ createdAt: ...,                                                     │ │
│  │ updatedAt: ...                                                      │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  Job Document (Firestore)                                                │
│  Path: /projects/{projectId}/jobs/{jobId}                                │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ id: "job123",                                                       │ │
│  │ sessionId: "session456",                                            │ │
│  │ experienceId: "exp789",                                             │ │
│  │ stepId: "step3",                                                    │ │
│  │ status: "pending" | "running" | "completed" | "failed",             │ │
│  │ progress: { currentNode: 2, totalNodes: 3, message: "..." },        │ │
│  │ inputs: { answers: [...], capturedMedia: [...] },                   │ │
│  │ outputs: { assetId, url, format, ... } | null,                      │ │
│  │ error: { code, message } | null,                                    │ │
│  │ createdAt: ...,                                                     │ │
│  │ startedAt: ...,                                                     │ │
│  │ completedAt: ...                                                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Data Flow

```
Guest completes experience steps
            │
            ▼
┌─────────────────────────────┐
│ Client: Transform Renderer  │
│ - Shows loading UI          │
│ - Calls startTransformJob() │
└─────────────────────────────┘
            │
            ▼
┌─────────────────────────────┐
│ HTTP Function:              │
│ startTransformPipeline      │
│ - Validates session         │
│ - Creates job document      │
│ - Queues Cloud Task         │
│ - Updates session.jobId     │
└─────────────────────────────┘
            │
            ▼
┌─────────────────────────────┐
│ Cloud Task:                 │
│ transformPipelineJob        │
│ - Fetches transform config  │
│ - Resolves step references  │
│ - Executes nodes in order   │
│ - Uploads result to Storage │
│ - Updates session.resultMedia│
└─────────────────────────────┘
            │
            ▼
┌─────────────────────────────┐
│ Client: Firestore listener  │
│ - Detects jobStatus change  │
│ - Redirects to share screen │
└─────────────────────────────┘
```

## 2. Data Schemas

### 2.1 Transform Step Config (Client-Visible - Minimal)

```typescript
// apps/clementine-app/src/domains/experience/steps/schemas/transform-pipeline.schema.ts

/**
 * Client-visible transform config
 * Contains ONLY non-sensitive metadata
 */
export const transformPipelineStepConfigSchema = z.object({
  /** Number of nodes in pipeline (for progress estimation) */
  nodeCount: z.number().int().min(1).default(1),

  /** Estimated processing duration in seconds */
  estimatedDurationSec: z.number().int().min(1).default(30),

  /** Expected output format */
  outputFormat: z.enum(['image', 'gif', 'video']).default('image'),

  /** Loading message to show during processing */
  loadingMessage: z.string().max(200).nullable().default(null),
})
```

### 2.2 Transform Config (Server-Only - Full Details)

```typescript
// functions/src/lib/schemas/transform-config.schema.ts

/**
 * Step reference - points to data from a previous step
 */
export const stepReferenceSchema = z.object({
  /** Type of reference */
  type: z.enum(['answer', 'capturedMedia']),

  /** ID of the step to reference */
  stepId: z.string(),

  /** Optional: specific field within the answer (for multi-select, etc.) */
  field: z.string().nullable().default(null),
})

/**
 * Media reference - points to a media asset
 */
export const mediaReferenceSchema = z.object({
  /** Asset ID in media library */
  assetId: z.string(),

  /** URL for the asset */
  url: z.string().url(),

  /** Optional label for reference in prompts (e.g., "cat image") */
  label: z.string().nullable().default(null),
})

/**
 * Node input source - where the node gets its input
 */
export const nodeInputSourceSchema = z.discriminatedUnion('source', [
  // From a previous step's captured media
  z.object({
    source: z.literal('capturedMedia'),
    stepId: z.string(),
  }),
  // From the previous node's output
  z.object({
    source: z.literal('previousNode'),
  }),
  // From a specific node's output (for branching pipelines)
  z.object({
    source: z.literal('node'),
    nodeId: z.string(),
  }),
])

/**
 * Remove Background Node
 */
export const removeBackgroundNodeSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('removeBackground'),
  input: nodeInputSourceSchema,

  /** Keep subject (person) or remove subject (keep background) */
  mode: z.enum(['keepSubject', 'keepBackground']).default('keepSubject'),
})

/**
 * Background Swap Node
 */
export const backgroundSwapNodeSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('backgroundSwap'),
  input: nodeInputSourceSchema,

  /** Static background image */
  backgroundAsset: mediaReferenceSchema,
})

/**
 * Apply Overlay Node
 */
export const applyOverlayNodeSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('applyOverlay'),
  input: nodeInputSourceSchema,

  /** Overlay image (PNG with transparency) */
  overlayAsset: mediaReferenceSchema,

  /** Position of overlay */
  position: z.enum(['stretch', 'center', 'topLeft', 'topRight', 'bottomLeft', 'bottomRight']).default('stretch'),

  /** Opacity (0-1) */
  opacity: z.number().min(0).max(1).default(1),
})

/**
 * AI Image Generation Node
 */
export const aiImageNodeSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('aiImage'),
  input: nodeInputSourceSchema,

  /**
   * Prompt template with variable placeholders
   * Variables use {{variableName}} syntax
   * Special variables:
   * - {{step:stepId}} - replaced with answer from step
   * - {{step:stepId:fieldName}} - replaced with specific field from step answer
   */
  promptTemplate: z.string().min(1).max(5000),

  /** Referenced images for the AI model */
  references: z.array(mediaReferenceSchema).max(10).default([]),

  /** AI model to use */
  model: z.enum([
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-3.0',
  ]).default('gemini-2.5-flash'),

  /** Output aspect ratio */
  aspectRatio: z.enum(['1:1', '3:2', '2:3', '9:16', '16:9']).default('1:1'),

  /**
   * Variable mappings - maps step inputs to prompt variables
   * Key: variable name in prompt (without {{ }})
   * Value: step reference
   */
  variableMappings: z.record(z.string(), stepReferenceSchema).default({}),
})

/**
 * Compose GIF Node (Future)
 */
export const composeGifNodeSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('composeGif'),

  /** Array of inputs (one per frame) */
  inputs: z.array(nodeInputSourceSchema).min(2).max(10),

  /** Frame duration in milliseconds */
  frameDurationMs: z.number().int().min(50).max(2000).default(500),

  /** Whether to loop */
  loop: z.boolean().default(true),
})

/**
 * Apply Video Background Node (Future)
 */
export const applyVideoBackgroundNodeSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('applyVideoBackground'),
  input: nodeInputSourceSchema,

  /** Background video asset */
  backgroundVideoAsset: mediaReferenceSchema,

  /** Duration of output video in seconds */
  durationSec: z.number().min(1).max(30).default(5),
})

/**
 * Union of all node types
 */
export const transformNodeSchema = z.discriminatedUnion('type', [
  removeBackgroundNodeSchema,
  backgroundSwapNodeSchema,
  applyOverlayNodeSchema,
  aiImageNodeSchema,
  // Future:
  // composeGifNodeSchema,
  // applyVideoBackgroundNodeSchema,
])

/**
 * Complete Transform Config (Server-Only)
 */
export const transformConfigSchema = z.object({
  /** Step ID this config belongs to */
  stepId: z.string(),

  /** Experience ID */
  experienceId: z.string(),

  /** Version (syncs with experience draft/published version) */
  version: z.number().int().min(1),

  /** Whether this is draft or published */
  configType: z.enum(['draft', 'published']),

  /** Ordered array of transform nodes */
  nodes: z.array(transformNodeSchema).min(1),

  /** Expected output format */
  outputFormat: z.enum(['image', 'gif', 'video']).default('image'),

  /** Timestamps */
  createdAt: z.number(),
  updatedAt: z.number(),
})

export type TransformConfig = z.infer<typeof transformConfigSchema>
export type TransformNode = z.infer<typeof transformNodeSchema>
```

### 2.3 Job Schema

```typescript
// functions/src/lib/schemas/transform-job.schema.ts

export const jobStatusSchema = z.enum([
  'pending',    // Job created, waiting to be picked up
  'running',    // Job is being processed
  'completed',  // Job finished successfully
  'failed',     // Job failed
  'cancelled',  // Job was cancelled
])

export const jobProgressSchema = z.object({
  /** Current node being processed (0-indexed) */
  currentNode: z.number().int().min(0),

  /** Total number of nodes */
  totalNodes: z.number().int().min(1),

  /** Human-readable status message */
  message: z.string().nullable().default(null),

  /** Percentage complete (0-100) */
  percentComplete: z.number().min(0).max(100).default(0),
})

export const jobOutputSchema = z.object({
  /** Asset ID in storage */
  assetId: z.string(),

  /** Public URL */
  url: z.string().url(),

  /** Output format */
  format: z.enum(['image', 'gif', 'video']),

  /** MIME type */
  mimeType: z.string(),

  /** File size in bytes */
  sizeBytes: z.number().int(),

  /** Dimensions */
  width: z.number().int(),
  height: z.number().int(),
})

export const jobErrorSchema = z.object({
  /** Error code */
  code: z.enum([
    'INVALID_INPUT',
    'PROCESSING_FAILED',
    'AI_MODEL_ERROR',
    'STORAGE_ERROR',
    'TIMEOUT',
    'CANCELLED',
    'UNKNOWN',
  ]),

  /** Human-readable error message */
  message: z.string(),

  /** Node that failed (if applicable) */
  failedNodeId: z.string().nullable().default(null),
})

export const transformJobSchema = z.looseObject({
  /** Job ID (Firestore document ID) */
  id: z.string(),

  /** Session that triggered this job */
  sessionId: z.string(),

  /** Project ID */
  projectId: z.string(),

  /** Experience ID */
  experienceId: z.string(),

  /** Transform step ID */
  stepId: z.string(),

  /** Job status */
  status: jobStatusSchema.default('pending'),

  /** Progress info */
  progress: jobProgressSchema.nullable().default(null),

  /** Snapshot of inputs at job creation time */
  inputs: z.object({
    answers: z.array(z.unknown()),
    capturedMedia: z.array(z.unknown()),
  }),

  /** Output (when completed) */
  output: jobOutputSchema.nullable().default(null),

  /** Error info (when failed) */
  error: jobErrorSchema.nullable().default(null),

  /** Timestamps */
  createdAt: z.number(),
  startedAt: z.number().nullable().default(null),
  completedAt: z.number().nullable().default(null),

  /** Processing metadata */
  processingTimeMs: z.number().int().nullable().default(null),
})

export type TransformJob = z.infer<typeof transformJobSchema>
```

### 2.4 Session Schema Updates

```typescript
// Updates to session.schema.ts

/**
 * Add to session schema
 */
export const sessionSchema = z.looseObject({
  // ... existing fields ...

  /** Transform job tracking */
  jobId: z.string().nullable().default(null),
  jobStatus: jobStatusSchema.nullable().default(null),

  // Note: resultMedia already exists
})
```

## 3. API Design

### 3.1 HTTP Function: startTransformPipeline

```typescript
// functions/src/http/startTransformPipeline.ts

/**
 * Request body
 */
interface StartTransformPipelineRequest {
  sessionId: string
  stepId: string
}

/**
 * Response
 */
interface StartTransformPipelineResponse {
  success: boolean
  jobId: string
  message: string
}

/**
 * Error responses
 */
// 400: Invalid request (missing fields, invalid session state)
// 404: Session not found, Experience not found, Transform config not found
// 409: Job already in progress
// 500: Internal error
```

### 3.2 Cloud Task: transformPipelineJob

```typescript
// functions/src/tasks/transformPipelineJob.ts

/**
 * Task payload
 */
interface TransformPipelineJobPayload {
  jobId: string
  sessionId: string
  projectId: string
}
```

## 4. Security Model

### 4.1 Firestore Security Rules

```javascript
// Transform configs - admin only
match /experiences/{experienceId}/transformConfigs/{stepId} {
  // Only admins can read/write
  allow read, write: if isAdmin();
}

// Jobs - admin read, server write
match /projects/{projectId}/jobs/{jobId} {
  // Admins can read job status
  allow read: if isProjectAdmin(projectId);

  // Only server (admin SDK) can write
  allow write: if false;
}

// Session - guests can read their own session
match /projects/{projectId}/sessions/{sessionId} {
  allow read: if isSessionOwner(sessionId) || isProjectAdmin(projectId);
  // Note: jobStatus and resultMedia updates happen server-side
}
```

### 4.2 What Clients Can See

| Data | Admin | Guest |
|------|-------|-------|
| Transform step exists | ✅ | ✅ |
| Node count | ✅ | ✅ |
| Node details/prompts | ✅ (editor) | ❌ |
| Job status | ✅ | ✅ (own session) |
| Job progress | ✅ | ✅ (own session) |
| Result media | ✅ | ✅ (own session) |

## 5. Transform Node Execution

### 5.1 Node Execution Order

Nodes execute sequentially in array order. Each node receives:
1. Input (from specified source)
2. Config (node-specific settings)
3. Resolved variables (for AI nodes)

### 5.2 Variable Resolution

For AI Image nodes, variables in the prompt template are resolved:

```
Input prompt: "Transform {{step:step1}} with {{pet}} in their hands"

Variable mappings:
{
  "pet": { type: "answer", stepId: "step2" }
}

Session answers:
[
  { stepId: "step1", value: "captured photo" },
  { stepId: "step2", value: "cat" }
]

Resolved prompt: "Transform captured photo with cat in their hands"
```

### 5.3 Error Handling

- If any node fails, the entire pipeline fails
- Job status is set to 'failed' with error details
- Session.jobStatus reflects the failure
- Client shows error message and retry option

## 6. Client Implementation

### 6.1 Transform Step Renderer

```typescript
// Pseudo-code for transform renderer

function TransformPipelineRunMode() {
  const { session } = useRuntime()

  // Subscribe to session changes (already handled by ExperienceRuntime)

  // Start job on mount
  useEffect(() => {
    if (!session.jobId) {
      startTransformJob({ sessionId: session.id, stepId: currentStep.id })
    }
  }, [])

  // Handle job completion
  useEffect(() => {
    if (session.jobStatus === 'completed') {
      // Navigate to share/result screen
      goToResult()
    }
  }, [session.jobStatus])

  // Render based on state
  if (session.jobStatus === 'failed') {
    return <ErrorState onRetry={retryJob} />
  }

  return <LoadingState progress={jobProgress} />
}
```

### 6.2 Admin Config Panel

The admin needs a way to configure transform nodes. This involves:

1. **Node list** - Drag-and-drop reorderable list of nodes
2. **Node editor** - Type-specific configuration for each node
3. **Variable picker** - UI to select inputs from previous steps
4. **Preview** - Validate pipeline configuration

## 7. Storage Paths

```
Firebase Storage structure:

/projects/{projectId}/
  /sessions/{sessionId}/
    /captures/           # Raw captured media
      {captureId}.jpg
    /results/            # Transform outputs
      {jobId}.jpg
      {jobId}.gif
      {jobId}.mp4

  /transform-assets/     # Referenced assets for transforms
    {assetId}.jpg        # Background images, overlays, etc.
```

## 8. Performance Considerations

### 8.1 Timeouts

- HTTP function: 60 seconds (just queues the task)
- Cloud Task: 540 seconds (9 minutes) for processing
- Consider: Long-running video processing may need async polling

### 8.2 Concurrency

- Rate limit Cloud Tasks to prevent overload
- Consider queue priority for paying customers

### 8.3 Caching

- Cache AI model responses where possible
- Cache downloaded reference images during pipeline execution
