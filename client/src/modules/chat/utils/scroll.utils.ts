export interface ScrollPosition {
  scrollTop: number
  scrollHeight: number
  clientHeight: number
}

export function isNearBottom(
  scrollTop: number,
  clientHeight: number,
  scrollHeight: number,
  threshold = 150
): boolean {
  return scrollHeight - scrollTop - clientHeight < threshold
}

export function preserveScrollPosition(container: HTMLElement, beforeHeight: number): void {
  const afterHeight = container.scrollHeight
  const diff = afterHeight - beforeHeight
  if (diff > 0) {
    container.scrollTop += diff
  }
}

export function captureScrollPosition(container: HTMLElement): {
  scrollTop: number
  scrollHeight: number
} {
  return {
    scrollTop: container.scrollTop,
    scrollHeight: container.scrollHeight,
  }
}

export function scrollToBottom(container: HTMLElement, smooth = false): void {
  container.scrollTo({
    top: container.scrollHeight,
    behavior: smooth ? 'smooth' : 'instant',
  })
}
