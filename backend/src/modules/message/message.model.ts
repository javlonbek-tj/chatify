import { Schema, model, Types } from 'mongoose';

const attachmentSchema = new Schema(
  {
    url: { type: String, required: true },
    name: { type: String, required: true },
    size: { type: Number, required: true }, // bytes
    mimeType: { type: String, required: true },
  },
  { _id: false }
);

const reactionSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true },
    emoji: { type: String, required: true, maxlength: 10 },
  },
  { _id: false }
);

const readBySchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true },
    readAt: { type: Date, required: true },
  },
  { _id: false }
);

const messageSchema = new Schema(
  {
    conversationId: {
      type: Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    senderId: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: '',
    },
    type: {
      type: String,
      enum: ['text', 'image', 'file'],
      default: 'text',
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
    },
    replyTo: {
      type: Types.ObjectId,
      ref: 'Message',
    },
    readBy: {
      type: [readBySchema],
      default: [],
    },
    reactions: {
      type: [reactionSchema],
      default: [],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedFor: {
      type: [{ type: Types.ObjectId, ref: 'User' }],
      default: [],
    },
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });

messageSchema.index({ senderId: 1 });

const Message = model('Message', messageSchema);

export default Message;
