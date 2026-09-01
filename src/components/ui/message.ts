import { getPortalContainer } from '@/common/hooks/appRoot'

let container: HTMLElement | null = null

function ensureContainer() {
  if (!container) {
    container = document.createElement('div')
    container.className = 'ds-message-container'
    ;(getPortalContainer() ?? document.body).appendChild(container)
  }
  return container
}

export type MessageType = 'success' | 'warning' | 'info' | 'error'

export default function message(options: string | { message: string; type?: MessageType; duration?: number }) {
  const { message: text, type, duration = 3000 } = typeof options === 'string' ? { message: options, type: undefined, duration: 3000 } : options
  const host = ensureContainer()
  const el = document.createElement('div')
  el.className = `el-message${type ? ` el-message--${type}` : ''}`
  el.setAttribute('role', 'alert')
  const offset = host.childElementCount * 16 + 20 + host.childElementCount * 40
  el.style.top = `${offset}px`
  el.style.zIndex = '2003'
  const content = document.createElement('p')
  content.className = 'el-message__content'
  content.textContent = text
  el.appendChild(content)
  host.appendChild(el)
  setTimeout(() => {
    el.remove()
  }, duration)
  return {
    close() {
      el.remove()
    },
  }
}
