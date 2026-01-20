# Transform Pipeline - Technical Specification

## 1. Architecture Overview

### 1.1 Data Model (Simplified for MVP)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         EXPERIENCE DOCUMENT                              │
│  Path: /workspaces/{workspaceId}/experiences/{experienceId}              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  draft: {                                                                │
│    steps: [                                                              │
│      { id: "step1", name: "Pet Choice", type: "input.multiSelect", ...}, │
│      { id: "step2", name: "Your Photo", type: "capture.photo", ...}      │
│    ],                                                                    │
│                                                                          │
│    // Transform is separate slot, not in steps array                     │
│    transform: {                                                          │
│      variableMappings: {                                                 │
│        pet: { stepId: "step1", type: "answer", defaultValue: "cat" },    │
│        photo: { stepId: "step2", type: "capturedMedia" }                 │
│      },                                                                  │
│      nodes: [                                                            │
│        { type: "removeBackground", input: {...} },                       │
│        { type: "aiImage", promptTemplate: "...", ... }                   │
│      ],                                                                  │
│      outputFormat: "image"                                               │
│    }                                                                     │
│  },                                                                      │
│                                                                          │
│  published: { ... }  // Same structure, snapshotted on publish           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                           SESSION DOCUMENT                               │
│  Path: /projects/{projectId}/sessions/{sessionId}                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  answers: [...],                   // Collected from input steps         │
│  capturedMedia: [...],             // Collected from capture steps       │
│  jobId: "job123" | null,           // Transform job reference            │
│  jobStatus: "pending" | "running" | "completed" | "failed" | null,       │
│  resultMedia: { url, assetId, ... } | null                               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                             JOB DOCUMENT                                 │
│  Path: /projects/{projectId}/jobs/{jobId}                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  id: "job123",                                                           │
│  sessionId: "session456",                                                │
│  experienceId: "exp789",                                                 │
│  status: "pending" | "running" | "completed" | "failed",                 │
│  progress: { currentNode: 2, totalNodes: 3, message: "..." },            │
│  inputs: { answers: [...], capturedMedia: [...] },                       │
│  output: { assetId, url, format, ... } | null,                           │
│  error: { code, message } | null,                                        │
│  timestamps: { created, started, completed }                             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Note**: Transform config is embedded in experience document (no separate collection).
This simplifies versioning (follows experience draft/published) and speeds up MVP delivery.
See decisions.md D23 for rationale.

### 1.2 Data Flow

```
Guest completes experience steps (info, input, capture)
                    │
                    ▼
┌───────────────────────────────────────┐
│ Client: Runtime detects all steps done │
│ - Checks if experience.transform exists│
│ - If yes, shows transform phase UI     │
│ - Calls startTransformJob()            │
└───────────────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│ HTTP Function: startTransformPipeline  │
│ - Validates session                    │
│ - Fetches experience with transform    │
│ - Creates job document                 │
│ - Queues Cloud Task                    │
│ - Updates session.jobId                │
└───────────────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│ Cloud Task: transformPipelineJob       │
│ - Reads transform config from job/exp  │
│ - Resolves variables from session data │
│ - Executes nodes in order              │
│ - Uploads result to Storage            │
│ - Updates session.resultMedia          │
│ - Updates session.jobStatus            │
└───────────────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│ Client: Firestore subscription         │
│ - Detects session.jobStatus change     │
│ - Shows progress during "running"      │
│ - On "completed", redirects to share   │
│ - On "failed", shows error + retry     │
└───────────────────────────────────────┘
```

### 1.3 Runtime Adaptation

Since transform is a separate slot (not in steps array), the runtime handles it as a phase:

```typescript
// ExperienceRuntime pseudo-code

const allSteps = useMemo(() => {
  const base = experience.draft.steps

  // Inject transform as virtual step at end
  if (experience.draft.transform) {
    return [
      ...base,
      {
        id: 'transform',
        type: 'transform.pipeline',
        name: 'Processing',
        config: experience.draft.transform
      }
    ]
  }
  return base
}, [experience.draft])

// Rest of runtime iterates through allSteps as normal
```

## 2. Data Schemas

### 2.0 Step Schema Update (All Steps)

```typescript
// apps/clementine-app/src/domains/experience/steps/schemas/step.schema.ts

/**
 * Base step fields - ALL steps get these
 * Adding `name` field for display and variable referencing
 */
export const baseStepSchema = z.object({
  /** Unique step identifier (UUID) */
  id: z.uuid(),

  /** Step type from registry */
  type: stepTypeSchema,

  /** Human-readable name (NEW - required)
   * Auto-generated on creation: "Photo Capture 1", "Scale Question 2"
   * User can edit
   */
  name: z.string().min(1).max(50),

  /** Type-specific config */
  config: z.record(z.string(), z.unknown()),
})
```

### 2.1 Experience Config Schema (Updated)

```typescript
// apps/clementine-app/src/domains/experience/shared/schemas/experience.schema.ts

/**
 * Experience Config - contains steps and optional transform
 * Transform is a separate slot, not in steps array
 */
export const experienceConfigSchema = z.looseObject({
  /**
   * User-facing steps (info, input, capture)
   * Does NOT include transform - that's a separate slot
   */
  steps: z.array(stepSchema).default([]),

  /**
   * Transform configuration (optional)
   * Processed after all steps complete
   * null = no transform, experience ends after last step
   */
  transform: transformConfigSchema.nullable().default(null),
})
```

### 2.2 Transform Config (Embedded in Experience)

```typescript
// apps/clementine-app/src/domains/experience/shared/schemas/transform.schema.ts

/**
 * Variable mapping - maps a variable name to a step's data
 * Used at root level of transform config
 */
export const variableMappingSchema = z.object({
  /** Type of data being referenced */
  type: z.enum(['answer', 'capturedMedia']),

  /** ID of the step to get data from */
  stepId: z.string(),

  /** Optional: specific field within the answer (for structured answers) */
  field: z.string().nullable().default(null),

  /**
   * Default/fallback value if step data is empty or missing
   * Used when: step was skipped, answer is empty, or step doesn't exist
   */
  defaultValue: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null()
  ]).default(null),
})

/**
 * Media reference - points to a media asset in the media library
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
 * Node input source - where the node gets its input image/media
 */
export const nodeInputSourceSchema = z.discriminatedUnion('source', [
  // From a variable (defined in variableMappings)
  z.object({
    source: z.literal('variable'),
    variableName: z.string(),
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
 *
 * Display name: "Cut Out"
 * Icon: ✂️
 */
export const removeBackgroundNodeSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('removeBackground'),
  input: nodeInputSourceSchema,

  /** Keep subject (person) or remove subject (keep background) */
  mode: z.enum(['keepSubject', 'keepBackground']).default('keepSubject'),
})

/**
 * Background source - either static asset or node output
 */
export const backgroundSourceSchema = z.discriminatedUnion('type', [
  // Static background image from media library
  z.object({
    type: z.literal('asset'),
    asset: mediaReferenceSchema,
  }),
  // Dynamic background from another node's output (e.g., AI-generated)
  z.object({
    type: z.literal('node'),
    nodeId: z.string(),
  }),
])

/**
 * Background Swap Node (Convenience Node)
 *
 * Display name: "Background Swap"
 * Icon: 🖼️
 *
 * This is a convenience node that internally combines:
 * 1. Remove background from input
 * 2. Composite subject onto new background
 *
 * Simplifies the common use case of replacing backgrounds
 * without requiring manual removeBackground + composite setup.
 */
export const backgroundSwapNodeSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('backgroundSwap'),
  input: nodeInputSourceSchema,

  /** Background source - static asset OR node output */
  backgroundSource: backgroundSourceSchema,
})

/**
 * Layer configuration for composite node
 */
export const compositeLayerSchema = z.object({
  /** Layer source - variable, node output, or asset */
  source: z.discriminatedUnion('type', [
    z.object({ type: z.literal('variable'), variableName: z.string() }),
    z.object({ type: z.literal('node'), nodeId: z.string() }),
    z.object({ type: z.literal('previousNode') }),
    z.object({ type: z.literal('asset'), asset: mediaReferenceSchema }),
  ]),

  /** Position in stack (0 = bottom/background) */
  zIndex: z.number().int().min(0).default(0),

  /** How to fit the layer */
  fit: z.enum(['cover', 'contain', 'stretch', 'none']).default('cover'),

  /** Opacity (0-1) */
  opacity: z.number().min(0).max(1).default(1),
})

/**
 * Composite Node (Unified Layering)
 *
 * Display name: "Combine"
 * Icon: 🔲
 *
 * Replaces separate backgroundSwap and applyOverlay nodes.
 * Layers multiple images together with configurable stacking order.
 * If any layer is video, output becomes video.
 */
export const compositeNodeSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('composite'),

  /**
   * Layers to combine (ordered by zIndex)
   * Typically: background (0), content (1), overlay (2)
   */
  layers: z.array(compositeLayerSchema).min(1),

  /** Output format - auto-detect from inputs or force specific format */
  outputFormat: z.enum(['auto', 'image', 'gif', 'video']).default('auto'),
})

/**
 * AI Image Generation Node
 *
 * Display name: "AI Image"
 * Icon: ✨
 */
export const aiImageNodeSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('aiImage'),
  input: nodeInputSourceSchema,

  /**
   * Prompt template with variable placeholders
   * Variables use {{variableName}} syntax
   * Variables must be defined in root-level variableMappings
   * Example: "Transform with {{pet}} in hands"
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
 * Union of all node types (MVP)
 *
 * Node naming:
 * - removeBackground → "Cut Out" ✂️
 * - composite → "Combine" 🔲
 * - backgroundSwap → "Background Swap" 🖼️ (convenience node)
 * - aiImage → "AI Image" ✨
 */
export const transformNodeSchema = z.discriminatedUnion('type', [
  removeBackgroundNodeSchema,   // Cut Out
  compositeNodeSchema,          // Combine
  backgroundSwapNodeSchema,     // Background Swap (convenience)
  aiImageNodeSchema,            // AI Image
  // Future:
  // aiVideoNodeSchema,         // AI Video 🎬
  // aiTextNodeSchema,          // AI Text 📝
])

/**
 * Complete Transform Config (Embedded in Experience)
 *
 * Structure:
 * - variableMappings: INPUTS - map variable names to step data
 * - nodes: PIPELINE - ordered array of transform operations
 * - outputFormat: OUTPUT - final format
 *
 * Note: This is embedded in experience.draft.transform and experience.published.transform
 * No separate collection needed - versioning follows experience versioning.
 */
export const transformConfigSchema = z.object({
  /**
   * INPUTS: Variable mappings
   * Maps variable names to step data (answers or captured media)
   * These variables can be used in node inputs and prompt templates
   *
   * Example:
   * {
   *   pet: { type: "answer", stepId: "step1", defaultValue: "cat" },
   *   photo: { type: "capturedMedia", stepId: "step3", defaultValue: null }
   * }
   */
  variableMappings: z.record(z.string(), variableMappingSchema).default({}),

  /**
   * PIPELINE: Ordered array of transform nodes
   * Nodes execute sequentially, each can reference:
   * - Variables from variableMappings
   * - Previous node's output
   * - Specific node's output (by nodeId)
   */
  nodes: z.array(transformNodeSchema).min(1),

  /** OUTPUT: Expected output format */
  outputFormat: z.enum(['image', 'gif', 'video']).default('image'),

  /** Loading message shown during processing */
  loadingMessage: z.string().max(200).nullable().default(null),
})

export type TransformConfig = z.infer<typeof transformConfigSchema>
export type TransformNode = z.infer<typeof transformNodeSchema>
export type VariableMapping = z.infer<typeof variableMappingSchema>
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
