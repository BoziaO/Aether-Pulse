import { apiFetch } from './client'

export interface LinkPreview {
  title: string | null
  image: string | null
  description: string | null
  url: string
}

export interface GitHubRepo {
  name: string
  full_name: string
  description: string | null
  stargazers_count: number
  forks_count: number
  html_url: string
  owner: {
    login: string
    avatar_url: string
  }
}

export async function fetchLinkPreview(url: string): Promise<LinkPreview> {
  return apiFetch<LinkPreview>(`/link-preview?url=${encodeURIComponent(url)}`)
}

export async function fetchGitHubRepo(owner: string, repo: string): Promise<GitHubRepo> {
  const res = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, {
    headers: { Accept: 'application/vnd.github.v3+json' },
  })
  if (!res.ok) throw new Error('GitHub repo not found')
  return res.json()
}

export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ]
  for (const pat of patterns) {
    const m = url.match(pat)
    if (m) return m[1]
  }
  return null
}

export function extractGitHubRepo(url: string): { owner: string; repo: string } | null {
  const m = url.match(/github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/)
  if (!m) return null
  // Remove trailing .git or tree/blobs/etc
  const repo = m[2].replace(/\.git$/, '').split('/')[0]
  return { owner: m[1], repo }
}

export interface EmbedEntry {
  type: 'youtube' | 'github' | 'twitter' | 'preview'
  url: string
  videoId?: string
  owner?: string
  repo?: string
}
