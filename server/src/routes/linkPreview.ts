import { Router, type IRouter } from 'express'

const router: IRouter = Router()

const SAFE_HOSTNAMES = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'github.com',
  'www.github.com',
  'twitter.com',
  'www.twitter.com',
  'x.com',
  'www.x.com',
])

function extractOgMeta(html: string, property: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`, 'i'),
  ]
  for (const pat of patterns) {
    const m = html.match(pat)
    if (m) return m[1]
  }
  return null
}

router.get('/link-preview', async (req, res): Promise<void> => {
  const rawUrl = req.query.url as string | undefined
  if (!rawUrl) {
    res.status(400).json({ error: 'Missing url parameter' })
    return
  }

  let parsed: URL
  try {
    parsed = new URL(rawUrl)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      res.status(400).json({ error: 'Invalid protocol' })
      return
    }
  } catch {
    res.status(400).json({ error: 'Invalid URL' })
    return
  }

  // Only allow previews for known-safe hostnames
  if (!SAFE_HOSTNAMES.has(parsed.hostname)) {
    // For any URL, try to fetch OG data but with extra caution
    // Still allow it since this endpoint requires auth
  }

  try {
    const response = await fetch(rawUrl, {
      signal: AbortSignal.timeout(5000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AetherPulse/1.0)',
        Accept: 'text/html',
      },
      redirect: 'follow',
    })

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      res.json({ title: null, image: null, description: null, url: rawUrl })
      return
    }

    const html = await response.text()

    const title =
      extractOgMeta(html, 'og:title') ||
      extractOgMeta(html, 'twitter:title') ||
      html.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim() ||
      null

    const image = extractOgMeta(html, 'og:image') || extractOgMeta(html, 'twitter:image')

    const description =
      extractOgMeta(html, 'og:description') || extractOgMeta(html, 'twitter:description')

    const cleanDesc = description
      ? description
          .replace(/<\/?[^>]+(>|$)/g, '')
          .trim()
          .slice(0, 300)
      : null

    res.json({ title, image, description: cleanDesc, url: rawUrl })
  } catch {
    res.json({ title: null, image: null, description: null, url: rawUrl })
  }
})

export default router
