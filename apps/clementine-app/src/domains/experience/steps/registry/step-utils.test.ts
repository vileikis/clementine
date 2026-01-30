import { describe, expect, it } from 'vitest'
import { getStepDisplayLabel } from './step-utils'
import { stepRegistry } from './step-registry'
import type { Step } from './step-registry'

describe('getStepDisplayLabel', () => {
  it('returns custom name when present', () => {
    const step: Step = {
      id: 'test-id',
      type: 'info',
      name: 'Welcome Screen',
      config: { title: 'Ignored Title', description: '', media: null },
    }
    const definition = stepRegistry.info
    expect(getStepDisplayLabel(step, definition)).toBe('Welcome Screen')
  })

  it('returns default label when name is empty string', () => {
    const step: Step = {
      id: 'test-id',
      type: 'info',
      name: '',
      config: { title: 'Ignored Title', description: '', media: null },
    }
    const definition = stepRegistry.info
    expect(getStepDisplayLabel(step, definition)).toBe('Information')
  })

  it('returns default label when name is whitespace only', () => {
    const step: Step = {
      id: 'test-id',
      type: 'info',
      name: '   ',
      config: { title: 'Ignored Title', description: '', media: null },
    }
    const definition = stepRegistry.info
    expect(getStepDisplayLabel(step, definition)).toBe('Information')
  })

  it('returns default label for capture photo step with empty name', () => {
    const step: Step = {
      id: 'test-id',
      type: 'capture.photo',
      name: '',
      config: { aspectRatio: '1:1' },
    }
    const definition = stepRegistry['capture.photo']
    expect(getStepDisplayLabel(step, definition)).toBe('Photo Capture')
  })
})
