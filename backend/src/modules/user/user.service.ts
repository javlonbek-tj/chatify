import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { AppError } from '../../utils/appError';
import { sendPasswordResetEmail } from '../../utils/email';
import User from './user.model';
import Token from '../auth/token.model';
import {
  signAccessToken,
  signRefreshToken,
} from '../auth/auth.service';
import type {
  ForgotPasswordInput,
  ResetPasswordInput,
  UpdatePasswordInput,
} from './user.schema';

const RESET_TOKEN_EXPIRES_MS = 10 * 60 * 1000; // 10 minutes
const REFRESH_TOKEN_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000;

export async function forgotPassword(input: ForgotPasswordInput) {
  const user = await User.findOne({ email: input.email });

  // Always respond with success to avoid email enumeration
  if (!user) return;

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = new Date(Date.now() + RESET_TOKEN_EXPIRES_MS);
  await user.save();

  await sendPasswordResetEmail(user.email, resetToken);
}

export async function resetPassword(token: string, input: ResetPasswordInput) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  });

  if (!user) {
    throw new AppError('Token is invalid or has expired', 400);
  }

  user.password = await bcrypt.hash(input.password, 10);
  user.passwordChangedAt = new Date();
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Invalidate all existing refresh tokens
  await Token.deleteMany({ userId: user._id });
}

export async function updatePassword(userId: string, input: UpdatePasswordInput) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const passwordMatch = await bcrypt.compare(input.currentPassword, user.password);
  if (!passwordMatch) {
    throw new AppError('Current password is incorrect', 401);
  }

  user.password = await bcrypt.hash(input.newPassword, 10);
  user.passwordChangedAt = new Date();
  await user.save();

  // Invalidate all existing refresh tokens and issue fresh ones
  await Token.deleteMany({ userId: user._id });

  const payload = { userId: user._id.toString(), email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await Token.create({
    userId: user._id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS),
  });

  return { accessToken, refreshToken };
}
