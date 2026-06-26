import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IFriendship extends Document {
  _id: mongoose.Types.ObjectId
  requesterId: mongoose.Types.ObjectId
  addresseeId: mongoose.Types.ObjectId
  status: 'pending' | 'accepted' | 'blocked'
  createdAt: Date
  updatedAt: Date
}

const FriendshipSchema = new Schema<IFriendship>(
  {
    requesterId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    addresseeId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'blocked'],
      default: 'pending',
    },
  },
  { timestamps: true }
)

FriendshipSchema.index({ requesterId: 1, addresseeId: 1 }, { unique: true })
FriendshipSchema.index({ requesterId: 1, status: 1 }, { name: 'friendship_outgoing' })
FriendshipSchema.index({ addresseeId: 1, status: 1 }, { name: 'friendship_incoming' })
FriendshipSchema.index({ status: 1 }, { name: 'friendship_status' })
FriendshipSchema.index({ addresseeId: 1, requesterId: 1 }, { name: 'friendship_reverse_lookup' })

export const Friendship: Model<IFriendship> =
  mongoose.models.Friendship ?? mongoose.model<IFriendship>('Friendship', FriendshipSchema)
