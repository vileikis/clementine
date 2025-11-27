# Quickstart: Step Media Upload

**Feature**: 009-step-media-upload
**Date**: 2025-11-27

## Prerequisites

1. Install `lottie-react` dependency:
   ```bash
   cd web && pnpm add lottie-react
   ```

2. Verify Firebase Storage is configured in `.env.local`

## Key Files to Implement

### 1. Types & Schemas (modify existing)

**File**: `web/src/features/steps/types/step.types.ts`
```typescript
// Add StepMediaType
export type StepMediaType = "image" | "gif" | "video" | "lottie";

// Update StepBase interface to include mediaType
```

**File**: `web/src/features/steps/schemas/step.schemas.ts`
```typescript
// Add stepMediaTypeSchema
export const stepMediaTypeSchema = z.enum(["image", "gif", "video", "lottie"]);

// Add mediaType to stepBaseSchema and updateStepInputSchema
```

### 2. Utility Functions (new files)

**File**: `web/src/features/steps/utils/media-type.ts`
```typescript
// detectMediaType(file: File): StepMediaType | null
// inferMediaTypeFromUrl(url: string): StepMediaType
// getMediaType(mediaType, mediaUrl): StepMediaType | null
```

**File**: `web/src/features/steps/utils/lottie-validation.ts`
```typescript
// isValidLottie(json: unknown): boolean
// validateLottieFile(file: File): Promise<boolean>
```

### 3. Server Action (new file)

**File**: `web/src/features/steps/actions/step-media.ts`
```typescript
"use server";

export async function uploadStepMedia(
  companyId: string,
  file: File
): Promise<ActionResponse<{ publicUrl: string; mediaType: StepMediaType; sizeBytes: number }>>
```

### 4. Upload Component (new file)

**File**: `web/src/features/steps/components/shared/StepMediaUpload.tsx`
```typescript
interface StepMediaUploadProps {
  companyId: string;
  mediaUrl?: string | null;
  mediaType?: StepMediaType | null;
  onUpload: (url: string, type: StepMediaType) => void;
  onRemove: () => void;
  disabled?: boolean;
}
```

### 5. Lottie Player (new file)

**File**: `web/src/components/shared/LottiePlayer.tsx`
```typescript
interface LottiePlayerProps {
  url: string;        // URL to fetch Lottie JSON
  className?: string;
}
```

### 6. BaseStepEditor Integration (modify existing)

**File**: `web/src/features/steps/components/editors/BaseStepEditor.tsx`
```typescript
interface BaseStepEditorProps {
  form: UseFormReturn<any>;
  companyId: string;  // NEW
  // ... existing props
}

// Replace Input type="url" with StepMediaUpload
```

## Testing Checklist

- [ ] Upload JPG image under 10MB → preview shows
- [ ] Upload PNG image under 10MB → preview shows
- [ ] Upload WebP image under 10MB → preview shows
- [ ] Upload GIF under 10MB → animates in preview
- [ ] Upload MP4 video under 25MB → autoplays muted
- [ ] Upload WebM video under 25MB → autoplays muted
- [ ] Upload valid Lottie JSON → animation plays
- [ ] Upload invalid JSON → error message
- [ ] Upload file over size limit → error message
- [ ] Upload unsupported file type → error message
- [ ] Remove media → preview clears, storage untouched
- [ ] Existing step with mediaUrl only → renders correctly

## Validation Commands

```bash
# From repository root
pnpm lint          # Fix all warnings
pnpm type-check    # No TypeScript errors
pnpm test          # All tests pass
```
