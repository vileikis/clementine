# Clementine Web App

Next.js 16 application for Clementine AI photobooth platform.

## Tech Stack

- **Next.js 16** (App Router) + **React 19**
- **TypeScript 5** (strict mode)
- **Tailwind CSS 4** + **shadcn/ui**
- **Firebase** (Firestore + Storage)
- **Zod** for validation

## Getting Started

```bash
pnpm dev              # Start dev server (localhost:3000)
pnpm build            # Production build
pnpm type-check       # TypeScript validation
```

## Architecture

### Admin Dashboard

- **Events Management** (`/events`) - Create and manage AI photobooth events
- **Companies Management** (`/companies`) - Organize events by brand/organization

### Event Builder

- **Content Tab** - Configure welcome screen, photo experiences, ending screen
- **Distribution Tab** - Share links and QR codes
- **Results Tab** - View analytics (sessions, shares, downloads)

Note: Survey UI present but not fully implemented (deferred to future project)

### Data Model

**Companies Collection** (`/companies`)
- Represents brands/organizations that own events
- Soft deletion support
- Optional branding metadata

**Events Collection** (`/events`)
- Root event configuration with welcome/ending screens
- Company association (optional)
- Share settings and survey configuration

**Events Subcollections**
- `/events/{eventId}/experiences` - Photo/video/gif/wheel experiences (photo only implemented)
- `/events/{eventId}/surveySteps` - Survey questions (not yet implemented)
- `/events/{eventId}/sessions` - Guest interactions
- `/events/{eventId}/shares` - Share tracking

## Key Features Implemented

✅ Company management with event filtering
✅ Event builder with sidebar navigation
✅ Welcome screen configuration
✅ Photo experiences with AI settings
✅ Ending screen with share options
✅ Mobile-first responsive design

⏳ Surveys (UI present, functionality not fully implemented)
