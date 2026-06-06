import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IMessageReaction extends Document {
  _id: mongoose.Types.ObjectId
  messageId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  emoji: string
  createdAt: Date
}

const MessageReactionSchema = new Schema<IMessageReaction>(
  {
    messageId: { type: Schema.Types.ObjectId, ref: 'Message', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    emoji: { type: String, required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

MessageReactionSchema.index({ messageId: 1, userId: 1, emoji: 1 }, { unique: true })

export const MessageReaction: Model<IMessageReaction> =
  mongoose.models.MessageReaction ??
  mongoose.model<IMessageReaction>('MessageReaction', MessageReactionSchema)
