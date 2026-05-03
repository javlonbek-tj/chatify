import { Types } from 'mongoose';
import { AppError } from '../../utils/appError';
import { uploadToCloudinary, type UploadResult } from '../../config/cloudinary';
import Message from './message.model';
import Conversation from '../conversation/conversation.model';
import type {
  SendMessageInput,
  ReactionInput,
  DeleteMessageInput,
} from './message.schema';

const PAGE_SIZE = 30;

export async function sendMessage(
  conversationId: string,
  senderId: string,
  input: SendMessageInput,
  files: Express.Multer.File[] = []
) {
  const conversation = await Conversation.findOne({
    _id: new Types.ObjectId(conversationId),
    participants: new Types.ObjectId(senderId),
  });

  if (!conversation) throw new AppError('Conversation not found', 404);

  if (!input.content?.trim() && files.length === 0) {
    throw new AppError('Message must have content or at least one file', 400);
  }

  let attachments: UploadResult[] = [];
  let type = input.type;

  if (files.length > 0) {
    attachments = await Promise.all(
      files.map((f) => uploadToCloudinary(f.buffer, f.originalname, f.mimetype))
    );
    type = files[0].mimetype.startsWith('image/') ? 'image' : 'file';
  }

  const message = await Message.create({
    conversationId: new Types.ObjectId(conversationId),
    senderId: new Types.ObjectId(senderId),
    content: input.content ?? '',
    type,
    attachments,
    replyTo: input.replyTo ? new Types.ObjectId(input.replyTo) : undefined,
  });

  conversation.lastMessage = message._id;
  await conversation.save();

  return message.populate('senderId', 'fullName profilePic');
}

export async function getMessages(
  conversationId: string,
  userId: string,
  page: number
) {
  const conversation = await Conversation.findOne({
    _id: new Types.ObjectId(conversationId),
    participants: new Types.ObjectId(userId),
  });

  if (!conversation) throw new AppError('Conversation not found', 404);

  const userObjectId = new Types.ObjectId(userId);

  const messages = await Message.find({
    conversationId: new Types.ObjectId(conversationId),
    deletedFor: { $ne: userObjectId },
  })
    .sort({ createdAt: -1 })
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .populate('senderId', 'fullName profilePic')
    .populate('replyTo', 'content type senderId');

  return messages.reverse();
}

export async function markAsRead(conversationId: string, userId: string) {
  const userObjectId = new Types.ObjectId(userId);

  await Message.updateMany(
    {
      conversationId: new Types.ObjectId(conversationId),
      'readBy.userId': { $ne: userObjectId },
      senderId: { $ne: userObjectId },
      isDeleted: false,
    },
    {
      $push: { readBy: { userId: userObjectId, readAt: new Date() } },
    }
  );
}

export async function toggleReaction(
  messageId: string,
  userId: string,
  input: ReactionInput
) {
  const message = await Message.findById(messageId);
  if (!message) throw new AppError('Message not found', 404);
  if (message.isDeleted)
    throw new AppError('Cannot react to a deleted message', 400);

  const userObjectId = new Types.ObjectId(userId);
  const existingIndex = message.reactions.findIndex((r) =>
    r.userId.equals(userObjectId)
  );

  if (existingIndex !== -1) {
    const isSameEmoji = message.reactions[existingIndex].emoji === input.emoji;

    if (isSameEmoji) {
      message.reactions.splice(existingIndex, 1);
    } else {
      message.reactions[existingIndex].emoji = input.emoji;
    }
  } else {
    message.reactions.push({ userId: userObjectId, emoji: input.emoji });
  }

  await message.save();
  return message;
}

export async function deleteMessage(
  messageId: string,
  userId: string,
  input: DeleteMessageInput
) {
  const message = await Message.findById(messageId);
  if (!message) throw new AppError('Message not found', 404);

  const userObjectId = new Types.ObjectId(userId);

  if (input.deleteFor === 'everyone') {
    if (!message.senderId.equals(userObjectId)) {
      throw new AppError(
        'You can only delete your own messages for everyone',
        403
      );
    }
    message.isDeleted = true;
    message.content = '';
    message.attachments.splice(0);
  } else {
    const alreadyDeleted = message.deletedFor.some((id) =>
      id.equals(userObjectId)
    );
    if (!alreadyDeleted) {
      message.deletedFor.push(userObjectId);
    }
  }

  await message.save();
  return message;
}
