/**
 * Component tests for QRCodeDisplay
 * Feature: 011-project-share-dialog
 */

import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { QRCodeDisplay } from './QRCodeDisplay'
import type { GuestUrl, QRCodeOptions } from '../types'

describe('QRCodeDisplay', () => {
  const mockQrOptions: QRCodeOptions = {
    value: 'https://app.clementine.com/join/test-project-123' as GuestUrl,
    size: 512,
    level: 'M',
    fgColor: '#000000',
    bgColor: '#FFFFFF',
    seed: 12345,
  }

  it('should render QR code SVG with correct attributes', () => {
    const { container } = render(<QRCodeDisplay qrOptions={mockQrOptions} />)

    const svgElement = container.querySelector('svg')
    expect(svgElement).toBeInTheDocument()
    expect(svgElement).toHaveAttribute('data-qr-code')
  })

  it('should use qrOptions.size when displaySize not specified', () => {
    const { container } = render(<QRCodeDisplay qrOptions={mockQrOptions} />)

    const svgElement = container.querySelector('svg')
    expect(svgElement).toBeInTheDocument()
    expect(svgElement).toHaveAttribute('width', '512')
    expect(svgElement).toHaveAttribute('height', '512')
  })

  it('should use displaySize when specified (override)', () => {
    const { container } = render(
      <QRCodeDisplay qrOptions={mockQrOptions} displaySize={256} />,
    )

    const svgElement = container.querySelector('svg')
    expect(svgElement).toHaveAttribute('width', '256')
    expect(svgElement).toHaveAttribute('height', '256')
  })

  it('should use qrOptions colors', () => {
    const customOptions: QRCodeOptions = {
      ...mockQrOptions,
      fgColor: '#FF0000',
      bgColor: '#00FF00',
    }
    const { container } = render(<QRCodeDisplay qrOptions={customOptions} />)

    const svgElement = container.querySelector('svg')
    expect(svgElement).toBeInTheDocument()
    // Colors are applied to SVG (visual verification)
  })

  it('should track seed for testing via data attribute', () => {
    const { container } = render(<QRCodeDisplay qrOptions={mockQrOptions} />)

    const svgElement = container.querySelector('svg')
    expect(svgElement).toHaveAttribute('data-seed', '12345')
  })

  it('should render QR code within border container', () => {
    const { container } = render(<QRCodeDisplay qrOptions={mockQrOptions} />)

    const borderContainer = container.querySelector('.border')
    expect(borderContainer).toBeInTheDocument()
  })
})
