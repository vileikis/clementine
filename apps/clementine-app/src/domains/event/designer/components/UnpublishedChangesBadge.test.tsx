import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { UnpublishedChangesBadge } from './UnpublishedChangesBadge'

describe('UnpublishedChangesBadge', () => {
  it('should show badge when never published (publishedVersion is null)', () => {
    render(<UnpublishedChangesBadge draftVersion={1} publishedVersion={null} />)

    expect(screen.getByText('New changes')).toBeTruthy()
  })

  it('should show badge when draft version > published version', () => {
    render(<UnpublishedChangesBadge draftVersion={5} publishedVersion={3} />)

    expect(screen.getByText('New changes')).toBeTruthy()
  })

  it('should hide badge when draft version === published version', () => {
    const { container } = render(
      <UnpublishedChangesBadge draftVersion={3} publishedVersion={3} />,
    )

    expect(container.firstChild).toBeNull()
  })

  it('should hide badge when draft version < published version', () => {
    const { container } = render(
      <UnpublishedChangesBadge draftVersion={2} publishedVersion={5} />,
    )

    expect(container.firstChild).toBeNull()
  })

  it('should show badge when both versions are null (never published)', () => {
    render(
      <UnpublishedChangesBadge draftVersion={null} publishedVersion={null} />,
    )

    // When never published, should show badge
    expect(screen.getByText('New changes')).toBeTruthy()
  })

  it('should hide badge when draft is null but published exists', () => {
    const { container } = render(
      <UnpublishedChangesBadge draftVersion={null} publishedVersion={1} />,
    )

    expect(container.firstChild).toBeNull()
  })

  it('should have correct styling classes', () => {
    const { container } = render(
      <UnpublishedChangesBadge draftVersion={2} publishedVersion={1} />,
    )

    const badge = container.firstChild as HTMLElement
    expect(badge.className).toContain('rounded-full')
    expect(badge.className).toContain('bg-yellow-50')
    expect(badge.className).toContain('dark:bg-yellow-950')
  })

  it('should render yellow dot indicator', () => {
    const { container } = render(
      <UnpublishedChangesBadge draftVersion={2} publishedVersion={1} />,
    )

    const dot = container.querySelector('.bg-yellow-500')
    expect(dot).toBeTruthy()
    expect(dot?.className).toContain('h-2 w-2 rounded-full')
  })
})
