import { Router } from 'express';
import * as messageController from './message.controller';
import { upload } from '../../middleware/upload.middleware';

// mergeParams lets us access :conversationId from parent router
const router = Router({ mergeParams: true });

// GET  /api/conversations/:conversationId/messages
router.get('/', messageController.getMessages);

// POST /api/conversations/:conversationId/messages
// files field — max 5 files per message
router.post('/', upload.array('files', 5), messageController.sendMessage);

// PATCH /api/conversations/:conversationId/read
router.patch('/read', messageController.markAsRead);

// POST /api/messages/:messageId/reactions
router.post('/:messageId/reactions', messageController.toggleReaction);

// DELETE /api/messages/:messageId
router.delete('/:messageId', messageController.deleteMessage);

export default router;
