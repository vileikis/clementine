# Clementine 🍊

**A digital AI photobooth platform** that empowers brands, event creators, and marketers to create stunning, AI-enhanced photobooth experiences without physical booths or technical skills.

## 🌟 What is Clementine?

Clementine transforms traditional photobooths into virtual, AI-powered experiences:
- **Experience Creators** set up branded AI photobooth events with custom prompts
- **Guests** visit a shareable link, upload a photo, and receive AI-transformed results in **under 1 minute**
- **Analytics** help creators measure engagement, shares, and campaign success

Perfect for festivals, brand activations, corporate events, and social campaigns.

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Visit http://localhost:3000
```

## 📂 Project Structure

```
clementine/
├── web/                    # Next.js 16 app (React 19, TypeScript)
│   ├── src/app/           # App Router pages & API routes
│   ├── src/components/    # React components
│   │   └── ui/           # shadcn/ui components
│   ├── src/lib/          # Utilities & helpers
│   ├── src/hooks/        # Custom React hooks
│   └── src/types/        # TypeScript type definitions
├── functions/             # Firebase Cloud Functions (planned)
├── sdd/                   # Spec-driven development documentation
│   ├── product/          # Product strategy & roadmap
│   ├── standards/        # Technical standards & conventions
│   └── specs/            # Project specifications
├── CLAUDE.md             # Claude Code guidance
└── README.md             # This file
```

## 🛠 Tech Stack

### Frontend
- **Framework:** Next.js 16 (App Router)
- **UI Library:** React 19
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4
- **Components:** shadcn/ui (New York style)
- **Package Manager:** pnpm (monorepo workspaces)

### Backend (Planned)
- **Cloud Functions:** Firebase Cloud Functions
- **Database:** Firebase/Firestore
- **Storage:** Firebase Storage
- **AI Workflow:** n8n (Nano Banana, Stable Diffusion)
- **Authentication:** Firebase Auth

See [sdd/standards/global/tech-stack.md](sdd/standards/global/tech-stack.md) for complete details.

## 📋 Available Commands

Run from the **root directory**:

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
pnpm type-check       # TypeScript check
```

## 🎯 Key Features

- **Mobile-first design** - Optimized for mobile devices (320px - 768px)
- **AI transformation** - Photo processing in under 60 seconds
- **White-label branding** - Fully customizable per event
- **Shareable links** - Easy distribution to guests
- **Real-time analytics** - Track engagement and shares
- **No technical skills required** - Simple setup for creators

## 📐 Development Standards

This project follows **spec-driven development** practices. All standards and conventions are documented in `sdd/standards/`:

### Standards Documentation

- **[Code Style](sdd/standards/global/coding-style.md)** - TypeScript, React, Tailwind conventions
- **[Architecture](sdd/standards/architecture.md)** - System design & patterns (TBD)
- **[Testing](sdd/standards/testing/test-writing.md)** - Testing philosophy & coverage goals
- **[Frontend](sdd/standards/frontend/)** - CSS, responsive design, accessibility, components
- **[Backend](sdd/standards/backend/)** - API design, models, queries
- **[Security](sdd/standards/security.md)** - Security guidelines (TBD)
- **[Performance](sdd/standards/performance.md)** - Performance budgets (TBD)

### Spec-Driven Workflow

Follow the SDD workflow using custom slash commands:

```bash
/specify [project-name]          # Create specification
/plan [project-name]             # Technical implementation plan
/tasks [project-name]            # Break down into tasks
/build [project-name] [task-id]  # Implement tasks
/review [project-name]           # Review against spec
```

Example: `/specify event-creation` creates `sdd/specs/event-creation/spec.md`

## 🎨 Design Principles

- **Mobile-first** - Primary experience on mobile devices
- **Speed** - AI transformation < 60s, page load < 2s
- **Simplicity** - Minimal friction from link → upload → result → share
- **White-label** - Fully customizable branding per event

## 📊 Product Strategy

See [sdd/product/PRODUCT.md](sdd/product/PRODUCT.md) for:
- Vision & mission
- MVP scope
- Core user flows
- Success metrics
- Strategic focus (Phase 1)

## 🧪 Testing (Planned)

```bash
# Unit & integration tests (Vitest)
pnpm test
pnpm test:watch
pnpm test:coverage

# E2E tests (Playwright)
pnpm test:e2e
pnpm test:e2e:ui
```

Coverage goals:
- Critical paths: 90%+
- Utilities: 80%+
- UI components: 70%+
- Overall: 70%+

## 🚢 Deployment

Recommended hosting: **Vercel** (optimized for Next.js)

```bash
# Build for production
pnpm build

# Environment variables required:
# - NEXT_PUBLIC_API_URL
# - FIREBASE_ADMIN_KEY (server-only)
# - DATABASE_URL (server-only)
```

## 🤝 Contributing

1. Follow the [coding standards](sdd/standards/)
2. Use the [spec-driven workflow](#spec-driven-workflow)
3. Write tests for critical paths
4. Ensure `pnpm lint` and `pnpm type-check` pass

## 📚 Documentation

- **[CLAUDE.md](CLAUDE.md)** - Claude Code guidance for AI development
- **[Product Strategy](sdd/product/PRODUCT.md)** - Vision, MVP, user flows
- **[Standards](sdd/standards/)** - Technical conventions & best practices
- **[Specifications](sdd/specs/)** - Project/feature specs

## 🎯 Roadmap

### Phase 1 (Current)
- [ ] Event creation & management
- [ ] Guest photo upload experience
- [ ] AI image transformation pipeline (n8n)
- [ ] Basic analytics dashboard

### Phase 2 (Planned)
- [ ] Firebase authentication
- [ ] User accounts & saved events
- [ ] Advanced analytics & insights
- [ ] Social sharing integrations
- [ ] Embeddable widget

### Phase 3 (Future)
- [ ] Video transformations
- [ ] Multi-language support
- [ ] White-label API
- [ ] Enterprise features

## 📄 License

[Add license information]

---

**Made with ❤️ for brands and event creators**

For questions or support, see [CLAUDE.md](CLAUDE.md) for development guidance.
