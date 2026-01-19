# Transform Pipeline - Discussion Points

## Key Architectural Decision: Split Storage Model

The most critical design decision is how to handle the **security requirement** that transform configs (prompts, node details) never reach the client.

### Proposed Solution: Dual Document Model

```
Experience Document (client-readable)
├── draft/published
│   └── steps[]
│       └── { type: "transform.pipeline", config: { nodeCount, estimatedDuration } }
│                                                   ↑ MINIMAL METADATA ONLY

Transform Config Document (server-only)
└── /experiences/{expId}/transformConfigs/{stepId}
    └── { nodes: [...full config...], promptTemplates, variableMappings }
```

**Why this approach**:
1. Experience document stays lightweight and cacheable
2. Security rules can explicitly deny client access to transformConfigs collection
3. Admin app can still read both (authenticated with proper claims)
4. Cloud Functions use Admin SDK to read full config

**Alternative considered**: Encrypted field in experience document
- Rejected because: Key management complexity, still transmitted to client

---

## Step Reference System

Transform nodes need to reference data from previous steps. This creates a dependency graph:

```
Step 1: input.multiSelect (id: "petChoice")    →  Answer: "cat"
Step 2: input.shortText (id: "phrase")         →  Answer: "Hello!"
Step 3: capture.photo (id: "photo")            →  Media: { url, assetId }
Step 4: transform.pipeline                     →  References steps 1, 2, 3
```

### Reference Syntax

For prompts (string templates):
```
"Transform person with {{step:petChoice}} in hands. Add text: {{step:phrase}}"
```

For node inputs (structured):
```json
{
  "input": { "source": "capturedMedia", "stepId": "photo" }
}
```

### Validation Requirements

1. **At save time**: Verify referenced steps exist and are before transform step
2. **At publish time**: Same + verify assets exist
3. **At execution time**: Verify data actually present in session

---

## Node Composition Patterns

### Pattern 1: Linear Pipeline
```
[capture] → [removeBackground] → [applyOverlay] → [output]
```
Simple, each node feeds into next.

### Pattern 2: Branching Pipeline
```
[capture] ─┬→ [removeBackground] → [compositeImages] → [output]
           │                              ↑
           └→ [aiGenerateBackground] ─────┘
```
Multiple nodes feed into one. Requires node-to-node references.

### Pattern 3: Multi-Input (GIF)
```
[capture frame 1] → [removeBg] ─┐
[capture frame 2] → [removeBg] ─┼→ [composeGif] → [output]
[capture frame 3] → [removeBg] ─┤
[capture frame 4] → [removeBg] ─┘
```
Multiple inputs combine into single output.

### Recommendation

MVP: Support Pattern 1 and Pattern 2
Future: Add Pattern 3 for GIF/video

---

## Admin UI Considerations

### Config Panel Structure

```
┌─────────────────────────────────────────────┐
│ Transform Pipeline Configuration            │
├─────────────────────────────────────────────┤
│                                             │
│ Nodes:                              [+ Add] │
│ ┌─────────────────────────────────────────┐ │
│ │ ≡ 1. Remove Background          [Edit] │ │
│ │     Input: Capture Photo (step3)       │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ ≡ 2. AI Transform               [Edit] │ │
│ │     Model: Gemini 2.5 Pro              │ │
│ │     Prompt: "Transform into hobbit..." │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ ≡ 3. Apply Overlay              [Edit] │ │
│ │     Overlay: Brand Frame               │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Output Format: [Image ▼]                    │
│ Estimated Time: ~30 seconds                 │
│                                             │
│ [Test Pipeline]              [Save Draft]   │
└─────────────────────────────────────────────┘
```

### Node Editor Modal

```
┌─────────────────────────────────────────────┐
│ Edit Node: AI Transform                     │
├─────────────────────────────────────────────┤
│                                             │
│ Input Source:                               │
│ [Previous Node ▼]                           │
│                                             │
│ AI Model:                                   │
│ [Gemini 2.5 Pro ▼]                         │
│                                             │
│ Aspect Ratio:                               │
│ [1:1 ▼]                                    │
│                                             │
│ Prompt:                                     │
│ ┌─────────────────────────────────────────┐ │
│ │ Transform the person into a hobbit     │ │
│ │ with {{pet}} in their hands.           │ │
│ │                                        │ │
│ │ [+ Insert Variable]                    │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Variables Used:                             │
│ • pet → Step: "Pet Choice" (multiSelect)   │
│   [Change Mapping]                          │
│                                             │
│ Reference Images:                   [+ Add] │
│ ┌─────┐ ┌─────┐ ┌─────┐                    │
│ │ 🐱  │ │ 🐕  │ │ 🐔  │                    │
│ │ cat │ │ dog │ │ chkn│                    │
│ └─────┘ └─────┘ └─────┘                    │
│                                             │
│ [Cancel]                      [Save Node]   │
└─────────────────────────────────────────────┘
```

---

## Client Runtime Flow

### State Machine

```
               ┌────────────────────┐
               │      IDLE          │
               │ (waiting to start) │
               └─────────┬──────────┘
                         │ onMount
                         ▼
               ┌────────────────────┐
               │    STARTING        │
               │ (calling API)      │
               └─────────┬──────────┘
                         │ API returns jobId
                         ▼
               ┌────────────────────┐
        ┌──────│    PROCESSING      │──────┐
        │      │ (subscribed to job)│      │
        │      └─────────┬──────────┘      │
        │                │                 │
        │ jobStatus:     │ jobStatus:      │ error
        │ 'completed'    │ 'running'       │
        ▼                │ (update UI)     ▼
┌──────────────┐         │        ┌──────────────┐
│   SUCCESS    │         │        │    FAILED    │
│ (redirect)   │         │        │ (show error) │
└──────────────┘         │        └──────┬───────┘
                         │               │ retry
                         │               │
                         └───────────────┘
```

### Loading UI

Options for what to show during processing:

1. **Simple spinner** - Minimal, but no feedback
2. **Progress bar** - Percentage based on node count
3. **Step indicator** - "Removing background... Applying AI... Finishing up..."
4. **Animation** - Branded animation/video

Recommendation: Option 3 for MVP - maps to node count, gives user sense of progress.

---

## Open Discussion Topics

### 1. Should we support "live preview" of transforms?

**Pros**:
- Better admin UX
- Catch errors before publish

**Cons**:
- Expensive (each preview runs full pipeline)
- Complex to implement
- Delay in getting to market

**My take**: Skip for MVP, add later if requested.

### 2. Pipeline templates / presets?

Some common patterns that could be pre-built:
- "Background Remover" - Just removeBackground
- "Branded Photo" - removeBackground + overlay
- "AI Portrait" - Full AI transform

**My take**: Good for V2, helps onboarding.

### 3. Cost tracking per experience?

Each transform uses:
- Cloud Function compute
- AI API calls (Gemini)
- Storage

Should we track and surface costs?

**My take**: Track internally for ops, expose to admins later.

### 4. Should transform step be explicit or implicit?

Current: Admin adds transform.pipeline step to experience
Alternative: Transform is always final step, auto-triggered

**My take**: Keep explicit - more flexible, clearer mental model.

---

## MVP Scope Recommendation

### Include in MVP

1. **Node types**: removeBackground, backgroundSwap, applyOverlay, aiImage
2. **Pipeline execution**: Linear with node-to-node references
3. **Variable system**: {{step:stepId}} syntax with mappings
4. **Output formats**: Image only
5. **Admin UI**: Basic config panel with node list and editors
6. **Client runtime**: Loading state, error handling, completion redirect

### Defer to V2

1. **Node types**: composeGif, applyVideoBackground
2. **Output formats**: GIF, Video
3. **Batch processing**: Multi-frame processing
4. **Pipeline templates**: Preset configurations
5. **Live preview**: Test pipeline before publish
6. **Conditional nodes**: Branching based on input

---

## Questions for Discussion

1. **Storage location**: Agree with `/experiences/{expId}/transformConfigs/{stepId}`?

2. **Variable syntax**: Is `{{step:stepId}}` clear enough? Alternatives?

3. **Node granularity**: Is the proposed node list right? Too few? Too many?

4. **Admin UX priority**: How polished does config UI need to be for MVP?

5. **Error handling**: What should guest see when pipeline fails?

6. **Timeouts**: 10 minutes reasonable for MVP?

7. **AI model options**: Start with just Gemini? Add others later?
