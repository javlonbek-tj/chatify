import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ENV } from '../../config/env';
import { AppError } from '../../utils/appError';
import User from '../user/user.model';
import Token from './token.model';
import type { RegisterInput, LoginInput } from './auth.schema';

export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
}

const REFRESH_TOKEN_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000;

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

export async function login(input: LoginInput) {
  const user = await User.findOne({ email: input.email });
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const passwordMatch = await bcrypt.compare(input.password, user.password);
  if (!passwordMatch) {
    throw new AppError('Invalid email or password', 401);
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
