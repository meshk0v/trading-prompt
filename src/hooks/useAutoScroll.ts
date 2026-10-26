import { useEffect, useRef } from 'react'

/** Pixels per millisecond. */
const SPEED = 0.018

/**
 * Slowly scrolls a horizontal list back and forth while it is on screen.
 * Pauses while the pointer is over it or a finger is on it; disabled for "reduce motion".
 * Spread the returned props onto the scrollable element.
 *
 * Browsers drop sub-pixel scroll steps and scroll snapping pulls small offsets back, so the
 * exact position is tracked here and the element gets `is-auto-scrolling` (which turns snapping off
 * in CSS) only while it is moving by itself.
 */
export function useAutoScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const paused = useRef(false)

  useEffect(() => {
    const element = ref.current
    if (!element || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let isVisible = false
    let direction = 1
    let previousTime = 0
    let position = element.scrollLeft
    let frame = 0
    const observer = new IntersectionObserver(([entry]) => (isVisible = entry.isIntersecting), { threshold: 0.25 })

    const step = (time: number) => {
      const moving = isVisible && !paused.current && element.scrollWidth > element.clientWidth
      element.classList.toggle('is-auto-scrolling', moving)
      if (moving) {
        // The user may have scrolled it by hand since the last frame.
        if (Math.abs(element.scrollLeft - position) > 2) position = element.scrollLeft
        const elapsed = previousTime ? Math.min(time - previousTime, 32) : 0
        const maxScroll = element.scrollWidth - element.clientWidth
        position = Math.min(maxScroll, Math.max(0, position + direction * elapsed * SPEED))
        element.scrollLeft = position
        if (position >= maxScroll - 1) direction = -1
        if (position <= 1) direction = 1
      }
      previousTime = time
      frame = requestAnimationFrame(step)
    }

    observer.observe(element)
    frame = requestAnimationFrame(step)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
      element.classList.remove('is-auto-scrolling')
    }
  }, [])

  const pause = () => (paused.current = true)
  const resume = () => (paused.current = false)
  return { ref, onMouseEnter: pause, onMouseLeave: resume, onTouchStart: pause, onTouchEnd: resume }
}
