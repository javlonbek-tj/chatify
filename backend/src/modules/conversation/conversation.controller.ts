import { Request, Response } from 'express';
import { AppError } from '../../utils/appError';
import * as conversationService from './conversation.service';
import {
  createConversationSchema,
  createGroupSchema,
  updateGroupSchema,
  addMembersSchema,
} from './conversation.schema';

export async function getOrCreateConversation(req: Request, res: Response) {
  const parsed = createConversationSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(parsed.error.issues[0].message, 400);

  const conversation = await conversationService.getOrCreateConversation(
    req.user!.userId,
    parsed.data,
  );

  res.status(200).json({ status: 'success', data: { conversation } });
}

export async function createGroup(req: Request, res: Response) {
  const parsed = createGroupSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(parsed.error.issues[0].message, 400);

  const conversation = await conversationService.createGroup(req.user!.userId, parsed.data);

  res.status(201).json({ status: 'success', data: { conversation } });
}

export async function getMyConversations(req: Request, res: Response) {
  const conversations = await conversationService.getMyConversations(req.user!.userId);

  res.status(200).json({ status: 'success', data: { conversations } });
}

export async function getConversationById(req: Request, res: Response) {
  const conversation = await conversationService.getConversationById(
    req.params.id as string,
    req.user!.userId,
  );

  res.status(200).json({ status: 'success', data: { conversation } });
}

export async function updateGroup(req: Request, res: Response) {
  const parsed = updateGroupSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(parsed.error.issues[0].message, 400);

  const conversation = await conversationService.updateGroup(
    req.params.id as string,
    req.user!.userId,
    parsed.data,
  );

  res.status(200).json({ status: 'success', data: { conversation } });
}

export async function addMembers(req: Request, res: Response) {
  const parsed = addMembersSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(parsed.error.issues[0].message, 400);

  const conversation = await conversationService.addMembers(
    req.params.id as string,
    req.user!.userId,
    parsed.data,
  );

  res.status(200).json({ status: 'success', data: { conversation } });
}

export async function removeMember(req: Request, res: Response) {
  const conversation = await conversationService.removeMember(
    req.params.id as string,
    req.user!.userId,
    req.params.userId as string,
  );

  res.status(200).json({ status: 'success', data: { conversation } });
}
