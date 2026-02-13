/**
 * Email Service
 *
 * Sends result emails to guests via Nodemailer + Google Workspace SMTP.
 * Transporter is created lazily to avoid cold-start overhead.
 *
 * See contracts/send-result-email.yaml (UT-001)
 */
import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import { SMTP_APP_PASSWORD } from '../../infra/params'
import { resultEmailTemplate } from './templates/resultEmail'

let transporter: Transporter | null = null

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'info@clementine-labs.com',
        pass: SMTP_APP_PASSWORD.value(),
      },
    })
  }
  return transporter
}

interface SendResultEmailParams {
  guestEmail: string
  resultMediaUrl: string
}

/**
 * Send a result email to a guest with the AI-generated result.
 *
 * @throws Error on SMTP failure
 */
export async function sendResultEmail({
  guestEmail,
  resultMediaUrl,
}: SendResultEmailParams): Promise<void> {
  const html = resultEmailTemplate({ resultMediaUrl })

  await getTransporter().sendMail({
    from: '"Clementine" <info@clementine-labs.com>',
    to: guestEmail,
    subject: 'Your result is ready!',
    html,
  })
}
