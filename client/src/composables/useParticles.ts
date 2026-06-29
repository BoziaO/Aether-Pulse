import { onMounted, onUnmounted, ref, type Ref } from 'vue'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  color: string
}

export function useParticles(canvasRef: Ref<HTMLCanvasElement | null>) {
  let ctx: CanvasRenderingContext2D | null = null
  let particles: Particle[] = []
  let animId = 0
  let resizeHandler: (() => void) | null = null
  const reducedMotion = ref(false)

  function resize() {
    const canvas = canvasRef.value
    if (!canvas) return
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }

  function initParticles() {
    const canvas = canvasRef.value
    if (!canvas || !ctx) return

    const width = canvas.width
    const height = canvas.height
    const isMobile = width < 768
    const colors = [
      'rgba(183, 167, 255',
      'rgba(255, 183, 213',
      'rgba(174, 235, 255',
    ]
    const count = isMobile
      ? Math.min(Math.floor((width * height) / 30000), 30)
      : Math.min(Math.floor((width * height) / 15000), 80)

    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 2.5 + 0.5,
      alpha: Math.random() * 0.4 + 0.05,
      color: colors[Math.floor(Math.random() * colors.length)],
    }))
  }

  function animate() {
    const canvas = canvasRef.value
    if (!canvas || !ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    for (const p of particles) {
      p.x += p.vx
      p.y += p.vy
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1

      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fillStyle = `${p.color}, ${p.alpha})`
      ctx.fill()
    }

    animId = requestAnimationFrame(animate)
  }

  onMounted(() => {
    const canvas = canvasRef.value
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return
    ctx = context

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    reducedMotion.value = mq.matches
    mq.addEventListener('change', () => {
      reducedMotion.value = mq.matches
    })

    resize()
    resizeHandler = resize
    window.addEventListener('resize', resize)

    initParticles()

    if (!reducedMotion.value) {
      animate()
    }
  })

  onUnmounted(() => {
    cancelAnimationFrame(animId)
    if (resizeHandler) window.removeEventListener('resize', resizeHandler)
  })

  return { reducedMotion }
}
