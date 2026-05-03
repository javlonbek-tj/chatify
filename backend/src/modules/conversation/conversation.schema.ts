import { z } from 'zod';

export const createConversationSchema = z.object({
  participantId: z.string().min(1, 'Participant ID is required'),
});

export const createGroupSchema = z.object({
  participantIds: z.array(z.string()).min(2, 'A group must have at least 2 other participants'),
  groupName: z.string().trim().min(1, 'Group name is required').max(100, 'Group name is too long'),
  groupAvatar: z.url('Invalid group avatar URL').optional(),
});

export const updateGroupSchema = z.object({
  groupName: z.string().trim().min(1).max(100).optional(),
  groupAvatar: z.url('Invalid URL').optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'At least one field must be provided' });

export const addMembersSchema = z.object({
  userIds: z.array(z.string()).min(1, 'At least one user ID is required'),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
export type AddMembersInput = z.infer<typeof addMembersSchema>;
