# Research: Photo Experience Tweaks

**Date**: 2025-11-17
**Feature**: Photo Experience Tweaks ([spec.md](./spec.md))
**Purpose**: Resolve technical unknowns and document architecture decisions

## Research Areas

### 1. Preview Media Handling (Image/GIF/Video)

**Question**: How should we handle upload, storage, and display of different preview media types (image, GIF, video)?

**Decision**: Use existing Firebase Storage pattern with media-type-specific rendering

**Rationale**:
- Firebase Storage already used for event images and overlays
- Existing `ImageUploadField` component can be extended to support video/GIF
- HTML `<video>` element supports autoplay muted loop natively
- GIF files render as `<img>` with autoplay by default

**Implementation Approach**:
1. Extend `ImageUploadField` to accept `accept` prop for MIME types (image/*, video/*, .gif)
2. Upload to Firebase Storage via Server Action (Admin SDK)
3. Store full public URL in `Experience.previewPath` field
4. Store media type in `Experience.previewType` enum ("image" | "gif" | "video")
5. Conditional rendering in UI:
   ```tsx
   {previewType === "video" && <video src={previewPath} autoPlay muted loop />}
   {previewType === "gif" && <img src={previewPath} alt="Preview" />}
   {previewType === "image" && <img src={previewPath} alt="Preview" />}
   ```

**Alternatives Considered**:
- Third-party video hosting (Cloudinary, Mux): Rejected - adds external dependency and cost
- Client-side video optimization: Rejected - adds complexity, Firebase Storage handles optimization

**File Size Limits**:
- Firebase free tier: 5GB total storage, 1GB/day download
- Recommended preview media limits: 10MB per file (enforced in Zod schema)
- Organizers should compress videos before upload (documented in quickstart.md)

---

### 2. Countdown Timer Implementation

**Question**: How should countdown timer be implemented for photo capture?

**Decision**: Store countdown settings in Firestore, implement countdown UI in guest photo capture flow

**Rationale**:
- Countdown is configuration (set by organizer) + runtime behavior (shown to guest)
- Configuration stored in Firestore Experience document
- Runtime countdown implemented in guest photo capture component (out of scope for this feature - config only)

**Schema Design**:
```typescript
// Experience schema additions
countdownEnabled: z.boolean().default(false),
countdownSeconds: z.number().int().min(0).max(10).default(3),
```

**Implementation Approach**:
1. Add `countdownEnabled` and `countdownSeconds` fields to `experienceSchema`
2. Create `CountdownSettings` component in ExperienceEditor:
   - Toggle switch for `countdownEnabled`
   - Number input (0-10) for `countdownSeconds` (hidden when toggle off)
   - Helper text: "Show countdown timer before capturing photo"
3. Guest capture flow (future implementation) reads these fields and shows countdown

**Alternatives Considered**:
- Fixed countdown values (3s, 5s, 10s): Rejected - less flexible
- Countdown in milliseconds: Rejected - seconds are more intuitive for organizers

---

### 3. Aspect Ratio Picker UI Component

**Question**: What UI component should be used for aspect ratio selection?

**Decision**: Use shadcn/ui `Select` component with 5 predefined aspect ratios

**Rationale**:
- `Select` component provides dropdown with clear labels
- Touch-friendly on mobile (≥44x44px touch target)
- Consistent with existing Event Builder UI patterns
- No custom aspect ratio input needed (YAGNI principle)

**Aspect Ratio Options**:
```typescript
export const aspectRatioSchema = z.enum(["1:1", "3:4", "4:5", "9:16", "16:9"]);
```

**Implementation Approach**:
1. Add `aiAspectRatio` field to `experienceSchema` (optional, default: "1:1")
2. Render `Select` component with 5 options:
   - 1:1 (Square - Instagram, Profile)
   - 3:4 (Portrait - Traditional)
   - 4:5 (Portrait - Instagram Feed)
   - 9:16 (Vertical - Stories, Reels)
   - 16:9 (Landscape - Widescreen)
3. Display human-readable labels with use case hints
4. Store selected value in Experience document

**Alternatives Considered**:
- Segmented control (iOS style): Rejected - too many options (5) for horizontal layout on mobile
- Radio buttons: Rejected - takes up more vertical space
- Custom aspect ratio input: Rejected - out of scope, YAGNI

---

### 4. Prompt Guide Link Management

**Question**: How should model-specific prompt guide URLs be managed?

**Decision**: Hard-code prompt guide URLs in a constants file, dynamically select based on `aiModel` value

**Rationale**:
- Only one model (NanoBanana) specified in requirements
- Hard-coding URLs is simplest approach (YAGNI)
- Easy to extend when new models are added
- No database/CMS needed for static URLs

**Implementation Approach**:
1. Create `web/src/lib/constants/ai-models.ts`:
   ```typescript
   export const AI_MODEL_PROMPT_GUIDES: Record<string, string> = {
     nanobanana: "https://ai.google.dev/gemini-api/docs/image-generation#prompt-guide",
     // Future models added here
   };
   ```
2. In `AITransformSettings` component:
   ```tsx
   const promptGuideUrl = AI_MODEL_PROMPT_GUIDES[aiModel];
   {promptGuideUrl && (
     <a href={promptGuideUrl} target="_blank" rel="noopener noreferrer">
       Prompt Guide ↗
     </a>
   )}
   ```
3. Link only shown if model has a guide URL defined

**Alternatives Considered**:
- Store URLs in Firestore: Rejected - overkill for static data
- Fetch from external API: Rejected - adds latency and dependency
- Hard-code in component: Rejected - less maintainable, prefer constants file

---

### 5. Reference Images Layout (Horizontal Row)

**Question**: How should multiple reference images be displayed in a horizontal row with responsive wrapping?

**Decision**: Use CSS Flexbox with `flex-wrap` for horizontal layout

**Rationale**:
- Flexbox is standard, mobile-friendly, and well-supported
- `flex-wrap: wrap` handles overflow gracefully on small screens
- Consistent with Tailwind CSS utility classes
- No JavaScript needed for layout logic

**Implementation Approach**:
```tsx
<div className="flex flex-wrap gap-4">
  {aiReferenceImagePaths.map((path, index) => (
    <div key={index} className="w-24 h-24 relative">
      <img src={path} alt={`Reference ${index + 1}`} className="object-cover rounded" />
      <button onClick={() => removeImage(index)}>Remove</button>
    </div>
  ))}
</div>
```

**Mobile Behavior**:
- On 320px viewport: ~3 images per row (24px image + 16px gap = ~96px each)
- Wraps to next row when container width exceeded
- Maintains aspect ratio with `object-cover`

**Alternatives Considered**:
- CSS Grid: Rejected - Flexbox simpler for single-row with wrapping
- Horizontal scroll: Rejected - less discoverable, poor UX on mobile
- Carousel/slider: Rejected - over-engineered for this use case

---

### 6. Removing Capture Options and Logo Overlay

**Question**: How should deprecated fields be handled in schema and UI?

**Decision**: Remove fields from schema validation, mark as optional in TypeScript interface, hide from UI

**Rationale**:
- Breaking change for existing data requires careful migration
- Optional fields in TS interface prevent type errors during transition
- Validation schema removes deprecated fields to prevent new data from using them
- UI hides deprecated inputs completely

**Migration Strategy**:
1. Update `experienceSchema` in `firestore.ts`:
   - Remove `allowCamera`, `allowLibrary` from required validation
   - Remove `overlayLogoPath` from schema (keep `overlayFramePath`)
2. Update `updateExperienceSchema`:
   - Remove `allowCamera`, `allowLibrary`, `overlayLogoPath` from allowed update fields
3. Update `Experience` TypeScript interface:
   - Mark deprecated fields as optional (don't remove - legacy data may exist)
4. Update `ExperienceEditor.tsx`:
   - Remove capture options section entirely
   - Remove logo overlay upload field
   - Keep frame overlay upload only

**Data Migration** (out of scope for this feature):
- Existing experiences with `allowCamera`, `allowLibrary`, `overlayLogoPath` will retain values
- New experiences created after this feature deploys will not have these fields
- Future cleanup task can remove deprecated fields from Firestore

**Alternatives Considered**:
- Hard delete fields: Rejected - breaks existing data
- Database migration script: Rejected - not needed immediately, can be future task
- Feature flag deprecated fields: Rejected - adds complexity, not needed

---

### 7. Component Architecture (Breaking Down ExperienceEditor)

**Question**: Should ExperienceEditor be broken into smaller sub-components or remain monolithic?

**Decision**: Break into focused sub-components for each settings section

**Rationale**:
- ExperienceEditor is already large (~300 lines based on read)
- Adding 5 new features will increase complexity significantly
- Smaller components are easier to test, maintain, and reason about
- Follows Single Responsibility Principle (Constitution Principle II)

**Component Breakdown**:
```
ExperienceEditor.tsx (parent orchestrator)
├── PreviewMediaUpload.tsx (preview media upload/display/remove)
├── CountdownSettings.tsx (countdown toggle + timer input)
├── OverlaySettings.tsx (frame overlay upload, remove logo support)
└── AITransformSettings.tsx (horizontal ref images, aspect ratio, prompt guide)
```

**Props Pattern**:
```typescript
interface PreviewMediaUploadProps {
  previewPath?: string;
  previewType?: "image" | "gif" | "video";
  onUpload: (file: File) => Promise<void>;
  onRemove: () => Promise<void>;
}
```

**Benefits**:
- Each component independently testable
- Easier to understand and modify
- Reusable if needed elsewhere
- Clear separation of concerns

**Alternatives Considered**:
- Keep monolithic ExperienceEditor: Rejected - violates SRP, hard to maintain
- Extract to separate pages/routes: Rejected - breaks existing Event Builder flow
- Hook-based logic extraction only: Rejected - still results in large render function

---

## Summary of Decisions

| Area                      | Decision                                          | Key Technology/Pattern              |
| ------------------------- | ------------------------------------------------- | ----------------------------------- |
| Preview Media             | Firebase Storage + conditional rendering          | `<video>`, `<img>`, MIME type detection |
| Countdown Timer           | Firestore config fields, runtime in guest flow    | Zod validation (0-10 seconds)       |
| Aspect Ratio Picker       | shadcn/ui Select with 5 predefined ratios         | Enum validation, no custom input    |
| Prompt Guide Links        | Hard-coded URL constants by model                 | `ai-models.ts` constants file       |
| Reference Images Layout   | CSS Flexbox with `flex-wrap`                      | Tailwind utilities, responsive      |
| Deprecated Fields         | Remove from validation, mark optional in TS       | No data migration (legacy data OK)  |
| Component Architecture    | Break ExperienceEditor into 4 sub-components      | Props-based composition             |

---

## Open Questions / Future Considerations

**Q**: Should preview media have different size limits based on type (image vs video)?
**A**: Not for MVP - use single 10MB limit. Can refine based on usage data.

**Q**: Should countdown timer support fractional seconds (e.g., 3.5s)?
**A**: No - integer seconds only (YAGNI). Fractional seconds add UI complexity without clear value.

**Q**: How will aspect ratio affect AI generation performance/quality?
**A**: Out of scope - AI generation logic is in backend (future n8n workflow). This feature only stores aspect ratio preference.

**Q**: Should prompt guide link be validated to ensure URL is accessible?
**A**: No - hard-coded URLs are assumed valid. If URL breaks, it's a code update, not runtime validation issue.

**Q**: What happens to existing experiences with capture options after this feature deploys?
**A**: They retain old values in Firestore, but UI no longer displays/edits them. Future migration task can clean up.
