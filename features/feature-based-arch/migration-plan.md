# Feature Module Migration Plan

This document provides a step-by-step plan to reorganize the codebase from the current component-type structure to a feature-based architecture as defined in [feature-based-arch.md](./feature-based-arch.md).

## Current State Analysis

### Existing Structure

```
web/src/
├── components/
│   ├── guest/              # Guest-facing photo capture components (9 files)
│   ├── organizer/          # Event creator/admin components (16 files)
│   │   └── builder/        # Event builder specific components (15 files)
│   └── ui/                 # shadcn/ui components (13 files) - KEEP AS-IS
├── hooks/
│   ├── useCamera.ts
│   ├── useGuestFlow.ts
│   └── useKeyboardShortcuts.ts
├── lib/
│   ├── actions/            # Server actions (10 files)
│   ├── repositories/       # Firestore data layer (6 files)
│   ├── schemas/            # Zod validation (2 files)
│   ├── ai/                 # AI integration (5 files)
│   ├── firebase/           # Firebase client/admin (2 files)
│   ├── storage/            # File upload (2 files)
│   ├── cache/              # Cache utilities (1 file)
│   ├── camera/             # Camera utilities (1 file)
│   ├── constants/          # Constants (1 file)
│   ├── qr/                 # QR generation (1 file)
│   ├── types/              # TypeScript types (3 files)
│   └── utils/              # Utilities (2 files)
└── app/
    ├── (admin)/            # Admin routes (companies, events list)
    ├── (studio)/           # Event builder routes
    ├── (public)/           # Guest-facing routes (/join/[eventId])
    └── login/              # Auth
```

### Identified Feature Domains

Based on the product architecture and current codebase, these are the distinct feature modules:

1. **Events** - Event management, configuration, builder UI
2. **Companies** - Company/brand management
3. **Experiences** - Photo/video/gif/wheel experiences (currently photo only)
4. **Sessions** - Guest sessions, result viewing
5. **Guest** - Public-facing guest photo capture flow
6. **Distribution** - QR codes, sharing, link generation
7. **Analytics** - Results tracking and analytics (future)

### What Stays in Shared Locations

**Keep in `components/ui/`:**
- All shadcn/ui components (design system primitives)

**Keep in `lib/`:**
- `lib/firebase/` - App-wide Firebase clients
- `lib/auth.ts` - App-wide auth utilities
- `lib/routes.ts` - App-wide routing constants
- `lib/utils.ts` - Generic utilities (cn, etc.)
- `lib/utils/urls.ts` - Generic URL utilities

**Keep in `hooks/`:**
- `useKeyboardShortcuts.ts` - App-wide keyboard shortcuts

---

## Proposed Feature Structure

> **Note:** This follows **Option A** from [organization-strategy.md](./organization-strategy.md) - single feature with internal organization via subfolders.

```
web/src/
├── features/
│   ├── events/                           # Event management & builder
│   │   ├── components/
│   │   │   ├── studio/                   # Event list, cards, forms
│   │   │   ├── designer/                 # Builder UI (welcome, ending editors)
│   │   │   └── shared/                   # Shared between studio & designer
│   │   ├── hooks/
│   │   ├── lib/
│   │   │   ├── actions.ts
│   │   │   ├── repository.ts
│   │   │   └── validation.ts
│   │   ├── types/
│   │   └── index.ts                      # Single public API
│   ├── companies/                        # Company/brand management
│   │   ├── components/
│   │   ├── lib/
│   │   │   ├── actions.ts
│   │   │   ├── repository.ts
│   │   │   ├── cache.ts
│   │   │   └── validation.ts
│   │   ├── types/
│   │   └── index.ts
│   ├── experiences/                      # Photo/video/gif/wheel experiences
│   │   ├── components/
│   │   │   ├── shared/                   # Common experience components
│   │   │   ├── photo/                    # Photo-specific settings
│   │   │   ├── video/                    # Video-specific (future)
│   │   │   ├── gif/                      # Gif-specific (future)
│   │   │   └── wheel/                    # Wheel-specific (future)
│   │   ├── hooks/
│   │   ├── lib/
│   │   │   ├── actions.ts
│   │   │   ├── repository.ts
│   │   │   ├── validation.ts
│   │   │   └── constants.ts
│   │   ├── types/
│   │   └── index.ts
│   ├── sessions/                         # Guest session management
│   │   ├── components/                   # (minimal - mostly data layer)
│   │   ├── lib/
│   │   │   ├── actions.ts
│   │   │   └── repository.ts
│   │   ├── types/
│   │   └── index.ts
│   ├── guest/                            # Public-facing capture flow
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   │   └── capture.ts
│   │   ├── types/
│   │   └── index.ts
│   ├── distribution/                     # QR codes, sharing
│   │   ├── components/
│   │   ├── lib/
│   │   │   ├── actions.ts
│   │   │   └── qr.ts
│   │   ├── types/
│   │   └── index.ts
│   └── analytics/                        # Future: Results & analytics
│       └── (future)
├── components/
│   ├── shared/         # Generic shared components (cross-feature)
│   └── ui/             # shadcn/ui components (design system)
├── hooks/              # App-wide hooks only (useKeyboardShortcuts)
├── lib/                # App-wide utilities only
│   ├── firebase/       # Firebase client/admin
│   ├── ai/             # AI integration infrastructure
│   ├── storage/        # File upload utilities
│   ├── auth.ts
│   ├── routes.ts
│   └── utils.ts
└── app/                # Next.js routes (minimal components here)
```

### Key Principles

1. **Single feature = single domain** - Events is one feature despite having studio & designer
2. **Internal organization via subfolders** - Use `studio/`, `designer/`, `photo/`, etc. within `components/`
3. **One public API per feature** - Single `index.ts` exports everything
4. **No "shared" features** - Shared code goes to `components/shared/` or `lib/`, not `features/shared/`

---

## ⚠️ CRITICAL: Server/Client Code Separation

**This is the most important rule to follow during migration to avoid runtime errors.**

### The Problem

Next.js separates code into **server bundles** (Node.js) and **client bundles** (browser). When you export server-only code from a feature's public API (`index.ts`), client components that import from that file will try to bundle server-only dependencies (like Firebase Admin SDK), causing errors:

```
Module not found: Can't resolve 'tls'
```

### The Rule: What to Export from `index.ts`

**✅ SAFE to export from public API:**
- **Components** - Both client and server components are safe
- **Server Actions** - Functions marked with `"use server"` (Next.js handles them automatically)
- **TypeScript types** - Compile-time only, no runtime code

**❌ NEVER export from public API:**
- **Repository functions** - Use Firebase Admin SDK (server-only)
- **Direct database/Firebase imports** - Server-only packages
- **Cache functions** - Often use server-only APIs
- **Any function that imports `firebase-admin`, `fs`, `path`, or other Node.js modules**

### Correct Pattern

**Bad (causes errors):**
```typescript
// features/companies/index.ts - ❌ DON'T DO THIS
export { CompanyForm } from "./components/CompanyForm";
export { createCompanyAction } from "./lib/actions";
export { getCompany } from "./lib/repository"; // ❌ Server-only!
export type { Company } from "./types/company.types";
```

**Good:**
```typescript
// features/companies/index.ts - ✅ CORRECT
export { CompanyForm } from "./components/CompanyForm";
export { createCompanyAction } from "./lib/actions";
export type { Company } from "./types/company.types";

// Note: Repository functions are NOT exported.
// They should only be used internally within server code.
```

### When to Use Direct Imports

**Use the public API** (`@/features/companies`):
```typescript
// ✅ Client components
import { CompanyForm, createCompanyAction } from "@/features/companies";

// ✅ Server components
import { CompanyForm, createCompanyAction } from "@/features/companies";
```

**Use direct imports** (`@/features/companies/lib/repository`):
```typescript
// ✅ Server actions (lib/actions/*.ts)
import { getCompany } from "@/features/companies/lib/repository";

// ✅ Server components (app routes)
import { getCompany } from "@/features/companies/lib/repository";

// ✅ Other server-only code
import { getCompany } from "@/features/companies/lib/repository";
```

### Detection During Migration

**Before creating `index.ts`, check each export:**

1. **Open the file** you're about to export
2. **Look for these imports** at the top:
   - `firebase-admin` → ❌ Don't export
   - `@/lib/firebase/admin` → ❌ Don't export
   - `fs`, `path`, Node.js modules → ❌ Don't export
3. **Check if file is used by client components**:
   - If YES → ❌ Don't export if it has server-only imports
   - If NO (only used in server code) → Still ❌ don't export to keep API clean

### Example: Companies Feature

**Public API (`features/companies/index.ts`):**
```typescript
// ============================================================================
// Components - Safe for client & server
// ============================================================================
export { CompanyCard } from "./components/CompanyCard";
export { CompanyForm } from "./components/CompanyForm";

// ============================================================================
// Server Actions - Safe (marked "use server")
// ============================================================================
export {
  createCompanyAction,
  listCompaniesAction,
  getCompanyAction,
} from "./lib/actions";

// ============================================================================
// Types - Safe (compile-time only)
// ============================================================================
export type { Company, CompanyStatus } from "./types/company.types";

// ============================================================================
// Repository & Cache - NOT EXPORTED
// These contain server-only code and should be imported directly when needed
// ============================================================================
```

**Server Actions (`features/companies/lib/actions.ts`):**
```typescript
"use server";

// Direct import - this file is server-only
import { createCompany, getCompany } from "./repository";

export async function createCompanyAction(input) {
  // Use repository functions here
  const id = await createCompany(input);
  return { success: true, id };
}
```

**Server Component (`app/(admin)/companies/page.tsx`):**
```typescript
// Use public API for actions
import { listCompaniesAction, type Company } from "@/features/companies";

// Or direct import if you need repository (rare)
import { listCompanies } from "@/features/companies/lib/repository";
```

**Client Component (`features/companies/components/CompanyForm.tsx`):**
```typescript
"use client";

// Only use public API - never import repository directly!
import { createCompanyAction, type Company } from "@/features/companies";
```

### Testing Your Public API

After creating `index.ts`, verify it's safe:

1. **Run type check**: `pnpm type-check`
2. **Start dev server**: `pnpm dev`
3. **Check for errors** like "Module not found: Can't resolve 'tls'"
4. **If you see server-only module errors**:
   - Find which export is causing it
   - Remove it from `index.ts`
   - Update imports to use direct paths

### Summary

**Golden Rule**: If a file imports `firebase-admin` or any Node.js module, **DO NOT export it from `index.ts`**. Import it directly where needed in server-only code.

---

## Migration Steps

> **Note:** See [organization-strategy.md](./organization-strategy.md) for detailed rationale on feature structure decisions.

### Phase 1: Create Feature Directories

**Action:** Create the feature module directory structure.

```bash
cd web/src
mkdir -p features/companies/{components,lib,types}
mkdir -p features/distribution/{components,lib,types}
mkdir -p features/guest/{components,hooks,lib,types}
mkdir -p features/sessions/{components,lib,types}
mkdir -p features/experiences/{components/{shared,photo},hooks,lib,types}
mkdir -p features/events/{components/{studio,designer,shared},hooks,lib,types}
mkdir -p components/shared
```

---

### Phase 2: Migrate Companies Feature (Easiest - Start Here)

**Scope:** Company/brand management.

#### 2.1 Move Components

```bash
mv components/organizer/CompanyCard.tsx features/companies/components/
mv components/organizer/CompanyFilter.tsx features/companies/components/
mv components/organizer/CompanyForm.tsx features/companies/components/
mv components/organizer/DeleteCompanyDialog.tsx features/companies/components/
mv components/organizer/BrandColorPicker.tsx features/companies/components/
mv components/organizer/BrandingForm.tsx features/companies/components/
```

#### 2.2 Move Server Actions

```bash
mv lib/actions/companies.ts features/companies/lib/actions.ts
mv lib/actions/companies.test.ts features/companies/lib/actions.test.ts
```

#### 2.3 Move Repository

```bash
mv lib/repositories/companies.ts features/companies/lib/repository.ts
mv lib/repositories/companies.test.ts features/companies/lib/repository.test.ts
```

#### 2.4 Move Cache Utilities

```bash
mv lib/cache/company-status.ts features/companies/lib/cache.ts
```

#### 2.5 Create Types

```bash
# Create features/companies/types/company.types.ts
# Extract Company, CompanyStatus types from lib/types/firestore.ts
```

#### 2.6 Create Public API

> ⚠️ **IMPORTANT**: Review the [Server/Client Code Separation](#️-critical-serverclient-code-separation) section before creating this file. **DO NOT export repository or cache functions** - they contain server-only code.

Create `features/companies/index.ts`:

```typescript
// Components
export { CompanyCard } from './components/CompanyCard';
export { CompanyFilter } from './components/CompanyFilter';
export { CompanyForm } from './components/CompanyForm';
export { DeleteCompanyDialog } from './components/DeleteCompanyDialog';
export { BrandColorPicker } from './components/BrandColorPicker';
export { BrandingForm } from './components/BrandingForm';

// Server Actions (safe for client components)
export {
  createCompanyAction,
  listCompaniesAction,
  getCompanyAction,
  updateCompanyAction,
  getCompanyEventCountAction,
  deleteCompanyAction,
} from './lib/actions';

// Types
export type {
  Company,
  CompanyStatus,
} from './types/company.types';

// NOTE: Repository and cache functions are NOT exported
// They contain server-only code (Firebase Admin SDK)
// Import directly when needed: @/features/companies/lib/repository
```

#### 2.7 Update Imports

**For components and server actions:**
```typescript
// ✅ Use public API
import { CompanyCard, createCompanyAction } from "@/features/companies";
```

**For repository functions in server code:**
```typescript
// ✅ Import directly (server-only files)
import { getCompany } from "@/features/companies/lib/repository";
```

Update imports in:
- `app/(admin)/companies/` routes - Use public API
- `components/` that use companies - Use public API
- `lib/actions/` that use company repository - Use direct import (`/lib/repository`)
- Test files - Use appropriate import based on what they're testing

---

### Phase 3: Migrate Distribution Feature

**Scope:** QR codes, sharing, link generation.

#### 3.1 Move Components

```bash
mv components/organizer/CopyLinkButton.tsx features/distribution/components/
mv components/organizer/QRPanel.tsx features/distribution/components/
```

#### 3.2 Move QR Utilities

```bash
mv lib/qr/generate.ts features/distribution/lib/qr.ts
mv lib/actions/qr.ts features/distribution/lib/actions.ts
```

#### 3.3 Create Public API

> ⚠️ **IMPORTANT**: Only export components, server actions, and types. Do NOT export repository functions.

Create `features/distribution/index.ts`:

```typescript
// Components
export { CopyLinkButton } from './components/CopyLinkButton';
export { QRPanel } from './components/QRPanel';

// Actions & Utilities
export {
  generateQR,
} from './lib/actions';

export {
  generateQRCode,
} from './lib/qr';
```

#### 3.4 Update Imports

Update imports in distribution routes and event builder.

---

### Phase 4: Migrate Guest Feature

**Scope:** Public-facing guest photo capture experience.

#### 4.1 Move Components

```bash
mv components/guest/BrandThemeProvider.tsx features/guest/components/
mv components/guest/CameraView.tsx features/guest/components/
mv components/guest/CaptureButton.tsx features/guest/components/
mv components/guest/Countdown.tsx features/guest/components/
mv components/guest/ErrorBanner.tsx features/guest/components/
mv components/guest/GreetingScreen.tsx features/guest/components/
mv components/guest/GuestFlowContainer.tsx features/guest/components/
mv components/guest/ResultViewer.tsx features/guest/components/
mv components/guest/RetakeButton.tsx features/guest/components/
```

#### 4.2 Move Hooks

```bash
mv hooks/useCamera.ts features/guest/hooks/
mv hooks/useGuestFlow.ts features/guest/hooks/
```

#### 4.3 Move Camera Utilities

```bash
mv lib/camera/capture.ts features/guest/lib/capture.ts
```

#### 4.4 Create Public API

> ⚠️ **IMPORTANT**: Only export components, hooks, and types. Guest feature doesn't have server actions or repository.

Create `features/guest/index.ts`:

```typescript
// Components
export { BrandThemeProvider } from './components/BrandThemeProvider';
export { CameraView } from './components/CameraView';
export { CaptureButton } from './components/CaptureButton';
export { Countdown } from './components/Countdown';
export { ErrorBanner } from './components/ErrorBanner';
export { GreetingScreen } from './components/GreetingScreen';
export { GuestFlowContainer } from './components/GuestFlowContainer';
export { ResultViewer } from './components/ResultViewer';
export { RetakeButton } from './components/RetakeButton';

// Hooks
export { useCamera } from './hooks/useCamera';
export { useGuestFlow } from './hooks/useGuestFlow';

// Utilities
export {
  captureFromCamera,
  captureFromVideo,
} from './lib/capture';
```

#### 4.5 Update Imports

Update imports in `app/(public)/join/[eventId]/` routes.

---

### Phase 5: Migrate Sessions Feature

**Scope:** Guest sessions, result viewing.

#### 5.1 Move Server Actions

```bash
mv lib/actions/sessions.ts features/sessions/lib/actions.ts
```

#### 5.2 Move Repository

```bash
mv lib/repositories/sessions.ts features/sessions/lib/repository.ts
mv lib/repositories/sessions.test.ts features/sessions/lib/repository.test.ts
```

#### 5.3 Create Types

```bash
# Create features/sessions/types/session.types.ts
# Extract Session, SessionState types from lib/types/firestore.ts
```

#### 5.4 Create Public API

> ⚠️ **IMPORTANT**: Only export server actions and types. Do NOT export repository functions (they use Firebase Admin).

Create `features/sessions/index.ts`:

```typescript
// Actions
export {
  getSession,
  getSessions,
  createSession,
  updateSession,
  updateSessionState,
} from './lib/actions';

// Repository
export {
  sessionRepository,
} from './lib/repository';

// Types
export type {
  Session,
  SessionState,
} from './types/session.types';
```

#### 5.5 Update Imports

Update imports in guest flow components and results pages.

---

### Phase 6: Migrate Experiences Feature

**Scope:** Photo/video/gif/wheel experiences.

> **Note:** Uses `shared/` and `photo/` subfolders. See [organization-strategy.md](./organization-strategy.md) for rationale.

#### 6.1 Move Shared Components

```bash
mv components/organizer/builder/ExperiencesList.tsx features/experiences/components/shared/
mv components/organizer/builder/CreateExperienceForm.tsx features/experiences/components/shared/
mv components/organizer/builder/ExperienceEditor.tsx features/experiences/components/shared/
mv components/organizer/builder/ExperienceEditor.test.tsx features/experiences/components/shared/
mv components/organizer/builder/ExperienceEditorWrapper.tsx features/experiences/components/shared/
mv components/organizer/builder/PreviewMediaUpload.tsx features/experiences/components/shared/
mv components/organizer/builder/PreviewMediaUpload.test.tsx features/experiences/components/shared/
```

#### 6.2 Move Photo-Specific Components

```bash
mv components/organizer/builder/AITransformSettings.tsx features/experiences/components/photo/
mv components/organizer/builder/AITransformSettings.test.tsx features/experiences/components/photo/
mv components/organizer/builder/CountdownSettings.tsx features/experiences/components/photo/
mv components/organizer/builder/CountdownSettings.test.tsx features/experiences/components/photo/
mv components/organizer/builder/OverlaySettings.tsx features/experiences/components/photo/
mv components/organizer/builder/OverlaySettings.test.tsx features/experiences/components/photo/
mv components/organizer/PromptEditor.tsx features/experiences/components/photo/
mv components/organizer/RefImageUploader.tsx features/experiences/components/photo/
mv components/organizer/ModeSelector.tsx features/experiences/components/photo/
```

#### 6.3 Move Server Actions

```bash
mv lib/actions/experiences.ts features/experiences/lib/actions.ts
```

#### 6.4 Move Repository

```bash
mv lib/repositories/experiences.ts features/experiences/lib/repository.ts
```

#### 6.5 Move AI Constants

```bash
mv lib/constants/ai-models.ts features/experiences/lib/constants.ts
```

#### 6.6 Create Types

```bash
# Create features/experiences/types/experience.types.ts
# Extract Experience, ExperienceType, PreviewType, AspectRatio from lib/types/firestore.ts
```

#### 6.7 Create Public API

> ⚠️ **IMPORTANT**: Only export components, server actions, constants, and types. Do NOT export repository functions.

Create `features/experiences/index.ts`:

```typescript
// Shared components
export { ExperiencesList } from './components/shared/ExperiencesList';
export { CreateExperienceForm } from './components/shared/CreateExperienceForm';
export { ExperienceEditor } from './components/shared/ExperienceEditor';
export { ExperienceEditorWrapper } from './components/shared/ExperienceEditorWrapper';
export { PreviewMediaUpload } from './components/shared/PreviewMediaUpload';

// Photo-specific components
export { AITransformSettings } from './components/photo/AITransformSettings';
export { CountdownSettings } from './components/photo/CountdownSettings';
export { OverlaySettings } from './components/photo/OverlaySettings';
export { PromptEditor } from './components/photo/PromptEditor';
export { RefImageUploader } from './components/photo/RefImageUploader';
export { ModeSelector } from './components/photo/ModeSelector';

// Actions
export {
  getExperience,
  getExperiences,
  createExperience,
  updateExperience,
  deleteExperience,
} from './lib/actions';

// Repository
export {
  experienceRepository,
} from './lib/repository';

// Constants
export {
  AI_MODELS,
  DEFAULT_AI_MODEL,
} from './lib/constants';

// Types
export type {
  Experience,
  ExperienceType,
  PreviewType,
  AspectRatio,
} from './types/experience.types';
```

#### 6.8 Update Imports

Update imports in event builder routes and components.

---

### Phase 7: Migrate Events Feature (Most Complex - Do Last)

**Scope:** Event management, event builder, event configuration.

> **Note:** Uses `studio/`, `designer/`, and `shared/` subfolders. See [organization-strategy.md](./organization-strategy.md) for rationale.

#### 7.1 Move Studio Components

```bash
mv components/organizer/EventCard.tsx features/events/components/studio/
mv components/organizer/EventForm.tsx features/events/components/studio/
mv components/organizer/EventStatusSwitcher.tsx features/events/components/studio/
mv components/organizer/EventBreadcrumb.tsx features/events/components/studio/
```

#### 7.2 Move Designer Components

```bash
mv components/organizer/builder/BuilderSidebar.tsx features/events/components/designer/
mv components/organizer/builder/DesignSidebar.tsx features/events/components/designer/
mv components/organizer/builder/WelcomeEditor.tsx features/events/components/designer/
mv components/organizer/builder/EndingEditor.tsx features/events/components/designer/
mv components/organizer/builder/PreviewPanel.tsx features/events/components/designer/
mv components/organizer/builder/BuilderContent.tsx features/events/components/designer/
mv components/organizer/builder/ImageUploadField.tsx features/events/components/designer/
```

#### 7.3 Move Shared Components

```bash
mv components/organizer/EventTabs.tsx features/events/components/shared/
mv components/organizer/TabLink.tsx features/events/components/shared/
mv components/organizer/EditableEventName.tsx features/events/components/shared/
```

#### 7.4 Move Server Actions

```bash
mv lib/actions/events.ts features/events/lib/actions.ts
mv lib/actions/events.test.ts features/events/lib/actions.test.ts
```

#### 7.5 Move Repository

```bash
mv lib/repositories/events.ts features/events/lib/repository.ts
mv lib/repositories/events.test.ts features/events/lib/repository.test.ts
```

#### 7.6 Move Schemas

```bash
# Extract event-specific schemas from lib/schemas/validation.ts
# You'll need to manually split this file
# Create features/events/lib/validation.ts with event-specific schemas
```

#### 7.7 Create Types

```bash
# Create features/events/types/event.types.ts
# Extract Event, EventStatus types from lib/types/firestore.ts
```

#### 7.8 Create Public API

> ⚠️ **IMPORTANT**: Review [Server/Client Code Separation](#️-critical-serverclient-code-separation). Do NOT export repository functions.

Create `features/events/index.ts`:

```typescript
// Studio components
export { EventCard } from './components/studio/EventCard';
export { EventForm } from './components/studio/EventForm';
export { EventStatusSwitcher } from './components/studio/EventStatusSwitcher';
export { EventBreadcrumb } from './components/studio/EventBreadcrumb';

// Designer components
export { BuilderSidebar } from './components/designer/BuilderSidebar';
export { DesignSidebar } from './components/designer/DesignSidebar';
export { WelcomeEditor } from './components/designer/WelcomeEditor';
export { EndingEditor } from './components/designer/EndingEditor';
export { PreviewPanel } from './components/designer/PreviewPanel';
export { BuilderContent } from './components/designer/BuilderContent';
export { ImageUploadField } from './components/designer/ImageUploadField';

// Shared components
export { EventTabs } from './components/shared/EventTabs';
export { TabLink } from './components/shared/TabLink';
export { EditableEventName } from './components/shared/EditableEventName';

// Actions
export {
  getEvent,
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  updateEventWelcome,
  updateEventEnding,
  updateEventShare,
  updateEventSurvey,
  incrementEventExperiences,
} from './lib/actions';

// Repository
export {
  eventRepository,
} from './lib/repository';

// Types
export type {
  Event,
  EventStatus,
} from './types/event.types';
```

#### 7.9 Update Imports

Update all imports in:
- `app/(admin)/events/` routes
- `app/(studio)/events/` routes
- Other files importing event components

Change from:
```typescript
import { EventCard } from '@/components/organizer/EventCard';
import { getEvent } from '@/lib/actions/events';
```

To:
```typescript
import { EventCard, getEvent } from '@/features/events';
```

---

### Phase 8: Migrate Remaining Shared Components

**Scope:** Generic shared components (not feature-specific).

#### 8.1 Move Components

```bash
mv components/organizer/LogoutButton.tsx components/shared/
```

#### 8.2 Update Imports

Update imports from:
```typescript
import { LogoutButton } from '@/components/organizer/LogoutButton';
```

To:
```typescript
import { LogoutButton } from '@/components/shared/LogoutButton';
```

---

### Phase 9: Handle Remaining Files


#### 9.1 Scene-Related Files (Decision Needed)

**Files:**
- `lib/actions/scenes.ts`
- `lib/repositories/scenes.ts`
- `lib/repositories/scenes.test.ts`

**Options:**

A. **Merge into Experiences** - Scenes seem closely related to experiences
B. **Keep in lib/** - If scenes are app-wide infrastructure
C. **Create separate feature** - If scenes warrant their own domain

**Recommendation:** Merge into Experiences feature (scenes are deprecated/being phased out based on the builder redesign).

#### 9.2 Storage Utilities (Keep in lib/)

**Files:**
- `lib/actions/storage.ts`
- `lib/storage/upload.ts`
- `lib/storage/upload.test.ts`

**Decision:** Keep in `lib/` - Storage is app-wide infrastructure used by multiple features.

#### 9.3 Survey (Not Yet Implemented)

**Files:**
- `lib/actions/survey.ts`

**Decision:** Keep in `lib/` for now. When survey feature is implemented, create `features/survey/`.

#### 9.4 AI Integration (Decision Needed)

**Files:**
- `lib/ai/client.ts`
- `lib/ai/nano-banana.ts`
- `lib/ai/providers/google-ai.ts`
- `lib/ai/providers/mock.ts`
- `lib/ai/providers/n8n-webhook.ts`
- `lib/ai/types.ts`

**Options:**

A. **Keep in lib/** - AI is infrastructure used by experiences
B. **Move to Experiences** - AI is tightly coupled to experiences

**Recommendation:** Keep in `lib/ai/` - It's infrastructure that experiences depend on, not part of the experiences feature itself.

#### 9.5 Consolidated Types

**File:** `lib/types/firestore.ts`

**Action:** This file should be gradually split as types move into their respective features. Eventually, this file should only contain:
- Shared types used across multiple features
- Generic Firestore utility types
- Types for features not yet migrated

---

### Phase 10: Update tsconfig Paths (Optional)

Add feature-specific path aliases to `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/features/*": ["./src/features/*"]
    }
  }
}
```

This allows imports like:
```typescript
import { EventCard } from '@/features/events';
```

---

### Phase 11: Cleanup Empty Directories

After migration, remove empty directories:

```bash
# Only remove if empty
rmdir components/guest
rmdir components/organizer/builder
rmdir components/organizer
rmdir hooks  # Only if useKeyboardShortcuts was moved/removed
```

---

## Testing Checklist

After each phase, verify:

- [ ] TypeScript compiles without errors (`pnpm type-check`)
- [ ] ESLint passes (`pnpm lint`)
- [ ] All tests pass (`pnpm test`)
- [ ] Dev server starts successfully (`pnpm dev`)
- [ ] Feature-specific routes load correctly
- [ ] No broken imports (check browser console)
- [ ] All functionality works as expected

### Critical Routes to Test

**Admin:**
- [ ] `/companies` - Companies list
- [ ] `/companies/[id]` - Company detail
- [ ] `/events` - Events list with company filter
- [ ] `/events/new` - Create event

**Studio (Event Builder):**
- [ ] `/events/[id]/design` - Design tab overview
- [ ] `/events/[id]/design/welcome` - Welcome screen editor
- [ ] `/events/[id]/design/experiences` - Experiences list
- [ ] `/events/[id]/design/experiences/create` - Create experience
- [ ] `/events/[id]/design/experiences/[experienceId]` - Experience editor
- [ ] `/events/[id]/design/ending` - Ending screen editor
- [ ] `/events/[id]/distribution` - Distribution tab (QR, share links)
- [ ] `/events/[id]/results` - Results/analytics tab

**Guest:**
- [ ] `/join/[eventId]` - Guest photo capture flow

---

## Migration Tips

### 1. Work in Small Batches

Don't migrate everything at once. Complete each phase fully, test, and commit before moving to the next.

### 2. Use Git Branches

Create a feature branch for each phase:
```bash
git checkout -b feature/migrate-events-module
# Complete Phase 2
git commit -am "Migrate events to feature module"
git checkout main
```

### 3. Search & Replace for Imports

Use your editor's find-and-replace across the workspace:

**Find:**
```
from '@/components/organizer/EventCard'
```

**Replace:**
```
from '@/features/events'
```

**Find:**
```
from '@/lib/actions/events'
```

**Replace:**
```
from '@/features/events'
```

### 4. Validate with TypeScript

After updating imports, run:
```bash
pnpm type-check
```

TypeScript will show all remaining broken imports.

### 5. Test Incrementally

After each component migration, verify the app still works:
```bash
pnpm dev
# Visit affected routes in browser
```

### 6. Update Tests

Don't forget to update import paths in test files (`.test.ts`, `.test.tsx`).

---

## Anti-Patterns to Avoid

### ❌ DON'T Export Server-Only Code from Public API (CRITICAL)

**Bad (causes "Module not found: Can't resolve 'tls'" error):**
```typescript
// features/companies/index.ts
export { CompanyForm } from './components/CompanyForm';
export { getCompany } from './lib/repository'; // ❌ Uses Firebase Admin!
```

**Error you'll see:**
```
Module not found: Can't resolve 'tls'
```

**Good:**
```typescript
// features/companies/index.ts
export { CompanyForm } from './components/CompanyForm';
export { createCompanyAction } from './lib/actions'; // ✅ Server action is safe
export type { Company } from './types/company.types'; // ✅ Types are safe

// Repository functions NOT exported - import directly when needed
```

**Why:** Repository functions use `firebase-admin` (server-only). When exported from `index.ts`, client components that import from the feature will try to bundle server-only dependencies, causing errors.

**See:** [Server/Client Code Separation](#️-critical-serverclient-code-separation) for full details.

### ❌ Don't Create Circular Dependencies

**Bad:**
```typescript
// features/events/index.ts
import { CompanyBadge } from '@/features/companies';

// features/companies/index.ts
import { EventCard } from '@/features/events';
```

**Fix:** Extract shared component to `components/shared/`.

### ❌ Don't Bypass Public API

**Bad:**
```typescript
import { EventCard } from '@/features/events/components/EventCard';
```

**Good:**
```typescript
import { EventCard } from '@/features/events';
```

### ❌ Don't Over-Nest Directories

**Bad:**
```
features/events/components/cards/event/EventCard.tsx
```

**Good:**
```
features/events/components/EventCard.tsx
```

### ❌ Don't Create a "Shared" Feature

**Bad:**
```
features/shared/  # Don't do this
```

**Good:**
```
components/shared/  # Use this instead
```

---

## Success Criteria

Migration is complete when:

1. ✅ All components are organized by feature domain
2. ✅ Each feature has a public API (`index.ts`)
3. ✅ All imports use feature public APIs (not deep imports)
4. ✅ TypeScript compiles without errors
5. ✅ All tests pass
6. ✅ All routes render correctly
7. ✅ No circular dependencies exist
8. ✅ Old `components/guest/` and `components/organizer/` are removed

---

## Questions or Issues?

If you encounter problems during migration:

1. **Check TypeScript errors** - They'll guide you to broken imports
2. **Review dependency graph** - Are there circular dependencies?
3. **Consult feature-based-arch.md** - Review the principles
4. **Test incrementally** - Don't migrate everything before testing

---

## Post-Migration: Maintaining Feature Architecture

### Adding New Components

**Question:** Where should this component go?

1. **Is it specific to a product feature?** → `features/[feature]/components/`
2. **Is it shared across many features?** → `components/shared/`
3. **Is it route-specific only?** → `app/[route]/_components/`
4. **Is it a design system primitive?** → `components/ui/` (shadcn)

### Adding New Features

When adding a new product capability:

1. Create `features/[feature-name]/`
2. Add subdirectories: `components/`, `hooks/`, `lib/`, `types/`
3. Build the feature
4. Create `index.ts` public API
   - ✅ Export: components, server actions, types
   - ❌ Don't export: repository functions, cache functions, server-only utilities
5. Document what the feature exports
6. Test with `pnpm dev` to ensure no server/client bundling errors

### Refactoring Existing Features

When refactoring:
- Update the feature's `index.ts` if public API changes
- Update imports in consuming code
- Keep feature boundaries clean (no circular deps)

---

## Appendix: Complete File Move List

### Events Feature (with studio/, designer/, shared/ subfolders)

**Studio components:**
- components/organizer/EventCard.tsx → features/events/components/studio/
- components/organizer/EventForm.tsx → features/events/components/studio/
- components/organizer/EventStatusSwitcher.tsx → features/events/components/studio/
- components/organizer/EventBreadcrumb.tsx → features/events/components/studio/

**Designer components:**
- components/organizer/builder/BuilderSidebar.tsx → features/events/components/designer/
- components/organizer/builder/DesignSidebar.tsx → features/events/components/designer/
- components/organizer/builder/WelcomeEditor.tsx → features/events/components/designer/
- components/organizer/builder/EndingEditor.tsx → features/events/components/designer/
- components/organizer/builder/PreviewPanel.tsx → features/events/components/designer/
- components/organizer/builder/BuilderContent.tsx → features/events/components/designer/
- components/organizer/builder/ImageUploadField.tsx → features/events/components/designer/

**Shared components:**
- components/organizer/EventTabs.tsx → features/events/components/shared/
- components/organizer/TabLink.tsx → features/events/components/shared/
- components/organizer/EditableEventName.tsx → features/events/components/shared/

**Actions & Repository:**
- lib/actions/events.ts → features/events/lib/actions.ts
- lib/actions/events.test.ts → features/events/lib/actions.test.ts
- lib/repositories/events.ts → features/events/lib/repository.ts
- lib/repositories/events.test.ts → features/events/lib/repository.test.ts

### Companies Feature
- components/organizer/CompanyCard.tsx → features/companies/components/
- components/organizer/CompanyFilter.tsx → features/companies/components/
- components/organizer/CompanyForm.tsx → features/companies/components/
- components/organizer/DeleteCompanyDialog.tsx → features/companies/components/
- components/organizer/BrandColorPicker.tsx → features/companies/components/
- components/organizer/BrandingForm.tsx → features/companies/components/
- lib/actions/companies.ts → features/companies/lib/actions.ts
- lib/actions/companies.test.ts → features/companies/lib/actions.test.ts
- lib/repositories/companies.ts → features/companies/lib/repository.ts
- lib/repositories/companies.test.ts → features/companies/lib/repository.test.ts
- lib/cache/company-status.ts → features/companies/lib/cache.ts

### Experiences Feature (with shared/ and photo/ subfolders)

**Shared components:**
- components/organizer/builder/ExperiencesList.tsx → features/experiences/components/shared/
- components/organizer/builder/CreateExperienceForm.tsx → features/experiences/components/shared/
- components/organizer/builder/ExperienceEditor.tsx → features/experiences/components/shared/
- components/organizer/builder/ExperienceEditor.test.tsx → features/experiences/components/shared/
- components/organizer/builder/ExperienceEditorWrapper.tsx → features/experiences/components/shared/
- components/organizer/builder/PreviewMediaUpload.tsx → features/experiences/components/shared/
- components/organizer/builder/PreviewMediaUpload.test.tsx → features/experiences/components/shared/

**Photo-specific components:**
- components/organizer/builder/AITransformSettings.tsx → features/experiences/components/photo/
- components/organizer/builder/AITransformSettings.test.tsx → features/experiences/components/photo/
- components/organizer/builder/CountdownSettings.tsx → features/experiences/components/photo/
- components/organizer/builder/CountdownSettings.test.tsx → features/experiences/components/photo/
- components/organizer/builder/OverlaySettings.tsx → features/experiences/components/photo/
- components/organizer/builder/OverlaySettings.test.tsx → features/experiences/components/photo/
- components/organizer/PromptEditor.tsx → features/experiences/components/photo/
- components/organizer/RefImageUploader.tsx → features/experiences/components/photo/
- components/organizer/ModeSelector.tsx → features/experiences/components/photo/

**Actions & Repository:**
- lib/actions/experiences.ts → features/experiences/lib/actions.ts
- lib/repositories/experiences.ts → features/experiences/lib/repository.ts
- lib/constants/ai-models.ts → features/experiences/lib/constants.ts

### Sessions Feature
- lib/actions/sessions.ts → features/sessions/lib/actions.ts
- lib/repositories/sessions.ts → features/sessions/lib/repository.ts
- lib/repositories/sessions.test.ts → features/sessions/lib/repository.test.ts

### Guest Feature
- components/guest/BrandThemeProvider.tsx → features/guest/components/
- components/guest/CameraView.tsx → features/guest/components/
- components/guest/CaptureButton.tsx → features/guest/components/
- components/guest/Countdown.tsx → features/guest/components/
- components/guest/ErrorBanner.tsx → features/guest/components/
- components/guest/GreetingScreen.tsx → features/guest/components/
- components/guest/GuestFlowContainer.tsx → features/guest/components/
- components/guest/ResultViewer.tsx → features/guest/components/
- components/guest/RetakeButton.tsx → features/guest/components/
- hooks/useCamera.ts → features/guest/hooks/
- hooks/useGuestFlow.ts → features/guest/hooks/
- lib/camera/capture.ts → features/guest/lib/capture.ts

### Distribution Feature
- components/organizer/CopyLinkButton.tsx → features/distribution/components/
- components/organizer/QRPanel.tsx → features/distribution/components/
- lib/qr/generate.ts → features/distribution/lib/qr.ts
- lib/actions/qr.ts → features/distribution/lib/actions.ts

### Shared Components
- components/organizer/LogoutButton.tsx → components/shared/

---

## Revision History

- **2024-11-18** - Initial migration plan created
- **2024-11-18** - Updated to reflect Option A (single feature with internal organization via subfolders)
  - Events feature: studio/, designer/, shared/ subfolders
  - Experiences feature: shared/, photo/ subfolders (with video/, gif/, wheel/ for future)
  - Companies first in migration order (easiest to start)
- **2024-11-18** - Added critical Server/Client Code Separation section
  - Documented what to export vs not export from index.ts
  - Added warnings throughout all phase instructions
  - Addresses "Module not found: Can't resolve 'tls'" error
  - Repository functions must NOT be exported from public API
