import { Resend } from 'resend';
import { ENV } from '../config/env';

const resend = new Resend(ENV.RESEND_API_KEY);

export async function sendOtpEmail(to: string, otp: string) {
  await resend.emails.send({
    from: ENV.RESEND_FROM_EMAIL,
    to,
    subject: 'Your verification code',
    html: `
      <p>Your Chatify verification code is:</p>
      <h2 style="letter-spacing: 4px;">${otp}</h2>
      <p>This code expires in 10 minutes. Do not share it with anyone.</p>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, resetToken: string) {
  const resetUrl = `${ENV.FRONTEND_URL}/reset-password/${resetToken}`;

  await resend.emails.send({
    from: ENV.RESEND_FROM_EMAIL,
    to,
    subject: 'Password reset request (valid for 10 minutes)',
    html: `
      <p>You requested a password reset. Click the link below to set a new password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>If you did not request this, please ignore this email.</p>
    `,
  });
}
