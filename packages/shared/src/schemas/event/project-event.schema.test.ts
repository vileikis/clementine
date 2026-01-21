import { describe, it, expect } from 'vitest'
import {
  projectEventStatusSchema,
  projectEventFullSchema,
} from './project-event.schema'

describe('projectEventStatusSchema', () => {
  it('accepts valid status values', () => {
    expect(projectEventStatusSchema.parse('active')).toBe('active')
    expect(projectEventStatusSchema.parse('deleted')).toBe('deleted')
  })

  it('rejects invalid status values', () => {
    expect(() => projectEventStatusSchema.parse('draft')).toThrow()
    expect(() => projectEventStatusSchema.parse('archived')).toThrow()
    expect(() => projectEventStatusSchema.parse('')).toThrow()
  })
})

describe('projectEventFullSchema', () => {
  const validMinimalEvent = {
    id: 'event-123',
    name: 'Test Event',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  it('parses minimal valid event with defaults', () => {
    const result = projectEventFullSchema.parse(validMinimalEvent)

    expect(result.id).toBe('event-123')
    expect(result.name).toBe('Test Event')
    expect(result.status).toBe('active')
    expect(result.deletedAt).toBeNull()
    expect(result.draftConfig).toBeNull()
    expect(result.publishedConfig).toBeNull()
    expect(result.draftVersion).toBe(1)
    expect(result.publishedVersion).toBeNull()
    expect(result.publishedAt).toBeNull()
  })

  it('requires id field', () => {
    const { id: _, ...withoutId } = validMinimalEvent
    expect(() => projectEventFullSchema.parse(withoutId)).toThrow()
  })

  it('requires name field', () => {
    const { name: _, ...withoutName } = validMinimalEvent
    expect(() => projectEventFullSchema.parse(withoutName)).toThrow()
  })

  it('requires createdAt field', () => {
    const { createdAt: _, ...withoutCreatedAt } = validMinimalEvent
    expect(() => projectEventFullSchema.parse(withoutCreatedAt)).toThrow()
  })

  it('requires updatedAt field', () => {
    const { updatedAt: _, ...withoutUpdatedAt } = validMinimalEvent
    expect(() => projectEventFullSchema.parse(withoutUpdatedAt)).toThrow()
  })

  it('accepts complete event with all fields', () => {
    const now = Date.now()
    const result = projectEventFullSchema.parse({
      ...validMinimalEvent,
      status: 'deleted',
      deletedAt: now,
      draftConfig: { schemaVersion: 1 },
      publishedConfig: { schemaVersion: 1 },
      draftVersion: 5,
      publishedVersion: 3,
      publishedAt: now,
    })

    expect(result.status).toBe('deleted')
    expect(result.deletedAt).toBe(now)
    expect(result.draftConfig).not.toBeNull()
    expect(result.publishedConfig).not.toBeNull()
    expect(result.draftVersion).toBe(5)
    expect(result.publishedVersion).toBe(3)
  })

  it('validates nested config schemas', () => {
    expect(() =>
      projectEventFullSchema.parse({
        ...validMinimalEvent,
        draftConfig: {
          theme: { primaryColor: 'invalid-color' },
        },
      })
    ).toThrow()
  })

  it('preserves unknown fields (looseObject forward compatibility)', () => {
    const result = projectEventFullSchema.parse({
      ...validMinimalEvent,
      futureField: 'value',
      metadata: { custom: true },
    })
    expect((result as Record<string, unknown>).futureField).toBe('value')
    expect((result as Record<string, unknown>).metadata).toEqual({ custom: true })
  })

  describe('version tracking', () => {
    it('draftVersion defaults to 1', () => {
      const result = projectEventFullSchema.parse(validMinimalEvent)
      expect(result.draftVersion).toBe(1)
    })

    it('publishedVersion is nullable (null until first publish)', () => {
      const result = projectEventFullSchema.parse(validMinimalEvent)
      expect(result.publishedVersion).toBeNull()
    })

    it('accepts version numbers', () => {
      const result = projectEventFullSchema.parse({
        ...validMinimalEvent,
        draftVersion: 10,
        publishedVersion: 5,
      })
      expect(result.draftVersion).toBe(10)
      expect(result.publishedVersion).toBe(5)
    })
  })

  describe('soft delete pattern', () => {
    it('active event has null deletedAt', () => {
      const result = projectEventFullSchema.parse({
        ...validMinimalEvent,
        status: 'active',
      })
      expect(result.deletedAt).toBeNull()
    })

    it('deleted event can have deletedAt timestamp', () => {
      const deletedAt = Date.now()
      const result = projectEventFullSchema.parse({
        ...validMinimalEvent,
        status: 'deleted',
        deletedAt,
      })
      expect(result.status).toBe('deleted')
      expect(result.deletedAt).toBe(deletedAt)
    })
  })
})
