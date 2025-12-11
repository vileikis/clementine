# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Clementine** is a digital AI photobooth platform that empowers brands, event creators, and marketers to create stunning, AI-enhanced photobooth experiences without physical booths or technical skills.

### What We're Building

A web-based platform where:

- **Experience Creators** (brands/event organizers) set up AI-powered photo experiences with custom prompts and branding
- **Guests** visit a shareable link, upload a photo, and receive an AI-transformed result in under 1 minute
- **Analytics** help creators measure engagement, shares, and campaign success

See [product.md](.specify/memory/product.md) for full product strategy, user flows, MVP scope, and success metrics.

### Spec-Driven Development

This project follows **spec-driven development** practices. Key documentation like technical standards, conventions, and coding guidelines in `standards/`

**IMPORTANT**: Before implementing any feature or making changes, you MUST:

1. Read `standards/README.md` to understand applicable standards
2. Review relevant standards from `standards/` based on your task:
   - `global/` - Always applicable (coding style, conventions, validation, error handling)
   - `frontend/` - For UI/UX work (CSS, components, accessibility, responsive design)
   - `backend/` - For API/data work (Firebase, API routes, models)
   - `testing/` - For test implementation
3. Follow all standards strictly in your implementation

### Technical Stack

This is a pnpm monorepo with two workspaces:

- **`web/`** - Next.js 16 app (React 19, TypeScript, Tailwind CSS 4, shadcn/ui) - mobile-first guest experience and creator dashboard
- **`functions/`** - Firebase Cloud Functions (placeholder for future n8n/webhook integration for AI generation workflows)

## Commands

Run all commands from the **root directory**:

```bash
# Development
pnpm dev              # Start Next.js dev server (port 3000)

# Building & Running
pnpm build            # Build production web app
pnpm start            # Start production server

# Code Quality
pnpm lint             # Run ESLint on web app
pnpm type-check       # TypeScript type checking (web app only)
```

### Working in the web workspace

```bash
cd web
pnpm dev              # Local dev server
pnpm build            # Production build
pnpm lint             # Lint only
pnpm type-check       # TypeScript check without emit
```

## Architecture

### Monorepo Structure

This is a **pnpm workspace** monorepo (`pnpm-workspace.yaml`). Root `package.json` scripts use `pnpm --filter web` to target the web workspace.

### Web Application (Next.js 16)

- **App Router**: Uses the Next.js App Router (`src/app/`)
- **TypeScript**: Strict TypeScript configuration
- **Styling**: Tailwind CSS v4 with CSS variables for theming
- **Component Library**: shadcn/ui configured with:
  - Style: `new-york`
  - Base color: `neutral`
  - Import aliases: `@/components`, `@/lib`, `@/hooks`, etc.
  - Components location: `src/components/ui/`
  - Utilities: `src/lib/utils.ts`

### Import Aliases

The web app uses path aliases (configured in `tsconfig.json`):

- `@/*` maps to `src/*`
- shadcn/ui components use `@/components/ui`
- Utilities use `@/lib/utils`

### Adding shadcn/ui Components

```bash
cd web
pnpm dlx shadcn@latest add <component-name>
```

Components are added to `src/components/ui/` and can be imported via `@/components/ui/<component-name>`.

### Backend Architecture (Planned)

The `functions/` workspace is a placeholder for Firebase Cloud Functions that will handle:

- **n8n workflow integration** - AI image generation pipeline (Nano Banana, Stable Diffusion, etc.)
- **Event & asset storage** - Firebase/Firestore for event configurations and generated images
- **Webhook processing** - Communication between web app and AI generation services

## Product Architecture

### Architecture Roadmap

We are migrating to a **scalable architecture** documented in `features/scalable-arch/`:

- `high-level-plan.md` - Phased roadmap (Phases 0-7)
- `feature-modules.md` - Target module organization
- `new-data-model-v5.md` - Target data model

**Target Architecture:**

```
Company
  → Projects (containers for events)
      → Events (theme + schedule)
          → EventExperiences (links to experiences)
  → Experiences (flows with steps, renamed from Journeys)
      → Steps (including new ai-transform step)
  → AiPresets (deprecated AI library)
```

### Feature Modules & Data Model

The application is organized into feature modules in `web/src/features/`.

**IMPORTANT: Legacy & Deprecated Code**

- Legacy implementations: `web/src/legacy-features/` - Do NOT use unless explicitly asked
- Deprecated modules are marked below - avoid using in new development

#### Feature Module Status

**✅ Ready - Companies** (`web/src/features/companies/`)

- **Firestore Collection**: `/companies/{companyId}`
- **Purpose**: Brand/organization management - top-level scope for everything
- **Status**: Fully implemented and stable (Phase 0 complete)
- **Schema**: name, status, brandColor, contactEmail, termsUrl, privacyUrl
- **Features**: Soft deletion, company workspace UI

**⚠️ Deprecated - AI Presets** (`web/src/features/ai-presets/`)

- **Firestore Collection**: `/aiPresets/{presetId}`
- **Purpose**: Legacy AI configuration library (renamed from old "experiences")
- **Status**: Implemented but **DEPRECATED - DO NOT USE in new development**
- **Schema**: Discriminated union by type (photo/video/gif), AI transform settings
- **Note**: Preserved for future preset marketplace, but not used in current flows

**✅ Ready - Projects** (`web/src/features/projects/`)

- **Firestore Collection**: `/projects/{projectId}`
- **Purpose**: Company-level containers organizing events (refactored from old Events)
- **Status**: Fully implemented (Phase 4 complete)
- **Schema**: name, companyId, sharePath, qrPngPath, activeEventId, status
- **Features**: Guest join links point to project → resolve active event, QR code generation

**✅ Ready - Events** (`web/src/features/events/`)

- **Firestore Collection**: `/projects/{projectId}/events/{eventId}`
- **Purpose**: Time-bound, themed guest-facing instances nested under Projects
- **Status**: Implemented (Phase 5 complete) - **Pending Phase 6 for Event Experiences**
- **Schema**: name, projectId, companyId, theme, experiences[], extras, scheduling
- **Pending**: Event Experiences linking UI (General tab) - see `features/scalable-arch/phase-6-event-experiences.md`

**✅ Ready - Experiences** (`web/src/features/experiences/`)

- **Firestore Collection**: `/experiences/{experienceId}`
- **Purpose**: Company-scoped reusable flow templates (renamed from Journeys)
- **Status**: Fully implemented (Phase 2 complete)
- **Schema**: name, description, companyId, stepsOrder[], status, previewMedia

**✅ Ready - Steps** (`web/src/features/steps/`)

- **Firestore Collection**: `/experiences/{experienceId}/steps/{stepId}`
- **Purpose**: Individual UI screen configurations within Experiences
- **Status**: Fully implemented (Phase 3 complete)
- **Schema**: Discriminated union by step type (info, capture, inputs, ai-transform, etc.)

**✅ Ready - Theming** (`web/src/features/theming/`)

- **Purpose**: Centralized theming system for guest-facing experiences
- **Status**: Fully implemented - canonical source of truth for theme types and utilities
- **Exports**:
  - Types: `Theme`, `ThemeText`, `ThemeButton`, `ThemeBackground`, `ButtonRadius`
  - Components: `ThemeProvider`, `ThemedBackground`
  - Hooks: `useEventTheme`, `useThemedStyles`
  - Constants: `BUTTON_RADIUS_MAP`
- **Usage**: Wrap guest-facing components with `<ThemeProvider theme={...}>` and use `useEventTheme()` hook

**✅ Ready - Camera** (`web/src/features/camera/`)

- **Purpose**: Camera capture and photo library picker for guest photo submission
- **Status**: Fully implemented
- **Exports**:
  - Components: `CameraCapture` (main component)
  - Types: `CapturedPhoto`, `CameraCaptureError`, `CaptureMethod`, `AspectRatio`, `CameraFacing`
  - Constants: `DEFAULT_LABELS` (for i18n customization)
- **Features**: Live camera preview, photo library fallback, aspect ratio constraints, camera facing toggle, permission handling

**✅ Ready - Preview Shell** (`web/src/features/preview-shell/`)

- **Purpose**: Reusable device preview infrastructure for admin interfaces
- **Status**: Fully implemented
- **Exports**:
  - Components: `PreviewShell`, `DeviceFrame`, `ViewportSwitcher`, `FullscreenOverlay`, `FullscreenTrigger`
  - Hooks: `useViewport`, `useFullscreen`
  - Context: `ViewportProvider`, `useViewportContext`
  - Types: `ViewportMode`, `ViewportDimensions`, `PreviewShellProps`, etc.
- **Features**: Mobile device frame, viewport switching (mobile/tablet), fullscreen mode
- **Usage**: Wrap preview content with `<PreviewShell>` component, combine with `theming` module for themed previews

**📋 Planned - Experience Engine** (`web/src/features/experience-engine/`)

- **Purpose**: Unified runtime powering admin preview AND guest flow (Phase 7)
- **Status**: Not started
- **Contains**:
  - Step renderers (one per step type)
  - Experience orchestrator (step flow, AI calls, callbacks)
  - Session state handler
- **Key Principle**: Steps module defines _what_, Experience Engine defines _how it runs_

**📋 Planned - Admin Preview** (`web/src/features/admin-preview/`)

- **Purpose**: Admin testing of experiences using Experience Engine (Phase 7)
- **Status**: Not started
- **Features**: Preview mode, start from specific step, fake session, debug info

**📋 Planned - Sessions** (`web/src/features/sessions/`)

- **Firestore Collection**: `/sessions/{sessionId}`
- **Purpose**: Transactional records of guest runs
- **Status**: Not started - will be completely rewritten

**📋 Planned - Guest** (`web/src/features/guest/`)

- **Purpose**: Guest-facing app using Experience Engine (Phase 7)
- **Status**: Will be completely rewritten
- **Features**: Load event, mount Experience Engine, handle share/download/QR

### Architecture Principles

**Domain-First Organization**

- Feature modules over global folders
- Separation of Admin vs Guest concerns
- One shared runtime engine (Experience Engine)

**Normalized Firestore Design**

- Flat root collections (no deep nesting)
- Linked by ID references
- Enables future SQL migration

**Experience Engine Pattern**

- Single source of truth for step execution
- Identical behavior in admin preview and guest flow
- True WYSIWYG preview

### User Experience Priorities

- **Mobile-first** - Primary experience is on mobile devices
- **Speed** - AI transformation in under 1 minute
- **Simplicity** - Minimal friction from link → upload → result → share
- **White-label** - Fully customizable branding per event

## Active Technologies

### Core Stack

- **Language**: TypeScript 5.x (strict mode)
- **Framework**: Next.js 16 (App Router), React 19
- **Styling**: Tailwind CSS v4, shadcn/ui, lucide-react
- **Validation**: Zod 4.x

### Data Layer

- **Database**: Firebase Firestore
- **Storage**: Firebase Storage (`media/{companyId}/{mediaType}/{timestamp}-{filename}`)
- **Client State**: Zustand (for complex state, with persist middleware for localStorage)

### Additional Libraries

- @dnd-kit/core (drag-drop)
- react-hook-form (forms)
- lottie-react (animations)
- sonner (toasts)

### Firestore Collections (Current - v5)

- `/companies` - Brand/organization management
- `/aiPresets` - Legacy AI presets (deprecated - do not use)
- `/projects` - Company-level containers (sharePath, activeEventId)
- `/projects/{projectId}/events` - Themed instances with `experiences[]` array and `extras` slots
- `/experiences` - Reusable flow templates (company-scoped)
- `/experiences/{experienceId}/steps` - Step configs (info, capture, inputs, ai-transform, etc.)
- `/sessions` - Guest interaction records (planned)

## Recent Changes

### Scalable Architecture Migration (December 2024)

**New architecture roadmap** - see `features/scalable-arch/` for full documentation.

**Phase Status:**

- ✅ Phase 0: Company Context - complete
- ✅ Phase 1: Rename experiences → aiPresets - complete (deprecated, do not use)
- ✅ Phase 2: Journeys → Experiences - complete
- ✅ Phase 3: Steps Consolidation - complete
- ✅ Phase 4: Projects - complete (refactored from old Events)
- ✅ Phase 5: Events under Projects - complete
- 📋 Phase 6: Event Experiences & Extras (General tab) - not started (see `features/scalable-arch/phase-6-event-experiences.md`)
- 📋 Phase 7: Experience Engine - not started

### Data Model v5 (Current - December 2024)

**Current production architecture** in `web/src/features/`:

- Normalized Firestore design with flat collections
- Company → Projects → Events hierarchy
- Experiences (company-scoped) with Steps
- Experience Editor with multiple step types

See `features/scalable-arch/new-data-model-v5.md` for full data model documentation.
