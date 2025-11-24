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

### Feature Modules & Data Model

The application is organized into feature modules in `web/src/features/`. The data model has been redesigned to use a **normalized Firestore architecture** with flat root collections (see `features/data-model-v4.md` for full specification).

**IMPORTANT: Legacy Code**
- Legacy implementations have been moved to `web/src/legacy-features/`
- **Do NOT reference or use legacy code unless explicitly asked**
- Only consult legacy features when specifically mentioned by the user (e.g., "check legacy-features for reference")
- When creating new feature modules from scratch, legacy code may be referenced if explicitly requested

#### Feature Module Status

**✅ Ready - Companies** (`web/src/features/companies/`)
- **Firestore Collection**: `/companies/{companyId}`
- **Purpose**: Brand/organization management that owns events
- **Status**: Fully implemented and stable
- **Schema**: name, status, brandColor, contactEmail, termsUrl, privacyUrl
- **Features**: Soft deletion (status: "active" | "deleted"), event count tracking

**🚧 In Progress - Events** (`web/src/features/events/`)
- **Firestore Collection**: `/events/{eventId}`
- **Purpose**: Root container for event configuration and the real-time "Switchboard" state
- **Status**: Complete redesign in progress - schema and actions being rewritten
- **New Model**: Event will control which Journey is active via `activeJourneyId`, manage branding/theming, and serve as entry point for guests
- **Note**: Current implementation is transitional - refer to data-model-v4.md for target architecture

**📋 Planned - Experiences** (`web/src/features/experiences/`)
- **Firestore Collection**: `/experiences/{experienceId}`
- **Purpose**: Reusable library of atomic AI experience configurations
- **Status**: Not yet started - will be completely rewritten from scratch
- **New Model**: Self-contained configs for AI rules (photo/video/gif), hardware settings, required user inputs, and prompt templates
- **Note**: Purpose and functionality have completely changed from legacy version

**📋 Planned - Journeys** (new module)
- **Firestore Collection**: `/journeys/{journeyId}`
- **Purpose**: Define linear sequences of steps (playlists) for guest experiences
- **Status**: Not yet started - new module to be written from scratch
- **New Model**: Lightweight wrapper that orders step IDs, referenced by Events via `activeJourneyId`

**📋 Planned - Steps** (new module)
- **Firestore Collection**: `/steps/{stepId}`
- **Purpose**: Individual UI screen configurations (welcome, selection, capture, form, processing, result)
- **Status**: Not yet started - new module to be written from scratch
- **New Model**: Content and layout for each screen in a Journey

**📋 Planned - Sessions** (`web/src/features/sessions/`)
- **Firestore Collection**: `/sessions/{sessionId}`
- **Purpose**: Transactional records of guest runs through Journeys
- **Status**: Not yet started - will be completely rewritten
- **New Model**: Stores guest progress, collected data (form inputs, media captures), and AI generation results

**📋 Planned - Guest** (`web/src/features/guest/`)
- **Purpose**: Guest-facing experience and UI components
- **Status**: Will be completely rewritten to work with new data model

### Architecture Principles (New Model)

**Normalized Firestore Design**
- No nested subcollections beyond one level
- All entities at root collection level
- Linked by `eventId` references
- Enables future SQL migration

**Dynamic Injection Pattern**
- Capture steps load Experience configs at runtime
- Selection steps set session variables
- Experiences define their own required inputs
- Promotes reusability and atomic design

**Real-time Switchboard**
- Event's `activeJourneyId` controls live experience
- All connected guests react to changes
- Host can switch Journeys dynamically

### User Experience Priorities

- **Mobile-first** - Primary experience is on mobile devices
- **Speed** - AI transformation in under 1 minute
- **Simplicity** - Minimal friction from link → upload → result → share
- **White-label** - Fully customizable branding per event

## Active Technologies

- TypeScript 5.x (strict mode), Next.js 16 (App Router), React 19
- Firebase (Firestore + Storage), Zod 4.x
- Tailwind CSS v4, shadcn/ui, lucide-react
- **Firestore Collections** (normalized, flat architecture):
  - `/companies` - Brand/organization management (ready)
  - `/events` - Root event configs and switchboard (in redesign)
  - `/experiences` - AI experience library (planned)
  - `/journeys` - Step sequence playlists (planned)
  - `/steps` - Individual screen configs (planned)
  - `/sessions` - Guest interaction records (planned)
- Firebase Storage for images/media assets

## Recent Changes

### Data Model v4 Redesign (November 2024)

**Major architectural overhaul** to implement normalized Firestore design:

- **Moved legacy code** to `web/src/legacy-features/` (companies, events, experiences, guest, sessions, distribution)
- **Changed data model** from nested subcollections to flat root collections
- **New terminology**: "Journey" (playlist), "Experience" (AI asset), "Step" (UI screen)
- **Dynamic injection pattern**: Capture steps load Experience configs at runtime
- **Switchboard pattern**: Events control active Journey via `activeJourneyId`

**Migration status**:
- ✅ Companies feature - ready and stable
- 🚧 Events feature - schema redesign in progress
- 📋 Experiences, Journeys, Steps, Sessions, Guest - to be rewritten from scratch

See `features/data-model-v4.md` for full specification.

### Previous Changes

- 001-remove-scenes: Added TypeScript 5.x (strict mode), Next.js 16 (App Router), React 19 + Firebase (Firestore + Storage), Zod 4.x for validation, Tailwind CSS v4, shadcn/ui
