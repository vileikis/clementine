/**
 * useShareActions Hook
 *
 * Handles share platform actions including download and social sharing.
 * Uses Firebase Storage SDK's getBlob() to bypass CORS restrictions.
 */
import { toast } from 'sonner'
import * as Sentry from '@sentry/tanstackstart-react'
import { getBlob, ref } from 'firebase/storage'
import type { MediaReference, ShareOptionsConfig } from '@clementine/shared'
import { storage } from '@/integrations/firebase/client'

export interface UseShareActionsParams {
  /** Media reference containing filePath for Firebase Storage download */
  media: MediaReference | null
}

// Platform labels for user-facing messages
const PLATFORM_LABELS: Record<keyof ShareOptionsConfig, string> = {
  download: 'Download',
  copyLink: 'Copy Link',
  email: 'Email',
  instagram: 'Instagram',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  twitter: 'Twitter',
  tiktok: 'TikTok',
  telegram: 'Telegram',
}

/**
 * Hook for handling share platform actions
 *
 * @param params - Configuration parameters
 * @returns Share action handler
 */
export function useShareActions({ media }: UseShareActionsParams) {
  /**
   * Handle image download using Firebase Storage SDK.
   * Uses getBlob() to bypass CORS restrictions.
   * On mobile devices (iOS/Android), opens the native share sheet.
   * On desktop, triggers a file download.
   */
  const handleDownload = async () => {
    if (!media?.filePath) {
      toast.error('No image available to download')
      return
    }

    try {
      const storageRef = ref(storage, media.filePath)
      const blob = await getBlob(storageRef)
      // TODO: magic value "clementine-result" should be a constant
      const fileName = `clementine-result-${Date.now()}.jpg`

      const result = await openWebShare(blob, fileName)
      if (result === 'shared') {
        toast.success('Shared successfully')
        return
      }

      if (result === 'unavailable') {
        downloadFromLink(blob, fileName)
        toast.success('Image downloaded successfully')
      }
    } catch (error) {
      toast.error('Failed to download image')
      Sentry.captureException(error, {
        tags: {
          domain: 'guest',
          action: 'download-media',
        },
        extra: {
          errorType: 'download-failure',
          mediaAssetId: media?.mediaAssetId,
          filePath: media?.filePath,
        },
      })
    }
  }

  /**
   * Handle copy link action
   */
  const handleCopyLink = () => {
    // TODO: Implement copy link functionality
    toast.info(`${PLATFORM_LABELS.copyLink} sharing not supported yet`)
  }

  /**
   * Handle email share action
   */
  const handleEmail = () => {
    // TODO: Implement email share functionality
    toast.info(`${PLATFORM_LABELS.email} sharing not supported yet`)
  }

  /**
   * Handle social media share action
   */
  const handleSocialShare = (platform: keyof ShareOptionsConfig) => {
    // TODO: Implement social media share functionality
    toast.info(`${PLATFORM_LABELS[platform]} sharing not supported yet`)
  }

  /**
   * Main share handler that routes to appropriate action
   */
  const handleShare = async (platform: keyof ShareOptionsConfig) => {
    switch (platform) {
      case 'download':
        await handleDownload()
        break

      case 'copyLink':
        handleCopyLink()
        break

      case 'email':
        handleEmail()
        break

      case 'instagram':
      case 'facebook':
      case 'linkedin':
      case 'twitter':
      case 'tiktok':
      case 'telegram':
        handleSocialShare(platform)
        break

      default: {
        // Exhaustive check ensures all platforms are handled
        const exhaustiveCheck: never = platform
        return exhaustiveCheck
      }
    }
  }

  return { handleShare }
}

type ShareResult = 'shared' | 'unavailable' | 'cancelled'

function isMobileOS(): boolean {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
}

/**
 * Attempts to open native share sheet on mobile devices.
 * Only works on iOS and Android.
 */
async function openWebShare(
  blob: Blob,
  fileName: string,
): Promise<ShareResult> {
  if (!isMobileOS()) {
    return 'unavailable'
  }

  const file = new File([blob], fileName, {
    type: blob.type || 'image/jpeg',
  })

  if (!navigator.canShare?.({ files: [file] })) {
    return 'unavailable'
  }

  try {
    await navigator.share({ files: [file] })
    return 'shared'
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return 'cancelled'
    }
    throw error
  }
}

/**
 * Downloads a blob as a file using an anchor element.
 */
function downloadFromLink(blob: Blob, fileName: string): void {
  const blobUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(blobUrl)
}
