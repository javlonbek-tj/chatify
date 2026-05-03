import { z } from 'zod';

export const sendMessageSchema = z.object({
  content: z.string().trim().max(5000).optional(),
  type: z.enum(['text', 'image', 'file']).default('text'),
  replyTo: z.string().optional(),
}).refine(
  (d) => d.type === 'text' ? (d.content && d.content.length > 0) : true,
  { message: 'Content is required for text messages' },
);

export const reactionSchema = z.object({
  emoji: z.string().min(1).max(10, 'Emoji is too long'),
});

export const deleteMessageSchema = z.object({
  deleteFor: z.enum(['me', 'everyone']),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type ReactionInput = z.infer<typeof reactionSchema>;
export type DeleteMessageInput = z.infer<typeof deleteMessageSchema>;
