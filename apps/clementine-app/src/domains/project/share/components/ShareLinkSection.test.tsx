/**
 * Component tests for ShareLinkSection
 * Feature: 011-project-share-dialog
 */

import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ShareLinkSection } from './ShareLinkSection'

describe('ShareLinkSection', () => {
  const mockUrl = 'https://app.clementine.com/guest/test-project-123'
  const mockOnCopy = vi.fn()

  it('should render guest URL in readonly input', () => {
    render(
      <ShareLinkSection
        guestUrl={mockUrl}
        onCopy={mockOnCopy}
        copySuccess={false}
      />,
    )

    const input = screen.getByLabelText('Guest Link')
    expect(input).toBeInTheDocument()
    expect(input).toHaveValue(mockUrl)
    expect(input).toHaveAttribute('readonly')
  })

  it('should call onCopy when copy button is clicked', () => {
    render(
      <ShareLinkSection
        guestUrl={mockUrl}
        onCopy={mockOnCopy}
        copySuccess={false}
      />,
    )

    const copyButton = screen.getByRole('button', { name: /copy link/i })
    fireEvent.click(copyButton)

    expect(mockOnCopy).toHaveBeenCalledTimes(1)
  })

  it('should show success state after copy succeeds', () => {
    render(
      <ShareLinkSection
        guestUrl={mockUrl}
        onCopy={mockOnCopy}
        copySuccess={true}
      />,
    )

    const copyButton = screen.getByRole('button', { name: /link copied/i })
    expect(copyButton).toBeInTheDocument()
    expect(screen.getByText('Copied!')).toBeInTheDocument()
  })

  it('should disable button when copying is in progress', () => {
    render(
      <ShareLinkSection
        guestUrl={mockUrl}
        onCopy={mockOnCopy}
        copySuccess={false}
        isCopying={true}
      />,
    )

    const copyButton = screen.getByRole('button')
    expect(copyButton).toBeDisabled()
  })

  it('should select all text when input is clicked', () => {
    render(
      <ShareLinkSection
        guestUrl={mockUrl}
        onCopy={mockOnCopy}
        copySuccess={false}
      />,
    )

    const input = screen.getByLabelText('Guest Link')
    const selectSpy = vi.spyOn(input, 'select')

    fireEvent.click(input)

    expect(selectSpy).toHaveBeenCalled()
  })
})
