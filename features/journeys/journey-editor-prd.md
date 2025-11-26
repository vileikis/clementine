# Journey Editor PRD

## Overview

The Journey Editor is a visual canvas for creating and editing guest journeys (step sequences) within an event. It provides a 3-panel interface for managing steps, previewing the guest experience, and configuring step properties.

---

## Architecture Overview

### Shared Components Strategy

The Journey Editor uses a **composition-based architecture** that separates visual presentation from interactive behavior. The `steps` feature module owns all step-related code (data, previews, editors), while the `journeys` feature provides the editor layout/orchestration.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    components/providers/                             │
│                    EventThemeProvider.tsx                            │
│                    (Shared theme context)                            │
└─────────────────────────────────────────────────────────────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        ▼                        ▼                        ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│  features/steps/    │  │  features/journeys/ │  │  features/guest/    │
│  (Step module)      │  │  (Editor layout)    │  │  (Interactive)      │
│                     │  │                     │  │                     │
│  - types/schemas    │  │  - JourneyEditor    │  │  - Uses primitives  │
│  - CRUD actions     │  │  - StepList         │  │  - Form state       │
│  - components/      │  │  - StepPreview      │  │  - Navigation       │
│    - preview/       │  │  - StepEditor       │  │  - API calls        │
│    - editors/       │  │    (routes to       │  │                     │
│                     │  │     steps/editors)  │  │                     │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
        │                                                 │
        └─────────────────────┬───────────────────────────┘
                              ▼
               ┌─────────────────────────────────┐
               │   components/step-primitives/   │
               │   (Shared visual building       │
               │    blocks - no behavior)        │
               └─────────────────────────────────┘
```

### Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| **EventThemeProvider in `components/providers/`** | Used by 3+ features (events, journeys, guest) - belongs in shared space |
| **Steps feature owns all step code** | Data layer (types, schemas, CRUD) + presentation (preview, editors) in one cohesive module |
| **Journeys feature is thin orchestrator** | Only layout/composition - imports step components from `features/steps/` |
| **Step primitives for shared visuals** | Visual consistency without mixing behavior; both steps and guest import these |
| **Guest feature owns interactive behavior** | Form state, validation, navigation, API calls belong to guest domain |

---

## Navigation & Routing

### URL Pattern
```
/events/{eventId}/design/journeys/{journeyId}
```

**Note:** This replaces the previous pattern `/events/{eventId}/journeys/{journeyId}`

### Query Parameters
- `?stepId={stepId}` - Selected step ID (synced with URL for deep linking)

### Example URLs
```
/events/qqRz2bUTmYwDzrdTjejQ/design/journeys/journey123
/events/qqRz2bUTmYwDzrdTjejQ/design/journeys/journey123?stepId=step456
```

---

## Data Model

### Collections Structure

Both journeys and steps are **subcollections** of the event document:

```
/events/{eventId}/journeys/{journeyId}
/events/{eventId}/steps/{stepId}
```

### Step Types (from data-model-v4.md)

```typescript
export type StepType =
  // Navigation
  | "info"              // Universal message/welcome screen
  | "experience-picker" // Choose an Experience
  // Media Capture
  | "capture"           // Camera capture (loads Experience config at runtime)
  // Input Collection (one question per screen)
  | "short_text"
  | "long_text"
  | "multiple_choice"
  | "yes_no"
  | "opinion_scale"
  | "email"
  // Completion
  | "processing"        // Optional custom loading/generation screen
  | "reward";           // Final result display
```

### Step Base Interface

```typescript
interface StepBase {
  id: string;
  eventId: string;
  journeyId: string;
  type: StepType;

  // Universal Layout Props
  title?: string;
  description?: string;
  mediaUrl?: string;
  ctaLabel?: string;
}
```

See `features/data-model-v4.md` for complete step type definitions.

---

## UI Layout

### 3-Panel Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Header                                     │
│  [← Back] Journey Name (editable)                    [Save] [Delete]│
├──────────────┬───────────────────────────┬─────────────────────────┤
│              │                           │                         │
│  Left Panel  │     Middle Panel          │     Right Panel         │
│  (Steps List)│     (Visual Simulator)    │     (Config Form)       │
│              │                           │                         │
│  - Drag/Drop │     - Phone mockup        │     - Type-specific     │
│  - Add Step  │     - Live preview        │       form fields       │
│  - Reorder   │     - Event theme applied │     - Step settings     │
│              │                           │                         │
│   w: 256px   │      flex: 1              │      w: 320px           │
└──────────────┴───────────────────────────┴─────────────────────────┘
```

### Responsive Behavior

- **Desktop (lg+):** 3-column layout, side-by-side
- **Tablet (md):** Stack Right Panel below Middle Panel
- **Mobile (sm):** Stack all panels vertically

---

## Panel Specifications

### 1. Left Panel - Step List

**Reference:** `web/src/legacy-features/experiences/components/survey/SurveyStepList.tsx`

#### Features
- **Header:** "Journey Steps" title + Add Step button (+)
- **Step Items:** Draggable list with:
  - Drag handle (grip icon)
  - Step number (1, 2, 3...)
  - Step type badge (e.g., "INFO", "CAPTURE")
  - Step title (truncated)
  - Selected state highlighting
- **Drag & Drop:** @dnd-kit for reordering
- **Empty State:** "No steps yet. Add your first step."

#### Step Type Categories in Add Dialog

| Category | Types | Icon |
|----------|-------|------|
| **Navigation** | `info`, `experience-picker` | Layout, Grid |
| **Capture** | `capture` | Camera |
| **Input** | `short_text`, `long_text`, `multiple_choice`, `yes_no`, `opinion_scale`, `email` | Type, AlignLeft, List, ToggleLeft, Gauge, Mail |
| **Completion** | `processing`, `reward` | Loader, Gift |

### 2. Middle Panel - Visual Simulator

**Reference:** `web/src/legacy-features/experiences/components/survey/SurveyStepPreview.tsx`

#### Features
- **Phone Mockup:** 9:16 aspect ratio container (PhoneFrame - can be added later)
- **Live Preview:** Real-time rendering of selected step via `SimulatorScreen`
- **Event Theme Applied:** Uses `EventThemeProvider` for theme context

#### Component Composition

```tsx
// Journey Editor uses step preview components from steps feature
import { SimulatorScreen } from "@/features/steps/components/preview";
import { InfoStep, CaptureStep } from "@/features/steps/components/preview/steps";
import { EventThemeProvider } from "@/components/providers";

<EventThemeProvider theme={event.theme}>
  <SimulatorScreen>
    {selectedStep.type === "info" && <InfoStep step={selectedStep} />}
    {selectedStep.type === "capture" && <CaptureStep step={selectedStep} />}
    {/* ... other step types */}
  </SimulatorScreen>
</EventThemeProvider>
```

#### Theme Integration

From `EventTheme` (see `web/src/features/events/types/event.types.ts`):

```typescript
interface EventTheme {
  logoUrl?: string | null;
  fontFamily?: string | null;
  primaryColor: string;
  text: {
    color: string;
    alignment: "left" | "center" | "right";
  };
  button: {
    backgroundColor?: string | null; // Falls back to primaryColor
    textColor: string;
    radius: "none" | "sm" | "md" | "full";
  };
  background: {
    color: string;
    image?: string | null;
    overlayOpacity: number; // 0-1
  };
}
```

#### Preview Rendering Rules

| Step Type | Preview Content |
|-----------|----------------|
| `info` | Title, description, media, CTA button |
| `experience-picker` | Title, grid/list/carousel of experience options |
| `capture` | Camera UI placeholder, countdown indicator |
| `short_text` | Title, single-line input, CTA button |
| `long_text` | Title, multi-line textarea, CTA button |
| `multiple_choice` | Title, option buttons/checkboxes |
| `yes_no` | Title, Yes/No buttons |
| `opinion_scale` | Title, scale buttons (min-max), labels |
| `email` | Title, email input, CTA button |
| `processing` | Title, loading animation, rotating messages |
| `reward` | Title, media placeholder, share buttons |

### 3. Right Panel - Configuration Form

**Reference:** `web/src/legacy-features/experiences/components/survey/SurveyStepEditor.tsx`

#### Common Fields (All Steps)
- **Title** - Main header text
- **Description** - Subtitle/helper text
- **Media URL** - Hero image/video (with upload)
- **CTA Label** - Button text override

#### Type-Specific Configurations

**Info Step**
```
- No additional config (uses base fields only)
```

**Experience Picker Step**
```
- Layout: grid | list | carousel (select)
- Variable: string (session key name)
- Options:
  - Linked to event's Experiences
  - Show: label, value (experience ID), thumbnail
  - Can add/remove options
```

**Capture Step**
```
- Source: string (variable name holding experience ID)
- Fallback Experience ID: string (dropdown of event experiences)
```

**Short Text Step**
```
- Variable: string
- Placeholder: string
- Max Length: number (default: 500)
- Required: boolean
```

**Long Text Step**
```
- Variable: string
- Placeholder: string
- Max Length: number (default: 2000)
- Required: boolean
```

**Multiple Choice Step**
```
- Variable: string
- Options: array of { label, value }
- Allow Multiple: boolean
- Required: boolean
```

**Yes/No Step**
```
- Variable: string
- Yes Label: string (default: "Yes")
- No Label: string (default: "No")
- Required: boolean
```

**Opinion Scale Step**
```
- Variable: string
- Scale Min: number
- Scale Max: number
- Min Label: string
- Max Label: string
- Required: boolean
```

**Email Step**
```
- Variable: string
- Placeholder: string
- Required: boolean
```

**Processing Step**
```
- Messages: array of strings (rotating messages)
- Estimated Duration: number (seconds)
```

**Reward Step**
```
- Allow Download: boolean (default: true)
- Allow System Share: boolean (default: true)
- Allow Email: boolean (default: false)
- Socials: array of ShareSocial[]
```

---

## State Management

### URL Query Param Sync

```typescript
// Read selected step from URL
const searchParams = useSearchParams();
const selectedStepId = searchParams.get("stepId");

// Update URL when step is selected
const router = useRouter();
const handleStepSelect = (stepId: string) => {
  router.push(`?stepId=${stepId}`, { scroll: false });
};
```

### Auto-Selection Logic
1. On page load, if `?stepId` exists, select that step
2. If no `?stepId` but steps exist, select first step
3. If selected step is deleted, select next/previous step
4. Update URL when selection changes

---

## Experience Picker Integration

The Experience Picker step links to event's Experiences collection:

```typescript
// Fetch experiences for the event
const experiences = await getExperiencesByEventId(eventId);

// Experience Picker options are derived from experiences
interface ExperiencePickerOption {
  id: string;           // Unique option ID
  label: string;        // Display text (experience.name)
  value: string;        // Experience ID (experience.id)
  imageUrl?: string;    // Experience preview image (experience.previewMediaUrl)
}
```

### Experience Picker Editor UI
- Dropdown/autocomplete to select from event's experiences
- "Add Experience" option to link more experiences
- Preview of selected experience (thumbnail, name)
- Drag to reorder options

---

## Capture Step Integration

The Capture step dynamically loads Experience config at runtime:

```typescript
interface StepCapture {
  type: "capture";
  config: {
    source: string;                    // Variable key (e.g., "selected_experience_id")
    fallbackExperienceId?: string;     // Default if variable not set
  };
}
```

### Capture Step Editor UI
- **Source Variable:** Text input for variable name
- **Fallback Experience:** Dropdown of event's experiences
- **Preview:** Shows camera UI with selected experience's overlay (if any)

---

## Component Reuse from Legacy

### Components to Port/Adapt

| Legacy Component | New Location | Changes |
|-----------------|--------------|---------|
| `SurveyStepList.tsx` | `features/journeys/components/editor/StepList.tsx` | Update types, add new step types |
| `SurveyStepEditor.tsx` | `features/journeys/components/editor/StepEditor.tsx` | Routes to step editors in steps feature |
| `SurveyStepTypeSelector.tsx` | `features/journeys/components/editor/StepTypeSelector.tsx` | Update step type options |
| `SurveyStepPreview.tsx` | `features/steps/components/preview/steps/*` | Split into individual step components |
| Step type editors (`step-types/`) | `features/steps/components/editors/*` | Adapt for new schema |

### New Components Needed

**Steps Feature (features/steps/):**
- `components/preview/SimulatorScreen.tsx` - Theme-aware content wrapper
- `components/preview/steps/InfoStep.tsx` - Info step preview
- `components/preview/steps/ExperiencePickerStep.tsx` - Experience picker preview
- `components/preview/steps/CaptureStep.tsx` - Capture step preview
- `components/preview/steps/MultipleChoiceStep.tsx` - Multiple choice preview
- ... (one preview per step type)
- `components/editors/InfoStepEditor.tsx` - Configure info step
- `components/editors/ExperiencePickerEditor.tsx` - Configure experience-picker options
- `components/editors/CaptureStepEditor.tsx` - Configure capture step
- `components/editors/ProcessingStepEditor.tsx` - Configure processing step
- `components/editors/RewardStepEditor.tsx` - Configure reward step
- ... (one editor per step type)

**Journey Editor (features/journeys/):**
- `components/editor/JourneyEditor.tsx` - Main 3-panel layout
- `components/editor/StepList.tsx` - Left panel with drag-and-drop
- `components/editor/StepPreview.tsx` - Middle panel (uses steps/preview)
- `components/editor/StepEditor.tsx` - Right panel (routes to steps/editors)

**Shared (components/):**
- `providers/EventThemeProvider.tsx` - Theme context provider
- `step-primitives/StepLayout.tsx` - Shared layout wrapper
- `step-primitives/OptionButton.tsx` - For multiple choice, yes/no
- `step-primitives/ScaleButton.tsx` - For opinion scale
- `step-primitives/TextInput.tsx` - Themed text input
- `step-primitives/ActionButton.tsx` - Themed CTA button

---

## File Structure

```
web/src/
├── components/
│   ├── providers/
│   │   └── EventThemeProvider.tsx      # Shared theme context
│   └── step-primitives/                # Shared visual building blocks
│       ├── index.ts
│       ├── StepLayout.tsx              # Title, description, media wrapper
│       ├── OptionButton.tsx            # For multiple choice, yes/no
│       ├── ScaleButton.tsx             # For opinion scale
│       ├── TextInput.tsx               # Themed input
│       ├── TextArea.tsx                # Themed textarea
│       └── ActionButton.tsx            # Themed CTA button
│
├── features/
│   ├── steps/                          # Step data + components (cohesive module)
│   │   ├── index.ts                    # Clean exports
│   │   ├── types/
│   │   │   └── step.types.ts           # TypeScript types for all 11 step types
│   │   ├── schemas/
│   │   │   └── step.schemas.ts         # Zod validation schemas
│   │   ├── repositories/
│   │   │   └── steps.repository.ts     # Firestore CRUD operations
│   │   ├── actions/
│   │   │   └── steps.ts                # Server actions for steps
│   │   ├── constants.ts                # Step limits, defaults
│   │   └── components/
│   │       ├── preview/                # Display-only step renderers
│   │       │   ├── index.ts
│   │       │   ├── SimulatorScreen.tsx # Theme-aware content wrapper
│   │       │   └── steps/              # Read-only step previews
│   │       │       ├── index.ts
│   │       │       ├── InfoStep.tsx
│   │       │       ├── ExperiencePickerStep.tsx
│   │       │       ├── CaptureStep.tsx
│   │       │       ├── ShortTextStep.tsx
│   │       │       ├── LongTextStep.tsx
│   │       │       ├── MultipleChoiceStep.tsx
│   │       │       ├── YesNoStep.tsx
│   │       │       ├── OpinionScaleStep.tsx
│   │       │       ├── EmailStep.tsx
│   │       │       ├── ProcessingStep.tsx
│   │       │       └── RewardStep.tsx
│   │       └── editors/                # Config forms per step type
│   │           ├── index.ts
│   │           ├── BaseStepEditor.tsx  # Shared base fields form
│   │           ├── InfoStepEditor.tsx
│   │           ├── ExperiencePickerEditor.tsx
│   │           ├── CaptureStepEditor.tsx
│   │           ├── ShortTextEditor.tsx
│   │           ├── LongTextEditor.tsx
│   │           ├── MultipleChoiceEditor.tsx
│   │           ├── YesNoEditor.tsx
│   │           ├── OpinionScaleEditor.tsx
│   │           ├── EmailEditor.tsx
│   │           ├── ProcessingStepEditor.tsx
│   │           └── RewardStepEditor.tsx
│   │
│   ├── journeys/                       # Journey editor (thin orchestrator)
│   │   ├── components/
│   │   │   └── editor/
│   │   │       ├── JourneyEditor.tsx   # Main 3-panel layout
│   │   │       ├── JourneyEditorHeader.tsx
│   │   │       ├── StepList.tsx        # Left panel (drag-and-drop)
│   │   │       ├── StepListItem.tsx
│   │   │       ├── StepPreview.tsx     # Middle panel (uses steps/preview)
│   │   │       ├── StepEditor.tsx      # Right panel (routes to steps/editors)
│   │   │       └── StepTypeSelector.tsx
│   │   ├── hooks/
│   │   │   ├── useSteps.ts             # Real-time steps subscription
│   │   │   ├── useStepMutations.ts     # CRUD operations (calls steps/actions)
│   │   │   └── useSelectedStep.ts      # URL query param sync
│   │   └── actions/
│   │       └── journeys.ts             # Server actions for journeys (existing)
│   │
│   ├── guest/                          # Guest-facing experience (future)
│   │   └── components/
│   │       └── steps/                  # Interactive step components
│   │           ├── InfoStep.tsx        # Uses primitives + navigation
│   │           ├── MultipleChoiceStep.tsx  # Uses primitives + form state
│   │           └── ...                 # (state, validation, submit)
│   │
│   └── events/
│       └── components/
│           └── designer/
│               ├── ThemeEditor.tsx
│               └── ThemePreviewContent.tsx  # Sample content for theme preview
```

---

## Implementation Notes

### EventThemeProvider

```tsx
// components/providers/EventThemeProvider.tsx
import { createContext, useContext, ReactNode } from "react";
import { EventTheme } from "@/features/events/types/event.types";

interface EventThemeContextValue {
  theme: EventTheme;
  // Computed values for convenience
  buttonBgColor: string;
  buttonTextColor: string;
  buttonRadius: string;
}

const EventThemeContext = createContext<EventThemeContextValue | null>(null);

export function useEventTheme() {
  const context = useContext(EventThemeContext);
  if (!context) {
    throw new Error("useEventTheme must be used within EventThemeProvider");
  }
  return context;
}

const buttonRadiusMap = {
  none: "0px",
  sm: "0.25rem",
  md: "0.375rem",
  full: "9999px",
};

export function EventThemeProvider({
  theme,
  children
}: {
  theme: EventTheme;
  children: ReactNode;
}) {
  const value: EventThemeContextValue = {
    theme,
    buttonBgColor: theme.button.backgroundColor || theme.primaryColor,
    buttonTextColor: theme.button.textColor,
    buttonRadius: buttonRadiusMap[theme.button.radius],
  };

  return (
    <EventThemeContext.Provider value={value}>
      {children}
    </EventThemeContext.Provider>
  );
}
```

### SimulatorScreen Component

```tsx
// features/steps/components/preview/SimulatorScreen.tsx
import { useEventTheme } from "@/components/providers/EventThemeProvider";

interface SimulatorScreenProps {
  children: ReactNode;
  fullscreen?: boolean; // For guest use (no phone frame)
}

export function SimulatorScreen({ children, fullscreen = false }: SimulatorScreenProps) {
  const { theme } = useEventTheme();

  return (
    <div
      className={fullscreen ? "min-h-screen" : "aspect-[9/16] rounded-lg overflow-hidden"}
      style={{
        backgroundColor: theme.background.color,
        backgroundImage: theme.background.image ? `url(${theme.background.image})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        fontFamily: theme.fontFamily || undefined,
        color: theme.text.color,
        textAlign: theme.text.alignment,
      }}
    >
      {/* Overlay for readability when image is present */}
      {theme.background.image && (
        <div
          className="absolute inset-0 bg-black pointer-events-none"
          style={{ opacity: theme.background.overlayOpacity }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 h-full">
        {children}
      </div>
    </div>
  );
}
```

### Step Primitives Example

```tsx
// components/step-primitives/ActionButton.tsx
import { useEventTheme } from "@/components/providers/EventThemeProvider";
import { Button, ButtonProps } from "@/components/ui/button";

export function ActionButton({ children, ...props }: ButtonProps) {
  const { buttonBgColor, buttonTextColor, buttonRadius } = useEventTheme();

  return (
    <Button
      {...props}
      style={{
        backgroundColor: buttonBgColor,
        color: buttonTextColor,
        borderRadius: buttonRadius,
        ...props.style,
      }}
    >
      {children}
    </Button>
  );
}

// components/step-primitives/StepLayout.tsx
interface StepLayoutProps {
  title?: string;
  description?: string;
  required?: boolean;
  children: ReactNode;
}

export function StepLayout({ title, description, required, children }: StepLayoutProps) {
  const { theme } = useEventTheme();

  return (
    <div className="flex flex-col h-full p-6" style={{ textAlign: theme.text.alignment }}>
      {title && (
        <h2 className="text-2xl font-bold mb-2" style={{ color: theme.text.color }}>
          {title}
          {required && <span className="text-red-500 ml-1">*</span>}
        </h2>
      )}
      {description && (
        <p className="text-base mb-6 opacity-80" style={{ color: theme.text.color }}>
          {description}
        </p>
      )}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
```

### Preview vs Guest Step Example

```tsx
// features/steps/components/preview/steps/MultipleChoiceStep.tsx (read-only)
import { StepLayout, OptionButton } from "@/components/step-primitives";
import type { StepMultipleChoice } from "@/features/steps/types/step.types";

export function MultipleChoiceStep({ step }: { step: StepMultipleChoice }) {
  return (
    <StepLayout title={step.title} description={step.description} required={step.config.required}>
      <div className="space-y-3">
        {step.config.options.map((opt) => (
          <OptionButton key={opt.value} label={opt.label} disabled />
        ))}
      </div>
    </StepLayout>
  );
}

// features/guest/components/steps/MultipleChoiceStep.tsx (interactive)
import { StepLayout, OptionButton, ActionButton } from "@/components/step-primitives";
import type { StepMultipleChoice } from "@/features/steps/types/step.types";

interface Props {
  step: StepMultipleChoice;
  value: string | string[] | null;
  onChange: (value: string | string[]) => void;
  onSubmit: () => void;
}

export function MultipleChoiceStep({ step, value, onChange, onSubmit }: Props) {
  const handleSelect = (optValue: string) => {
    if (step.config.allowMultiple) {
      const current = Array.isArray(value) ? value : [];
      const updated = current.includes(optValue)
        ? current.filter((v) => v !== optValue)
        : [...current, optValue];
      onChange(updated);
    } else {
      onChange(optValue);
      onSubmit(); // Auto-advance on single select
    }
  };

  return (
    <StepLayout title={step.title} description={step.description} required={step.config.required}>
      <div className="space-y-3">
        {step.config.options.map((opt) => (
          <OptionButton
            key={opt.value}
            label={opt.label}
            selected={Array.isArray(value) ? value.includes(opt.value) : value === opt.value}
            onClick={() => handleSelect(opt.value)}
          />
        ))}
      </div>
      {step.config.allowMultiple && (
        <ActionButton onClick={onSubmit} className="mt-6">
          {step.ctaLabel || "Continue"}
        </ActionButton>
      )}
    </StepLayout>
  );
}
```

### Keyboard Shortcuts

- `Cmd/Ctrl + S` - Save changes
- `↑/↓` - Navigate steps
- `Delete/Backspace` - Delete selected step (with confirmation)
- `Cmd/Ctrl + D` - Duplicate selected step

---

## Success Criteria

### Journey Editor
1. ✅ Journey editor accessible at `/events/{eventId}/design/journeys/{journeyId}`
2. ✅ Steps are subcollection of event: `/events/{eventId}/steps/{stepId}`
3. ✅ 3-panel layout with responsive stacking
4. ✅ All 11 step types can be created and configured
5. ✅ Step preview applies event theme (background, text, button styles)
6. ✅ Experience Picker links to event's experiences
7. ✅ Capture Step references experience via variable
8. ✅ URL query param (`?stepId`) syncs with selected step
9. ✅ Drag-and-drop step reordering works
10. ✅ Real-time preview updates as config changes

### Architecture
11. ✅ `EventThemeProvider` in `components/providers/` - shared across features
12. ✅ `features/steps/` owns all step code - data layer (types, schemas, CRUD) + presentation (preview, editors)
13. ✅ `features/journeys/` is thin orchestrator - only layout/composition, imports step components
14. ✅ Step primitives in `components/step-primitives/` - shared visual building blocks
15. ✅ Preview steps (read-only in steps/) separated from guest steps (interactive in guest/)
16. ✅ Theme editor uses `SimulatorScreen` with custom `ThemePreviewContent`
