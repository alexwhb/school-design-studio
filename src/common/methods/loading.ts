import { getPortalContainer } from '@/common/hooks/appRoot'

export type LoadingInstance = { close: () => void }

export default function loading(text: string = 'loading'): LoadingInstance {
  const mask = document.createElement('div')
  mask.className = 'el-loading-mask is-fullscreen'
  mask.style.background = 'rgba(0, 0, 0, 0.7)'
  mask.style.zIndex = '2000'
  mask.innerHTML = `
    <div class="el-loading-spinner">
      <svg class="circular" viewBox="0 0 50 50"><circle class="path" cx="25" cy="25" r="20" fill="none"></circle></svg>
      <p class="el-loading-text">${text}</p>
    </div>`
  ;(getPortalContainer() ?? document.body).appendChild(mask)
  document.body.classList.add('el-loading-parent--hidden')
  return {
    close() {
      mask.remove()
      document.body.classList.remove('el-loading-parent--hidden')
    },
  }
}
