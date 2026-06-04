import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import * as schema from './schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set. Did you forget to provision a database?')
}

function findWorkspaceRoot(startDir: string): string {
  let current = startDir

  while (true) {
    const packageJsonPath = path.join(current, 'package.json')
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as {
          name?: string
        }
        if (packageJson.name === 'aetherpulse' || packageJson.name === 'aetherpulse-monorepo')
          return current
      } catch {
        // Keep walking if this package.json is not readable JSON.
      }
    }

    const parent = path.dirname(current)
    if (parent === current) return startDir
    current = parent
  }
}

function normalizeDatabaseUrl(url: string): string {
  if (url.includes(':')) return url

  const currentDir = path.dirname(fileURLToPath(import.meta.url))
  const workspaceRoot = findWorkspaceRoot(currentDir)
  return pathToFileURL(path.resolve(workspaceRoot, url)).href
}

const client = createClient({ url: normalizeDatabaseUrl(process.env.DATABASE_URL) })
export const db = drizzle(client, { schema })

export * from './schema'
