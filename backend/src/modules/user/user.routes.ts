import { Router } from 'express';
import * as userController from './user.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

// POST /api/users/forgot-password
router.post('/forgot-password', userController.forgotPassword);

// PATCH /api/users/reset-password/:token
router.patch('/reset-password/:token', userController.resetPassword);

// GET /api/users?search=Jasur — protected
router.get('/', authenticate, userController.getUsers);

// GET /api/users/me — protected
router.get('/me', authenticate, userController.getMe);

// PATCH /api/users/me — protected
router.patch('/me', authenticate, userController.updateUser);

// PATCH /api/users/update-password — protected
router.patch('/update-password', authenticate, userController.updatePassword);

export default router;
