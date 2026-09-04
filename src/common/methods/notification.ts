type NotifyType = 'success' | 'warning' | 'info' | 'error' | ''

type NotifyOptions = {
  type?: NotifyType
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  duration?: number
}

const ICONS: Record<string, string> = {
  success: 'M512 64a448 448 0 1 1 0 896 448 448 0 0 1 0-896zm-55.808 536.384-99.52-99.584a38.4 38.4 0 1 0-54.336 54.336l126.72 126.72a38.272 38.272 0 0 0 54.336 0l262.4-262.464a38.4 38.4 0 1 0-54.272-54.336L456.192 600.384z',
  info: 'M512 64a448 448 0 1 1 0 896.064A448 448 0 0 1 512 64zm67.2 275.072c33.28 0 60.288-23.04 60.288-57.344s-27.072-57.344-60.288-57.344c-33.28 0-60.16 23.04-60.16 57.344s26.88 57.344 60.16 57.344zM590.912 699.2c0-6.848 2.368-24.64 1.024-34.752l-52.608 60.544c-10.88 11.456-24.512 19.392-30.912 17.28a12.992 12.992 0 0 1-8.256-14.72l87.68-276.992c7.168-35.136-12.544-67.2-54.336-71.296-44.096 0-108.992 44.736-148.48 101.504 0 6.784-1.28 23.68.064 33.792l52.544-60.608c10.88-11.328 23.552-19.328 29.952-17.152a12.8 12.8 0 0 1 7.808 16.128L388.48 728.576c-10.048 32.256 8.96 63.872 55.04 71.04 67.84 0 107.904-43.648 147.456-100.416z',
  warning: 'M512 64a448 448 0 1 1 0 896 448 448 0 0 1 0-896zm0 192a58.432 58.432 0 0 0-58.24 63.744l23.36 256.384a35.072 35.072 0 0 0 69.76 0l23.296-256.384A58.432 58.432 0 0 0 512 256zm0 512a51.2 51.2 0 1 0 0-102.4 51.2 51.2 0 0 0 0 102.4z',
  error: 'M512 64a448 448 0 1 1 0 896 448 448 0 0 1 0-896zm0 393.664L407.936 353.6a38.4 38.4 0 1 0-54.336 54.336L457.664 512 353.6 616.064a38.4 38.4 0 1 0 54.336 54.336L512 566.336 616.064 670.4a38.4 38.4 0 1 0 54.336-54.336L566.336 512 670.4 407.936a38.4 38.4 0 1 0-54.336-54.336L512 457.664z',
}

import { getPortalContainer } from '@/common/hooks/appRoot'

let container: HTMLElement | null = null

function ensureContainer() {
  if (!container) {
    container = document.createElement('div')
    container.className = 'ds-notification-container'
    ;(getPortalContainer() ?? document.body).appendChild(container)
  }
  return container
}

export default function useNotification(title: string, messageText: string = '', extra?: NotifyOptions) {
  const type = extra?.type || ''
  const duration = extra?.duration ?? 4500
  const host = ensureContainer()
  const el = document.createElement('div')
  el.className = `el-notification right${type ? ` ${type}` : ''}`
  el.setAttribute('role', 'alert')

  if (type && ICONS[type]) {
    const icon = document.createElement('i')
    icon.className = `el-notification__icon el-icon el-notification--${type}`
    icon.innerHTML = `<svg viewBox="0 0 1024 1024" width="1em" height="1em"><path fill="currentColor" d="${ICONS[type]}"/></svg>`
    el.appendChild(icon)
  }

  const group = document.createElement('div')
  group.className = 'el-notification__group'
  const h2 = document.createElement('h2')
  h2.className = 'el-notification__title'
  h2.textContent = title
  group.appendChild(h2)
  if (messageText) {
    const body = document.createElement('div')
    body.className = 'el-notification__content'
    const p = document.createElement('p')
    p.textContent = messageText
    body.appendChild(p)
    group.appendChild(body)
  }
  el.appendChild(group)

  const close = document.createElement('button')
  close.className = 'el-notification__closeBtn el-icon'
  close.innerHTML = '<svg viewBox="0 0 1024 1024" width="1em" height="1em"><path fill="currentColor" d="M764.288 214.592 512 466.88 259.712 214.592a31.936 31.936 0 0 0-45.12 45.12L466.752 512 214.528 764.224a31.936 31.936 0 1 0 45.12 45.184L512 557.184l252.288 252.288a31.936 31.936 0 0 0 45.12-45.12L557.12 512.064l252.288-252.352a31.936 31.936 0 1 0-45.12-45.184z"/></svg>'
  close.onclick = () => el.remove()
  el.appendChild(close)

  host.appendChild(el)
  if (duration > 0) {
    setTimeout(() => el.remove(), duration)
  }
  return { close: () => el.remove() }
}
