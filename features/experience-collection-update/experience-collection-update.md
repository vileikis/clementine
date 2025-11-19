# 🔧 **Evolve Experiences Schema — Feature Description**

## 🎯 **Goal**

Refactor and evolve the `experiences` document structure into a **scalable, type-safe, and future-proof schema** that supports multiple experience types (photo, video, gif, wheel, survey).
The new schema introduces a **discriminated union** driven by the `type` field and separates concerns using:

- `config` → **type-specific configuration**
- `aiConfig` → **shared AI configuration** (only for capture-type experiences)

This ensures the builder UI can grow to support new experience types without schema rewrites, while maintaining consistent behavior across capture workflows.

---

# 📌 **Requirements**

## **1. Adopt the New Schema for All New Experiences**

- When creating an experience, the system must use the new discriminated-union structure:

  - Set `type`
  - Create `config` based on the chosen type
  - Add `aiConfig` only if the type supports AI (photo, video, gif — not survey)

- Creation flow must reject experiences missing `label` or `type`.

---

## **2. Editing Existing Experiences**

### **Photo Experiences**

- Must read and write **only** from:

  - `config` (countdown, overlays, etc.)
  - `aiConfig` (AI model, prompt, references)

### **Other Capture Types (video, gif)**

- Same rules as photo:

  - UI panels must map to `config` and `aiConfig`
  - No legacy flat fields should be read or written

### **Survey Experiences**

- Must:

  - Use `config.stepsOrder` and `config.required`
  - Never attempt to show or write `aiConfig`

---

## **3. Add Survey Experience Type (Coming Soon)**

- Add `"survey"` into `ExperienceType`
- Include placeholder screens / coming-soon state in UI
- Survey experience form should:

  - create the document
  - create the `config` object
  - not reference steps (future work)

- Disable editing of steps until the _Survey Builder_ project lands.

---

## **4. Backward Compatibility / Cleanup**

- If any old experiences exist with flat or legacy fields:

  - The editor must gracefully read missing fields as `undefined`
  - Saving should migrate them into the new structure automatically

- Remove deprecated fields from:

  - TypeScript interfaces (also previously deprecated fields if exist)
  - Builder logic
  - Admin UI panels

- Enforce new schema shape in Firestore validation (if using Zod/TS enforcement)

---

## **5. Out of Scope**

- The `/steps` subcollection management (survey steps)
  → Will be implemented as a **separate project**.

---

# 📘 **Final Schema**

## **Shared Base**

```ts
export type AspectRatio = "1:1" | "3:4" | "4:5" | "9:16" | "16:9";

type ExperienceType = "photo" | "video" | "gif" | "wheel" | "survey";

interface AiConfig {
  enabled: boolean;
  model?: string;
  prompt?: string;
  referenceImagePaths?: string[];
  aspectRatio: AspectRatio;
}

interface ExperienceBase {
  id: string;
  eventId: string;

  label: string;
  type: ExperienceType;

  enabled: boolean;
  hidden?: boolean;

  previewPath?: string;
  previewType?: "image" | "gif" | "video";

  createdAt: number;
  updatedAt: number;

  aiConfig?: AiConfig; // only for capture types
}
```

---

## **Capture Experiences**

### **Photo**

```ts
interface PhotoConfig {
  countdown?: number;
  overlayFramePath?: string;
}

interface PhotoExperience extends ExperienceBase {
  type: "photo";
  config: PhotoConfig;
  aiConfig?: AiConfig;
}
```

### **Video**

```ts
type CameraFacing = "front" | "back" | "both";

interface VideoConfig {
  countdown?: number;
  overlayFramePath?: string;

  maxDurationMs?: number;
  cameraFacing?: CameraFacing;
}

interface VideoExperience extends ExperienceBase {
  type: "video";
  config: VideoConfig;
  aiConfig?: AiConfig;
}
```

### **Gif**

```ts
interface GifConfig {
  countdown?: number;
  overlayFramePath?: string;

  frameCount?: number;
  captureIntervalMs?: number;
}

interface GifExperience extends ExperienceBase {
  type: "gif";
  config: GifConfig;
  aiConfig?: AiConfig;
}
```

---

## **Wheel**

```ts
interface WheelConfig {
  wheelConfigId?: string;
}

interface WheelExperience extends ExperienceBase {
  type: "wheel";
  config: WheelConfig;
  aiConfig?: AiConfig;
}
```

---

## **Survey (Coming Soon)**

```ts
interface SurveyConfig {
  stepsOrder: string[];
  required: boolean;
}

interface SurveyExperience extends ExperienceBase {
  type: "survey";
  config: SurveyConfig;
  aiConfig?: never;
}
```

---

## **Union**

```ts
type Experience =
  | PhotoExperience
  | VideoExperience
  | GifExperience
  | WheelExperience
  | SurveyExperience;
```
