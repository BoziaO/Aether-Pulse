import { User } from '@workspace/db'

export const UserRepository = {
  async findById(id: string) {
    return User.findById(id).lean() as any
  },

  async findByIdAndUpdate(id: string, data: any, options?: { new?: boolean }) {
    return User.findByIdAndUpdate(id, data, { new: true, ...options }).lean() as any
  },

  async findOne(filter: Record<string, any>) {
    return User.findOne(filter).lean() as any
  },

  async updateStatus(id: string, status: string) {
    await User.findByIdAndUpdate(id, { status })
  },

  async create(data: Record<string, any>) {
    return User.create(data) as any
  },

  async search(query: string, excludeId: string, limit = 20) {
    return User.find({
      _id: { $ne: excludeId },
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { displayName: { $regex: query, $options: 'i' } },
      ],
    })
      .limit(limit)
      .lean() as any
  },

  async findByIds(ids: string[]) {
    return User.find({ _id: { $in: ids } }).lean() as any
  },
}
