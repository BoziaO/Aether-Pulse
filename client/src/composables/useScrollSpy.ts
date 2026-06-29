import { onMounted, onUnmounted, reactive } from 'vue'

export function useScrollSpy(selector = '[data-observe]') {
  const visible = reactive<Record<string, boolean>>({})
  let observer: IntersectionObserver | null = null

  onMounted(() => {
    if (typeof window === 'undefined') return

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const key = entry.target.getAttribute('data-observe')
          if (key) {
            visible[key] = true
          }
        })
      },
      { threshold: 0.1 }
    )

    document.querySelectorAll(selector).forEach((el) => observer?.observe(el))
  })

  onUnmounted(() => {
    observer?.disconnect()
  })

  return { visible }
}
