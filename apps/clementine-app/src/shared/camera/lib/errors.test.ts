/**
 * Tests for error parsing utilities
 */

import { describe, expect, it } from 'vitest'
import { createUnavailableError, parseMediaError } from './errors'

describe('parseMediaError', () => {
  it('should parse NotAllowedError to PERMISSION_DENIED', () => {
    const error = new Error('Permission denied')
    error.name = 'NotAllowedError'

    const result = parseMediaError(error)

    expect(result).toEqual({
      code: 'PERMISSION_DENIED',
      message:
        'Camera permission denied. Please allow camera access to continue.',
    })
  })

  it('should parse NotFoundError to CAMERA_UNAVAILABLE', () => {
    const error = new Error('No camera found')
    error.name = 'NotFoundError'

    const result = parseMediaError(error)

    expect(result).toEqual({
      code: 'CAMERA_UNAVAILABLE',
      message: 'No camera found on this device.',
    })
  })

  it('should parse NotReadableError to CAMERA_IN_USE', () => {
    const error = new Error('Camera in use')
    error.name = 'NotReadableError'

    const result = parseMediaError(error)

    expect(result).toEqual({
      code: 'CAMERA_IN_USE',
      message: 'Camera is already in use by another application.',
    })
  })

  it('should handle unknown Error instances as UNKNOWN', () => {
    const error = new Error('Some unexpected error')
    error.name = 'UnknownError'

    const result = parseMediaError(error)

    expect(result).toEqual({
      code: 'UNKNOWN',
      message: 'Some unexpected error',
    })
  })

  it('should handle non-Error values as UNKNOWN', () => {
    const result1 = parseMediaError('string error')
    expect(result1).toEqual({
      code: 'UNKNOWN',
      message: 'Failed to access camera. Please check your permissions.',
    })

    const result2 = parseMediaError({ foo: 'bar' })
    expect(result2).toEqual({
      code: 'UNKNOWN',
      message: 'Failed to access camera. Please check your permissions.',
    })

    const result3 = parseMediaError(null)
    expect(result3).toEqual({
      code: 'UNKNOWN',
      message: 'Failed to access camera. Please check your permissions.',
    })
  })
})

describe('createUnavailableError', () => {
  it('should create CAMERA_UNAVAILABLE error', () => {
    const result = createUnavailableError()

    expect(result).toEqual({
      code: 'CAMERA_UNAVAILABLE',
      message:
        'Camera access not supported. Please use HTTPS or a supported browser.',
    })
  })

  it('should return the same error object structure each time', () => {
    const result1 = createUnavailableError()
    const result2 = createUnavailableError()

    expect(result1).toEqual(result2)
  })
})
