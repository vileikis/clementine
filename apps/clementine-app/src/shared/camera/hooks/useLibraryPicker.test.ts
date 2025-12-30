/**
 * Tests for useLibraryPicker hook
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useLibraryPicker } from './useLibraryPicker'

// Mock the schemas module
vi.mock('../schemas', () => ({
  validateImageFile: vi.fn((file: File) => {
    if (file.type.startsWith('image/')) {
      return { success: true }
    }
    return { success: false, error: 'Invalid file type' }
  }),
}))

// Mock the lib module
vi.mock('../lib', () => ({
  getImageDimensions: vi.fn(() => ({
    width: 1920,
    height: 1080,
  })),
}))

describe('useLibraryPicker', () => {
  let createObjectURLSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    createObjectURLSpy = vi.fn(() => 'blob:test-url')
    vi.stubGlobal('URL', {
      createObjectURL: createObjectURLSpy,
      revokeObjectURL: vi.fn(),
    })
  })

  describe('openPicker', () => {
    it('should trigger file input click when openPicker called', () => {
      const { result } = renderHook(() => useLibraryPicker())

      // Create a mock input element
      const mockInput = document.createElement('input')
      mockInput.click = vi.fn()

      // Assign the mock input to the ref
      result.current.fileInputRef.current = mockInput

      act(() => {
        result.current.openPicker()
      })

      expect(mockInput.click).toHaveBeenCalled()
    })

    it('should handle null fileInputRef gracefully', () => {
      const { result } = renderHook(() => useLibraryPicker())

      // Ensure ref is null
      result.current.fileInputRef.current = null

      // Should not throw
      expect(() => {
        act(() => {
          result.current.openPicker()
        })
      }).not.toThrow()
    })
  })

  describe('handleFileChange', () => {
    it('should process valid image file and call onSelect', async () => {
      const onSelect = vi.fn()
      const { result } = renderHook(() => useLibraryPicker({ onSelect }))

      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const mockEvent = {
        target: {
          files: [mockFile],
          value: 'test.jpg',
        },
      } as unknown as React.ChangeEvent<HTMLInputElement>

      await act(async () => {
        await result.current.handleFileChange(mockEvent)
      })

      expect(onSelect).toHaveBeenCalledWith({
        previewUrl: 'blob:test-url',
        file: mockFile,
        method: 'library',
        width: 1920,
        height: 1080,
      })
    })

    it('should reset input value after file selection', async () => {
      const { result } = renderHook(() => useLibraryPicker())

      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const mockEvent = {
        target: {
          files: [mockFile],
          value: 'test.jpg',
        },
      } as unknown as React.ChangeEvent<HTMLInputElement>

      await act(async () => {
        await result.current.handleFileChange(mockEvent)
      })

      expect(mockEvent.target.value).toBe('')
    })

    it('should handle no file selected gracefully', async () => {
      const onSelect = vi.fn()
      const { result } = renderHook(() => useLibraryPicker({ onSelect }))

      const mockEvent = {
        target: {
          files: [],
          value: '',
        },
      } as unknown as React.ChangeEvent<HTMLInputElement>

      await act(async () => {
        await result.current.handleFileChange(mockEvent)
      })

      expect(onSelect).not.toHaveBeenCalled()
    })

    it('should call onError when file validation fails', async () => {
      const onError = vi.fn()
      const { result } = renderHook(() => useLibraryPicker({ onError }))

      const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' })
      const mockEvent = {
        target: {
          files: [mockFile],
          value: 'test.txt',
        },
      } as unknown as React.ChangeEvent<HTMLInputElement>

      await act(async () => {
        await result.current.handleFileChange(mockEvent)
      })

      expect(onError).toHaveBeenCalledWith({
        code: 'INVALID_FILE_TYPE',
        message: 'Invalid file type',
      })
    })

    it('should call onError when image dimensions fail to load', async () => {
      // Mock getImageDimensions to reject
      const { getImageDimensions } = await import('../lib')
      vi.mocked(getImageDimensions).mockRejectedValueOnce(
        new Error('Failed to load image'),
      )

      const onError = vi.fn()
      const { result } = renderHook(() => useLibraryPicker({ onError }))

      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const mockEvent = {
        target: {
          files: [mockFile],
          value: 'test.jpg',
        },
      } as unknown as React.ChangeEvent<HTMLInputElement>

      await act(async () => {
        await result.current.handleFileChange(mockEvent)
      })

      expect(onError).toHaveBeenCalledWith({
        code: 'CAPTURE_FAILED',
        message: 'Failed to load image',
      })
    })

    it('should handle non-Error exceptions when loading dimensions', async () => {
      // Mock getImageDimensions to reject with non-Error value
      const { getImageDimensions } = await import('../lib')
      vi.mocked(getImageDimensions).mockRejectedValueOnce('String error')

      const onError = vi.fn()
      const { result } = renderHook(() => useLibraryPicker({ onError }))

      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const mockEvent = {
        target: {
          files: [mockFile],
          value: 'test.jpg',
        },
      } as unknown as React.ChangeEvent<HTMLInputElement>

      await act(async () => {
        await result.current.handleFileChange(mockEvent)
      })

      expect(onError).toHaveBeenCalledWith({
        code: 'CAPTURE_FAILED',
        message: 'Failed to process image',
      })
    })

    it('should create object URL for selected file', async () => {
      const onSelect = vi.fn()
      const { result } = renderHook(() => useLibraryPicker({ onSelect }))

      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const mockEvent = {
        target: {
          files: [mockFile],
          value: 'test.jpg',
        },
      } as unknown as React.ChangeEvent<HTMLInputElement>

      await act(async () => {
        await result.current.handleFileChange(mockEvent)
      })

      expect(createObjectURLSpy).toHaveBeenCalledWith(mockFile)
    })

    it('should work without onSelect callback', async () => {
      const { result } = renderHook(() => useLibraryPicker())

      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const mockEvent = {
        target: {
          files: [mockFile],
          value: 'test.jpg',
        },
      } as unknown as React.ChangeEvent<HTMLInputElement>

      // Should not throw
      await expect(
        act(async () => {
          await result.current.handleFileChange(mockEvent)
        }),
      ).resolves.not.toThrow()
    })

    it('should work without onError callback', async () => {
      const { result } = renderHook(() => useLibraryPicker())

      const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' })
      const mockEvent = {
        target: {
          files: [mockFile],
          value: 'test.txt',
        },
      } as unknown as React.ChangeEvent<HTMLInputElement>

      // Should not throw
      await expect(
        act(async () => {
          await result.current.handleFileChange(mockEvent)
        }),
      ).resolves.not.toThrow()
    })
  })

  describe('fileInputRef', () => {
    it('should provide a ref object', () => {
      const { result } = renderHook(() => useLibraryPicker())

      expect(result.current.fileInputRef).toEqual({
        current: null,
      })
    })

    it('should maintain stable ref across re-renders', () => {
      const { result, rerender } = renderHook(() => useLibraryPicker())

      const firstRef = result.current.fileInputRef

      rerender()

      expect(result.current.fileInputRef).toBe(firstRef)
    })
  })

  describe('callback stability', () => {
    it('should maintain stable openPicker function across re-renders', () => {
      const { result, rerender } = renderHook(() => useLibraryPicker())

      const firstOpenPicker = result.current.openPicker

      rerender()

      expect(result.current.openPicker).toBe(firstOpenPicker)
    })

    it('should update handleFileChange when callbacks change', () => {
      const onSelect1 = vi.fn()
      const onSelect2 = vi.fn()

      const { result, rerender } = renderHook(
        ({ onSelect }) => useLibraryPicker({ onSelect }),
        { initialProps: { onSelect: onSelect1 } },
      )

      const firstHandle = result.current.handleFileChange

      rerender({ onSelect: onSelect2 })

      // Function reference should be different because callbacks changed
      expect(result.current.handleFileChange).not.toBe(firstHandle)
    })
  })
})
