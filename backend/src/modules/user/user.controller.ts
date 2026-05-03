import { Request, Response } from 'express';
import { AppError } from '../../utils/appError';
import * as userService from './user.service';
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  updatePasswordSchema,
  updateUserSchema,
} from './user.schema';

const COOKIE_NAME = 'refreshToken';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export async function getUsers(req: Request, res: Response) {
  const search = req.query.search as string | undefined;
  const users = await userService.getUsers(req.user!.userId, search);

  res.status(200).json({
    status: 'success',
    data: { users },
  });
}

export async function getMe(req: Request, res: Response) {
  const user = await userService.getMe(req.user!.userId);

  res.status(200).json({
    status: 'success',
    data: { user },
  });
}

export async function updateUser(req: Request, res: Response) {
  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(parsed.error.issues[0].message, 400);
  }

  const user = await userService.updateUser(req.user!.userId, parsed.data);

  res.status(200).json({
    status: 'success',
    data: { user },
  });
}

export async function forgotPassword(req: Request, res: Response) {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(parsed.error.issues[0].message, 400);
  }

  await userService.forgotPassword(parsed.data);

  // Always return the same response to prevent email enumeration
  res.status(200).json({
    status: 'success',
    message: 'If that email is registered, a reset link has been sent.',
  });
}

export async function resetPassword(req: Request, res: Response) {
  const token = req.params.token as string;
  if (!token) {
    throw new AppError('Reset token is missing', 400);
  }

  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(parsed.error.issues[0].message, 400);
  }

  await userService.resetPassword(token, parsed.data);

  res.status(200).json({
    status: 'success',
    message: 'Password reset successful. Please log in.',
  });
}

export async function updatePassword(req: Request, res: Response) {
  const parsed = updatePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(parsed.error.issues[0].message, 400);
  }

  const result = await userService.updatePassword(req.user!.userId, parsed.data);

  res.cookie(COOKIE_NAME, result.refreshToken, COOKIE_OPTIONS);

  res.status(200).json({
    status: 'success',
    accessToken: result.accessToken,
  });
}
