# Clementine 🍊

**A digital AI photobooth platform** that empowers brands, event creators, and marketers to create stunning, AI-enhanced photobooth experiences without physical booths or technical skills.

## 🌟 What is Clementine?

Clementine transforms traditional photobooths into virtual, AI-powered experiences:

- **Experience Creators** set up branded AI photobooth events with custom prompts
- **Guests** visit a shareable link, upload a photo, and receive AI-transformed results in **under 1 minute**
- **Analytics** help creators measure engagement, shares, and campaign success

Perfect for festivals, brand activations, corporate events, and social campaigns.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm package manager
- Firebase project (see [Firebase Setup](#firebase-setup))

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables (see Firebase Setup below)
cp web/.env.local.example web/.env.local
# Edit web/.env.local with your Firebase credentials

# Start development server (from root)
pnpm app:dev

# Visit http://localhost:3000
```

### Firebase Setup

This project requires a Firebase project for Firestore and Storage. Follow these steps:

#### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Enable Google Analytics (optional)

#### 2. Enable Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click "Create database"
3. Select **Start in production mode** (we'll add security rules later)
4. Choose a location (e.g., `us-central1`)

#### 3. Enable Firebase Storage

1. In Firebase Console, go to **Storage**
2. Click "Get started"
3. Accept default security rules (we'll customize later)
4. Use the same location as Firestore

#### 4. Get Client SDK Configuration

1. Go to **Project Settings** > **General**
2. Scroll to "Your apps" section
3. Click the Web icon (`</>`) to add a web app
4. Register app with a nickname (e.g., "Clementine Web")
5. Copy the config object values to `web/.env.local`:
   - `apiKey` → `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `projectId` → `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `storageBucket` → `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `authDomain` → `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `messagingSenderId` → `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `appId` → `NEXT_PUBLIC_FIREBASE_APP_ID`

#### 5. Generate Service Account (Admin SDK)

1. Go to **Project Settings** > **Service Accounts**
2. Click "Generate new private key"
3. Download the JSON file (keep it secure!)
4. Add these values to `web/.env.local`:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the full key with newlines)
   - Also set `FIREBASE_STORAGE_BUCKET` (same as public storage bucket)

#### 6. Set Base URL

Add your base URL to `web/.env.local`:

```bash
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # Development
# NEXT_PUBLIC_BASE_URL=https://your-domain.com  # Production
```

**Important**: Never commit `web/.env.local` or the service account JSON file to version control! The `.env.local.example` file should be committed as a template.

#### 7. Deploy Security Rules

Firebase security rules are stored in the repository for version control. To deploy them:

**Option 1: Firebase CLI (Recommended)**

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Update .firebaserc with your project ID
# Edit .firebaserc and replace "clementine-poc" with your project ID

# Update firebase.json with your storage bucket
# Edit firebase.json and replace the bucket name with yours

# Deploy rules
firebase deploy --only firestore:rules,storage

# Or use the npm script
pnpm firebase:deploy:rules

# Or deploy everything (including indexes)
pnpm firebase:deploy
```

**Option 2: Web Console (Manual - Not Recommended)**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. For Firestore rules:
   - Go to **Firestore Database** > **Rules** tab
   - Copy contents of `firestore.rules` and paste
   - Click **Publish**
4. For Storage rules:
   - Go to **Storage** > **Rules** tab
   - Copy contents of `storage.rules` and paste
   - Click **Publish**

**Important**: Always deploy rules from the repository files (Option 1) to maintain version control and consistency across environments.

**Rules Files Location:**

- `firebase/firestore.rules` - Firestore security rules
- `firebase/storage.rules` - Storage security rules
- `firebase/firestore.indexes.json` - Firestore indexes (auto-generated)
- `firebase.json` - Firebase configuration (at root, points to firebase/ folder)
- `.firebaserc` - Firebase project aliases (at root)

**POC Security Strategy:**

- ✅ Allow all reads (Client SDK can subscribe to real-time updates)
- ❌ Deny all writes (force all mutations through Server Actions)
- ✅ Business logic and validation enforced server-side
- ✅ Ready to tighten in MVP phase when authentication is added

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
├── firebase/              # Firebase configuration
│   ├── firestore.rules    # Firestore security rules
│   ├── storage.rules      # Storage security rules
│   └── firestore.indexes.json # Firestore indexes
├── standards/        # Technical standards & conventions
├── firebase.json          # Firebase config (points to firebase/ folder)
├── .firebaserc            # Firebase project aliases
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

See [standards/global/tech-stack.md](standards/global/tech-stack.md) for complete details.

## 📋 Available Commands

Run from the **root directory**:

> **Note:** App scripts use the `app:*` prefix to clarify they target the TanStack Start app.

```bash
# Development
pnpm app:dev          # Start TanStack Start dev server (port 3000)

# Building & Running
pnpm app:build        # Build production app
pnpm app:start        # Start production server

# Code Quality
pnpm app:lint         # Run ESLint on app
pnpm app:type-check   # TypeScript type checking
pnpm app:format       # Check Prettier formatting
pnpm app:check        # Format + fix linting (all-in-one)
pnpm app:test         # Run tests
```

### Working in the app workspace

```bash
cd apps/clementine-app
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

This project follows **spec-driven development** practices. All standards and conventions are documented in `standards/`:

### Standards Documentation

- **[Code Style](standards/global/coding-style.md)** - TypeScript, React, Tailwind conventions
- **[Architecture](standards/architecture.md)** - System design & patterns (TBD)
- **[Testing](standards/testing/test-writing.md)** - Testing philosophy & coverage goals
- **[Frontend](standards/frontend/)** - CSS, responsive design, accessibility, components
- **[Backend](standards/backend/)** - API design, models, queries
- **[Security](standards/security.md)** - Security guidelines (TBD)
- **[Performance](standards/performance.md)** - Performance budgets (TBD)

## 🎨 Design Principles

- **Mobile-first** - Primary experience on mobile devices
- **Speed** - AI transformation < 60s, page load < 2s
- **Simplicity** - Minimal friction from link → upload → result → share
- **White-label** - Fully customizable branding per event

## 📊 Product Strategy

See [.specify/memory/product.md](.specify/memory/product.md) for:

- Vision & mission
- MVP scope
- Core user flows
- Success metrics
- Strategic focus (Phase 1)

## 🧪 Testing (Planned)

```bash
# Unit & integration tests (Vitest) - run from root
pnpm app:test

# Or from app directory
cd apps/clementine-app
pnpm test
pnpm test --watch
pnpm test --coverage
```

Coverage goals:

- Critical paths: 90%+
- Utilities: 80%+
- UI components: 70%+
- Overall: 70%+

## 🚢 Deployment

Production app is deployed via **Firebase App Hosting**.

```bash
# Build for production (from root)
pnpm app:build

# Or from app directory
cd apps/clementine-app
pnpm build
```

## 🤝 Contributing

1. Follow the [coding standards](standards/)
2. Use the [spec-driven workflow](#spec-driven-workflow)
3. Write tests for critical paths
4. Ensure `pnpm app:lint` and `pnpm app:type-check` pass (from root), or run `pnpm check` from `apps/clementine-app/`

## 📚 Documentation

- **[CLAUDE.md](CLAUDE.md)** - Claude Code guidance for AI development
- **[Standards](standards/)** - Technical conventions & best practices
- **[Specifications](specs/)** - Project/feature specs

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
