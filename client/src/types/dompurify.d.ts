declare module 'dompurify' {
  interface DOMPurifyStatic {
    sanitize(dirty: string): string
    sanitize(dirty: string, options: any): string
  }

  const DOMPurify: DOMPurifyStatic
  export default DOMPurify
}
