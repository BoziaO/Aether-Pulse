import type { SlashCommand } from '../types/composer.types'

const COMMANDS: SlashCommand[] = [
  {
    name: '/shrug',
    description: 'Adds a shrug ¯\\_(ツ)_/¯ at the end',
    transform: (input: string) => `${input.replace('/shrug', '').trim()} ¯\\_(ツ)_/¯`,
  },
  {
    name: '/tableflip',
    description: 'Flips a table',
    transform: (input: string) => `${input.replace('/tableflip', '').trim()} (╯°□°)╯︵ ┻━┻`,
  },
  {
    name: '/me',
    description: 'Describe yourself in third person',
    transform: (input: string) => `_${input.replace('/me', '').trim()}_`,
  },
  {
    name: '/code',
    description: 'Format as code block',
    transform: (input: string) => {
      const text = input.replace('/code', '').trim()
      return '```\n' + text + '\n```'
    },
  },
  {
    name: '/spoiler',
    description: 'Mark as spoiler',
    transform: (input: string) => {
      const text = input.replace('/spoiler', '').trim()
      return '||' + text + '||'
    },
  },
  {
    name: '/bold',
    description: 'Make text bold',
    transform: (input: string) => {
      const text = input.replace('/bold', '').trim()
      return '**' + text + '**'
    },
  },
  {
    name: '/italic',
    description: 'Make text italic',
    transform: (input: string) => {
      const text = input.replace('/italic', '').trim()
      return '*' + text + '*'
    },
  },
]

export function getCommands(): SlashCommand[] {
  return COMMANDS
}

export function getFilteredCommands(query: string): SlashCommand[] {
  if (!query.startsWith('/')) return []
  const partial = query.toLowerCase()
  return COMMANDS.filter((cmd) => cmd.name.startsWith(partial))
}

export function isSlashCommand(input: string): boolean {
  return /^\/\w+/.test(input.trim())
}

export function executeCommand(input: string): string {
  const trimmed = input.trim()
  for (const cmd of COMMANDS) {
    if (trimmed.startsWith(cmd.name)) {
      return cmd.transform(trimmed)
    }
  }
  return input
}
