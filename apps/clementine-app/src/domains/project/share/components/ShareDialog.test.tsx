/**
 * Component tests for ShareDialog
 * Feature: 011-project-share-dialog
 */

import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ShareDialog } from './ShareDialog'

// Mock the child components
vi.mock('./ShareLinkSection', () => ({
  ShareLinkSection: ({
    guestUrl,
    onCopy,
  }: {
    guestUrl: string
    onCopy: () => void
  }) => (
    <div data-testid="share-link-section">
      <span>{guestUrl}</span>
      <button onClick={onCopy}>Copy</button>
    </div>
  ),
}))

// Mock the hooks
vi.mock('../hooks/useCopyToClipboard', () => ({
  useCopyToClipboard: () => ({
    copyToClipboard: vi.fn(),
    isCopying: false,
    copySuccess: false,
  }),
}))

// Mock window.location
const mockLocation = {
  origin: 'https://app.clementine.com',
}
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
})

describe('ShareDialog', () => {
  const mockProjectId = 'test-project-123'
  const mockOnOpenChange = vi.fn()

  it('should render when open is true', () => {
    render(
      <ShareDialog
        projectId={mockProjectId}
        open={true}
        onOpenChange={mockOnOpenChange}
      />,
    )

    expect(screen.getByText('Share Project')).toBeInTheDocument()
    expect(
      screen.getByText('Share this project with guests at your event'),
    ).toBeInTheDocument()
  })

  it('should not render when open is false', () => {
    render(
      <ShareDialog
        projectId={mockProjectId}
        open={false}
        onOpenChange={mockOnOpenChange}
      />,
    )

    expect(screen.queryByText('Share Project')).not.toBeInTheDocument()
  })

  it('should generate and display guest URL', () => {
    render(
      <ShareDialog
        projectId={mockProjectId}
        open={true}
        onOpenChange={mockOnOpenChange}
      />,
    )

    const expectedUrl = `https://app.clementine.com/guest/${mockProjectId}`
    expect(screen.getByText(expectedUrl)).toBeInTheDocument()
  })

  it('should render ShareLinkSection component', () => {
    render(
      <ShareDialog
        projectId={mockProjectId}
        open={true}
        onOpenChange={mockOnOpenChange}
      />,
    )

    expect(screen.getByTestId('share-link-section')).toBeInTheDocument()
  })

  it('should call onOpenChange when dialog closes', () => {
    render(
      <ShareDialog
        projectId={mockProjectId}
        open={true}
        onOpenChange={mockOnOpenChange}
      />,
    )

    // Find and click the close button (X button in dialog)
    const closeButton = screen.getByRole('button', { name: /close/i })
    fireEvent.click(closeButton)

    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })
})
