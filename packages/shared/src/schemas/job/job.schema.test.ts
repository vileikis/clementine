import { describe, it, expect } from 'vitest'
import {
  jobStatusSchema,
  jobProgressSchema,
  jobErrorSchema,
  jobOutputSchema,
  jobSnapshotSchema,
  jobSchema,
} from './job.schema'

describe('jobStatusSchema', () => {
  it('accepts valid status values', () => {
    const validStatuses = ['pending', 'running', 'completed', 'failed', 'cancelled']
    validStatuses.forEach((status) => {
      expect(jobStatusSchema.parse(status)).toBe(status)
    })
  })

  it('rejects invalid status values', () => {
    expect(() => jobStatusSchema.parse('queued')).toThrow()
    expect(() => jobStatusSchema.parse('paused')).toThrow()
  })
})

describe('jobProgressSchema', () => {
  it('parses valid progress', () => {
    const result = jobProgressSchema.parse({
      currentStep: 'processing',
      percentage: 50,
    })
    expect(result.currentStep).toBe('processing')
    expect(result.percentage).toBe(50)
    expect(result.message).toBeNull()
  })

  it('validates percentage bounds (0-100)', () => {
    expect(jobProgressSchema.parse({ currentStep: 'start', percentage: 0 }).percentage).toBe(0)
    expect(jobProgressSchema.parse({ currentStep: 'end', percentage: 100 }).percentage).toBe(100)
  })

  it('rejects percentage outside bounds', () => {
    expect(() => jobProgressSchema.parse({ currentStep: 'x', percentage: -1 })).toThrow()
    expect(() => jobProgressSchema.parse({ currentStep: 'x', percentage: 101 })).toThrow()
  })

  it('accepts optional message', () => {
    const result = jobProgressSchema.parse({
      currentStep: 'processing',
      percentage: 75,
      message: 'Applying filters...',
    })
    expect(result.message).toBe('Applying filters...')
  })
})

describe('jobErrorSchema', () => {
  const validError = {
    code: 'TRANSFORM_FAILED',
    message: 'Transform pipeline failed',
    isRetryable: true,
    timestamp: Date.now(),
  }

  it('parses valid error', () => {
    const result = jobErrorSchema.parse(validError)
    expect(result.code).toBe('TRANSFORM_FAILED')
    expect(result.message).toBe('Transform pipeline failed')
    expect(result.isRetryable).toBe(true)
    expect(result.step).toBeNull()
  })

  it('requires positive integer timestamp', () => {
    expect(() => jobErrorSchema.parse({ ...validError, timestamp: 0 })).toThrow()
    expect(() => jobErrorSchema.parse({ ...validError, timestamp: -1 })).toThrow()
    expect(() => jobErrorSchema.parse({ ...validError, timestamp: 1.5 })).toThrow()
  })

  it('accepts optional step field', () => {
    const result = jobErrorSchema.parse({
      ...validError,
      step: 'ai.imageGeneration',
    })
    expect(result.step).toBe('ai.imageGeneration')
  })
})

describe('jobOutputSchema', () => {
  const validOutput = {
    assetId: 'asset-123',
    url: 'https://example.com/output.png',
    filePath: 'outputs/project-1/output.png',
    format: 'image',
    dimensions: { width: 1024, height: 1024 },
    sizeBytes: 500000,
    processingTimeMs: 5000,
  }

  it('parses valid output', () => {
    const result = jobOutputSchema.parse(validOutput)
    expect(result.assetId).toBe('asset-123')
    expect(result.format).toBe('image')
    expect(result.dimensions).toEqual({ width: 1024, height: 1024 })
  })

  it('validates format enum', () => {
    expect(jobOutputSchema.parse({ ...validOutput, format: 'image' }).format).toBe('image')
    expect(jobOutputSchema.parse({ ...validOutput, format: 'gif' }).format).toBe('gif')
    expect(jobOutputSchema.parse({ ...validOutput, format: 'video' }).format).toBe('video')
    expect(() => jobOutputSchema.parse({ ...validOutput, format: 'audio' })).toThrow()
  })

  it('requires positive integer dimensions', () => {
    expect(() =>
      jobOutputSchema.parse({
        ...validOutput,
        dimensions: { width: 0, height: 100 },
      })
    ).toThrow()

    expect(() =>
      jobOutputSchema.parse({
        ...validOutput,
        dimensions: { width: 100, height: -1 },
      })
    ).toThrow()

    expect(() =>
      jobOutputSchema.parse({
        ...validOutput,
        dimensions: { width: 100.5, height: 100 },
      })
    ).toThrow()
  })

  it('requires positive integer sizeBytes', () => {
    expect(() => jobOutputSchema.parse({ ...validOutput, sizeBytes: 0 })).toThrow()
    expect(() => jobOutputSchema.parse({ ...validOutput, sizeBytes: -100 })).toThrow()
  })

  it('requires non-negative integer processingTimeMs', () => {
    expect(jobOutputSchema.parse({ ...validOutput, processingTimeMs: 0 }).processingTimeMs).toBe(0)
    expect(() => jobOutputSchema.parse({ ...validOutput, processingTimeMs: -1 })).toThrow()
  })

  it('accepts optional thumbnailUrl', () => {
    const result = jobOutputSchema.parse({
      ...validOutput,
      thumbnailUrl: 'https://example.com/thumb.png',
    })
    expect(result.thumbnailUrl).toBe('https://example.com/thumb.png')
  })

  it('validates thumbnailUrl format when provided', () => {
    expect(() =>
      jobOutputSchema.parse({
        ...validOutput,
        thumbnailUrl: 'not-a-url',
      })
    ).toThrow()
  })
})

describe('jobSnapshotSchema', () => {
  const validSnapshot = {
    sessionResponses: [],
    experienceVersion: 1,
    type: 'ai.image' as const,
    config: {},
    overlayChoice: null,
  }

  it('parses valid snapshot with type and config', () => {
    const result = jobSnapshotSchema.parse(validSnapshot)
    expect(result.sessionResponses).toBeDefined()
    expect(result.experienceVersion).toBe(1)
    expect(result.type).toBe('ai.image')
    expect(result.config.photo).toBeNull()
    expect(result.config.gif).toBeNull()
    expect(result.config.video).toBeNull()
    expect(result.config.aiImage).toBeNull()
    expect(result.config.aiVideo).toBeNull()
    expect(result.overlayChoice).toBeNull()
  })

  it('accepts resolved overlayChoice', () => {
    const result = jobSnapshotSchema.parse({
      ...validSnapshot,
      overlayChoice: {
        mediaAssetId: 'overlay-1',
        url: 'https://example.com/overlay.png',
        displayName: 'Brand Overlay',
      },
    })
    expect(result.overlayChoice).not.toBeNull()
    expect(result.overlayChoice?.mediaAssetId).toBe('overlay-1')
  })

  it('accepts per-type config in config object', () => {
    const result = jobSnapshotSchema.parse({
      ...validSnapshot,
      config: {
        aiImage: {
          task: 'text-to-image',
          captureStepId: null,
          aspectRatio: '1:1',
          imageGeneration: { prompt: 'a photo of a cat' },
        },
      },
    })
    expect(result.config.aiImage?.task).toBe('text-to-image')
  })
})

describe('jobSchema', () => {
  const validMinimalJob = {
    id: 'job-123',
    projectId: 'project-1',
    sessionId: 'session-1',
    experienceId: 'exp-1',
    snapshot: {
      sessionResponses: [],
      experienceVersion: 1,
      type: 'ai.image' as const,
      config: {},
      overlayChoice: null,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  it('parses minimal valid job with defaults', () => {
    const result = jobSchema.parse(validMinimalJob)

    expect(result.id).toBe('job-123')
    expect(result.status).toBe('pending')
    expect(result.progress).toBeNull()
    expect(result.output).toBeNull()
    expect(result.error).toBeNull()
    expect(result.startedAt).toBeNull()
    expect(result.completedAt).toBeNull()
  })

  it('requires id field', () => {
    const { id: _, ...withoutId } = validMinimalJob
    expect(() => jobSchema.parse(withoutId)).toThrow()
  })

  it('requires snapshot field', () => {
    const { snapshot: _, ...withoutSnapshot } = validMinimalJob
    expect(() => jobSchema.parse(withoutSnapshot)).toThrow()
  })

  it('requires positive integer timestamps', () => {
    expect(() => jobSchema.parse({ ...validMinimalJob, createdAt: 0 })).toThrow()
    expect(() => jobSchema.parse({ ...validMinimalJob, createdAt: -1 })).toThrow()
  })

  it('accepts complete job with all fields', () => {
    const now = Date.now()
    const result = jobSchema.parse({
      ...validMinimalJob,
      status: 'completed',
      progress: { currentStep: 'done', percentage: 100 },
      output: {
        assetId: 'asset-out',
        url: 'https://example.com/out.png',
        filePath: 'outputs/project-1/out.png',
        format: 'image',
        dimensions: { width: 512, height: 512 },
        sizeBytes: 100000,
        processingTimeMs: 3000,
      },
      startedAt: now - 5000,
      completedAt: now,
    })

    expect(result.status).toBe('completed')
    expect(result.progress?.percentage).toBe(100)
    expect(result.output?.format).toBe('image')
    expect(result.startedAt).toBe(now - 5000)
    expect(result.completedAt).toBe(now)
  })

  it('accepts failed job with error', () => {
    const result = jobSchema.parse({
      ...validMinimalJob,
      status: 'failed',
      error: {
        code: 'TIMEOUT',
        message: 'Processing timed out',
        isRetryable: true,
        timestamp: Date.now(),
      },
    })

    expect(result.status).toBe('failed')
    expect(result.error?.code).toBe('TIMEOUT')
    expect(result.error?.isRetryable).toBe(true)
  })

  it('preserves unknown fields (looseObject forward compatibility)', () => {
    const result: Record<string, unknown> = jobSchema.parse({
      ...validMinimalJob,
      retryCount: 3,
      metadata: { source: 'api' },
    })
    expect(result['retryCount']).toBe(3)
    expect(result['metadata']).toEqual({ source: 'api' })
  })
})
