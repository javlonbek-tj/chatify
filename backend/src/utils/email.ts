import nodemailer from 'nodemailer';
import { ENV } from '../config/env';

const transporter = nodemailer.createTransport({
  host: ENV.SMTP_HOST,
  port: Number(ENV.SMTP_PORT),
  auth: {
    user: ENV.SMTP_USER,
    pass: ENV.SMTP_PASSWORD,
  },
});

export async function sendPasswordResetEmail(to: string, resetToken: string) {
  const resetUrl = `${ENV.FRONTEND_URL}/reset-password/${resetToken}`;

  await transporter.sendMail({
    from: ENV.SMTP_FROM_EMAIL,
    to,
    subject: 'Password Reset Request (valid for 10 minutes)',
    html: `
      <p>You requested a password reset. Click the link below to set a new password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>If you did not request this, please ignore this email.</p>
    `,
  });
}
