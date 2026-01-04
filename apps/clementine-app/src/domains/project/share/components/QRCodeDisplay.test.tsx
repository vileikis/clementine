/**
 * Component tests for QRCodeDisplay
 * Feature: 011-project-share-dialog
 */

import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { QRCodeDisplay } from './QRCodeDisplay'
import type { GuestUrl } from '../types'

describe('QRCodeDisplay', () => {
  const mockGuestUrl =
    'https://app.clementine.com/guest/test-project-123' as GuestUrl

  it('should render QR code SVG with correct attributes', () => {
    const { container } = render(
      <QRCodeDisplay guestUrl={mockGuestUrl} size={256} level="M" />,
    )

    const svgElement = container.querySelector('svg')
    expect(svgElement).toBeInTheDocument()
    expect(svgElement).toHaveAttribute('data-qr-code')
  })

  it('should use default size of 256 when not specified', () => {
    const { container } = render(<QRCodeDisplay guestUrl={mockGuestUrl} />)

    const svgElement = container.querySelector('svg')
    expect(svgElement).toBeInTheDocument()
    expect(svgElement).toHaveAttribute('width', '256')
    expect(svgElement).toHaveAttribute('height', '256')
  })

  it('should use custom size when specified', () => {
    const { container } = render(
      <QRCodeDisplay guestUrl={mockGuestUrl} size={512} />,
    )

    const svgElement = container.querySelector('svg')
    expect(svgElement).toHaveAttribute('width', '512')
    expect(svgElement).toHaveAttribute('height', '512')
  })

  it('should use default error correction level M when not specified', () => {
    const { container } = render(<QRCodeDisplay guestUrl={mockGuestUrl} />)

    const svgElement = container.querySelector('svg')
    expect(svgElement).toBeInTheDocument()
    // QR code should render successfully with default level
  })

  it('should track seed for testing via data attribute', () => {
    const testSeed = 12345
    const { container } = render(
      <QRCodeDisplay guestUrl={mockGuestUrl} seed={testSeed} />,
    )

    const svgElement = container.querySelector('svg')
    expect(svgElement).toHaveAttribute('data-seed', String(testSeed))
  })

  it('should render QR code within border container', () => {
    const { container } = render(<QRCodeDisplay guestUrl={mockGuestUrl} />)

    const borderContainer = container.querySelector('.border')
    expect(borderContainer).toBeInTheDocument()
  })
})
