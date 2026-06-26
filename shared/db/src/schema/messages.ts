import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId
  roomId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  content: string
  type: 'text' | 'system' | 'file'
  replyToId?: mongoose.Types.ObjectId | null
  editedAt?: Date | null
  isDeleted: boolean
  attachmentUrl?: string | null
  attachmentName?: string | null
  attachmentMime?: string | null
  createdAt: Date
  updatedAt: Date
}

const MessageSchema = new Schema<IMessage>(
  {
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String, required: true, maxlength: 10000 },
    type: { type: String, enum: ['text', 'system', 'file'], default: 'text' },
    replyToId: { type: Schema.Types.ObjectId, ref: 'Message', default: null, index: true },
    editedAt: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false },
    attachmentUrl: { type: String, default: null, maxlength: 2048 },
    attachmentName: { type: String, default: null, maxlength: 512 },
    attachmentMime: { type: String, default: null, maxlength: 64 },
  },
  { timestamps: true }
)

MessageSchema.index({ roomId: 1, createdAt: -1 })
MessageSchema.index({ roomId: 1, type: 1, createdAt: -1 }, { name: 'msg_type_timeline' })
MessageSchema.index(
  { roomId: 1, isDeleted: 1, type: 1, createdAt: -1 },
  { name: 'msg_filtered_search' }
)
MessageSchema.index({ userId: 1, isDeleted: 1, createdAt: -1 }, { name: 'msg_user_stats' })

export const Message: Model<IMessage> =
  mongoose.models.Message ?? mongoose.model<IMessage>('Message', MessageSchema)
