# AI Provider Abstraction Refactor

**Date**: 2025-11-09
**Status**: Planned
**Related**: Phase 4 AI Transform Pipeline (tasks.md)

---

## Problem Statement

Current implementation expects separate endpoint URLs for each AI effect (background_swap, deep_fake), originally planned for n8n webhook integration. However:

1. We want to use Google GenAI SDK (`@google/genai`) with `gemini-2.5-flash-image` model directly on our server now
2. Future migration to n8n will use the same model with similar parameters
3. n8n will handle all transformation logic and potentially complex workflows
4. Need architecture that supports easy provider switching without code changes

---

## Solution: Provider Abstraction Pattern

Replace endpoint-based routing with a **provider abstraction layer** that supports multiple AI backends (Google AI, n8n, mock) through a unified interface.

### Architecture

```
TransformParams → nano-banana.ts → AIClient (factory)
                                   ↓
                      ┌────────────┴────────────┐
                      ↓                         ↓
              GoogleAIProvider          N8nWebhookProvider
              (gemini-2.5-flash)        (future)
```

**Key Principle**: Effect-specific logic (prompts, templates) is shared across providers. The provider only handles the communication layer.

---

## Implementation Plan

### 1. Install Dependencies

```bash
cd web
pnpm add @google/genai
```

### 2. New File Structure

```
web/src/lib/ai/
├── client.ts              # AIClient interface + factory
├── providers/
│   ├── google-ai.ts       # Google GenAI SDK implementation
│   ├── n8n-webhook.ts     # n8n webhook implementation (future)
│   └── mock.ts            # Mock implementation (moved from mock.ts)
├── prompts.ts             # Effect-specific prompt templates
├── nano-banana.ts         # Main entry point (modified)
└── types.ts               # Types (modified)
```

### 3. Core Abstractions

#### `AIClient` Interface (`client.ts`)

```typescript
export interface AIClient {
  /**
   * Generate transformed image
   * @param params - Transform parameters
   * @returns Buffer containing transformed image
   */
  generateImage(params: TransformParams): Promise<Buffer>;
}

export type AIProvider = 'google-ai' | 'n8n' | 'mock';

export function getAIClient(): AIClient {
  const provider = (process.env.AI_PROVIDER || 'mock') as AIProvider;

  switch (provider) {
    case 'google-ai':
      if (!process.env.GOOGLE_AI_API_KEY) {
        console.warn('[AI] GOOGLE_AI_API_KEY not set, falling back to mock');
        return new MockProvider();
      }
      return new GoogleAIProvider(process.env.GOOGLE_AI_API_KEY);

    case 'n8n':
      if (!process.env.N8N_WEBHOOK_BASE_URL) {
        console.warn('[AI] N8N_WEBHOOK_BASE_URL not set, falling back to mock');
        return new MockProvider();
      }
      return new N8nWebhookProvider({
        baseUrl: process.env.N8N_WEBHOOK_BASE_URL,
        authToken: process.env.N8N_WEBHOOK_AUTH_TOKEN,
      });

    case 'mock':
    default:
      return new MockProvider();
  }
}
```

#### Effect Prompts (`prompts.ts`)

```typescript
import type { TransformParams } from './types';

/**
 * Build effect-specific prompt from base params
 *
 * These templates are shared across all providers (Google AI, n8n, mock)
 */
export function buildPromptForEffect(params: TransformParams): string {
  const { effect, prompt, brandColor } = params;

  switch (effect) {
    case 'background_swap':
      return `${prompt}\n\nStyle: Professional photobooth quality. Brand color: ${brandColor || '#0EA5E9'}. Maintain subject's appearance exactly.`;

    case 'deep_fake':
      return `${prompt}\n\nStyle: Realistic face swap. Brand color accent: ${brandColor || '#0EA5E9'}. High quality output.`;

    default:
      return prompt;
  }
}
```

#### Google AI Provider (`providers/google-ai.ts`)

```typescript
import { GoogleGenAI } from "@google/genai";
import type { AIClient } from '../client';
import type { TransformParams } from '../types';
import { buildPromptForEffect } from '../prompts';

export class GoogleAIProvider implements AIClient {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateImage(params: TransformParams): Promise<Buffer> {
    console.log('[GoogleAI] Starting transform:', {
      effect: params.effect,
      hasReference: !!params.referenceImageUrl,
    });

    // Fetch input image and convert to base64
    const inputResponse = await fetch(params.inputImageUrl);
    const inputBuffer = await inputResponse.arrayBuffer();
    const inputBase64 = Buffer.from(inputBuffer).toString('base64');

    // Build prompt parts
    const promptParts: any[] = [
      { text: buildPromptForEffect(params) }
    ];

    // Add input image
    promptParts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: inputBase64,
      }
    });

    // Add reference image if provided (for background swap)
    if (params.referenceImageUrl) {
      const refResponse = await fetch(params.referenceImageUrl);
      const refBuffer = await refResponse.arrayBuffer();
      const refBase64 = Buffer.from(refBuffer).toString('base64');

      promptParts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: refBase64,
        }
      });
    }

    // Call Google AI
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: promptParts,
    });

    // Extract image from response
    for (const part of response.parts) {
      if (part.inlineData) {
        const buffer = Buffer.from(part.inlineData.data, 'base64');
        console.log('[GoogleAI] Transform complete:', {
          effect: params.effect,
          imageSize: buffer.length,
        });
        return buffer;
      }
    }

    throw new Error('No image data in Google AI response');
  }
}
```

#### n8n Webhook Provider (`providers/n8n-webhook.ts`)

```typescript
import type { AIClient } from '../client';
import type { TransformParams } from '../types';
import { buildPromptForEffect } from '../prompts';

export interface N8nConfig {
  baseUrl: string;
  authToken?: string;
}

export class N8nWebhookProvider implements AIClient {
  constructor(private config: N8nConfig) {}

  async generateImage(params: TransformParams): Promise<Buffer> {
    console.log('[n8n] Starting transform:', {
      effect: params.effect,
      webhook: this.config.baseUrl,
    });

    const response = await fetch(`${this.config.baseUrl}/transform`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.authToken && {
          Authorization: `Bearer ${this.config.authToken}`,
        }),
      },
      body: JSON.stringify({
        effect: params.effect,
        prompt: buildPromptForEffect(params),
        inputImageUrl: params.inputImageUrl,
        referenceImageUrl: params.referenceImageUrl,
        brandColor: params.brandColor,
      }),
    });

    if (!response.ok) {
      throw new Error(`n8n webhook error (${response.status}): ${await response.text()}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('[n8n] Transform complete:', {
      effect: params.effect,
      imageSize: buffer.length,
    });

    return buffer;
  }
}
```

#### Mock Provider (`providers/mock.ts`)

```typescript
import type { AIClient } from '../client';
import type { TransformParams } from '../types';

export class MockProvider implements AIClient {
  async generateImage(params: TransformParams): Promise<Buffer> {
    console.log('[Mock AI] Starting mock transform:', {
      effect: params.effect,
      prompt: params.prompt.substring(0, 50) + '...',
    });

    // Simulate API processing time (3-5 seconds)
    const delayMs = 3000 + Math.random() * 2000;
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    // Fetch input image and return it as-is
    const response = await fetch(params.inputImageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch input image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`[Mock AI] Transform complete (${Math.round(delayMs)}ms):`, {
      imageSize: buffer.length,
      effect: params.effect,
    });

    return buffer;
  }
}
```

### 4. Modified Files

#### `nano-banana.ts`

```typescript
import { getAIClient } from './client';
import type { TransformParams } from './types';

/**
 * Transform an image using configured AI provider
 *
 * Automatically selects provider based on AI_PROVIDER env var:
 * - 'google-ai': Google GenAI SDK (gemini-2.5-flash-image)
 * - 'n8n': n8n webhook integration
 * - 'mock': Development mock (default)
 */
export async function transformWithNanoBanana(
  params: TransformParams
): Promise<Buffer> {
  const client = getAIClient();
  return client.generateImage(params);
}
```

#### `types.ts`

```typescript
import type { EffectType } from '@/lib/types/firestore';

export interface TransformParams {
  effect: EffectType;
  prompt: string;
  inputImageUrl: string;
  referenceImageUrl?: string;
  brandColor?: string;
}

// AI provider configuration (read from env)
export interface AIServiceConfig {
  provider: 'google-ai' | 'n8n' | 'mock';
  googleAIKey?: string;
  n8nWebhookUrl?: string;
  n8nAuthToken?: string;
}

export function getAIConfig(): AIServiceConfig {
  const provider = (process.env.AI_PROVIDER || 'mock') as AIServiceConfig['provider'];

  return {
    provider,
    googleAIKey: process.env.GOOGLE_AI_API_KEY,
    n8nWebhookUrl: process.env.N8N_WEBHOOK_BASE_URL,
    n8nAuthToken: process.env.N8N_WEBHOOK_AUTH_TOKEN,
  };
}
```

### 5. Environment Variables

#### `.env.local.example`

```bash
# ============================================
# AI PROVIDER CONFIGURATION
# ============================================
# Select AI provider: 'google-ai' | 'n8n' | 'mock'
# Defaults to 'mock' if not set or if required credentials are missing
AI_PROVIDER=google-ai

# Google AI (when AI_PROVIDER=google-ai)
# Get API key from: https://aistudio.google.com/app/apikey
GOOGLE_AI_API_KEY=

# n8n Webhooks (when AI_PROVIDER=n8n)
# Base URL for your n8n instance webhook endpoints
N8N_WEBHOOK_BASE_URL=
# Optional: Authentication token for n8n webhooks
N8N_WEBHOOK_AUTH_TOKEN=

# ============================================
# DEPRECATED (remove after refactor)
# ============================================
# NANO_BANANA_API_KEY=
# NANO_BANANA_BG_SWAP_ENDPOINT=
# NANO_BANANA_DEEPFAKE_ENDPOINT=
```

### 6. Files to Delete

- `web/src/lib/ai/mock.ts` (moved to `providers/mock.ts`)

### 7. No Changes Required

- `web/src/app/actions/sessions.ts` - Orchestration logic unchanged
- All repository, storage, and UI code - untouched
- Retry/timeout logic in Server Actions - preserved

---

## Migration Paths

### Development (No API)

```bash
# .env.local
AI_PROVIDER=mock
# (or omit entirely, defaults to mock)
```

### POC with Google AI

```bash
# .env.local
AI_PROVIDER=google-ai
GOOGLE_AI_API_KEY=your_google_ai_api_key_here
```

### Production with n8n (Future)

```bash
# .env.local
AI_PROVIDER=n8n
N8N_WEBHOOK_BASE_URL=https://n8n.yourapp.com/webhook
N8N_WEBHOOK_AUTH_TOKEN=your_secret_token
```

### A/B Testing

Can switch providers per environment:
- **Staging**: Use Google AI for fast iteration
- **Production**: Use n8n for complex workflows

---

## Benefits

✅ **Zero-friction migration**: Change 1 env var to switch providers
✅ **Future-proof**: n8n provider ready to activate when workflows are built
✅ **Shared logic**: Prompt templates reused across all providers
✅ **Type-safe**: Single `AIClient` interface enforced by TypeScript
✅ **Easy testing**: Mock provider for development and tests
✅ **Gradual rollout**: Can test new provider in staging before production
✅ **Provider-agnostic**: Easy to add Replicate, Midjourney, or custom APIs later

---

## Testing Strategy

### Unit Tests

```typescript
// Test each provider independently
describe('GoogleAIProvider', () => {
  it('should transform image with correct prompt', async () => {
    const provider = new GoogleAIProvider(mockApiKey);
    const result = await provider.generateImage({
      effect: 'background_swap',
      prompt: 'Test prompt',
      inputImageUrl: 'https://example.com/input.jpg',
      brandColor: '#FF0000',
    });
    expect(result).toBeInstanceOf(Buffer);
  });
});
```

### Integration Tests

```typescript
// Test factory with env vars
describe('getAIClient', () => {
  it('should return GoogleAI when AI_PROVIDER=google-ai', () => {
    process.env.AI_PROVIDER = 'google-ai';
    process.env.GOOGLE_AI_API_KEY = 'test-key';
    const client = getAIClient();
    expect(client).toBeInstanceOf(GoogleAIProvider);
  });

  it('should fallback to mock when credentials missing', () => {
    process.env.AI_PROVIDER = 'google-ai';
    delete process.env.GOOGLE_AI_API_KEY;
    const client = getAIClient();
    expect(client).toBeInstanceOf(MockProvider);
  });
});
```

---

## Implementation Checklist

- [ ] Install `@google/genai` package
- [ ] Create `client.ts` with `AIClient` interface and factory
- [ ] Create `prompts.ts` with effect-specific templates
- [ ] Implement `GoogleAIProvider` in `providers/google-ai.ts`
- [ ] Implement `N8nWebhookProvider` in `providers/n8n-webhook.ts`
- [ ] Move mock logic to `MockProvider` in `providers/mock.ts`
- [ ] Update `nano-banana.ts` to use `getAIClient()`
- [ ] Update `types.ts` with new config structure
- [ ] Update `.env.local.example` with new env vars
- [ ] Delete old `mock.ts` file
- [ ] Test with `AI_PROVIDER=mock` (should work as before)
- [ ] Test with `AI_PROVIDER=google-ai` + API key
- [ ] Verify existing Server Action orchestration still works
- [ ] Update documentation in README if needed

---

## Future Enhancements

### n8n Workflow Example

When n8n is ready, the workflow could:

1. Receive webhook POST with `{ effect, prompt, inputImageUrl, referenceImageUrl, brandColor }`
2. Download images from signed URLs
3. Call Google AI (or other AI service) with workflow logic
4. Apply post-processing (watermarks, filters, compression)
5. Return transformed image as response

The `N8nWebhookProvider` will handle this communication transparently.

### Additional Providers

Easy to add more providers:

```typescript
// providers/replicate.ts
export class ReplicateProvider implements AIClient {
  async generateImage(params: TransformParams): Promise<Buffer> {
    // Replicate API logic
  }
}

// Update factory in client.ts
case 'replicate':
  return new ReplicateProvider(process.env.REPLICATE_API_KEY);
```

---

## Conclusion

This refactor provides a clean, extensible architecture that:
- Works today with Google GenAI SDK
- Prepares for n8n migration with zero code changes (just env vars)
- Supports future AI providers with minimal effort
- Maintains all existing functionality and error handling
