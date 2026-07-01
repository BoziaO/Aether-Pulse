import mongoose from 'mongoose'
import { Friendship, User } from '@workspace/db'

function validateObjectId(id: string): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('Invalid ID format')
  }
}

export type LeanFriendship = {
  _id: mongoose.Types.ObjectId
  requesterId: mongoose.Types.ObjectId
  addresseeId: mongoose.Types.ObjectId
  status: 'pending' | 'accepted' | 'blocked'
  createdAt: Date
  updatedAt: Date
}

type FriendshipCreateData = {
  requesterId: string | mongoose.Types.ObjectId
  addresseeId: string | mongoose.Types.ObjectId
  status?: 'pending' | 'accepted' | 'blocked'
}

export const FriendRepository = {
  async findFriendship(userId: string, otherId: string): Promise<LeanFriendship | null> {
    validateObjectId(userId)
    validateObjectId(otherId)
    return Friendship.findOne({
      $or: [
        { requesterId: userId, addresseeId: otherId },
        { requesterId: otherId, addresseeId: userId },
      ],
    }).lean() as Promise<LeanFriendship | null>
  },

  async findAllForUser(userId: string): Promise<LeanFriendship[]> {
    validateObjectId(userId)
    return Friendship.find({
      $or: [{ requesterId: userId }, { addresseeId: userId }],
    }).lean() as Promise<LeanFriendship[]>
  },

  async create(data: FriendshipCreateData): Promise<LeanFriendship> {
    const doc = await Friendship.create(data)
    return doc.toObject() as LeanFriendship
  },

  async updateStatus(id: string | mongoose.Types.ObjectId, status: string): Promise<void> {
    await Friendship.findByIdAndUpdate(id, { status })
  },

  async delete(id: string | mongoose.Types.ObjectId): Promise<void> {
    await Friendship.findByIdAndDelete(id)
  },

  async countAccepted(userId: string): Promise<number> {
    validateObjectId(userId)
    return Friendship.countDocuments({
      status: 'accepted',
      $or: [{ requesterId: userId }, { addresseeId: userId }],
    })
  },

  async areFriends(userId: string, otherId: string): Promise<boolean> {
    validateObjectId(userId)
    validateObjectId(otherId)
    const row = await Friendship.findOne({
      status: 'accepted',
      $or: [
        { requesterId: userId, addresseeId: otherId },
        { requesterId: otherId, addresseeId: userId },
      ],
    }).lean()
    return Boolean(row)
  },

  async getSuggestions(excludeIds: string[], limit = 6) {
    excludeIds.forEach(validateObjectId)
    const objectIds = excludeIds.map((id) => new mongoose.Types.ObjectId(id))
    return User.aggregate([{ $match: { _id: { $nin: objectIds } } }, { $sample: { size: limit } }])
  },
}
