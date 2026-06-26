import { Friendship, User, mongoose } from '@workspace/db'

export const FriendRepository = {
  async findFriendship(userId: string, otherId: string) {
    return Friendship.findOne({
      $or: [
        { requesterId: userId, addresseeId: otherId },
        { requesterId: otherId, addresseeId: userId },
      ],
    }).lean() as any
  },

  async findAllForUser(userId: string) {
    return Friendship.find({
      $or: [{ requesterId: userId }, { addresseeId: userId }],
    }).lean() as any
  },

  async create(data: Record<string, any>) {
    return Friendship.create(data) as any
  },

  async updateStatus(id: string, status: string) {
    await Friendship.findByIdAndUpdate(id, { status })
  },

  async delete(id: string) {
    await Friendship.findByIdAndDelete(id)
  },

  async countAccepted(userId: string): Promise<number> {
    return Friendship.countDocuments({
      status: 'accepted',
      $or: [{ requesterId: userId }, { addresseeId: userId }],
    })
  },

  async areFriends(userId: string, otherId: string): Promise<boolean> {
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
    const objectIds = excludeIds.map((id) => new mongoose.Types.ObjectId(id))
    return User.aggregate([{ $match: { _id: { $nin: objectIds } } }, { $sample: { size: limit } }])
  },
}
