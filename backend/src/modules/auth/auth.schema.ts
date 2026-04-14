import { z } from 'zod';

export const registerSchema = z.object({
  email: z.email('Invalid email').max(254, 'Email is too long'),
  fullName: z.string().trim().min(1, 'Full name is required').max(100, 'Full name is too long'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128, 'Password is too long'),
});

export const loginSchema = z.object({
  email: z.email('Invalid email').max(254, 'Email is too long'),
  password: z.string().min(1, 'Password is required').max(128, 'Password is too long'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
