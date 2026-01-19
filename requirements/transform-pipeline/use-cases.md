# Transform Pipeline - Use Cases

## Use Case 1: Simple Background Removal

**Scenario**: Brand wants guests to upload photos and receive them with background removed.

**Experience Steps**:
1. `info` - Welcome message
2. `capture.photo` - Take your photo
3. `transform.pipeline` - Processing...

**Transform Config**:
```json
{
  "nodes": [
    {
      "id": "node1",
      "type": "removeBackground",
      "input": { "source": "capturedMedia", "stepId": "step2" },
      "mode": "keepSubject"
    }
  ],
  "outputFormat": "image"
}
```

**Output**: PNG with transparent background

---

## Use Case 2: Apply Overlay

**Scenario**: Brand wants to add their branded frame/overlay to guest photos.

**Experience Steps**:
1. `info` - Welcome
2. `capture.photo` - Take photo
3. `transform.pipeline` - Adding brand frame...

**Transform Config**:
```json
{
  "nodes": [
    {
      "id": "node1",
      "type": "applyOverlay",
      "input": { "source": "capturedMedia", "stepId": "step2" },
      "overlayAsset": {
        "assetId": "overlay123",
        "url": "https://storage.../overlay.png",
        "label": "Brand Frame"
      },
      "position": "stretch",
      "opacity": 1
    }
  ],
  "outputFormat": "image"
}
```

**Output**: JPEG with overlay applied

---

## Use Case 3: Hobbitify - Full AI Transform

**Scenario**: Transform guests into hobbits with customizable pets, backgrounds, and phrases.

**Experience Steps**:
1. `info` - "Welcome to Hobbitify!"
2. `input.multiSelect` (id: "petStep") - "Which pet do you want?" Options: Cat, Dog, Chicken, None
3. `input.yesNo` (id: "pipeStep") - "Do you want a pipe?" Options: Yes, No
4. `input.multiSelect` (id: "bgStep") - "Choose your background" Options: Hobbiton, Rivendell, Gondor
5. `input.shortText` (id: "phraseStep") - "What phrase to display?" (max 200 chars)
6. `capture.photo` (id: "captureStep") - "Take your photo"
7. `transform.pipeline` - "Creating your hobbit portrait..."

**Transform Config**:
```json
{
  "nodes": [
    {
      "id": "node1",
      "type": "aiImage",
      "input": { "source": "capturedMedia", "stepId": "captureStep" },
      "promptTemplate": "Transform the person in the input photo into a hobbit character. The hobbit should have {{pet}} in their hands (use reference image for the pet). Should have pipe in mouth: {{pipe}}. Use {{background}} as the background (use reference image for background). Add text label at bottom center: \"{{phrase}}\"",
      "references": [
        { "assetId": "cat1", "url": "...", "label": "cat reference" },
        { "assetId": "dog1", "url": "...", "label": "dog reference" },
        { "assetId": "chicken1", "url": "...", "label": "chicken reference" },
        { "assetId": "hobbiton1", "url": "...", "label": "hobbiton background" },
        { "assetId": "rivendell1", "url": "...", "label": "rivendell background" },
        { "assetId": "gondor1", "url": "...", "label": "gondor background" }
      ],
      "model": "gemini-2.5-pro",
      "aspectRatio": "3:2",
      "variableMappings": {
        "pet": { "type": "answer", "stepId": "petStep" },
        "pipe": { "type": "answer", "stepId": "pipeStep" },
        "background": { "type": "answer", "stepId": "bgStep" },
        "phrase": { "type": "answer", "stepId": "phraseStep" }
      }
    }
  ],
  "outputFormat": "image"
}
```

**Variable Resolution Example**:
```
User answers:
- petStep: "Cat"
- pipeStep: true (Yes)
- bgStep: "Rivendell"
- phraseStep: "Adventure awaits!"

Resolved prompt:
"Transform the person in the input photo into a hobbit character.
The hobbit should have Cat in their hands (use reference image for the pet).
Should have pipe in mouth: true.
Use Rivendell as the background (use reference image for background).
Add text label at bottom center: "Adventure awaits!""
```

---

## Use Case 4: Hobbitify Modified - AI-Generated Background

**Scenario**: Instead of preset backgrounds, user describes their desired background and AI generates it.

**Experience Steps**:
1. `info` - "Welcome to Hobbitify!"
2. `input.shortText` (id: "bgDescStep") - "Describe your fantasy background" (e.g., "A mystical forest with glowing mushrooms")
3. `capture.photo` (id: "captureStep") - "Take your photo"
4. `transform.pipeline` - "Creating your portrait..."

**Transform Config** (Multi-node pipeline):
```json
{
  "nodes": [
    {
      "id": "node1",
      "type": "aiImage",
      "input": { "source": "capturedMedia", "stepId": "captureStep" },
      "promptTemplate": "Generate a fantasy background scene: {{bgDescription}}. Make it look like a scene from Lord of the Rings or a fantasy movie. No people in the scene, just the environment.",
      "references": [],
      "model": "gemini-2.5-flash",
      "aspectRatio": "3:2",
      "variableMappings": {
        "bgDescription": { "type": "answer", "stepId": "bgDescStep" }
      }
    },
    {
      "id": "node2",
      "type": "removeBackground",
      "input": { "source": "capturedMedia", "stepId": "captureStep" },
      "mode": "keepSubject"
    },
    {
      "id": "node3",
      "type": "backgroundSwap",
      "input": { "source": "node", "nodeId": "node2" },
      "backgroundFromNode": "node1"
    }
  ],
  "outputFormat": "image"
}
```

**Note**: This use case reveals a gap - we need a way for one node to reference another node's output as its background (not just previous node).

**Alternative approach with aiImage doing everything**:
```json
{
  "nodes": [
    {
      "id": "node1",
      "type": "aiImage",
      "input": { "source": "capturedMedia", "stepId": "captureStep" },
      "promptTemplate": "Take the person from the input photo and place them in a fantasy background: {{bgDescription}}. Keep the person looking like themselves but transform the background. The background should look like a scene from Lord of the Rings.",
      "model": "gemini-2.5-pro",
      "aspectRatio": "3:2",
      "variableMappings": {
        "bgDescription": { "type": "answer", "stepId": "bgDescStep" }
      }
    }
  ],
  "outputFormat": "image"
}
```

---

## Use Case 5: GIF from Multiple Captures (Future)

**Scenario**: Guest takes 4 photos and receives an animated GIF with different backgrounds on each frame.

**Experience Steps**:
1. `info` - "Let's make a GIF!"
2. `capture.photoSequence` (id: "captureStep") - "Strike 4 poses!" (captures 4 photos)
3. `transform.pipeline` - "Creating your GIF..."

**Transform Config**:
```json
{
  "nodes": [
    {
      "id": "removeBg1",
      "type": "removeBackground",
      "input": { "source": "capturedMedia", "stepId": "captureStep", "frameIndex": 0 }
    },
    {
      "id": "removeBg2",
      "type": "removeBackground",
      "input": { "source": "capturedMedia", "stepId": "captureStep", "frameIndex": 1 }
    },
    {
      "id": "removeBg3",
      "type": "removeBackground",
      "input": { "source": "capturedMedia", "stepId": "captureStep", "frameIndex": 2 }
    },
    {
      "id": "removeBg4",
      "type": "removeBackground",
      "input": { "source": "capturedMedia", "stepId": "captureStep", "frameIndex": 3 }
    },
    {
      "id": "bg1",
      "type": "backgroundSwap",
      "input": { "source": "node", "nodeId": "removeBg1" },
      "backgroundAsset": { "assetId": "beach", "url": "...", "label": "Beach" }
    },
    {
      "id": "bg2",
      "type": "backgroundSwap",
      "input": { "source": "node", "nodeId": "removeBg2" },
      "backgroundAsset": { "assetId": "mountains", "url": "...", "label": "Mountains" }
    },
    {
      "id": "bg3",
      "type": "backgroundSwap",
      "input": { "source": "node", "nodeId": "removeBg3" },
      "backgroundAsset": { "assetId": "city", "url": "...", "label": "City" }
    },
    {
      "id": "bg4",
      "type": "backgroundSwap",
      "input": { "source": "node", "nodeId": "removeBg4" },
      "backgroundAsset": { "assetId": "space", "url": "...", "label": "Space" }
    },
    {
      "id": "compose",
      "type": "composeGif",
      "inputs": [
        { "source": "node", "nodeId": "bg1" },
        { "source": "node", "nodeId": "bg2" },
        { "source": "node", "nodeId": "bg3" },
        { "source": "node", "nodeId": "bg4" }
      ],
      "frameDurationMs": 500,
      "loop": true
    }
  ],
  "outputFormat": "gif"
}
```

**Concerns**:
- This config is verbose - 9 nodes for a 4-frame GIF
- Consider a "batch" mode for nodes that applies same operation to multiple inputs
- Or a higher-level "gifWithBackgrounds" composite node

---

## Use Case 6: Video Background (Future)

**Scenario**: Guest takes a photo and receives a video with animated background.

**Experience Steps**:
1. `info` - "Create your video!"
2. `capture.photo` (id: "captureStep") - "Take your photo"
3. `transform.pipeline` - "Creating your video..."

**Transform Config**:
```json
{
  "nodes": [
    {
      "id": "node1",
      "type": "removeBackground",
      "input": { "source": "capturedMedia", "stepId": "captureStep" }
    },
    {
      "id": "node2",
      "type": "applyVideoBackground",
      "input": { "source": "previousNode" },
      "backgroundVideoAsset": {
        "assetId": "fireworks",
        "url": "...",
        "label": "Fireworks celebration"
      },
      "durationSec": 5
    }
  ],
  "outputFormat": "video"
}
```

---

## Use Case 7: Conditional Processing Based on User Input

**Scenario**: Different transform based on user's choice.

**Experience Steps**:
1. `input.multiSelect` (id: "styleStep") - "Choose your style" Options: Realistic, Cartoon, Anime
2. `capture.photo` (id: "captureStep") - "Take photo"
3. `transform.pipeline` - "Applying style..."

**Challenge**: How do we handle conditional logic in the pipeline?

**Option A - Single AI node with conditional prompt**:
```json
{
  "nodes": [
    {
      "id": "node1",
      "type": "aiImage",
      "promptTemplate": "Transform this photo in {{style}} style. If Realistic: make minor enhancements while keeping photorealistic look. If Cartoon: apply cartoon/comic book style. If Anime: apply Japanese anime art style.",
      "variableMappings": {
        "style": { "type": "answer", "stepId": "styleStep" }
      }
    }
  ]
}
```

**Option B - Conditional node type (Future)**:
```json
{
  "nodes": [
    {
      "id": "router",
      "type": "conditional",
      "condition": { "stepId": "styleStep" },
      "branches": {
        "Realistic": [{ "id": "real", "type": "aiImage", "promptTemplate": "..." }],
        "Cartoon": [{ "id": "cartoon", "type": "aiImage", "promptTemplate": "..." }],
        "Anime": [{ "id": "anime", "type": "aiImage", "promptTemplate": "..." }]
      }
    }
  ]
}
```

**Recommendation**: Start with Option A (prompt-based conditionals) for MVP. Add conditional nodes later if needed.

---

## Summary of Node Types Needed

### MVP Nodes
1. **removeBackground** - Remove or swap background
2. **backgroundSwap** - Apply static background image
3. **applyOverlay** - Apply overlay (frames, watermarks)
4. **aiImage** - AI-powered image transformation

### Future Nodes
5. **composeGif** - Combine multiple images into GIF
6. **applyVideoBackground** - Create video from still + video background
7. **conditional** - Branching logic based on step inputs
8. **batch** - Apply same operation to multiple inputs

### Potential Additional Nodes
- **faceSwap** - Replace face with another face
- **styleTransfer** - Apply artistic style
- **textOverlay** - Add text to image (could be part of overlay)
- **crop** - Crop/resize image
- **filter** - Apply color filters
- **compositeImages** - Layer multiple images
