import mongoose, { Schema, Document, Model } from 'mongoose'

// ─── Room ────────────────────────────────────────────────────────────────────

export interface IRoom extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  inviteCode: string
  ownerId: mongoose.Types.ObjectId
  quality: '360p' | '480p' | '720p' | '1080p' | '1440p'
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const RoomSchema = new Schema<IRoom>(
  {
    name: { type: String, required: true },
    inviteCode: { type: String, required: true, unique: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    quality: {
      type: String,
      enum: ['360p', '480p', '720p', '1080p', '1440p'],
      default: '1080p',
    },
    isActive: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
)

export const Room: Model<IRoom> = mongoose.models.Room ?? mongoose.model<IRoom>('Room', RoomSchema)

// ─── RoomMember ──────────────────────────────────────────────────────────────

export interface IRoomMember extends Document {
  _id: mongoose.Types.ObjectId
  roomId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  joinedAt: Date
}

const RoomMemberSchema = new Schema<IRoomMember>({
  roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  joinedAt: { type: Date, default: Date.now },
})

RoomMemberSchema.index({ roomId: 1, userId: 1 }, { unique: true })

export const RoomMember: Model<IRoomMember> =
  mongoose.models.RoomMember ?? mongoose.model<IRoomMember>('RoomMember', RoomMemberSchema)
