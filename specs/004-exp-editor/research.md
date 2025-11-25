# Research: Experience Editor & AI Playground

**Feature**: 004-exp-editor
**Date**: 2025-11-25

## Research Topics

### 1. AI Client Integration for Playground

**Decision**: Use existing `getAIClient()` factory pattern from `web/src/lib/ai/client.ts`

**Rationale**: The AI infrastructure is already established with a provider-agnostic interface. The `generateImage()` method accepts `TransformParams` and returns a `Buffer`, which is exactly what the playground needs.

**Implementation Details**:
- Interface: `AIClient.generateImage(params: TransformParams): Promise<Buffer>`
- TransformParams: `{ prompt, inputImageUrl, referenceImageUrl?, brandColor? }`
- Providers: GoogleAI (production), n8n webhook, Mock (testing)
- Default model: `gemini-2.5-flash-image`

**Alternatives Considered**:
- Direct Google AI SDK calls: Rejected - would bypass the existing abstraction layer
- New playground-specific AI service: Rejected - unnecessary duplication

### 2. Photo Upload and Temporary Storage

**Decision**: Use client-side File API with Base64 encoding for playground (no Firebase Storage persistence)

**Rationale**: Playground images are temporary test assets. Persisting them to Firebase Storage would waste storage and require cleanup logic. Client-side handling is simpler and aligns with the spec requirement that test results are not persisted.

**Implementation Details**:
- Accept file via drag-and-drop or file picker
- Validate: JPEG, PNG, WebP formats only, max 10MB
- Convert to Base64 data URL for preview display
- For AI generation: Either upload temporarily to get URL, or pass Base64 directly if provider supports it

**Note**: The current `GoogleAIProvider` fetches images via URL, so a temporary upload to Firebase Storage may be needed for the actual AI call. The resulting transformed image is displayed but NOT persisted.

**Alternatives Considered**:
- Persist all playground images: Rejected - creates storage bloat
- Base64-only flow: May work if AI provider supports inline data (needs testing)

### 3. Split-Screen Layout Pattern

**Decision**: Use CSS Grid with responsive breakpoints following existing patterns

**Rationale**: The existing ThemeEditor uses a similar split-screen pattern. CSS Grid provides clean layout control with minimal JS.

**Desktop Layout (≥1024px)**:
```css
display: grid;
grid-template-columns: 1fr 1fr;
grid-template-rows: auto 1fr;
```

**Mobile Layout (<1024px)**:
```css
display: flex;
flex-direction: column;
/* OR tabs for switching between config/playground */
```

**Existing Pattern Reference**: `ThemeEditor.tsx` uses grid-based split view

**Alternatives Considered**:
- Resizable panels: Rejected - adds complexity, not requested in spec
- Tabs for mobile: Valid option, simpler than vertical scroll for large forms

### 4. AI Model Selection

**Decision**: Use existing model options from `experiences.constants.ts` with simple dropdown

**Rationale**: The experiences module already defines available AI models. Reuse this constant for consistency.

**Available Models** (from exploration):
- `gemini-2.5-flash-image` (default in GoogleAI provider)
- Future: Additional models can be added to constants

**UI Pattern**: Simple `<select>` dropdown from shadcn/ui (`Select` component)

**Alternatives Considered**:
- Hardcoded options: Rejected - should use shared constants
- Dynamic model fetch from API: Over-engineering for current needs

### 5. Form State Management

**Decision**: Use `useState` for local state (following PhotoExperienceEditor pattern)

**Rationale**: The existing `PhotoExperienceEditor` uses simple `useState` for form fields with `useTransition` for async saves. This pattern is proven and simple.

**Pattern**:
```typescript
const [name, setName] = useState(experience.name);
const [prompt, setPrompt] = useState(experience.aiPhotoConfig?.prompt ?? "");
const [model, setModel] = useState(experience.aiPhotoConfig?.model ?? "gemini-2.5-flash-image");
```

**Alternatives Considered**:
- React Hook Form: Overhead for this use case since most fields are simple
- useReducer: Better for complex nested state, but form is relatively flat

### 6. Playground Generation Flow

**Decision**: Server Action for AI generation to protect API keys and handle large payloads

**Rationale**: AI API keys should not be exposed to client. Server Actions provide secure execution with proper error handling.

**Flow**:
1. User uploads test image (client-side)
2. Image uploaded to temp Firebase Storage location (with expiry)
3. User clicks Generate
4. Server Action receives: experienceId, testImageUrl
5. Server fetches experience config
6. Server calls AI client with params from experience
7. Server returns transformed image as Base64 or uploads to temp storage
8. Client displays result

**Alternatives Considered**:
- Client-side AI calls: Rejected - exposes API keys
- WebSocket streaming: Over-engineering for single image generation

## Summary Table

| Topic | Decision | Key Rationale |
|-------|----------|---------------|
| AI Client | Use existing `getAIClient()` | Infrastructure exists, provider-agnostic |
| Photo Storage | Client-side File API, temp upload for AI | Playground results not persisted per spec |
| Layout | CSS Grid, responsive stacking | Follows ThemeEditor pattern |
| Model Selection | Dropdown with constants | Consistent with existing UI patterns |
| Form State | useState | Matches PhotoExperienceEditor pattern |
| Generation Flow | Server Action | Protects API keys, handles payloads |

## Deferred

- **Branding Context**: Automatic injection of event theme colors into AI prompts. See `deferred/branding-context.md` for details.
