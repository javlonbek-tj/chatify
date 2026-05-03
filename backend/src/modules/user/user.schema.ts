import { z } from 'zod';

export const forgotPasswordSchema = z.object({
  email: z.email('Invalid email').max(254, 'Email is too long'),
});

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password is too long'),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password is too long'),
});

export const updateUserSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100, 'Full name is too long').optional(),
  profilePic: z.url('Invalid profile picture URL').optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided',
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
