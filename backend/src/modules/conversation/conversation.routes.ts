import { Router } from 'express';
import * as conversationController from './conversation.controller';
import { authenticate } from '../../middleware/auth.middleware';
import messageRouter from '../message/message.routes';

const router = Router();

router.use(authenticate);

// POST /api/conversations
router.post('/', conversationController.getOrCreateConversation);

// POST /api/conversations/group
router.post('/group', conversationController.createGroup);

// GET /api/conversations
router.get('/', conversationController.getMyConversations);

// GET /api/conversations/:id
router.get('/:id', conversationController.getConversationById);

// PATCH /api/conversations/:id
router.patch('/:id', conversationController.updateGroup);

// POST /api/conversations/:id/members
router.post('/:id/members', conversationController.addMembers);

// DELETE /api/conversations/:id/members/:userId
router.delete('/:id/members/:userId', conversationController.removeMember);

// Nest message routes under conversations
router.use('/:conversationId/messages', messageRouter);

export default router;
