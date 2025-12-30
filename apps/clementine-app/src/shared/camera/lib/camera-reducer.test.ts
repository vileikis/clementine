/**
 * Tests for camera state machine reducer
 */

import { describe, expect, it } from 'vitest'
import { INITIAL_CAMERA_STATE, cameraReducer } from './cameraReducer'
import type { CameraAction, CameraState } from '../types'

describe('cameraReducer', () => {
  describe('CAMERA_READY action', () => {
    it('should transition to camera-active from any state', () => {
      const action: CameraAction = { type: 'CAMERA_READY' }

      const fromError: CameraState = {
        status: 'error',
        error: { code: 'CAMERA_IN_USE', message: 'Camera in use' },
      }
      expect(cameraReducer(fromError, action)).toEqual({
        status: 'camera-active',
      })

      const fromPhotoReview: CameraState = {
        status: 'photo-review',
        photo: {
          previewUrl: 'blob:test',
          file: new File([], 'test.jpg'),
          method: 'camera',
          width: 100,
          height: 100,
        },
      }
      expect(cameraReducer(fromPhotoReview, action)).toEqual({
        status: 'camera-active',
      })
    })
  })

  describe('PHOTO_CAPTURED action', () => {
    it('should transition to photo-review with captured photo', () => {
      const photo = {
        previewUrl: 'blob:test',
        file: new File([], 'test.jpg'),
        method: 'camera' as const,
        width: 1920,
        height: 1080,
      }
      const action: CameraAction = { type: 'PHOTO_CAPTURED', photo }

      const result = cameraReducer(INITIAL_CAMERA_STATE, action)

      expect(result).toEqual({
        status: 'photo-review',
        photo,
      })
    })
  })

  describe('RETAKE action', () => {
    it('should transition from photo-review back to camera-active', () => {
      const photoReviewState: CameraState = {
        status: 'photo-review',
        photo: {
          previewUrl: 'blob:test',
          file: new File([], 'test.jpg'),
          method: 'camera',
          width: 100,
          height: 100,
        },
      }
      const action: CameraAction = { type: 'RETAKE' }

      const result = cameraReducer(photoReviewState, action)

      expect(result).toEqual({ status: 'camera-active' })
    })
  })

  describe('ERROR action', () => {
    it('should transition to error state with error details', () => {
      const error = {
        code: 'PERMISSION_DENIED' as const,
        message: 'Camera permission denied',
      }
      const action: CameraAction = { type: 'ERROR', error }

      const result = cameraReducer(INITIAL_CAMERA_STATE, action)

      expect(result).toEqual({
        status: 'error',
        error,
      })
    })
  })

  describe('default/unknown action', () => {
    it('should return current state for unknown action types', () => {
      const currentState: CameraState = { status: 'camera-active' }
      const unknownAction = { type: 'UNKNOWN_ACTION' }

      // @ts-expect-error - Testing unknown action type
      const result = cameraReducer(currentState, unknownAction)

      expect(result).toBe(currentState)
    })
  })

  describe('INITIAL_CAMERA_STATE', () => {
    it('should have camera-active as initial state', () => {
      expect(INITIAL_CAMERA_STATE).toEqual({ status: 'camera-active' })
    })
  })
})
