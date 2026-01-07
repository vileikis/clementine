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
│   └── clementine-app/       # TanStack Start application (NEW - Future production)
├── web/                       # Next.js 16 application (Legacy - being replaced)
├── functions/                 # Firebase Cloud Functions (AI processing, webhooks)
├── scripts/                   # Monorepo utility scripts
└── packages/                  # Shared packages (if any)
```

### Application Status

**🚀 `apps/clementine-app/` - TanStack Start (Active Development)**

- Modern full-stack React application built with TanStack Start
- Complete rewrite of the platform with improved architecture
- **This is the future** - will become the main production app
- See `apps/clementine-app/CLAUDE.md` for app-specific guidance

**⚠️ `web/` - Next.js 16 (Legacy)**

- Current production application
- Being gradually replaced by TanStack Start app
- **Will be deprecated** once migration is complete
- See `web/CLAUDE.md` for app-specific guidance

**⚙️ `functions/` - Firebase Cloud Functions**

- Backend services for AI image/video processing
- Webhook handlers for n8n workflow integration
- Media processing pipeline (FFmpeg)
- Shared by both web applications

## Technology Stack

### Frontend Applications

- **TanStack Start** (new app) - Full-stack React framework
- **Next.js 16** (legacy app) - React framework with App Router
- **React 19** - Both apps use latest React
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

```bash
# Development (runs legacy Next.js app by default)
pnpm dev              # Start Next.js dev server (port 3000)

# Building & Running (legacy Next.js app)
pnpm build            # Build Next.js production app
pnpm start            # Start Next.js production server

# Code Quality (legacy Next.js app)
pnpm lint             # Run ESLint
pnpm type-check       # TypeScript type checking
pnpm test             # Run tests

# Firebase Cloud Functions
pnpm functions:build  # Build Cloud Functions
pnpm functions:serve  # Serve functions locally
pnpm functions:deploy # Deploy functions to Firebase

# Firebase Deployment
pnpm fb:deploy        # Deploy all Firebase resources
pnpm fb:deploy:rules  # Deploy Firestore/Storage rules only
pnpm fb:deploy:indexes # Deploy Firestore indexes only
```

**Note**: Global commands currently target the legacy Next.js app (`web/`) for backwards compatibility.

## Working with Specific Apps

### TanStack Start App (New)

```bash
cd apps/clementine-app
pnpm dev              # Start TanStack Start dev server
pnpm build            # Build production app
pnpm test             # Run tests
```

See `apps/clementine-app/CLAUDE.md` for complete guidance.

### Next.js App (Legacy)

```bash
cd web
pnpm dev              # Start Next.js dev server
pnpm build            # Build production app
pnpm test             # Run tests
```

See `web/CLAUDE.md` for complete guidance.

### Firebase Functions

```bash
cd functions
pnpm build            # Build functions
pnpm serve            # Serve locally
```

See `functions/README.md` for function-specific documentation.

## Development Workflow

### Choosing Where to Work

**For new features or major changes:**

- ✅ Build in `apps/clementine-app/` (TanStack Start app)
- This is the future of the platform

**For bug fixes or maintenance:**

- ⚠️ Fix in `web/` (Next.js app) if it affects current production
- Consider if the fix should also be implemented in the new app

**For backend/API work:**

- ⚙️ Work in `functions/` (Firebase Cloud Functions)
- Backend is shared by both applications

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

Each workspace has its own `CLAUDE.md` file with detailed guidance:

- **TanStack Start App**: `apps/clementine-app/CLAUDE.md`
- **Next.js App**: `web/CLAUDE.md`
- **Cloud Functions**: `functions/README.md`

These files are automatically discovered by Claude Code based on your working context.

## Standards & Guidelines

Standards are maintained at the workspace level:

- **TanStack Start App**: `apps/clementine-app/standards/`
- **Next.js App**: `web/standards/`

Each app has its own standards to avoid confusion between different tech stacks and architectural patterns.

## Migration Strategy

We are gradually migrating from the Next.js app to the TanStack Start app:

1. **Phase 1 (Current)**: Build TanStack Start app with core features
2. **Phase 2**: Achieve feature parity with Next.js app
3. **Phase 3**: Switch production traffic to TanStack Start app
4. **Phase 4**: Deprecate and archive Next.js app

During migration:

- Both apps share the same Firebase backend (`functions/`)
- Both apps use the same Firestore data model
- Backend APIs remain compatible with both frontends

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
- **Next.js App**: `web/.env.local`
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
- **Next.js**: https://nextjs.org
- **Firebase**: https://firebase.google.com/docs

---

**Remember**: This is a monorepo overview. For app-specific guidance, refer to the CLAUDE.md file in each workspace directory.

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
- TypeScript 5.7.2 (strict mode, ES2022 target) + TanStack Start 1.132.0, React 19.2.0, TanStack Router 1.132.0, TanStack Query 5.66.5, Firebase SDK 12.5.0 (012-event-settings-sharing-publish)
- Firebase Firestore (NoSQL database with client SDK), Firebase Storage (media files) (012-event-settings-sharing-publish)
- TypeScript 5.7.2 (strict mode, ES2022 target) + TanStack Start 1.132.0, React 19.2.0, TanStack Query 5.66.5, Zustand 5.x, Zod 4.1.12, Lucide React (icons) (014-event-designer-global-changes-tracker)
- N/A (client-side state management only, persists to Firestore via existing mutation hooks) (014-event-designer-global-changes-tracker)
- TypeScript 5.7.2 (strict mode, ES2022 target) + TanStack Start 1.132.0, React 19.2.0, TanStack Query 5.66.5, TanStack Router 1.132.0, React Hook Form, Zod 4.1.12 (015-event-theme-editor)
- Firebase Firestore (client SDK) - updates to `event.draftConfig.theme` (015-event-theme-editor)
- TypeScript 5.7.2 (strict mode, ES2022 target) + React 19.2.0, TanStack Start 1.132.0, Zod 4.1.12, Tailwind CSS 4, Lucide Reac (016-themed-primitives)
- TypeScript 5.7.2 (strict mode, ES2022 target) + TanStack Start 1.132.0, React 19.2.0, TanStack Query 5.66.5, React Hook Form, Zod 4.1.12 (017-welcome-editor)
- Firebase Firestore (client SDK) - updates to `event.draftConfig.welcome` (017-welcome-editor)

## Recent Changes
- 012-event-settings-sharing-publish: Added TypeScript 5.7.2 (strict mode, ES2022 target) + TanStack Start 1.132.0, React 19.2.0, TanStack Router 1.132.0, TanStack Query 5.66.5, Firebase SDK 12.5.0
