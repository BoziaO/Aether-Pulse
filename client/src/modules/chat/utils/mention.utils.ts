import type { MentionMatch } from '../types/composer.types'

export interface ParsedMention {
  query: string
  startIndex: number
  endIndex: number
}

export function parseMention(input: string, cursorPos: number): ParsedMention | null {
  const textBefore = input.slice(0, cursorPos)
  const atIndex = textBefore.lastIndexOf('@')

  if (atIndex === -1) return null

  if (atIndex > 0 && !/[\s\n(]/.test(textBefore[atIndex - 1])) return null

  const afterAt = textBefore.slice(atIndex + 1)
  if (!afterAt) return { query: '', startIndex: atIndex, endIndex: cursorPos }

  if (/[\s\n)]/.test(afterAt[0])) return null

  const match = afterAt.match(/^(\w+)/)
  if (!match) return null

  return {
    query: match[1],
    startIndex: atIndex,
    endIndex: atIndex + 1 + match[1].length,
  }
}

export function filterMentions(
  query: string,
  members: MentionMatch[],
  maxResults = 10
): MentionMatch[] {
  if (!query) return members.slice(0, maxResults)

  const q = query.toLowerCase()
  return members
    .filter(
      (m) =>
        m.displayName.toLowerCase().includes(q) ||
        (m.username && m.username.toLowerCase().includes(q))
    )
    .slice(0, maxResults)
}

export function buildMentionInsert(mention: MentionMatch): string {
  return `@${mention.username || mention.displayName.replace(/\s+/g, '')}`
}
