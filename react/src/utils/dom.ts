export function cx(...parts: (string | false | null | undefined | Record<string, boolean | undefined>)[]): string {
  const out: string[] = []
  for (const part of parts) {
    if (!part) continue
    if (typeof part === 'string') {
      out.push(part)
    } else {
      for (const key in part) {
        part[key] && out.push(key)
      }
    }
  }
  return out.join(' ')
}

export function setTransformAttribute(el: HTMLElement, attrName: string, value: string | number) {
  const tf = el.style.transform
  const iof = tf.indexOf(attrName)
  if (iof !== -1) {
    const index = iof + attrName.length
    const FRONT = tf.slice(0, index + 1)
    const half = tf.substring(index + 1)
    const END = half.substring(half.indexOf(')'))
    el.style.transform = FRONT + value + END
  } else {
    el.style.transform = tf + ` ${attrName}(${value})`
  }
}
