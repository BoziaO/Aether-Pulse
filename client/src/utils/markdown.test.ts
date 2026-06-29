import { describe, it, expect } from 'vitest'

import { escapeHtml, renderMarkdown } from './markdown'

describe('markdown utils', () => {
  describe('escapeHtml', () => {
    it('should escape ampersands', () => {
      expect(escapeHtml('a & b')).toBe('a &amp; b')
    })

    it('should escape angle brackets', () => {
      expect(escapeHtml('<div>text</div>')).toBe('&lt;div&gt;text&lt;/div&gt;')
    })

    it('should escape double quotes', () => {
      expect(escapeHtml('say "hello"')).toBe('say &quot;hello&quot;')
    })

    it('should handle empty string', () => {
      expect(escapeHtml('')).toBe('')
    })

    it('should handle null/undefined gracefully', () => {
      expect(escapeHtml(null as unknown as string)).toBe('')
      expect(escapeHtml(undefined as unknown as string)).toBe('')
    })

    it('should not escape single quotes', () => {
      expect(escapeHtml("it's")).toBe("it's")
    })
  })

  describe('renderMarkdown', () => {
    it('should return empty string for empty input', () => {
      expect(renderMarkdown('')).toBe('')
    })

    it('should render bold text', () => {
      expect(renderMarkdown('**bold**')).toBe('<strong>bold</strong>')
    })

    it('should render italic text', () => {
      expect(renderMarkdown('*italic*')).toBe('<em>italic</em>')
    })

    it('should render strikethrough text', () => {
      expect(renderMarkdown('~~deleted~~')).toBe('<s>deleted</s>')
    })

    it('should render inline code', () => {
      expect(renderMarkdown('`code`')).toBe('<code class="md-inline-code">code</code>')
    })

    it('should render code blocks', () => {
      const input = '```js\nconsole.log("hi")\n```'
      const result = renderMarkdown(input)
      expect(result).toContain('<pre class="md-codeblock"><code>')
      expect(result).toContain('console.log')
    })

    it('should render links', () => {
      const result = renderMarkdown('visit https://example.com')
      expect(result).toContain('<a href="https://example.com"')
      expect(result).toContain('target="_blank"')
    })

    it('should convert newlines to <br>', () => {
      expect(renderMarkdown('line1\nline2')).toContain('<br>')
    })

    it('should escape HTML within markdown', () => {
      const result = renderMarkdown('<script>alert("xss")</script>')
      expect(result).not.toContain('<script>')
      expect(result).toContain('&lt;script&gt;')
    })

    it('should handle combined formatting', () => {
      const result = renderMarkdown('**bold** and *italic*')
      expect(result).toContain('<strong>bold</strong>')
      expect(result).toContain('<em>italic</em>')
    })
  })
})
