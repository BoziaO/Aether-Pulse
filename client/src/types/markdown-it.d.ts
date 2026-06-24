declare module 'markdown-it' {
  interface MarkdownItOptions {
    html?: boolean
    linkify?: boolean
    typographer?: boolean
    breaks?: boolean
    highlight?: (str: string, lang: string, env: any) => string | void
  }

  class MarkdownIt {
    constructor(options?: MarkdownItOptions)
    render(markdown: string): string
    parse(markdown: string): any
    utils: {
      escapeHtml(str: string): string
    }
  }

  export default MarkdownIt
}
