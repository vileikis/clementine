# Research: Multi-Experience Type Editor Architecture

**Date**: 2025-11-20
**Feature**: 004-multi-experience-editor
**Purpose**: Resolve architectural design questions for implementing multi-experience type editing with TypeScript discriminated unions

---

## Research Question 1: Component Architecture for Discriminated Unions

### Decision

**Use hybrid component architecture**: Wrapper component with switch-case routing + type-specific child components

### Rationale

1. **Type Safety Through Narrowing**: TypeScript automatically narrows discriminated unions within switch case blocks. Type-specific components receive fully narrowed types as props.

2. **Component Isolation**: Each experience type has unique UI requirements:
   - Photo: countdown timer, overlay frame, AI transformation
   - GIF: frame count, interval, loop count, AI transformation
   - Video: duration, retake option, AI transformation
   - Wheel: spin items, duration (no AI)
   - Survey: question steps (no AI)

   Separate components prevent conditional rendering complexity.

3. **Exhaustiveness Checking**: The `default: never` pattern ensures compile-time errors if new experience types are added but not handled in the switch.

4. **Scalability**: Adding new experience types requires:
   - Define schema in discriminated union
   - Create new type-specific component
   - Add case to wrapper switch statement
   - TypeScript enforces completeness

5. **Developer Experience**: IDEs provide full autocomplete for type-specific properties within each component. No need for repeated type guards.

### Implementation Pattern

```typescript
// Wrapper component with switch-case routing
export function ExperienceEditor({ experience, onSave, onDelete }: ExperienceEditorProps) {
  switch (experience.type) {
    case 'photo':
      return <PhotoExperienceEditor experience={experience} onSave={onSave} onDelete={onDelete} />;
    case 'gif':
      return <GifExperienceEditor experience={experience} onSave={onSave} onDelete={onDelete} />;
    case 'video':
      return <VideoExperienceEditor experience={experience} onSave={onSave} onDelete={onDelete} />;
    case 'wheel':
      return <WheelExperienceEditor experience={experience} onSave={onSave} onDelete={onDelete} />;
    case 'survey':
      return <SurveyExperienceEditor experience={experience} onSave={onSave} onDelete={onDelete} />;
    default:
      // Exhaustiveness check - compile error if case missing
      const _exhaustive: never = experience;
      return null;
  }
}

// Type-specific component receives narrowed type
interface PhotoExperienceEditorProps {
  experience: PhotoExperience; // Already narrowed
  onSave: (experienceId: string, data: Partial<PhotoExperience>) => Promise<void>;
  onDelete: (experienceId: string) => Promise<void>;
}

export function PhotoExperienceEditor({ experience, onSave, onDelete }: PhotoExperienceEditorProps) {
  // TypeScript knows experience.type === 'photo'
  // Can access experience.config.countdown and experience.aiConfig safely
  const [countdown, setCountdown] = useState(experience.config.countdown);
  const [aiPrompt, setAiPrompt] = useState(experience.aiConfig.prompt || '');
  // ...
}
```

### Alternatives Considered

**Alternative 1: Single Component with Conditional Rendering**

```typescript
export function ExperienceEditor({ experience }: ExperienceEditorProps) {
  if (experience.type === 'photo') {
    return <div>{/* 200 lines of photo config */}</div>;
  }
  if (experience.type === 'wheel') {
    return <div>{/* 150 lines of wheel config */}</div>;
  }
  // ... 5 types × 150-200 lines = 800-1000 line file
}
```

**Rejected Because**:
- Single component becomes 800-1000+ lines (violates Clean Code principle)
- Hard to test individual experience types in isolation
- Poor separation of concerns
- Difficult to divide work among multiple developers
- Merge conflicts likely when multiple people edit same file

**Alternative 2: Props-Based Polymorphism with Render Props**

```typescript
interface ExperienceEditorProps {
  experience: Experience;
  renderPhotoSettings?: (exp: PhotoExperience) => React.ReactNode;
  renderWheelSettings?: (exp: WheelExperience) => React.ReactNode;
  // ... 5 render props
}
```

**Rejected Because**:
- Over-engineered for internal feature (not a library component)
- Shifts complexity to call site instead of centralizing it
- Doesn't leverage TypeScript's discriminated union narrowing
- Better suited for plugin systems with unknown use cases

**Alternative 3: Component Injection Pattern**

```typescript
interface ExperienceEditorProps {
  experience: Experience;
  components: {
    photo: React.ComponentType<PhotoExperienceEditorProps>;
    gif: React.ComponentType<GifExperienceEditorProps>;
    // ...
  };
}
```

**Rejected Because**:
- Unnecessary indirection for single-app scenario
- Adds boilerplate without benefits (all components are known at compile time)
- Good for plugin systems, not internal features with fixed set of types

---

## Research Question 2: Handling Partial Updates for Discriminated Unions

### Decision

**Create type-specific update schemas** without the discriminant field

### Rationale

1. **Partial<DiscriminatedUnion> Problem**: TypeScript's `Partial` utility type makes all properties optional, including the discriminant. This breaks type safety because you can't determine which variant you're working with.

2. **Immutable Discriminant**: The `type` field should never change after experience creation. An experience created as "photo" type stays "photo" forever. Changing types would require deleting and recreating.

3. **Type-Specific Validation**: Each experience type has different config structures that need different validation rules:
   - Photo: countdown (0-10), overlayFramePath (URL or null)
   - GIF: frameCount (3-10), intervalMs (100-1000), loopCount (0+)

   Type-specific schemas ensure correct validation.

4. **Zod Compatibility**: Zod's `discriminatedUnion` requires the discriminant to be a literal or enum in each variant. Partials don't work with this pattern.

### Implementation Pattern

```typescript
// In schemas.ts - Update schemas WITHOUT the 'type' discriminant

// Photo experience updates
export const updatePhotoExperienceSchema = z.object({
  label: z.string().min(1).max(50).optional(),
  enabled: z.boolean().optional(),
  hidden: z.boolean().optional(),
  previewPath: z.string().url().optional(),
  previewType: previewTypeSchema.optional(),
  config: photoConfigSchema.partial().optional(), // Partial of photo config
  aiConfig: aiConfigSchema.partial().optional(),   // Partial of AI config
}).strict();

export type UpdatePhotoExperienceData = z.infer<typeof updatePhotoExperienceSchema>;

// GIF experience updates
export const updateGifExperienceSchema = z.object({
  label: z.string().min(1).max(50).optional(),
  enabled: z.boolean().optional(),
  hidden: z.boolean().optional(),
  previewPath: z.string().url().optional(),
  previewType: previewTypeSchema.optional(),
  config: gifConfigSchema.partial().optional(),   // Partial of GIF config
  aiConfig: aiConfigSchema.partial().optional(),   // Partial of AI config
}).strict();

export type UpdateGifExperienceData = z.infer<typeof updateGifExperienceSchema>;

// Server action signatures
export async function updatePhotoExperience(
  eventId: string,
  experienceId: string,
  data: UpdatePhotoExperienceData // No 'type' field
): Promise<ActionResponse<PhotoExperience>>

export async function updateGifExperience(
  eventId: string,
  experienceId: string,
  data: UpdateGifExperienceData // No 'type' field
): Promise<ActionResponse<GifExperience>>
```

### Alternatives Considered

**Alternative 1: Single Polymorphic Update Action**

```typescript
export async function updateExperience(
  eventId: string,
  experienceId: string,
  data: Partial<Experience> // Loses discriminant
): Promise<ActionResponse<Experience>>
```

**Rejected Because**:
- `Partial<Experience>` loses the discriminant, can't validate correctly
- Server action can't determine which validation schema to apply
- Would need runtime type detection to route to correct validation
- Less type-safe at compile time

**Alternative 2: PartialExcept Utility Type**

```typescript
type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;
type PhotoExperienceUpdate = PartialExcept<PhotoExperience, 'type'>;

const update: PhotoExperienceUpdate = {
  type: 'photo', // Required
  label: 'New label', // Optional
};
```

**Rejected Because**:
- Requires passing the discriminant even though it never changes
- Adds boilerplate to every update call
- Zod validation would need to verify discriminant matches existing experience type
- More complex than necessary for immutable discriminants

---

## Research Question 3: Server Action Design Patterns

### Decision

**Use type-specific Server Actions** for create and update operations

### Rationale

1. **Type Safety**: Each Server Action has a clear input type and output type. TypeScript enforces correct usage at compile time.

2. **Validation Clarity**: Each action validates against its type-specific schema. No runtime type checking needed.

3. **Explicit API**: Developers know exactly which action to call based on experience type they're working with.

4. **Code Duplication is Minimal**: Shared logic (Firestore writes, response wrapping) can be extracted to utility functions. Only validation schemas differ.

5. **Scalability**: Adding new experience types adds new actions, but doesn't change existing ones. No risk of breaking existing functionality.

### Implementation Pattern

```typescript
// Photo experience actions
export async function createPhotoExperience(
  eventId: string,
  data: CreatePhotoExperienceData
): Promise<ActionResponse<PhotoExperience>> {
  try {
    // Validate input
    const validated = createPhotoExperienceSchema.parse(data);

    // Create in Firestore via Admin SDK
    const experienceId = await createExperienceInFirestore(eventId, {
      ...validated,
      type: 'photo' as const,
      config: { countdown: 0, overlayFramePath: null },
      aiConfig: { enabled: false, model: null, prompt: null, referenceImagePaths: null, aspectRatio: '1:1' },
    });

    // Return created experience
    const experience = await getExperienceById(eventId, experienceId);
    return { success: true, data: experience as PhotoExperience };
  } catch (error) {
    return handleError(error);
  }
}

export async function updatePhotoExperience(
  eventId: string,
  experienceId: string,
  data: UpdatePhotoExperienceData
): Promise<ActionResponse<PhotoExperience>> {
  try {
    // Validate input
    const validated = updatePhotoExperienceSchema.parse(data);

    // Update in Firestore via Admin SDK
    await updateExperienceInFirestore(eventId, experienceId, validated);

    // Return updated experience
    const experience = await getExperienceById(eventId, experienceId);
    return { success: true, data: experience as PhotoExperience };
  } catch (error) {
    return handleError(error);
  }
}

// GIF experience actions (similar structure)
export async function createGifExperience(
  eventId: string,
  data: CreateGifExperienceData
): Promise<ActionResponse<GifExperience>> {
  // Same pattern, different schema and defaults
}

export async function updateGifExperience(
  eventId: string,
  experienceId: string,
  data: UpdateGifExperienceData
): Promise<ActionResponse<GifExperience>> {
  // Same pattern, different schema
}
```

### Shared Utility Functions

```typescript
// Shared Firestore operations
async function createExperienceInFirestore(
  eventId: string,
  experience: Omit<Experience, 'id' | 'eventId' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const db = getFirestoreAdmin();
  const docRef = await db.collection(`events/${eventId}/experiences`).add({
    ...experience,
    eventId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  return docRef.id;
}

async function updateExperienceInFirestore(
  eventId: string,
  experienceId: string,
  data: Partial<Experience>
): Promise<void> {
  const db = getFirestoreAdmin();
  await db.doc(`events/${eventId}/experiences/${experienceId}`).update({
    ...data,
    updatedAt: Date.now(),
  });
}
```

### Alternatives Considered

**Alternative 1: Single Polymorphic Update Action with Runtime Type Check**

```typescript
export async function updateExperience(
  eventId: string,
  experienceId: string,
  data: unknown // Untyped
): Promise<ActionResponse<Experience>> {
  // Fetch existing experience to determine type
  const existing = await getExperienceById(eventId, experienceId);

  // Runtime discrimination
  switch (existing.type) {
    case 'photo':
      return updatePhotoExperienceSchema.parse(data);
    case 'gif':
      return updateGifExperienceSchema.parse(data);
    // ...
  }
}
```

**Rejected Because**:
- Requires extra database read to determine type
- Loses compile-time type safety (data is `unknown`)
- Centralized action becomes complex with 5+ experience types
- Higher risk of bugs (one action affects all types)

---

## Research Question 4: Code Sharing Strategies

### Decision

**Extract shared components** for common functionality, pass experience type where needed

### Rationale

1. **Shared Fields**: All experiences have label, enabled, hidden, previewPath/previewType regardless of type.

2. **Shared Capabilities**: Photo, Video, and GIF all support AI transformation with same config structure.

3. **Component Reuse**: Shared components reduce duplication and ensure consistent UX.

4. **Type Awareness**: Some shared components need to know the experience type for validation or UI decisions (e.g., preview media accepts images for photo, videos for video type).

### Implementation Pattern

```typescript
// BaseExperienceFields - shared across all types
interface BaseExperienceFieldsProps {
  label: string;
  enabled: boolean;
  onLabelChange: (value: string) => void;
  onEnabledChange: (value: boolean) => void;
  disabled?: boolean;
}

export function BaseExperienceFields({
  label,
  enabled,
  onLabelChange,
  onEnabledChange,
  disabled,
}: BaseExperienceFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="label">Experience Label</Label>
        <Input
          id="label"
          value={label}
          onChange={(e) => onLabelChange(e.target.value)}
          placeholder="e.g., Neon Portrait"
          disabled={disabled}
          maxLength={50}
        />
        <p className="text-xs text-muted-foreground">
          {label.length}/50 characters
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Label htmlFor="enabled">Enable</Label>
        <Switch
          id="enabled"
          checked={enabled}
          onCheckedChange={onEnabledChange}
          disabled={disabled}
        />
      </div>
    </>
  );
}

// AITransformSettings - shared by photo, video, gif
interface AITransformSettingsProps {
  aiModel: string;
  aiPrompt: string;
  aiReferenceImagePaths: string[];
  aiAspectRatio: AspectRatio;
  onAiModelChange: (value: string) => void;
  onAiPromptChange: (value: string) => void;
  onAiReferenceImagePathsChange: (paths: string[]) => void;
  onAiAspectRatioChange: (ratio: AspectRatio) => void;
  disabled?: boolean;
}

export function AITransformSettings(props: AITransformSettingsProps) {
  // AI configuration UI (model selector, prompt textarea, reference images, aspect ratio)
}

// DeleteExperienceButton - works for all types
interface DeleteExperienceButtonProps {
  experienceLabel: string;
  onDelete: () => Promise<void>;
  disabled?: boolean;
}

export function DeleteExperienceButton({
  experienceLabel,
  onDelete,
  disabled,
}: DeleteExperienceButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      await onDelete();
      setShowDialog(false);
    });
  };

  return (
    <>
      <Button
        variant="destructive"
        onClick={() => setShowDialog(true)}
        disabled={disabled || isPending}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete
      </Button>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Experience?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{experienceLabel}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending}>
              {isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// PreviewMediaUpload - type-aware for validation
interface PreviewMediaUploadProps {
  experienceType: ExperienceType; // 'photo' | 'video' | 'gif' | 'wheel' | 'survey'
  eventId: string;
  experienceId: string;
  previewPath?: string;
  previewType?: PreviewType;
  onUpload: (publicUrl: string, fileType: PreviewType) => void;
  onRemove: () => void;
  disabled?: boolean;
}

export function PreviewMediaUpload(props: PreviewMediaUploadProps) {
  // Accept different file types based on experienceType
  const acceptedFileTypes =
    props.experienceType === 'photo' ? 'image/*' :
    props.experienceType === 'video' ? 'video/*' :
    'image/*,video/*'; // GIF, wheel, survey accept either

  // Upload and preview logic
}
```

### Alternatives Considered

**Alternative 1: Duplicate Shared UI in Each Type-Specific Component**

**Rejected Because**:
- Violates DRY principle
- Changes to label field would need updates in 5 places
- Inconsistent UX if one component diverges
- Fails SC-007 success criterion (zero code duplication for shared functionality)

**Alternative 2: Complex Inheritance or HOC Pattern**

```typescript
function withSharedFields<P>(Component: React.ComponentType<P>) {
  return (props: P & SharedFieldProps) => {
    // Inject shared field logic
    return <Component {...props} />;
  };
}
```

**Rejected Because**:
- Over-engineered for React (prefer composition over HOCs)
- Makes component hierarchy harder to understand
- Debugging is more difficult with wrapped components
- React team recommends hooks and composition over HOCs

---

## References

### Official Documentation

- [TypeScript Handbook: Narrowing (Discriminated Unions)](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
- [Zod Discriminated Unions](https://zod.dev/?id=discriminated-unions)
- [React Documentation: Composition vs Inheritance](https://react.dev/learn/passing-props-to-a-component#passing-jsx-as-children)

### Community Articles

- [Advanced TypeScript for React Developers - Discriminated Unions](https://www.developerway.com/posts/advanced-typescript-for-react-developers-discriminated-unions)
- [Expressive React Component APIs with Discriminated Unions](https://blog.andrewbran.ch/expressive-react-component-apis-with-discriminated-unions)
- [Type-Safe React: Harnessing Discriminated Unions](https://dev.to/gboladetrue/type-safe-react-harnessing-the-power-of-discriminated-unions-158m)
- [Complex Forms with Zod, Next.js and TypeScript](https://peturgeorgievv.com/blog/complex-form-with-zod-nextjs-and-typescript-discriminated-union)
- [TypeScript Deep Dive - Discriminated Unions](https://basarat.gitbook.io/typescript/type-system/discriminated-unions)

---

## Conclusion

The research conclusively supports:

1. **Hybrid component architecture** with wrapper + type-specific components
2. **Type-specific update schemas** without discriminant field
3. **Type-specific Server Actions** for clarity and type safety
4. **Shared component extraction** for common UI (label, enabled, preview, delete, AI settings)

This approach maximizes type safety, minimizes code duplication, and provides clear extensibility path for future experience types (Video, Wheel, Survey).

**Next Steps**: Proceed to Phase 1 (Data Model & Contracts) with these architectural decisions.
