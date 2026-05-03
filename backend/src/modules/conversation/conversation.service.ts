import { Types } from 'mongoose';
import { AppError } from '../../utils/appError';
import Conversation from './conversation.model';
import type {
  CreateConversationInput,
  CreateGroupInput,
  UpdateGroupInput,
  AddMembersInput,
} from './conversation.schema';

export async function getOrCreateConversation(
  userId: string,
  input: CreateConversationInput
) {
  const participantId = new Types.ObjectId(input.participantId);
  const currentUserId = new Types.ObjectId(userId);

  if (currentUserId.equals(participantId)) {
    throw new AppError('You cannot start a conversation with yourself', 400);
  }

  const existing = await Conversation.findOne({
    isGroup: false,
    participants: { $all: [currentUserId, participantId], $size: 2 },
  })
    .populate('participants', 'fullName profilePic')
    .populate('lastMessage');

  if (existing) return existing;

  const conversation = await Conversation.create({
    participants: [currentUserId, participantId],
    isGroup: false,
    createdBy: currentUserId,
  });

  return conversation.populate('participants', 'fullName profilePic');
}

export async function createGroup(userId: string, input: CreateGroupInput) {
  const creatorId = new Types.ObjectId(userId);
  const memberIds = input.participantIds.map((id) => new Types.ObjectId(id));

  const allParticipants = [creatorId, ...memberIds];
  const uniqueParticipants = [
    ...new Map(allParticipants.map((id) => [id.toString(), id])).values(),
  ];

  if (uniqueParticipants.length < 3) {
    throw new AppError(
      'A group must have at least 3 participants including you',
      400
    );
  }

  const conversation = await Conversation.create({
    participants: uniqueParticipants,
    isGroup: true,
    groupName: input.groupName,
    groupAvatar: input.groupAvatar ?? '',
    groupAdmins: [creatorId],
    createdBy: creatorId,
  });

  return conversation.populate('participants', 'fullName profilePic');
}

export async function getMyConversations(userId: string) {
  return Conversation.find({ participants: new Types.ObjectId(userId) })
    .populate('participants', 'fullName profilePic')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });
}

export async function getConversationById(
  conversationId: string,
  userId: string
) {
  const conversation = await Conversation.findOne({
    _id: new Types.ObjectId(conversationId),
    participants: new Types.ObjectId(userId),
  })
    .populate('participants', 'fullName profilePic')
    .populate('lastMessage');

  if (!conversation) {
    throw new AppError('Conversation not found', 404);
  }

  return conversation;
}

export async function updateGroup(
  conversationId: string,
  userId: string,
  input: UpdateGroupInput
) {
  const conversation = await Conversation.findById(conversationId);

  if (!conversation) throw new AppError('Conversation not found', 404);
  if (!conversation.isGroup)
    throw new AppError('This is not a group conversation', 400);

  const isAdmin = conversation.groupAdmins?.some((id) =>
    id.equals(new Types.ObjectId(userId))
  );
  if (!isAdmin)
    throw new AppError('Only group admins can update group info', 403);

  if (input.groupName) conversation.groupName = input.groupName;
  if (input.groupAvatar) conversation.groupAvatar = input.groupAvatar;

  await conversation.save();
  return conversation.populate('participants', 'fullName profilePic');
}

export async function addMembers(
  conversationId: string,
  userId: string,
  input: AddMembersInput
) {
  const conversation = await Conversation.findById(conversationId);

  if (!conversation) throw new AppError('Conversation not found', 404);
  if (!conversation.isGroup)
    throw new AppError('Cannot add members to a 1-on-1 conversation', 400);

  const isAdmin = conversation.groupAdmins?.some((id) =>
    id.equals(new Types.ObjectId(userId))
  );
  if (!isAdmin) throw new AppError('Only group admins can add members', 403);

  const newMemberIds = input.userIds.map((id) => new Types.ObjectId(id));
  const existingIds = conversation.participants.map((id) => id.toString());
  const toAdd = newMemberIds.filter(
    (id) => !existingIds.includes(id.toString())
  );

  if (toAdd.length === 0)
    throw new AppError('All users are already in this group', 400);

  conversation.participants.push(...toAdd);
  await conversation.save();

  return conversation.populate('participants', 'fullName profilePic');
}

export async function removeMember(
  conversationId: string,
  adminId: string,
  targetUserId: string
) {
  const conversation = await Conversation.findById(conversationId);

  if (!conversation) throw new AppError('Conversation not found', 404);
  if (!conversation.isGroup)
    throw new AppError('Cannot remove members from a 1-on-1 conversation', 400);

  const isAdmin = conversation.groupAdmins?.some((id) =>
    id.equals(new Types.ObjectId(adminId))
  );

  const isSelf = adminId === targetUserId;

  if (!isAdmin && !isSelf)
    throw new AppError('Only group admins can remove members', 403);

  conversation.participants = conversation.participants.filter(
    (id) => !id.equals(new Types.ObjectId(targetUserId))
  );

  if (conversation.groupAdmins) {
    conversation.groupAdmins = conversation.groupAdmins.filter(
      (id) => !id.equals(new Types.ObjectId(targetUserId))
    );
  }

  await conversation.save();
  return conversation.populate('participants', 'fullName profilePic');
}
