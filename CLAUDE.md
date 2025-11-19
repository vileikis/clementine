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

### Admin Dashboard

**Companies Management** (`/companies`)

- Create and organize brands/organizations
- Event count tracking per company
- Soft deletion with status management
- Filter events by company

**Events Management** (`/events`)

- Create and manage AI photobooth events
- Associate events with companies (optional)
- Event builder with three tabs: Content, Distribution, Results

**Event Builder** (`/events/[eventId]`)

- **Content Tab**: Configure welcome screen, photo experiences, ending screen via sidebar navigation (survey UI present but not fully implemented)
- **Distribution Tab**: Share links, QR codes, embedding options
- **Results Tab**: Analytics (sessions, shares, downloads, reach)

### Core Entities

**Company** (`/companies/{companyId}`)

- Brand/organization that owns events
- Fields: name, status, brandColor, contactEmail, termsUrl, privacyUrl
- Soft deletion (status: "active" | "deleted")

**Event** (`/events/{eventId}`)

- Root event configuration
- Welcome screen: title, description, CTA, background (image/color)
- Ending screen: headline, body, CTA with URL
- Share settings: download, email, system share, social platforms
- Survey configuration: enabled, required, steps count/order (data model defined but feature not fully implemented)
- Company association (optional via companyId)
- Denormalized counters: experiencesCount, sessionsCount, readyCount, sharesCount

**Experience** (`/events/{eventId}/experiences/{experienceId}`)

- Interactive experiences (photo/video/gif/wheel)
- Currently implemented: photo experiences only
- Fields: label, type, enabled, preview media (image/GIF/video), countdown settings, frame overlay, AI settings (model, prompt, reference images, aspect ratio)

**SurveyStep** (`/events/{eventId}/surveySteps/{stepId}`) - NOT YET IMPLEMENTED

- Survey questions/steps (data model defined, feature cancelled in 001 spec)
- Types: short_text, long_text, multiple_choice, opinion_scale, email, statement
- Order managed via Event.surveyStepsOrder array
- Subject to change in future implementation

**Session** (`/events/{eventId}/sessions/{sessionId}`)

- Guest interaction with event
- Tracks input (photo/video), output (transformed media), state (created/processing/ready/error)
- Survey completion status
- Share metrics (download/email/social counts)

**Other Subcollections** (not yet implemented)

- `/events/{eventId}/experienceItems` - Items for wheel-type experiences (future)
- `/events/{eventId}/shares` - Share tracking records
- `/events/{eventId}/surveyResponses` - Guest survey answers (pending survey feature)
- `/events/{eventId}/participants` - Authenticated user tracking

### User Experience Priorities

- **Mobile-first** - Primary experience is on mobile devices
- **Speed** - AI transformation in under 1 minute
- **Simplicity** - Minimal friction from link → upload → result → share
- **White-label** - Fully customizable branding per event

## Active Technologies

- TypeScript 5.x (strict mode), Next.js 16 (App Router), React 19
- Firebase (Firestore + Storage), Zod 4.x
- Tailwind CSS v4, shadcn/ui, lucide-react
- Firestore: companies collection, events collection with 7 subcollections (experiences, experienceItems, surveySteps, surveyResponses, participants, sessions, shares)
- Firebase Storage for images/media assets

## Recent Changes

- 001-remove-scenes: Added TypeScript 5.x (strict mode), Next.js 16 (App Router), React 19 + Firebase (Firestore + Storage), Zod 4.x for validation, Tailwind CSS v4, shadcn/ui
