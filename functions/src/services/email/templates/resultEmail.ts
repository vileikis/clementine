/**
 * Result Email Template
 *
 * HTML email template sent to guests with their AI-generated result.
 */

interface ResultEmailTemplateParams {
  resultMediaUrl: string
}

export function resultEmailTemplate({
  resultMediaUrl,
}: ResultEmailTemplateParams): string {
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
          <p style="margin:0;font-size:15px;color:#71717a;">Here's your AI-generated photo</p>
        </td></tr>
        <tr><td style="padding:0 32px;">
          <img src="${resultMediaUrl}" alt="Your AI result" style="width:100%;border-radius:8px;display:block;" />
        </td></tr>
        <tr><td style="padding:24px 32px;text-align:center;">
          <a href="${resultMediaUrl}" target="_blank" style="display:inline-block;padding:12px 32px;background-color:#18181b;color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;">View &amp; Download</a>
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
