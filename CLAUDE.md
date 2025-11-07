# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Clementine** is a digital AI photobooth platform that empowers brands, event creators, and marketers to create stunning, AI-enhanced photobooth experiences without physical booths or technical skills.

### What We're Building

A web-based platform where:
- **Experience Creators** (brands/event organizers) set up AI-powered photo experiences with custom prompts and branding
- **Guests** visit a shareable link, upload a photo, and receive an AI-transformed result in under 1 minute
- **Analytics** help creators measure engagement, shares, and campaign success

See [PRODUCT.md](./PRODUCT.md) for full product strategy, user flows, MVP scope, and success metrics.

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

### Core Entities

1. **Event/Campaign** - A branded AI photobooth experience created by an Experience Creator
   - Custom AI prompt/theme
   - Branding (logo, campaign name)
   - Configuration (input type, output format)
   - Shareable link or embeddable widget

2. **Submission** - A guest interaction with an event
   - Original uploaded photo
   - AI-generated result
   - Metadata (timestamp, share status)

3. **Analytics** - Event performance metrics
   - Views, submissions, shares
   - Engagement stats
   - Top prompts/themes

### User Experience Priorities

- **Mobile-first** - Primary experience is on mobile devices
- **Speed** - AI transformation in under 1 minute
- **Simplicity** - Minimal friction from link → upload → result → share
- **White-label** - Fully customizable branding per event
