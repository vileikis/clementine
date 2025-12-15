# Original PLan

- see ./plan.md

### Stage 0: Monorepo Foundation (Day 1)

**Goal**: Establish shared packages and deployment infrastructure before any business logic.

### Deliverables

**1. Workspace Configuration**

```yaml
# pnpm-workspace.yaml
packages:
  - "web"
  - "functions"
  - "packages/*"
```

**2. Shared Types Package**

```
packages/shared/
├── src/
│   ├── types/
│   │   ├── session.types.ts
│   │   ├── experience.types.ts
│   │   ├── event.types.ts
│   │   └── index.ts
│   ├── constants/
│   │   └── index.ts
│   └── index.ts
├── package.json
└── tsconfig.json

```

```tsx
// packages/shared/src/types/session.types.ts
export interface InputAsset {
  url: string;
  type: "image" | "video";
  order: number;
}

export interface ProcessingState {
  state: "pending" | "running" | "completed" | "failed";
  currentStep: string;
  startedAt: Date;
  updatedAt: Date;
  attemptNumber: number;
  taskId: string;
  error?: ProcessingError;
}

export interface ProcessingError {
  message: string;
  code: string;
  step: string;
  retryable: boolean;
  timestamp: Date;
}

export interface SessionOutputs {
  primaryUrl: string;
  thumbnailUrl: string;
  format: "gif" | "mp4" | "webm" | "image";
  dimensions: { width: number; height: number };
  sizeBytes: number;
  completedAt: Date;
  processingTimeMs: number;
}

export interface Session {
  id: string;
  projectId: string;
  eventId: string;
  experienceId: string;
  inputAssets: InputAsset[];
  processing?: ProcessingState;
  outputs?: SessionOutputs;
  createdAt: Date;
  updatedAt: Date;
}
```

**3. Functions Package Setup**

```json
// functions/package.json
{
  "name": "@clementine/functions",
  "main": "lib/index.js",
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "serve": "npm run build && firebase emulators:start --only functions",
    "deploy": "npm run build && firebase deploy --only functions"
  },
  "dependencies": {
    "@clementine/shared": "workspace:*",
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^5.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

**4. Hello World Function**

```tsx
// functions/src/index.ts
import { onRequest } from "firebase-functions/v2/https";
import { Session } from "@clementine/shared";

export const helloWorld = onRequest((req, res) => {
  // Verify shared types work
  const mockSession: Partial<Session> = {
    id: "test",
    projectId: "test-project",
  };

  res.json({
    message: "Functions operational",
    sharedTypesWorking: true,
    testSession: mockSession,
  });
});
```

**5. Deploy Script**

```bash
#!/bin/bash
# scripts/deploy.sh

set -e

echo "🔨 Building shared package..."
pnpm --filter @clementine/shared build

echo "🔨 Building functions..."
pnpm --filter @clementine/functions build

echo "🚀 Deploying functions..."
firebase deploy --only functions

echo "✅ Deployment complete!"

```

**6. Firebase Configuration**

```json
// firebase.json
{
  "functions": {
    "source": "functions",
    "codebase": "default",
    "predeploy": ["npm --prefix \"$RESOURCE_DIR\" run build"],
    "ignore": ["node_modules", ".git", "src/**/*.test.ts"]
  }
}
```

### Testing Checkpoint

- [ ] `pnpm install` from root succeeds
- [ ] Import `Session` type in both web and functions
- [ ] `./scripts/deploy.sh` completes without errors
- [ ] `curl <function-url>/helloWorld` returns expected JSON

---
