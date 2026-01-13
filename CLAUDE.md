# CLAUDE.md

This file provides high-level guidance for Claude Code (claude.ai/code) when working with the Clementine monorepo.

## Project Overview

**Clementine** is a digital AI photobooth platform that empowers brands, event creators, and marketers to create stunning, AI-enhanced photo and video experiences without physical booths or technical skills.

### What We're Building

A web-based platform where:

- **Experience Creators** (brands/event organizers) set up AI-powered photo and video experiences with custom prompts and branding
- **Guests** visit a shareable link, upload a photo/video, and receive an AI-transformed result in under 1 minute
- **Analytics** help creators measure engagement, shares, and campaign success

## Monorepo Structure

This is a **pnpm workspace monorepo** containing multiple applications and packages.

### Workspaces

```
clementine/
├── apps/
│   └── clementine-app/       # TanStack Start application (Production)
├── functions/                 # Firebase Cloud Functions (AI processing, webhooks)
├── scripts/                   # Monorepo utility scripts
└── packages/                  # Shared packages (if any)
```

### Application Status

**🚀 `apps/clementine-app/` - TanStack Start (Production)**

- Modern full-stack React application built with TanStack Start
- Production application deployed via Firebase App Hosting
- See `apps/clementine-app/CLAUDE.md` for app-specific guidance

**⚙️ `functions/` - Firebase Cloud Functions**

- Backend services for AI image/video processing
- Webhook handlers for n8n workflow integration
- Media processing pipeline (FFmpeg)

## Technology Stack

### Frontend Application

- **TanStack Start** - Full-stack React framework
- **React 19** - Latest React
- **TypeScript 5.x** - Strict mode enabled
- **Tailwind CSS v4** - Utility-first CSS

### Backend Services

- **Firebase Cloud Functions v2** - Serverless functions
- **Firebase Firestore** - NoSQL database
- **Firebase Storage** - Media storage
- **FFmpeg** - Media processing

### Developer Tools

- **pnpm** - Package manager (v10.18.1)
- **Vitest** - Testing framework
- **ESLint** - Linting
- **Prettier** - Code formatting

## Global Commands

Run these commands from the **monorepo root**:

> **Note:** App scripts were renamed from `pnpm dev` to `pnpm app:dev` (etc.) to clarify they target the TanStack Start app.

```bash
# Development
pnpm app:dev          # Start TanStack Start dev server

# Building & Running
pnpm app:build        # Build production app
pnpm app:start        # Start production server

# Code Quality
pnpm app:lint         # Run ESLint
pnpm app:type-check   # TypeScript type checking
pnpm app:format       # Check Prettier formatting
pnpm app:check        # Format + fix linting (all-in-one)
pnpm app:test         # Run tests

# Firebase Cloud Functions
pnpm functions:build  # Build Cloud Functions
pnpm functions:serve  # Serve functions locally
pnpm functions:deploy # Deploy functions to Firebase

# Firebase Deployment
pnpm fb:deploy        # Deploy all Firebase resources
pnpm fb:deploy:rules  # Deploy Firestore/Storage rules only
pnpm fb:deploy:indexes # Deploy Firestore indexes only
```

## Working with Specific Apps

### TanStack Start App

```bash
cd apps/clementine-app
pnpm dev              # Start TanStack Start dev server
pnpm build            # Build production app
pnpm test             # Run tests
```

See `apps/clementine-app/CLAUDE.md` for complete guidance.

### Firebase Functions

```bash
cd functions
pnpm build            # Build functions
pnpm serve            # Serve locally
```

See `functions/README.md` for function-specific documentation.

## Development Workflow

### Choosing Where to Work

**For frontend features:**

- ✅ Build in `apps/clementine-app/` (TanStack Start app)

**For backend/API work:**

- ⚙️ Work in `functions/` (Firebase Cloud Functions)

### Installing Dependencies

**To a specific workspace:**

```bash
pnpm add <package> --filter <workspace-name>
# Example: pnpm add zod --filter @clementine/app
```

**To the root (monorepo tooling):**

```bash
pnpm add -w <package>
```

### Running Commands in Workspaces

```bash
pnpm --filter <workspace-name> <command>
# Example: pnpm --filter @clementine/app dev
```

## Package Manager

This project uses **pnpm** (version 10.18.1) for package management.

**Why pnpm?**

- Efficient disk space usage (content-addressable storage)
- Fast installation with proper dependency resolution
- Excellent monorepo support with workspaces
- Strict dependency management

**Installation:**

```bash
npm install -g pnpm@10.18.1
```

## Workspace-Specific Documentation

Each workspace has its own documentation:

- **TanStack Start App**: `apps/clementine-app/CLAUDE.md`
- **Cloud Functions**: `functions/README.md`

These files are automatically discovered by Claude Code based on your working context.

## Standards & Guidelines

Standards are maintained at the monorepo level in `standards/`:

- `standards/frontend/` - Frontend architecture, components, state management
- `standards/backend/` - Firebase functions, Firestore patterns
- `standards/global/` - Code quality, security, authentication
- `standards/testing/` - Testing patterns

## Firebase Configuration

Firebase resources are shared across applications:

```
firebase/
├── firestore.rules       # Firestore security rules
├── firestore.indexes.json # Firestore indexes
├── storage.rules         # Storage security rules
└── firebase.json         # Firebase project config
```

Deploy Firebase resources:

```bash
pnpm fb:deploy            # All resources
pnpm fb:deploy:rules      # Security rules only
pnpm fb:deploy:indexes    # Indexes only
```

## Environment Variables

Each workspace manages its own environment variables:

- **TanStack Start App**: `apps/clementine-app/.env`
- **Cloud Functions**: `functions/.env`

See individual workspace documentation for required environment variables.

## Best Practices

### Workspace Independence

- Each app should be independently runnable
- Share code through proper imports, not copy-paste
- Keep workspace-specific concerns separate

### Dependency Management

- Add dependencies to the correct workspace
- Use workspace protocol (`workspace:*`) for internal packages
- Keep dependencies up to date

### Code Quality

- Follow workspace-specific standards
- Run linting and type checking before commits
- Write tests for new features

### Documentation

- Keep CLAUDE.md files up to date
- Document architecture decisions
- Update this file when adding/removing workspaces

## Getting Help

1. **Check workspace CLAUDE.md** - Each app has detailed documentation
2. **Review standards** - Workspace-specific standards in `standards/` folders
3. **Check existing code** - Look for similar patterns in the codebase
4. **Ask the team** - When in doubt, discuss with the team

## Resources

- **pnpm Docs**: https://pnpm.io
- **pnpm Workspaces**: https://pnpm.io/workspaces
- **TanStack Start**: https://tanstack.com/start
- **Firebase**: https://firebase.google.com/docs

---

**Remember**: This is a monorepo overview. For app-specific guidance, refer to `apps/clementine-app/CLAUDE.md`.

## Current Tech Stack

### TanStack Start App (apps/clementine-app/)
- TypeScript 5.7.2 (strict mode, ES2022 target)
- TanStack Start 1.132.0
- React 19.2.0
- TanStack Router 1.132.0
- TanStack Query 5.66.5
- Zustand 5.x (state management with persist middleware)
- Zod 4.1.12 (validation)
- shadcn/ui + Radix UI (components)
- Tailwind CSS v4
- Firebase SDK 12.5.0 (Auth, Firestore client)
- Lucide React (icons)
- Sonner (toasts)

### Backend (functions/)
- Firebase Cloud Functions v2
- Firebase Admin SDK
- Firebase Firestore (NoSQL database)
- Firebase Storage (media files)
- FFmpeg (media processing)

### Development Tools
- pnpm 10.18.1 (package manager)
- Vitest (testing)
- ESLint (linting)
- Prettier (formatting)

## Active Technologies
- TypeScript 5.7.2 (strict mode, ES2022 target) + Zod 4.1.12 (validation), TanStack Query 5.66.5 (data fetching), Firebase SDK 12.5.0 (Firestore) (019-exp-system-foundations)
- Firebase Firestore (NoSQL) - subcollection pattern for experiences and sessions (019-exp-system-foundations)
- TypeScript 5.7.2 (strict mode enabled) + TanStack Start 1.132.0, TanStack Router 1.132.0, React 19.2.0, Zustand 5.x (020-app-nav-refactor)
- N/A (navigation state persisted to localStorage via Zustand) (020-app-nav-refactor)
- TypeScript 5.7.2 (strict mode, ES2022 target) + TanStack Start 1.132.0, React 19.2.0, TanStack Router 1.132.0, TanStack Query 5.66.5, Zustand 5.0.9, Zod 4.1.12, Firebase SDK 12.5.0 (001-experience-data-library)
- Firebase Firestore (client SDK) - workspace subcollection pattern `/workspaces/{workspaceId}/experiences/{experienceId}` (001-experience-data-library)
- TypeScript 5.7.2 (strict mode, ES2022 target) + TanStack Start 1.132.0, TanStack Query 5.66.5, TanStack Router 1.132.0, React 19.2.0, Zustand 5.0.9, Zod 4.1.12, @dnd-kit (drag-and-drop) (022-step-system-editor)
- Firebase Firestore (client SDK) - `/workspaces/{workspaceId}/experiences/{experienceId}` with draft/published structure (022-step-system-editor)
- TypeScript 5.7.2 (strict mode, ES2022 target) + TanStack Start 1.132.0, TanStack Router 1.132.0, React 19.2.0, Tailwind CSS v4 (023-top-bar-with-tabs)
- N/A (no data layer changes) (023-top-bar-with-tabs)

## Recent Changes
- 019-exp-system-foundations: Added TypeScript 5.7.2 (strict mode, ES2022 target) + Zod 4.1.12 (validation), TanStack Query 5.66.5 (data fetching), Firebase SDK 12.5.0 (Firestore)
