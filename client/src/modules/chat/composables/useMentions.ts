import type { MentionMatch } from '../types/composer.types'
import { parseMention } from '../utils/mention.utils'

export function useMentions() {
  function detectMention(
    input: string,
    cursorPos: number
  ): { query: string; index: number } | null {
    const parsed = parseMention(input, cursorPos)
    if (!parsed) return null
    return { query: parsed.query, index: parsed.startIndex }
  }

  function filterMembers(query: string, members: MentionMatch[]): MentionMatch[] {
    if (!query) return members.slice(0, 10)
    const q = query.toLowerCase()
    return members
      .filter(
        (m) =>
          m.displayName.toLowerCase().includes(q) ||
          (m.username && m.username.toLowerCase().includes(q))
      )
      .slice(0, 10)
  }

  return {
    detectMention,
    filterMembers,
  }
}
