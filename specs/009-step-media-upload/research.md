# Research: Step Media Upload

**Feature**: 009-step-media-upload
**Date**: 2025-11-27

## Research Tasks

### 1. Lottie Library Selection

**Decision**: `lottie-react`

**Rationale**:
- Smaller bundle size (~50KB) compared to `@lottiefiles/react-lottie-player` (~150KB)
- Built on top of `lottie-web`, the industry standard
- Simple API: `<Lottie animationData={data} loop autoplay />`
- TypeScript support included
- Active maintenance and community support

**Alternatives Considered**:
- `@lottiefiles/react-lottie-player`: More features (controls, speed adjustment) but larger bundle and not needed for our use case
- `lottie-web` directly: Lower level, requires more boilerplate for React integration
- `react-lottie`: Deprecated, no longer maintained

### 2. Media Type Detection Strategy

**Decision**: MIME type primary, file extension fallback

**Rationale**:
- MIME type from `file.type` is reliable during upload
- File extension needed for backward compatibility with existing mediaUrl values
- GIF detection: `image/gif` MIME type (distinct from other images)
- Lottie detection: Parse JSON and validate structure (no dedicated MIME type)

**Implementation**:
```typescript
type StepMediaType = "image" | "gif" | "video" | "lottie";

function detectMediaType(file: File): StepMediaType | null {
  // Images (not GIF)
  if (["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return "image";
  }
  // GIF
  if (file.type === "image/gif") {
    return "gif";
  }
  // Video
  if (["video/mp4", "video/webm"].includes(file.type)) {
    return "video";
  }
  // JSON (potential Lottie - requires validation)
  if (file.type === "application/json" || file.name.endsWith(".json")) {
    return "lottie"; // Validate structure separately
  }
  return null;
}
```

**Backward Compatibility** (inferring from URL):
```typescript
function inferMediaTypeFromUrl(url: string): StepMediaType {
  const ext = url.split(".").pop()?.toLowerCase();
  if (["jpg", "jpeg", "png", "webp"].includes(ext ?? "")) return "image";
  if (ext === "gif") return "gif";
  if (["mp4", "webm"].includes(ext ?? "")) return "video";
  if (ext === "json") return "lottie";
  return "image"; // Default fallback
}
```

### 3. Lottie JSON Validation

**Decision**: Validate required Lottie structure before upload

**Rationale**:
- Lottie files are JSON but not all JSON is valid Lottie
- Prevent uploading arbitrary JSON that would fail to render
- Quick client-side validation before server upload

**Implementation**:
```typescript
interface LottieJSON {
  v: string;      // Version (e.g., "5.5.7")
  fr: number;     // Frame rate (e.g., 30)
  ip: number;     // In point (start frame)
  op: number;     // Out point (end frame)
  w: number;      // Width
  h: number;      // Height
  layers: unknown[]; // Animation layers
}

function isValidLottie(json: unknown): json is LottieJSON {
  if (typeof json !== "object" || json === null) return false;
  const obj = json as Record<string, unknown>;
  return (
    typeof obj.v === "string" &&
    typeof obj.fr === "number" &&
    typeof obj.ip === "number" &&
    typeof obj.op === "number" &&
    typeof obj.w === "number" &&
    typeof obj.h === "number" &&
    Array.isArray(obj.layers)
  );
}

async function validateLottieFile(file: File): Promise<boolean> {
  try {
    const text = await file.text();
    const json = JSON.parse(text);
    return isValidLottie(json);
  } catch {
    return false;
  }
}
```

### 4. Storage Path Pattern

**Decision**: `media/{companyId}/{mediaType}/{timestamp}-{filename}`

**Rationale**:
- Company-level storage enables future media library/reuse
- Media type in path aids organization and potential cleanup
- Timestamp prefix prevents filename collisions
- Original filename preserved for human readability

**Examples**:
- `media/abc123/image/1701234567890-hero.png`
- `media/abc123/video/1701234567890-intro.mp4`
- `media/abc123/lottie/1701234567890-loading.json`
- `media/abc123/gif/1701234567890-animation.gif`

### 5. File Size Limits

**Decision**: Type-specific limits

| Type   | Max Size | Rationale                                    |
|--------|----------|----------------------------------------------|
| Image  | 10MB     | Standard for web, matches existing uploads   |
| GIF    | 10MB     | Can be large due to frames, match image      |
| Video  | 25MB     | Balance quality vs upload time, mobile-first |
| Lottie | 5MB      | JSON should be small, complex files indicate issue |

### 6. Preview Rendering Strategy

**Decision**: Component-based rendering by media type

**Implementation**:
```typescript
// StepMediaPreview.tsx
function StepMediaPreview({ url, type }: { url: string; type: StepMediaType }) {
  switch (type) {
    case "image":
      return <Image src={url} alt="" fill className="object-contain" />;
    case "gif":
      return <Image src={url} alt="" fill className="object-contain" unoptimized />;
    case "video":
      return (
        <video src={url} autoPlay muted loop playsInline className="h-full w-full object-contain" />
      );
    case "lottie":
      return <LottiePlayer url={url} />;
  }
}
```

**Lottie Loading**: Fetch JSON from URL at render time (small files, cacheable).

### 7. Existing Code Patterns

**Reference: ImageUploadField** (`web/src/components/shared/ImageUploadField.tsx`)
- Uses `uploadImage` server action
- Shows preview after upload
- Remove button clears value
- Loading state during upload
- Error state with auto-clear

**Reference: PreviewMediaUpload** (`web/src/features/experiences/components/shared/PreviewMediaUpload.tsx`)
- Multi-type support (image, gif, video)
- Type detection from MIME
- Delete actually removes from storage (different from our requirement)

**Reference: uploadImage** (`web/src/lib/storage/actions.ts`)
- Server action pattern
- File validation (type, size)
- UUID filename generation
- Public URL return

### 8. Integration Points

**BaseStepEditor Changes**:
- Add `companyId` prop
- Replace `<Input type="url">` with `<StepMediaUpload>`
- Form schema includes `mediaType` field

**Editor Prop Chain**:
```
JourneyEditorPage (has companyId from event)
  → StepConfigPanel
    → [TypeEditor] (e.g., InfoStepEditor)
      → BaseStepEditor (receives companyId)
        → StepMediaUpload (uses companyId for storage path)
```

## Summary

All research tasks resolved. Key decisions:
1. **lottie-react** for Lottie rendering (smaller bundle)
2. **MIME + extension** for type detection
3. **Structural validation** for Lottie JSON
4. **Company-level storage** at `media/{companyId}/{type}/{timestamp}-{filename}`
5. **Type-specific size limits**: 10MB images/GIFs, 25MB videos, 5MB Lottie
6. **Component-based preview** with type-specific rendering
