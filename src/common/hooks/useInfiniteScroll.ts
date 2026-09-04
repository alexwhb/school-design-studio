import { useEffect, type RefObject } from 'react'

export default function useInfiniteScroll(ref: RefObject<HTMLElement | null>, load: () => void, distance = 150, enabled = true) {
  useEffect(() => {
    const el = ref.current
    if (!el || !enabled) return
    const onScroll = () => {
      if (el.scrollHeight - el.scrollTop - el.clientHeight <= distance) {
        load()
      }
    }
    el.addEventListener('scroll', onScroll)
    return () => el.removeEventListener('scroll', onScroll)
  }, [ref, load, distance, enabled])
}
