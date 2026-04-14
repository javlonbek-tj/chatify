import { Router } from 'express';
import * as userController from './user.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

// POST /api/users/forgot-password
router.post('/forgot-password', userController.forgotPassword);

// PATCH /api/users/reset-password/:token
router.patch('/reset-password/:token', userController.resetPassword);

// PATCH /api/users/update-password — protected
router.patch('/update-password', authenticate, userController.updatePassword);

export default router;
