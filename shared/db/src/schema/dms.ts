import mongoose, { Schema, Document, Model } from 'mongoose'

// ─── DmConversation ──────────────────────────────────────────────────────────

export interface IDmConversation extends Document {
  _id: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const DmConversationSchema = new Schema<IDmConversation>({}, { timestamps: true })

DmConversationSchema.index({ updatedAt: -1 })

export const DmConversation: Model<IDmConversation> =
  mongoose.models.DmConversation ??
  mongoose.model<IDmConversation>('DmConversation', DmConversationSchema)

// ─── DmParticipant ───────────────────────────────────────────────────────────

export interface IDmParticipant extends Document {
  _id: mongoose.Types.ObjectId
  conversationId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  joinedAt: Date
}

const DmParticipantSchema = new Schema<IDmParticipant>({
  conversationId: {
    type: Schema.Types.ObjectId,
    ref: 'DmConversation',
    required: true,
    index: true,
  },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  joinedAt: { type: Date, default: Date.now },
})

DmParticipantSchema.index({ conversationId: 1, userId: 1 }, { unique: true })

export const DmParticipant: Model<IDmParticipant> =
  mongoose.models.DmParticipant ??
  mongoose.model<IDmParticipant>('DmParticipant', DmParticipantSchema)

// ─── DmMessage ───────────────────────────────────────────────────────────────

export interface IDmMessage extends Document {
  _id: mongoose.Types.ObjectId
  conversationId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  content: string
  type: 'text' | 'file'
  attachmentUrl?: string | null
  attachmentName?: string | null
  attachmentMime?: string | null
  replyToId?: mongoose.Types.ObjectId | null
  editedAt?: Date | null
  isDeleted: boolean
  createdAt: Date
  updatedAt: Date
}

const DmMessageSchema = new Schema<IDmMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'DmConversation',
      required: true,
      index: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String, required: true },
    type: { type: String, enum: ['text', 'file'], default: 'text' },
    attachmentUrl: { type: String, default: null },
    attachmentName: { type: String, default: null },
    attachmentMime: { type: String, default: null },
    replyToId: { type: Schema.Types.ObjectId, ref: 'DmMessage', default: null },
    editedAt: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
)

DmMessageSchema.index({ conversationId: 1, createdAt: -1 })

export const DmMessage: Model<IDmMessage> =
  mongoose.models.DmMessage ?? mongoose.model<IDmMessage>('DmMessage', DmMessageSchema)
