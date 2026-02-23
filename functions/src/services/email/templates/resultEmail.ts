/**
 * Result Email Template
 *
 * HTML email template sent to guests with their AI-generated result.
 * Branches on media format: video shows thumbnail + "Watch Your Video" CTA,
 * image/gif embeds the result directly with "View & Download" CTA.
 */

interface ResultEmailTemplateParams {
  resultMediaUrl: string
  format: 'image' | 'gif' | 'video'
  thumbnailUrl: string | null
  resultPageUrl: string | null
}

/** Placeholder image for video emails when no thumbnail is available */
const VIDEO_PLACEHOLDER_URL =
  'https://storage.googleapis.com/clementine-prod.firebasestorage.app/static/video-placeholder.png'

export function resultEmailTemplate({
  resultMediaUrl,
  format,
  thumbnailUrl,
  resultPageUrl,
}: ResultEmailTemplateParams): string {
  const isVideo = format === 'video'
  const subheading = isVideo
    ? "Here's your AI-generated video"
    : "Here's your AI-generated image"
  const mediaSrc = isVideo
    ? (thumbnailUrl || VIDEO_PLACEHOLDER_URL)
    : resultMediaUrl
  const ctaText = isVideo ? 'Watch Your Video' : 'View &amp; Download'
  const ctaHref = isVideo ? (resultPageUrl || resultMediaUrl) : resultMediaUrl

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:32px 32px 24px;text-align:center;">
          <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#18181b;">Your result is ready!</h1>
          <p style="margin:0;font-size:15px;color:#71717a;">${subheading}</p>
        </td></tr>
        <tr><td style="padding:0 32px;">
          <img src="${mediaSrc}" alt="${isVideo ? 'Video preview' : 'Your AI result'}" style="width:100%;border-radius:8px;display:block;" />
        </td></tr>
        <tr><td style="padding:24px 32px;text-align:center;">
          <a href="${ctaHref}" target="_blank" style="display:inline-block;padding:12px 32px;background-color:#18181b;color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;">${ctaText}</a>
        </td></tr>
        <tr><td style="padding:16px 32px 32px;text-align:center;">
          <p style="margin:0;font-size:13px;color:#a1a1aa;">Powered by Clementine</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
