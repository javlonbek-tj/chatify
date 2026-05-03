import { Request, Response } from 'express';
import { AppError } from '../../utils/appError';
import * as messageService from './message.service';
import { sendMessageSchema, reactionSchema, deleteMessageSchema } from './message.schema';

export async function sendMessage(req: Request, res: Response) {
  const parsed = sendMessageSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(parsed.error.issues[0].message, 400);

  const files = Array.isArray(req.files)
    ? req.files
    : Object.values(req.files ?? {}).flat();

  const message = await messageService.sendMessage(
    req.params.conversationId as string,
    req.user!.userId,
    parsed.data,
    files,
  );

  res.status(201).json({ status: 'success', data: { message } });
}

export async function getMessages(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query.page) || 1);

  const messages = await messageService.getMessages(
    req.params.conversationId as string,
    req.user!.userId,
    page,
  );

  res.status(200).json({ status: 'success', data: { messages } });
}

export async function markAsRead(req: Request, res: Response) {
  await messageService.markAsRead(req.params.conversationId as string, req.user!.userId);

  res.status(200).json({ status: 'success', message: 'Marked as read' });
}

export async function toggleReaction(req: Request, res: Response) {
  const parsed = reactionSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(parsed.error.issues[0].message, 400);

  const message = await messageService.toggleReaction(
    req.params.messageId as string,
    req.user!.userId,
    parsed.data,
  );

  res.status(200).json({ status: 'success', data: { message } });
}

export async function deleteMessage(req: Request, res: Response) {
  const parsed = deleteMessageSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(parsed.error.issues[0].message, 400);

  const message = await messageService.deleteMessage(
    req.params.messageId as string,
    req.user!.userId,
    parsed.data,
  );

  res.status(200).json({ status: 'success', data: { message } });
}
