import { useEffect, useState } from 'react'

/**
 * The talk's running time, counted from a timestamp rather than held as a
 * number of seconds — which is what lets the presenter and the presenter view
 * show the same clock without either of them sending a tick to the other.
 *
 * Its own component because it ticks once a second, and the presenter's tree has
 * a mounted slide in it for every page within reach. Every one of those is
 * memoised and would skip the render, but there is no reason to ask.
 */
export default function Elapsed({
  startedAt,
  onReset,
  className = 'present__timer',
  title = 'Time on this presentation — click to reset',
}: {
  startedAt: number
  onReset: () => void
  className?: string
  title?: string
}) {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    setSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)))
    const timer = setInterval(() => setSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000))), 1000)
    return () => clearInterval(timer)
  }, [startedAt])

  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <button type="button" className={className} title={title} onClick={onReset}>
      {h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`}
    </button>
  )
}
