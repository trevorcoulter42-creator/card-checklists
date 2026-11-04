'use client'

import { useEffect, useRef } from 'react'

/* Animated galaxy background (same feel as Command Center and Pong HQ):
   drifting navy nebula clouds, three layers of twinkling stars with slow
   parallax, and now and then a shooting star. CardHQ's shooting stars are
   trading cards: a small tumbling card with a refractor-rainbow trail.
   Fixed behind every page. Pauses when the tab is hidden, uses fewer stars
   on phones, and draws one still frame for people who prefer reduced motion. */

const LAYERS = [
  { speed: 0.006, size: 0.6 },
  { speed: 0.014, size: 1.0 },
  { speed: 0.03, size: 1.5 },
]

export default function Galaxy() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let w = 0, h = 0, dpr = 1, raf = 0, t = 0
    let last = performance.now()
    let stars = [], clouds = []
    const shots = []
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 }

    function build() {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const cap = w < 640 ? 120 : 240
      const count = Math.round(Math.min(cap, (w * h) / 7000))
      stars = Array.from({ length: count }, () => {
        const layer = Math.random() < 0.72 ? 0 : Math.random() < 0.85 ? 1 : 2
        return {
          x: Math.random() * w, y: Math.random() * h,
          r: (Math.random() * 0.5 + 0.3) * LAYERS[layer].size,
          a: Math.random() * 0.45 + 0.2, tw: Math.random() * 1.6 + 0.4,
          ph: Math.random() * Math.PI * 2, layer,
        }
      })
      const m = Math.max(w, h)
      clouds = [
        { x: w * 0.18, y: h * 0.22, r: m * 0.55, color: '38, 62, 160', dx: 0.6, dy: 0.4, ph: 0 },
        { x: w * 0.85, y: h * 0.15, r: m * 0.45, color: '59, 110, 245', dx: 0.5, dy: 0.7, ph: 1.7 },
        { x: w * 0.7, y: h * 0.85, r: m * 0.6, color: '22, 34, 80', dx: 0.4, dy: 0.5, ph: 3.1 },
        { x: w * 0.3, y: h * 0.9, r: m * 0.4, color: '46, 74, 170', dx: 0.7, dy: 0.3, ph: 4.4 },
      ]
    }

    function drawClouds() {
      ctx.globalCompositeOperation = 'lighter'
      for (const c of clouds) {
        const x = c.x + Math.sin(t * 0.003 * c.dx + c.ph) * w * 0.06 - mouse.x * 12
        const y = c.y + Math.cos(t * 0.0024 * c.dy + c.ph) * h * 0.06 - mouse.y * 12
        const pulse = (0.07 + Math.sin(t * 0.0004 + c.ph) * 0.02) * 0.26
        const g = ctx.createRadialGradient(x, y, 0, x, y, c.r)
        g.addColorStop(0, `rgba(${c.color}, ${pulse})`)
        g.addColorStop(0.45, `rgba(${c.color}, ${pulse * 0.35})`)
        g.addColorStop(1, `rgba(${c.color}, 0)`)
        ctx.fillStyle = g
        ctx.fillRect(0, 0, w, h)
      }
      ctx.globalCompositeOperation = 'source-over'
    }

    function drawStars(dt) {
      for (const s of stars) {
        const L = LAYERS[s.layer]
        if (!still) {
          s.x -= L.speed * dt
          s.y += L.speed * dt * 0.25
          if (s.x < -4) s.x = w + 4
          if (s.y > h + 4) s.y = -4
        }
        const px = s.x - mouse.x * (s.layer + 1) * 6
        const py = s.y - mouse.y * (s.layer + 1) * 6
        const tw = still ? 1 : 0.65 + 0.35 * Math.sin(t * 0.001 * s.tw + s.ph)
        const color = `rgba(255, 255, 255, ${s.a * tw})`
        if (s.r > 1.05) {
          const g = ctx.createRadialGradient(px, py, 0, px, py, s.r * 2.5)
          g.addColorStop(0, color)
          g.addColorStop(1, 'rgba(255, 255, 255, 0)')
          ctx.fillStyle = g
          ctx.beginPath(); ctx.arc(px, py, s.r * 2.5, 0, Math.PI * 2); ctx.fill()
        }
        ctx.fillStyle = color
        ctx.beginPath(); ctx.arc(px, py, s.r, 0, Math.PI * 2); ctx.fill()
      }
    }

    // A shooting card: rainbow refractor trail, then a small tumbling card with a foil glint
    function drawShots(dt) {
      if (Math.random() < 0.0005 * dt && shots.length < 2) {
        const fromTop = Math.random() < 0.5
        shots.push({
          x: fromTop ? Math.random() * w : w + 20,
          y: fromTop ? -20 : Math.random() * h * 0.5,
          vx: -(0.45 + Math.random() * 0.4), vy: 0.2 + Math.random() * 0.22,
          spin: (Math.random() < 0.5 ? -1 : 1) * (0.002 + Math.random() * 0.003),
          rot: Math.random() * Math.PI, life: 0, max: 1300 + Math.random() * 700,
          hue: Math.floor(Math.random() * 360),
        })
      }
      for (let i = shots.length - 1; i >= 0; i--) {
        const s = shots[i]
        s.life += dt
        s.x += s.vx * dt
        s.y += s.vy * dt
        s.rot += s.spin * dt
        const k = Math.min(1, s.life / 200) * (1 - s.life / s.max)
        if (k <= 0) { shots.splice(i, 1); continue }

        // trail: a short refractor rainbow fading to nothing
        const tail = 150
        const tx = s.x - s.vx * tail, ty = s.y - s.vy * tail
        const g = ctx.createLinearGradient(s.x, s.y, tx, ty)
        g.addColorStop(0, `hsla(${s.hue}, 100%, 80%, ${0.55 * k})`)
        g.addColorStop(0.35, `hsla(${(s.hue + 90) % 360}, 100%, 70%, ${0.3 * k})`)
        g.addColorStop(0.7, `hsla(${(s.hue + 200) % 360}, 100%, 70%, ${0.12 * k})`)
        g.addColorStop(1, 'hsla(0, 0%, 100%, 0)')
        ctx.strokeStyle = g
        ctx.lineWidth = 2.2
        ctx.lineCap = 'round'
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(tx, ty); ctx.stroke()

        // the card: 2.5 x 3.5 proportions, white border, foil face that shifts colour as it turns
        ctx.save()
        ctx.translate(s.x, s.y)
        ctx.rotate(s.rot)
        const flip = Math.abs(Math.cos(s.rot * 1.7)) * 0.75 + 0.25   // tumbling: the card narrows as it turns
        const cw = 9 * flip, ch = 12.6
        ctx.shadowColor = `hsla(${s.hue}, 100%, 75%, ${0.9 * k})`
        ctx.shadowBlur = 12
        ctx.fillStyle = `rgba(255, 255, 255, ${0.95 * k})`
        ctx.fillRect(-cw / 2, -ch / 2, cw, ch)
        ctx.shadowBlur = 0
        const foil = ctx.createLinearGradient(-cw / 2, -ch / 2, cw / 2, ch / 2)
        const h0 = (s.hue + s.rot * 40) % 360
        foil.addColorStop(0, `hsla(${h0}, 95%, 62%, ${k})`)
        foil.addColorStop(0.5, `hsla(${(h0 + 120) % 360}, 95%, 66%, ${k})`)
        foil.addColorStop(1, `hsla(${(h0 + 240) % 360}, 95%, 62%, ${k})`)
        ctx.fillStyle = foil
        ctx.fillRect(-cw / 2 + 1.2 * flip, -ch / 2 + 1.2, cw - 2.4 * flip, ch - 2.4)
        ctx.restore()
      }
    }

    function frame(now) {
      const dt = Math.min(64, now - last)
      last = now
      t += dt
      mouse.x += (mouse.tx - mouse.x) * 0.04
      mouse.y += (mouse.ty - mouse.y) * 0.04
      const bg = ctx.createLinearGradient(0, 0, 0, h)
      bg.addColorStop(0, '#03050c')
      bg.addColorStop(0.55, '#04060e')
      bg.addColorStop(1, '#010103')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)
      drawClouds()
      drawStars(dt)
      if (!still) {
        drawShots(dt)
        raf = requestAnimationFrame(frame)
      }
    }

    function onMove(e) {
      mouse.tx = (e.clientX / w - 0.5) * 2
      mouse.ty = (e.clientY / h - 0.5) * 2
    }
    // phones fire resize when the address bar hides; only rebuild on a real width change
    let lastW = 0
    function onResize() {
      if (window.innerWidth === lastW && Math.abs(window.innerHeight - h) < 120) return
      lastW = window.innerWidth
      build()
      if (still) frame(performance.now())
    }
    function onVisibility() {
      if (still) return
      cancelAnimationFrame(raf)
      if (!document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame) }
    }

    lastW = window.innerWidth
    build()
    raf = requestAnimationFrame(frame)
    window.addEventListener('resize', onResize)
    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return <canvas ref={ref} className="hq-galaxy" aria-hidden="true" />
}
