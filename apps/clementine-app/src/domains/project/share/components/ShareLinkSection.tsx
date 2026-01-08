/**
 * Share Link Section Component
 * Feature: 011-project-share-dialog
 */

import { Check, Copy } from 'lucide-react'
import { Button } from '@/ui-kit/ui/button'

export interface ShareLinkSectionProps {
  /**
   * Guest URL to display and copy
   */
  guestUrl: string

  /**
   * Callback when copy button clicked
   */
  onCopy: () => void

  /**
   * Whether copy operation succeeded
   */
  copySuccess: boolean

  /**
   * Whether copy operation is in progress
   */
  isCopying?: boolean
}

/**
 * Component for displaying and copying guest URL
 * Shows read-only input with copy button
 *
 * @param props - Component props
 * @returns ShareLinkSection component
 */
export function ShareLinkSection({
  guestUrl,
  onCopy,
  copySuccess,
  isCopying = false,
}: ShareLinkSectionProps) {
  return (
    <div className="space-y-2">
      <label htmlFor="guest-url" className="text-sm font-medium">
        Guest Link
      </label>
      <div className="flex gap-2">
        <input
          id="guest-url"
          type="text"
          value={guestUrl}
          readOnly
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          onClick={(e) => {
            // Select all text when input is clicked
            e.currentTarget.select()
          }}
        />
        <Button
          onClick={onCopy}
          variant="default"
          size="sm"
          disabled={isCopying}
          className="shrink-0"
          aria-label={copySuccess ? 'Link copied' : 'Copy link to clipboard'}
        >
          {copySuccess ? (
            <Check className="size-4" aria-hidden="true" />
          ) : (
            <Copy className="size-4" aria-hidden="true" />
          )}
          <span className="ml-2 hidden sm:inline">
            {copySuccess ? 'Copied!' : 'Copy Link'}
          </span>
        </Button>
      </div>
    </div>
  )
}
