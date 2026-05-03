import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ENV } from '../../config/env';
import { AppError } from '../../utils/appError';
import { sendOtpEmail } from '../../utils/email';
import User from '../user/user.model';
import Token from './token.model';
import Otp from './otp.model';
import type { RegisterInput, LoginInput, VerifyOtpInput, ResendOtpInput } from './auth.schema';

export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
}

const REFRESH_TOKEN_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000;
const OTP_EXPIRES_MS = 10 * 60 * 1000;

export function signAccessToken(payload: Omit<JwtPayload, 'iat'>): string {
  return jwt.sign(payload, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_ACCESS_TOKEN_EXPIRY as jwt.SignOptions['expiresIn'],
  });
}

export function signRefreshToken(payload: Omit<JwtPayload, 'iat'>): string {
  return jwt.sign(payload, ENV.JWT_REFRESH_SECRET, {
    expiresIn: ENV.JWT_REFRESH_TOKEN_EXPIRY as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, ENV.JWT_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, ENV.JWT_REFRESH_SECRET) as JwtPayload;
}

async function generateAndSendOtp(userId: string, email: string) {
  const otp = crypto.randomInt(100000, 999999).toString();
  const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

  await Otp.findOneAndUpdate(
    { userId },
    { otpHash, expiresAt: new Date(Date.now() + OTP_EXPIRES_MS) },
    { upsert: true },
  );

  await sendOtpEmail(email, otp);
}

export async function register(input: RegisterInput) {
  const existing = await User.findOne({ email: input.email });
  if (existing) {
    throw new AppError('Email already in use', 409);
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = await User.create({
    email: input.email,
    fullName: input.fullName,
    password: passwordHash,
  });

  await generateAndSendOtp(user._id.toString(), user.email);
}

export async function verifyOtp(input: VerifyOtpInput) {
  const user = await User.findOne({ email: input.email });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.isVerified) {
    throw new AppError('Email is already verified', 400);
  }

  const otpHash = crypto.createHash('sha256').update(input.otp).digest('hex');
  const stored = await Otp.findOne({ userId: user._id });

  if (!stored || stored.otpHash !== otpHash) {
    throw new AppError('Invalid OTP', 400);
  }

  if (stored.expiresAt < new Date()) {
    await Otp.deleteOne({ userId: user._id });
    throw new AppError('OTP has expired', 400);
  }

  user.isVerified = true;
  await user.save();
  await Otp.deleteOne({ userId: user._id });

  const payload = { userId: user._id.toString(), email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await Token.create({
    userId: user._id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS),
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      profilePic: user.profilePic,
    },
  };
}

export async function resendOtp(input: ResendOtpInput) {
  const user = await User.findOne({ email: input.email });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.isVerified) {
    throw new AppError('Email is already verified', 400);
  }

  await generateAndSendOtp(user._id.toString(), user.email);
}

export async function login(input: LoginInput) {
  const user = await User.findOne({ email: input.email });
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const passwordMatch = await bcrypt.compare(input.password, user.password);
  if (!passwordMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.isVerified) {
    throw new AppError('Please verify your email before logging in', 403);
  }

  const payload = { userId: user._id.toString(), email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await Token.create({
    userId: user._id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS),
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      profilePic: user.profilePic,
    },
  };
}

export async function refresh(token: string) {
  let payload: JwtPayload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const stored = await Token.findOne({ token });
  if (!stored) {
    throw new AppError('Refresh token not found', 401);
  }

  if (stored.expiresAt < new Date()) {
    await Token.deleteOne({ token });
    throw new AppError('Refresh token expired', 401);
  }

  const accessToken = signAccessToken({
    userId: payload.userId,
    email: payload.email,
  });

  return { accessToken };
}

export async function logout(token: string) {
  await Token.deleteOne({ token });
}

export async function logoutAll(userId: string) {
  await Token.deleteMany({ userId });
}
