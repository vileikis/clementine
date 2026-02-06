# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the Clementine TanStack Start application.

## Project Overview

**Clementine** is a digital AI photobooth platform that empowers brands, event creators, and marketers to create stunning, AI-enhanced photo and video experiences without physical booths or technical skills.

### What We're Building

A web-based platform where:

- **Experience Creators** (brands/event organizers) set up AI-powered photo and video experiences with custom prompts and branding
- **Guests** visit a shareable link, upload a photo, and receive an AI-transformed result in under 1 minute
- **Analytics** help creators measure engagement, shares, and campaign success

### Project Status

This is a **complete rewrite** of the existing Next.js application (`web/`) using TanStack Start. The goal is to gradually build this application and make it the main production app, while the Next.js app will eventually be deprecated.

**Same scope, different tech stack.** We're not changing the product - we're modernizing the implementation.

## Development Standards

**CRITICAL**: Before implementing any feature or making changes, you **MUST**:

1. **Read `standards/README.md`** - Understand applicable standards
2. **Review relevant standards** based on your task:
   - **Architecture**: `standards/global/project-structure.md` + `standards/global/client-first-architecture.md`
   - **UI Components**: `standards/frontend/component-libraries.md` + `standards/frontend/accessibility.md`
   - **Performance**: `standards/frontend/performance.md`
   - **Code Quality**: `standards/global/code-quality.md`
   - **Security**: `standards/global/security.md`
   - **Testing**: `standards/testing/overview.md`
3. **Follow all standards strictly** in your implementation

**These standards are non-negotiable.** They ensure consistency, quality, and maintainability.

## Technical Stack

### Core Framework

- **TanStack Start** - Full-stack React framework
- **TanStack Router** - Type-safe file-based routing
- **React 19** - Latest React with new features
- **TypeScript 5.7** - Strict mode enabled
- **Vite 7** - Build tool and dev server

### Styling & UI Components

- **Tailwind CSS 4** - Utility-first CSS framework
- **shadcn/ui** - Primary component library (built on Radix UI)
- **Radix UI** - Unstyled accessible primitives
- **@dnd-kit** - Drag and drop functionality
- **lucide-react** - Icon library
- **class-variance-authority** - Component variants

**IMPORTANT**: Use **shadcn/ui**, **Radix UI**, and **@dnd-kit** as the foundation for all UI components. Don't reinvent what these libraries already provide. See `standards/frontend/component-libraries.md` for detailed guidance.

### Data & State

- **Firebase Firestore** - Database (client SDK)
- **Firebase Storage** - File storage (client SDK)
- **Firebase Auth** - Authentication (client SDK)
- **TanStack Query** - Client-side data fetching and caching
- **Zustand** - Client state management (if needed)

### Developer Experience

- **TanStack DevTools** - Router, Query, and React DevTools
- **Sentry** - Error tracking and monitoring
- **Vitest** - Unit testing framework
- **Testing Library** - Component testing
- **TypeScript ESLint** - Linting
- **Prettier** - Code formatting

## Architecture

### Client-First Architecture ⚡

**This application follows a client-first architecture**, not a traditional server-first pattern:

- ✅ **Firebase client SDKs** for all data operations (Firestore, Storage, Auth)
- ✅ **Client-side business logic** and state management
- ✅ **Real-time updates** using Firestore listeners
- ✅ **Security enforced by Firebase rules**, not server code
- ✅ **SSR only for entry points and SEO** (metadata, Open Graph tags)
- ⚠️ **Minimal server functions** (use only when absolutely necessary)

**Key principle**: Build for the client, use the server strategically.

See `standards/global/client-first-architecture.md` for complete details on when to use client vs server code.

### Domain-Driven Design (DDD)

Project structure follows DDD principles with clear separation of concerns:

```
src/
├── app/                 # TanStack Router routes (thin - import from domains)
├── ui-kit/              # Design system (shadcn/ui components)
├── integrations/        # Third-party integrations (Firebase, Sentry)
├── shared/              # Cross-cutting modules used across domains
│   ├── camera/          # Camera capture & photo functionality
│   │   ├── components/  # CameraPreview, PhotoCapture, etc.
│   │   ├── containers/  # Camera container components
│   │   ├── hooks/       # useCamera, useMediaStream, etc.
│   │   ├── lib/         # Camera utilities
│   │   ├── schemas/     # Camera validation schemas
│   │   └── types/       # Camera type definitions
│   ├── components/      # Generic shared components
│   ├── editor-controls/ # Reusable editor UI (sliders, pickers, etc.)
│   ├── editor-status/   # Editor save status tracking & indicators
│   │   ├── components/  # SaveStatusIndicator
│   │   ├── hooks/       # useSaveStatus
│   │   ├── store/       # Zustand save status store
│   │   └── types/       # Status type definitions
│   ├── forms/           # Form utilities (hooks, utils)
│   ├── preview-shell/   # Preview container with viewport switcher
│   │   ├── components/  # ViewportSwitcher, PreviewFrame
│   │   ├── containers/  # PreviewShell container
│   │   ├── context/     # Preview context provider
│   │   ├── hooks/       # usePreviewViewport
│   │   ├── store/       # Preview state store
│   │   └── types/       # Viewport type definitions
│   ├── theming/         # Theme utilities & CSS variable generation
│   │   ├── components/  # ThemePreview
│   │   ├── constants/   # Default theme values
│   │   ├── context/     # ThemeContext
│   │   ├── hooks/       # useTheme, useThemeCSS
│   │   ├── providers/   # ThemeProvider
│   │   ├── schemas/     # Theme validation schemas
│   │   └── types/       # Theme type definitions
│   └── utils/           # Utility functions
└── domains/             # Business domains (bounded contexts)
    ├── admin/           # Workspace admin (super-admin functions)
    ├── auth/            # Authentication & login
    ├── dev-tools/       # Development utilities (camera preview, etc.)
    ├── experience/      # Experience system (designer, library, runtime)
    ├── guest/           # Guest photo experience (public-facing)
    ├── media-library/   # Media asset management
    ├── navigation/      # Sidebar, top nav, breadcrumbs
    ├── project/         # Project utilities (sharing)
    ├── project-config/  # Project configuration designer
    ├── session/         # Session capture & tracking
    └── workspace/       # Workspace settings & project list
```

#### Project Config Domain

The `project-config` domain handles project configuration and the project designer/editor:

```
domains/project-config/
├── designer/            # Main editor layout & state
│   ├── components/      # EditorTabs, DesignerHeader
│   ├── containers/      # ProjectDesignerPage
│   ├── hooks/           # useProjectDesigner
│   └── stores/          # Designer state store
├── experiences/         # Experience selection & management within projects
│   ├── components/      # ExperienceSelector, ExperienceCard
│   ├── hooks/           # useExperienceSelection
│   └── schemas/         # Experience reference schemas
├── settings/            # Settings tab (overlay, publish settings)
│   ├── components/      # OverlaySettings, PublishSettings
│   ├── containers/      # SettingsTab
│   ├── hooks/           # useProjectSettings
│   └── schemas/         # Settings validation schemas
├── share/               # Sharing configuration tab
│   ├── components/      # SharePreview, SocialSettings
│   ├── containers/      # ShareTab
│   └── hooks/           # useShareSettings
├── theme/               # Theme tab (colors, fonts, branding)
│   ├── components/      # ColorPicker, FontSelector
│   ├── containers/      # ThemeTab
│   └── hooks/           # useThemeEditor
├── welcome/             # Welcome screen editor tab
│   ├── components/      # WelcomeEditor, WelcomePreview
│   ├── containers/      # WelcomeTab
│   ├── hooks/           # useWelcomeEditor
│   └── schemas/         # Welcome validation schemas
└── shared/              # Shared types, schemas, queries, hooks
    ├── hooks/           # useProjectConfig
    ├── lib/             # Project utilities
    ├── queries/         # Firestore queries
    ├── schemas/         # Common project schemas
    └── types/           # Shared type definitions
```

#### Experience Domain

The `experience` domain is the core of AI photo/video experiences:

```
domains/experience/
├── create/              # Experience creation wizard
│   ├── components/      # ProfileSelector, CreateForm
│   ├── containers/      # CreateExperiencePage
│   ├── hooks/           # useCreateExperience
│   ├── lexical/         # Lexical editor integration
│   ├── lib/             # Creation utilities
│   └── stores/          # Create wizard state
├── designer/            # Experience editor/designer
│   ├── components/      # StepList, DesignerToolbar
│   ├── containers/      # ExperienceDesignerPage
│   ├── hooks/           # useExperienceDesigner
│   └── stores/          # Designer state store
├── library/             # Experience library & selection
│   ├── components/      # ExperienceGrid, ExperienceCard
│   └── containers/      # ExperienceLibraryPage
├── preview/             # Experience preview components
│   ├── components/      # PreviewRenderer, StepPreview
│   └── containers/      # ExperiencePreviewPage
├── runtime/             # Guest-facing experience runtime
│   ├── components/      # RuntimeStep, ProgressBar
│   ├── containers/      # ExperienceRuntime
│   ├── hooks/           # useExperienceRuntime
│   └── stores/          # Runtime state store
├── steps/               # Step system (capture, transform, etc.)
│   ├── components/      # Step type components
│   ├── config-panels/   # Step configuration editors
│   ├── registry/        # Step type registry
│   └── renderers/       # Step rendering logic
├── transform/           # AI transform pipeline
│   └── hooks/           # useTransformJob, useJobStatus
└── shared/              # Shared types, schemas, queries
    ├── hooks/           # useExperience, useExperiences
    ├── lib/             # Experience utilities
    ├── queries/         # Firestore queries
    ├── schemas/         # Experience validation schemas
    ├── types/           # Shared type definitions
    └── utils/           # Experience utility functions
```

#### Session Domain

The `session` domain handles guest session data and tracking:

```
domains/session/
└── shared/              # Session data layer
    ├── hooks/           # useSession, useSessionResponses
    ├── queries/         # Session Firestore queries
    ├── schemas/         # Session validation schemas
    └── types/           # Session type definitions
```

#### Guest Domain

The `guest` domain handles the public-facing guest experience:

```
domains/guest/
├── components/          # GuestHeader, GuestFooter
├── containers/          # GuestExperiencePage
├── contexts/            # GuestSessionContext
├── hooks/               # useGuestSession, useGuestExperience
├── queries/             # Guest-specific queries
├── schemas/             # Guest validation schemas
└── types/               # Guest type definitions
```

**Key principles:**

- **Domain-first organization** - Code organized by business capability
- **Thin app routes** - Routes import containers from domains
- **Client-first data** - Firebase client SDK for all data operations
- **Progressive complexity** - Start simple, add structure as needed

See `standards/global/project-structure.md` for complete architectural guidelines.

### Authentication & Authorization

**Firebase Authentication** with hybrid client-server approach is used for all authentication and authorization.

**Key principle**: All auth checks MUST happen server-side. Client-side auth state is for UX only, never for security.

For complete authentication standards, implementation patterns, and security guidelines, see:

- **Authentication Standard**: `../../standards/global/authentication.md`

## Commands

Run all commands from **`apps/clementine-app/`** directory:

```bash
# Development
pnpm dev              # Start dev server (port 3000)

# Building & Running
pnpm build            # Build production app
pnpm start            # Start production server
pnpm preview          # Preview production build

# Code Quality
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix ESLint issues
pnpm type-check       # TypeScript type checking
pnpm format           # Check Prettier formatting
pnpm check            # Format + fix linting (all-in-one)

# Testing
pnpm test             # Run tests with Vitest
pnpm test --watch     # Watch mode
pnpm test --ui        # UI mode (visual test runner)
```

## Development Workflow

### Before You Start

1. ✅ Read relevant standards (see "Development Standards" section above)
2. ✅ Understand client-first architecture
3. ✅ Check which domain your feature belongs to

### Building a Feature

1. **Identify the domain** - Which business domain? (project-config, experiences, guest, session, etc.)
2. **Check existing structure** - Does the domain/subdomain exist?
3. **Create module structure** - Add folders as needed (components, containers, hooks, etc.)
4. **Build with standards** - Follow DDD principles and all applicable standards
5. **Create thin route** - Import container from domain module

### Working with UI Components

1. **Check shadcn/ui first** - Does the component exist? Use it!
   ```bash
   pnpm dlx shadcn@latest add <component-name>
   ```
2. **Use Radix UI** - If shadcn doesn't have it, use Radix primitives
3. **Use @dnd-kit** - For all drag and drop interactions
4. **Build on top** - Create domain-specific components using ui-kit components

See `standards/frontend/component-libraries.md` for detailed component library usage.

### Working with Data

**Use Firebase client SDKs directly:**

```tsx
import { firestore } from '@/integrations/firebase/client'
import { collection, query, where, onSnapshot } from 'firebase/firestore'

// ✅ Client-side Firestore operations
function useProjects(workspaceId: string) {
  const [projects, setProjects] = useState([])

  useEffect(() => {
    const q = query(
      collection(firestore, 'workspaces', workspaceId, 'projects'),
      where('status', '==', 'active'),
    )

    return onSnapshot(q, (snapshot) => {
      setProjects(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    })
  }, [workspaceId])

  return projects
}
```

**Don't create server functions unless absolutely necessary.** See `standards/global/client-first-architecture.md` for when to use server vs client.

### TypeScript Path Aliases

```tsx
import { Button } from '@/ui-kit/ui/button'
import { firestore } from '@/integrations/firebase/client'
import { ProjectsPage } from '@/domains/workspace/projects/containers/ProjectsPage'
import { ProjectDesignerPage } from '@/domains/project-config/designer/containers/ProjectDesignerPage'
import { useCamera } from '@/shared/camera/hooks/useCamera'
```

## Standards Quick Reference

| Task                        | Standards to Review                                                                           |
| --------------------------- | --------------------------------------------------------------------------------------------- |
| **Setting up architecture** | `global/project-structure.md` + `global/client-first-architecture.md`                         |
| **Building UI components**  | `frontend/component-libraries.md` + `frontend/design-system.md` + `frontend/accessibility.md` |
| **Styling components**      | `frontend/design-system.md`                                                                   |
| **Working with data**       | `global/client-first-architecture.md` + `global/security.md`                                  |
| **Implementing auth**       | `global/authentication.md` + `global/security.md`                                             |
| **Optimizing performance**  | `frontend/performance.md`                                                                     |
| **Writing tests**           | `testing/overview.md`                                                                         |
| **Code review**             | `global/code-quality.md` + `global/security.md`                                               |

**Complete standards**: See `standards/README.md` for all available standards.

## Integration with Firebase

### Firebase Services (Client SDK)

```
integrations/firebase/
├── client.ts          # Firebase client SDK initialization
│   ├── firestore      # Firestore client
│   ├── storage        # Storage client
│   └── auth           # Auth client (future)
└── admin.ts           # Firebase Admin SDK (server functions only)
```

**Use client SDK for 90% of code:**

- Firestore queries and mutations
- Storage uploads and downloads
- Authentication
- Real-time subscriptions

**Use admin SDK only for:**

- Operations requiring elevated permissions
- Server-side metadata generation (SEO)

See `standards/global/client-first-architecture.md` for complete Firebase usage guidelines.

## Migration from Next.js App

As we build this TanStack Start app, we'll gradually migrate features from `web/`:

1. **Don't copy-paste** - Rewrite following client-first architecture
2. **Learn from patterns** - Study existing implementations but adapt to DDD structure
3. **Test thoroughly** - Ensure feature parity with Next.js app
4. **Document differences** - Note any intentional behavioral changes

The Next.js app remains the reference implementation until this app is production-ready.

## Common Tasks

### Adding a New Domain

```bash
# Simple domain (flat structure)
mkdir -p src/domains/new-domain/{components,containers,hooks,types}

# Complex domain with subdomains
mkdir -p src/domains/new-domain/subdomain/{components,containers,hooks,stores}
mkdir -p src/domains/new-domain/shared/{hooks,queries,schemas,types}
```

### Installing Dependencies

From monorepo root:

```bash
pnpm add <package> --filter clementine-app
```

From app directory:

```bash
cd apps/clementine-app
pnpm add <package>
```

### Adding shadcn/ui Component

```bash
pnpm dlx shadcn@latest add <component-name>
# Components are added to src/ui-kit/components/
```

## Pre-Commit Checklist

Before committing code:

- [ ] Run `pnpm check` (format + lint)
- [ ] Run `pnpm type-check` (TypeScript)
- [ ] Run `pnpm test` (if you wrote tests)
- [ ] Review `standards/global/code-quality.md`
- [ ] Review `standards/global/security.md`
- [ ] Remove console.log and debugger statements

## Resources

### TanStack Ecosystem

- **TanStack Start**: https://tanstack.com/start
- **TanStack Router**: https://tanstack.com/router
- **TanStack Query**: https://tanstack.com/query

### UI Components

- **shadcn/ui**: https://ui.shadcn.com
- **Radix UI**: https://www.radix-ui.com
- **@dnd-kit**: https://docs.dndkit.com
- **lucide-react**: https://lucide.dev

### Firebase

- **Firebase Docs**: https://firebase.google.com/docs
- **Firestore**: https://firebase.google.com/docs/firestore
- **Storage**: https://firebase.google.com/docs/storage
- **Auth**: https://firebase.google.com/docs/auth

### Development Tools

- **Tailwind CSS**: https://tailwindcss.com
- **Vitest**: https://vitest.dev
- **Testing Library**: https://testing-library.com/react

## Getting Help

1. **Check standards** - Review `standards/` directory for guidance
2. **Check existing code** - Look for similar patterns in the codebase
3. **Review official docs** - TanStack, shadcn/ui, Firebase docs are excellent
4. **Ask the team** - When in doubt, discuss with the team

## Remember

**Three core principles:**

1. **Client-first architecture** - Firebase client SDKs, minimal server code
2. **Domain-driven design** - Organize by business capability, not technical layer
3. **Use existing libraries** - shadcn/ui, Radix UI, @dnd-kit before building custom

**Consistency is key.** Follow established patterns and standards to maintain a high-quality, maintainable codebase.
