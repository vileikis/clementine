import { describe, expect, it } from 'vitest'
import { getStepDisplayLabel } from './step-utils'
import { stepRegistry } from './step-registry'
import type { Step } from './step-registry'

describe('getStepDisplayLabel', () => {
  it('returns custom title when present and non-empty', () => {
    const step: Step = {
      id: 'test-id',
      type: 'info',
      config: { title: 'Welcome', description: '', media: null },
    }
    const definition = stepRegistry.info
    expect(getStepDisplayLabel(step, definition)).toBe('Welcome')
  })

  it('returns default label when title is whitespace only', () => {
    const step: Step = {
      id: 'test-id',
      type: 'info',
      config: { title: '   ', description: '', media: null },
    }
    const definition = stepRegistry.info
    expect(getStepDisplayLabel(step, definition)).toBe('Information')
  })

  it('returns default label when title is empty string', () => {
    const step: Step = {
      id: 'test-id',
      type: 'info',
      config: { title: '', description: '', media: null },
    }
    const definition = stepRegistry.info
    expect(getStepDisplayLabel(step, definition)).toBe('Information')
  })

  it('returns default label when step type has no title field', () => {
    const step: Step = {
      id: 'test-id',
      type: 'capture.photo',
      config: { aspectRatio: '1:1' },
    }
    const definition = stepRegistry['capture.photo']
    expect(getStepDisplayLabel(step, definition)).toBe('Photo Capture')
  })
})
