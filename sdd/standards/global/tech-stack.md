## Clementine Tech Stack

This document defines the complete technical stack for Clementine - a digital AI photobooth platform.

### Framework & Runtime
- **Application Framework:** Next.js 16 (App Router)
- **Language/Runtime:** TypeScript (strict mode), Node.js
- **Package Manager:** pnpm (workspace monorepo)

### Frontend (web/ workspace)
- **JavaScript Framework:** React 19
- **CSS Framework:** Tailwind CSS v4 (CSS variables for theming)
- **UI Components:** shadcn/ui (New York style, neutral base color)
- **Component Library Location:** `src/components/ui/`
- **Utilities:** `src/lib/utils.ts` (cn helper)
- **State Management:** React hooks, URL state (useSearchParams), React Query (planned)

### Backend & AI Pipeline
- **Cloud Functions:** Firebase Cloud Functions (planned)
- **Workflow Automation:** n8n (AI image generation pipeline)
- **Database:** Firebase/Firestore (planned for events & submissions)
- **Storage:** Firebase Storage (planned for images)
- **AI Services:** Nano Banana, Stable Diffusion (via n8n workflows)

### Testing & Quality (Planned)
- **Unit/Integration Tests:** Vitest
- **Component Testing:** React Testing Library, Testing Library User Event
- **E2E Testing:** Playwright
- **API Mocking:** MSW (Mock Service Worker)
- **Linting:** ESLint (Next.js config)
- **Formatting:** Prettier (recommended)
- **Type Checking:** TypeScript compiler (strict mode)

### Deployment & Infrastructure
- **Hosting:** Vercel (recommended for Next.js)
- **CI/CD:** GitHub Actions (planned)
- **Environment:** Node.js
- **Analytics:** Vercel Analytics, Speed Insights (optional)
- **Performance Monitoring:** Lighthouse CI (planned)

### Third-Party Services
- **Authentication:** Firebase Authentication (planned)
- **File Storage:** Firebase Storage (planned)
- **AI Processing:** n8n webhooks → AI services
- **Monitoring:** Vercel Analytics, Sentry (planned)

### Import Aliases
- `@/components` → `src/components`
- `@/lib` → `src/lib`
- `@/hooks` → `src/hooks`
- `@/types` → `src/types`

### Key Design Decisions
- **Mobile-first:** Primary experience on mobile devices (320px - 768px)
- **Performance target:** AI transformation < 60 seconds, page load < 2 seconds
- **White-label:** Fully customizable branding per event
- **Monorepo structure:** pnpm workspaces (web/, functions/)

See [CLAUDE.md](../../../CLAUDE.md) for detailed architecture and commands.
