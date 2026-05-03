import { Schema, model, Types } from 'mongoose';

const conversationSchema = new Schema(
  {
    participants: {
      type: [{ type: Types.ObjectId, ref: 'User' }],
      required: true,
      validate: {
        validator: (v: Types.ObjectId[]) => v.length >= 2,
        message: 'A conversation must have at least 2 participants',
      },
    },
    isGroup: {
      type: Boolean,
      default: false,
    },
    groupName: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    groupAvatar: {
      type: String,
      default: '',
    },
    groupAdmins: {
      type: [{ type: Types.ObjectId, ref: 'User' }],
      default: [],
    },
    lastMessage: {
      type: Types.ObjectId,
      ref: 'Message',
    },
    createdBy: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1 });

conversationSchema.index(
  { participants: 1, isGroup: 1 },
  {
    unique: false,
  }
);

const Conversation = model('Conversation', conversationSchema);

export default Conversation;
