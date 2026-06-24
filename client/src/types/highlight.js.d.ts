declare module 'highlight.js' {
  interface HLJSOptions {
    language?: string
  }

  interface HLJSResult {
    value: string
  }

  interface HLJSStatic {
    highlight(text: string, options: HLJSOptions): HLJSResult
    getLanguage(lang: string): any
    highlightAuto(text: string): HLJSResult
  }

  const hljs: HLJSStatic
  export default hljs
}
