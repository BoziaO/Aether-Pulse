import { ref, nextTick } from 'vue'

import {
  isNearBottom,
  scrollToBottom,
  preserveScrollPosition,
  captureScrollPosition,
} from '../utils/scroll.utils'

export function useInfiniteScroll(
  containerRef: ReturnType<typeof ref<HTMLElement | null>>,
  loadMore: () => Promise<void>,
  hasMore: () => boolean,
  isLoadingMore: () => boolean
) {
  const nearBottom = ref(true)
  const showNewMessage = ref(false)
  let isAtBottom = true
  let scrollPosition = { scrollTop: 0, scrollHeight: 0 }

  function onScroll(): void {
    const el = containerRef.value
    if (!el) return

    isAtBottom = isNearBottom(el.scrollTop, el.clientHeight, el.scrollHeight)
    nearBottom.value = isAtBottom

    if (isAtBottom) {
      showNewMessage.value = false
    }

    if (el.scrollTop < 50 && hasMore() && !isLoadingMore()) {
      scrollPosition = captureScrollPosition(el)
      loadMore().then(() => {
        nextTick(() => {
          preserveScrollPosition(el, scrollPosition.scrollHeight)
        })
      })
    }
  }

  function scrollDown(smooth = false): void {
    const el = containerRef.value
    if (!el) return
    scrollToBottom(el, smooth)
    showNewMessage.value = false
    isAtBottom = true
    nearBottom.value = true
  }

  function onNewMessage(): void {
    if (isAtBottom) {
      nextTick(() => scrollDown())
    } else {
      showNewMessage.value = true
    }
  }

  return {
    nearBottom,
    showNewMessage,
    onScroll,
    scrollDown,
    onNewMessage,
  }
}
