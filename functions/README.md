# Clementine Functions

Firebase Cloud Functions for Clementine - the digital AI photobooth.

## Purpose

This package contains Firebase Cloud Functions (v2) for:
- **Media processing pipeline** - Image, GIF, and video generation from uploaded photos
- **API endpoints** - HTTP functions for triggering processing
- **Task handlers** - Async Cloud Tasks for long-running operations

## Architecture

### Media Processing Pipeline

The media processing pipeline transforms user-uploaded photos into final outputs (images, GIFs, or videos).

**Key Design Decisions:**

1. **Direct FFmpeg Integration** (December 2024)
   - **Why**: `fluent-ffmpeg` is no longer maintained (read-only repository)
   - **Implementation**: Direct `child_process.spawn` calls to ffmpeg binary
   - **Benefits**: Works with latest ffmpeg versions, no dependency on unmaintained wrapper
   - **Location**: `src/services/media-pipeline/ffmpeg.ts`

2. **Pipeline Split by Media Type**
   - **Why**: Each output format (image/GIF/video) has unique processing requirements
   - **Structure**:
     - `image.pipeline.ts` - Single image scaling and cropping
     - `gif.pipeline.ts` - Multi-frame GIF with palette generation
     - `video.pipeline.ts` - MP4 video creation from image sequences
   - **Benefits**: Clear separation of concerns, easier to maintain and test

### File Structure

```
functions/
├── src/
│   ├── http/
│   │   └── processMedia.ts        # HTTP endpoint to queue processing
│   ├── tasks/
│   │   └── processMediaJob.ts     # Cloud Task handler (async processing)
│   ├── services/
│   │   └── media-pipeline/
│   │       ├── ffmpeg.ts           # FFmpeg wrapper (direct CLI calls)
│   │       ├── image.pipeline.ts   # Single image processing
│   │       ├── gif.pipeline.ts     # GIF processing
│   │       └── video.pipeline.ts   # Video processing
│   ├── lib/
│   │   ├── session.ts              # Firestore session helpers
│   │   ├── storage.ts              # Firebase Storage helpers
│   │   └── schemas/                # Zod validation schemas
│   └── index.ts                    # Function exports
├── scripts/
│   └── seed-emulators.ts           # Seed test data for local dev
└── seed-data/
    └── images/                     # Test images for seeding
```

## Setup

### Prerequisites

- Node.js 22+
- pnpm 10+
- Firebase CLI
- 12 test images in `seed-data/images/` (see README there)

### Installation

```bash
# From root
pnpm install

# Build functions
pnpm functions:build
```

## Development

### Local Development with Emulators

```bash
# Terminal 1: Start emulators
pnpm functions:serve

# Terminal 2: Seed test data
pnpm functions:seed
```

**Emulator UI**: http://localhost:4000

### Testing

See `MANUAL-TESTING.md` for comprehensive test cases and curl commands.

### Key Technologies

- **Runtime**: Node.js 22, TypeScript 5
- **Functions**: Firebase Cloud Functions v2
- **Storage**: Firebase Storage, Firestore
- **Media**: FFmpeg (via `ffmpeg-static` + direct CLI calls)
- **Validation**: Zod 3.x

### FFmpeg Operations

- **Image scaling/cropping**: Lanczos filter with center-crop
- **Thumbnail generation**: 300px width, maintains aspect ratio
- **GIF creation**: Palette-based with dithering (2 fps)
- **Video creation**: H.264 MP4, baseline profile, 5 fps
