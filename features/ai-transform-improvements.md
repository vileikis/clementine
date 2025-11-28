# AI Transform Improvements: Aspect Ratio & Multiple Reference Images

## Overview

Enhance the AI transformation pipeline to support:
1. **Aspect Ratio Control**: Pass `aspectRatio` from Experience configuration to Google AI API
2. **Multiple Reference Images**: Support passing all reference images (not just the first one)

Both fields already exist in the Experience schema but are not fully utilized in the transform pipeline.

---

## Current State Analysis

### What Exists
- ✅ Experience schema has `aspectRatio` field in `aiPhotoConfig` (optional)
- ✅ Current schema supports: "1:1", "3:4", "4:5", "9:16", "16:9" (5 values)
- ✅ Experience schema has `referenceImageUrls` array (max 5 images)
- ✅ UI component (AITransformSettings) has aspect ratio picker
- ✅ Default "1:1" set in repository for new experiences

### What's Missing
- ❌ `aspectRatio` not included in `TransformParams` interface
- ❌ `TransformParams` only supports single `referenceImageUrl` (should support array)
- ❌ Sessions action doesn't pass `aspectRatio` to transform pipeline
- ❌ Sessions action only passes first reference image (line 205-207)
- ❌ Playground action doesn't pass `aspectRatio` to AI client
- ❌ Playground action only passes first reference image
- ❌ Google AI provider doesn't use `aspectRatio` in API call
- ❌ Google AI provider only uses single reference image

### Google AI Capabilities
- **Supported aspect ratios**: 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9 (10 total)
- **Our schema subset**: 1:1, 3:4, 4:5, 9:16, 16:9 (5 ratios - all are valid for Google AI)
- **Multiple reference images**: Supported by Google AI (can pass multiple inline images in prompt)
- **API structure**: `config.imageConfig.aspectRatio` in `generateContent()` call

---

## Design Decisions

### 1. Schema Scope
**Keep existing 5 aspect ratios** in schema: "1:1", "3:4", "4:5", "9:16", "16:9"

**Rationale**: Simpler UI, current ratios cover most common social media use cases. Can expand later if needed without breaking changes.

### 2. Backward Compatibility Strategy
**Default to "1:1" (Square)** if aspectRatio is missing or invalid.

**Rationale**: Safest default - works everywhere, neutral format, no unexpected cropping. Existing experiences may have undefined aspectRatio.

### 3. Multiple Reference Images Strategy
**Change `referenceImageUrl` to `referenceImageUrls` array** in TransformParams.

**Rationale**:
- Matches Experience schema structure
- Enables advanced AI transforms (e.g., style transfer from multiple sources)
- Backward compatible (empty array = no reference images)
- Google AI supports multiple images in prompt

### 4. Validation Approach
**Multi-layer validation with graceful degradation**:
1. Schema layer (Zod enum) - prevents invalid writes
2. Transform layer (runtime default) - ensures value always present
3. Provider layer (validation function) - validates against Google AI supported values

### 5. imageSize Support
**Out of scope** - defer to future enhancement.

**Rationale**: Only works with gemini-3-pro-image-preview; adds model-specific complexity; aspectRatio alone provides immediate value.

---

## Implementation Steps

### Step 1: Update TransformParams Interface
**File**: `web/src/lib/ai/types.ts`

**Changes**:
1. Add optional `aspectRatio` field
2. Change `referenceImageUrl` (singular) to `referenceImageUrls` (plural array)

```typescript
export interface TransformParams {
  prompt: string;
  inputImageUrl: string;
  referenceImageUrls?: string[]; // Changed from referenceImageUrl (singular)
  brandColor?: string;
  /** AI model to use for generation (e.g., 'gemini-2.5-flash-image', 'gemini-3-pro-image-preview') */
  model?: string;
  /** Aspect ratio for generated image. Defaults to '1:1' if not specified. */
  aspectRatio?: string;
}
```

**Breaking Change**: This changes the interface signature. Must update all callers.

---

### Step 2: Update Google AI Provider
**File**: `web/src/lib/ai/providers/google-ai.ts`

**2A**: Add validation utility (after imports):
```typescript
/**
 * Valid aspect ratios supported by Google AI image generation models.
 * Our schema uses a subset: "1:1", "3:4", "4:5", "9:16", "16:9"
 */
const GOOGLE_AI_ASPECT_RATIOS = [
  "1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"
] as const;

/**
 * Validate and normalize aspect ratio for Google AI.
 * Falls back to "1:1" if invalid or undefined.
 */
function validateAspectRatio(aspectRatio?: string): string {
  if (!aspectRatio) return "1:1";

  if (GOOGLE_AI_ASPECT_RATIOS.includes(aspectRatio as typeof GOOGLE_AI_ASPECT_RATIOS[number])) {
    return aspectRatio;
  }

  console.warn(`[GoogleAI] Invalid aspect ratio: ${aspectRatio}, defaulting to 1:1`);
  return "1:1";
}
```

**2B**: Update `generateImage` method to handle multiple reference images:

**Current code** (lines 36-39):
```typescript
const [inputImageData, referenceImageData] = await Promise.all([
  this.fetchImageAsBase64(params.inputImageUrl),
  params.referenceImageUrl ? this.fetchImageAsBase64(params.referenceImageUrl) : null,
]);
```

**New code**:
```typescript
// Fetch input image
const inputImageData = await this.fetchImageAsBase64(params.inputImageUrl);

// Fetch all reference images (if any)
const referenceImageDataList: string[] = [];
if (params.referenceImageUrls && params.referenceImageUrls.length > 0) {
  const referencePromises = params.referenceImageUrls.map(url =>
    this.fetchImageAsBase64(url)
  );
  const results = await Promise.all(referencePromises);
  referenceImageDataList.push(...results);
}
```

**2C**: Update prompt construction (lines 45-65):

**Current code**:
```typescript
const promptParts: ContentListUnion = [
  { text: promptText },
  {
    inlineData: {
      mimeType: 'image/jpeg',
      data: inputImageData,
    }
  }
];

// Add reference image if provided (for background swap)
if (referenceImageData) {
  promptParts.push({
    inlineData: {
      mimeType: 'image/jpeg',
      data: referenceImageData,
    }
  });
}
```

**New code**:
```typescript
const promptParts: ContentListUnion = [
  { text: promptText },
  {
    inlineData: {
      mimeType: 'image/jpeg',
      data: inputImageData,
    }
  }
];

// Add all reference images if provided
if (referenceImageDataList.length > 0) {
  for (const referenceData of referenceImageDataList) {
    promptParts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: referenceData,
      }
    });
  }
}
```

**2D**: Update Google AI API call (lines 68-71):

**Current code**:
```typescript
// Call Google AI
const response = await this.ai.models.generateContent({
  model,
  contents: promptParts,
});
```

**New code**:
```typescript
// Validate and prepare aspect ratio
const aspectRatio = validateAspectRatio(params.aspectRatio);

console.log('[GoogleAI] Generation config:', {
  model,
  aspectRatio,
  promptLength: params.prompt.length,
  referenceImageCount: referenceImageDataList.length,
});

// Call Google AI with imageConfig
const response = await this.ai.models.generateContent({
  model,
  contents: promptParts,
  config: {
    imageConfig: {
      aspectRatio: aspectRatio,
    },
  },
});
```

---

### Step 3: Update Sessions Transform Pipeline
**File**: `web/src/features/sessions/actions/sessions.actions.ts`

Update `transformParams` construction (line 197-207):

**Current code**:
```typescript
const transformParams: TransformParams = {
  prompt: aiConfig.prompt!,
  inputImageUrl,
  model: aiConfig.model ?? undefined,
  brandColor: event.theme?.primaryColor,
};

// Add reference image if available
if (aiConfig.referenceImageUrls && aiConfig.referenceImageUrls.length > 0) {
  transformParams.referenceImageUrl = aiConfig.referenceImageUrls[0];
}
```

**New code**:
```typescript
const transformParams: TransformParams = {
  prompt: aiConfig.prompt!,
  inputImageUrl,
  model: aiConfig.model ?? undefined,
  brandColor: event.theme?.primaryColor,
  aspectRatio: aiConfig.aspectRatio || "1:1",
  referenceImageUrls: aiConfig.referenceImageUrls || [], // Pass all reference images
};
```

**Notes**:
- Simpler code - no conditional assignment
- Pass all reference images from array (not just first one)
- Add aspectRatio with default "1:1"

---

### Step 4: Update Playground Action
**File**: `web/src/features/experiences/actions/playground-generate.ts`

Update AI client call (around line 159-164):

**Current code**:
```typescript
const resultBuffer = await aiClient.generateImage({
  prompt,
  inputImageUrl: testImageUrl,
  referenceImageUrl,
  model,
});
```

**New code**:
```typescript
const resultBuffer = await aiClient.generateImage({
  prompt,
  inputImageUrl: testImageUrl,
  referenceImageUrls: experience.aiPhotoConfig.referenceImageUrls || [],
  model,
  aspectRatio: experience.aiPhotoConfig.aspectRatio || "1:1",
});
```

**Notes**:
- Pass all reference images from experience config
- Add aspectRatio support
- Remove intermediate `referenceImageUrl` variable (no longer needed)

---

### Step 5: Update Mock Provider (for consistency)
**File**: `web/src/lib/ai/providers/mock.ts`

Update `generateImage` signature to accept new TransformParams:

```typescript
async generateImage(params: TransformParams): Promise<Buffer> {
  // Mock implementation - just log what we received
  console.log('[MockAI] Transform params:', {
    prompt: params.prompt.substring(0, 50),
    model: params.model,
    aspectRatio: params.aspectRatio,
    referenceImageCount: params.referenceImageUrls?.length || 0,
  });

  // Return placeholder image (existing logic)
  // ...
}
```

---

### Step 6: Update N8n Provider (for consistency)
**File**: `web/src/lib/ai/providers/n8n-webhook.ts`

Update webhook payload to include new fields:

```typescript
async generateImage(params: TransformParams): Promise<Buffer> {
  const payload = {
    prompt: params.prompt,
    inputImageUrl: params.inputImageUrl,
    referenceImageUrls: params.referenceImageUrls || [],
    model: params.model,
    brandColor: params.brandColor,
    aspectRatio: params.aspectRatio || "1:1",
  };

  console.log('[N8nWebhook] Sending payload:', {
    ...payload,
    prompt: payload.prompt.substring(0, 50),
  });

  // Existing webhook logic...
}
```

---

## Edge Cases & Error Handling

### Aspect Ratio
1. **Legacy experiences without aspectRatio**: Default to "1:1" in transform pipeline
2. **Invalid aspectRatio in database**: Provider validation catches it, falls back to "1:1" with warning
3. **Google AI API rejects aspectRatio**: Existing error flow handles it (session marked as "error", retry available)

### Multiple Reference Images
1. **Empty referenceImageUrls array**: No reference images added to prompt (valid use case)
2. **Invalid URL in referenceImageUrls**: fetchImageAsBase64 will throw, caught by existing try/catch in triggerTransformAction
3. **Too many reference images**: Schema limits to max 5, but Google AI may have limits - will fail gracefully with error state
4. **Reference image fetch timeout**: Individual fetch failures will propagate to session error state

### General
1. **Network timeout**: Existing 60s timeout in triggerTransformAction handles it
2. **Concurrent transforms**: No race conditions - each session is isolated

---

## Testing Checklist

### Aspect Ratio Testing
- [ ] Create new photo experience with each of 5 aspect ratios (1:1, 3:4, 4:5, 9:16, 16:9)
- [ ] Verify values save to Firestore
- [ ] Test playground preview with various aspect ratios
- [ ] Start guest session, capture photo, verify transform uses correct aspect ratio
- [ ] Test backward compatibility with experience without aspectRatio (should default to "1:1")
- [ ] Verify error scenarios (invalid value) gracefully fall back to "1:1"

### Multiple Reference Images Testing
- [ ] Create experience with 0 reference images - verify transform works
- [ ] Create experience with 1 reference image - verify it's used
- [ ] Create experience with 3 reference images - verify all are passed to Google AI
- [ ] Create experience with 5 reference images (max) - verify all are passed
- [ ] Test playground with multiple reference images
- [ ] Test guest session with multiple reference images
- [ ] Verify logs show correct reference image count

### Integration Testing
- [ ] Test combination: aspect ratio + multiple reference images
- [ ] Verify TransformParams interface changes don't break other providers (mock, n8n)
- [ ] Test error scenarios: invalid reference URL + valid aspectRatio
- [ ] Verify existing experiences without new fields still work

### Verification Points
- [ ] Existing schema with 5 aspect ratios remains unchanged
- [ ] Transform pipeline passes aspectRatio and all reference images to AI client
- [ ] Google AI provider receives and applies aspectRatio
- [ ] Google AI provider adds all reference images to prompt
- [ ] Playground respects both fields from experience config
- [ ] Logs show aspectRatio and reference image count at each stage
- [ ] No breaking changes for existing experiences

---

## Critical Files to Modify

1. **`web/src/lib/ai/types.ts`** - Update TransformParams interface (breaking change)
2. **`web/src/lib/ai/providers/google-ai.ts`** - Core Google AI implementation
   - Add aspectRatio validation
   - Update to handle multiple reference images
   - Add config.imageConfig.aspectRatio to API call
3. **`web/src/features/sessions/actions/sessions.actions.ts`** - Transform pipeline
   - Pass aspectRatio with default "1:1"
   - Pass all referenceImageUrls (not just first one)
4. **`web/src/features/experiences/actions/playground-generate.ts`** - Playground support
   - Pass aspectRatio with default "1:1"
   - Pass all referenceImageUrls
5. **`web/src/lib/ai/providers/mock.ts`** - Update for consistency
6. **`web/src/lib/ai/providers/n8n-webhook.ts`** - Update for consistency

---

## Migration Strategy

### Phase 1: Interface Changes (Breaking)
1. Update `TransformParams` interface in types.ts
2. Update all AI providers to accept new interface
3. This will cause TypeScript errors in callers - intentional

### Phase 2: Update Callers
1. Update sessions.actions.ts
2. Update playground-generate.ts
3. TypeScript errors should be resolved

### Phase 3: Testing & Validation
1. Test each provider individually
2. Test end-to-end flows (guest session, playground)
3. Verify backward compatibility

### Deployment
- **Low risk**: Changes are additive (new optional fields)
- **Backward compatible**: Existing experiences work without new fields
- **Graceful degradation**: Defaults ensure no failures

---

## Risk Assessment

**Low Risk**:
- Aspect ratio default ("1:1")
- Empty reference images array (valid use case)
- Interface changes (TypeScript catches all callers)

**Medium Risk**:
- Multiple reference image fetching (network failures)
  - Mitigation: Existing try/catch in transform pipeline
  - Mitigation: Session error state handles failures
- Google AI provider changes (multiple code paths updated)
  - Mitigation: Validation layer prevents invalid values
  - Mitigation: Extensive logging for debugging

**Overall**: Low-Medium risk with clear rollback path

---

## Rollback Strategy

If issues arise:

### Option 1: Revert Google AI Provider
- Revert `google-ai.ts` changes (remove `config.imageConfig`, revert to single reference image)
- Images will generate without aspect ratio control
- Only first reference image used
- No data loss, selections preserved for re-deployment

### Option 2: Full Rollback
- Revert all changes across all files
- System returns to previous behavior
- No migration needed

---

## Future Enhancements (Out of Scope)

### 1. imageSize Support
Add imageSize field to schema for gemini-3-pro-image-preview:
- Add to aiPhotoConfig: `imageSize: z.enum(["1K", "2K", "4K"]).optional()`
- Show imageSize picker in UI (conditionally based on model)
- Pass to Google AI provider: `config.imageConfig.imageSize`

### 2. Reference Image Ordering Strategy
Allow creators to specify which reference image should have priority:
- Add `primaryReferenceImageIndex` to aiPhotoConfig
- Reorder array before passing to Google AI
- UI drag-and-drop for reference image ordering

### 3. Per-Reference Image Prompts
Support different prompts for different reference images:
- Schema: Array of `{ url: string, description: string }`
- Google AI: Add text parts before each image in prompt
- Advanced style transfer control

### 4. Aspect Ratio Auto-Detection
Automatically suggest aspect ratio based on input image:
- Analyze input image dimensions in capture step
- Suggest matching aspect ratio to creator
- One-click apply to experience config

---

## Success Metrics

### Functional Success
- [ ] All 5 aspect ratios generate successfully in playground
- [ ] Multiple reference images (0-5) work correctly
- [ ] Guest sessions with various configurations complete successfully
- [ ] Error rate remains stable or improves
- [ ] No regression in generation times
- [ ] Zero "invalid aspect ratio" errors in logs (except from legacy data)
- [ ] Zero reference image fetch failures (except network issues)

### Code Quality
- [ ] TypeScript compilation succeeds with no errors
- [ ] All AI providers implement new interface consistently
- [ ] Logging provides clear visibility into transform parameters
- [ ] Error messages are actionable

---

## Implementation Checklist

- [ ] Step 1: Update TransformParams interface
- [ ] Step 2: Update Google AI Provider (validation, multiple refs, aspect ratio)
- [ ] Step 3: Update Sessions Transform Pipeline
- [ ] Step 4: Update Playground Action
- [ ] Step 5: Update Mock Provider
- [ ] Step 6: Update N8n Provider
- [ ] Run type checking: `pnpm type-check`
- [ ] Run linting: `pnpm lint`
- [ ] Manual testing (aspect ratio)
- [ ] Manual testing (multiple reference images)
- [ ] Integration testing
- [ ] Deploy to staging
- [ ] Monitor error logs
- [ ] Deploy to production

---

## Notes

- All changes maintain backward compatibility with existing experiences
- Schema remains unchanged (already supports both features)
- UI already supports aspect ratio picker (no changes needed)
- Multiple reference images already supported in UI (no changes needed)
- Focus is on plumbing the data through the transform pipeline
