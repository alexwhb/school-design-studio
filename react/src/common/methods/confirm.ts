import { getPortalContainer } from '@/common/hooks/appRoot'

export type ConfirmType = 'success' | 'info' | 'warning' | 'error'

type ConfirmExtra = {
  confirmButtonText?: string
  cancelButtonText?: string
  showCancelButton?: boolean
  dangerouslyUseHTMLString?: boolean
}

export default function confirm(
  title: string = 'Note',
  message: string = '',
  type: ConfirmType = 'success',
  extra: ConfirmExtra = {},
): Promise<boolean> {
  const { confirmButtonText = 'OK', cancelButtonText = 'Cancel', showCancelButton = true, dangerouslyUseHTMLString = false } = extra

  return new Promise((resolve) => {
    const overlay = document.createElement('div')
    overlay.className = 'el-overlay is-message-box'
    overlay.innerHTML = `
      <div class="el-overlay-message-box">
        <div class="el-message-box" role="dialog">
          <div class="el-message-box__header">
            <div class="el-message-box__title"><span></span></div>
            <button type="button" class="el-message-box__headerbtn" aria-label="Close">
              <i class="el-message-box__close el-icon"><svg viewBox="0 0 1024 1024" width="1em" height="1em"><path fill="currentColor" d="M764.288 214.592 512 466.88 259.712 214.592a31.936 31.936 0 0 0-45.12 45.12L466.752 512 214.528 764.224a31.936 31.936 0 1 0 45.12 45.184L512 557.184l252.288 252.288a31.936 31.936 0 0 0 45.12-45.12L557.12 512.064l252.288-252.352a31.936 31.936 0 1 0-45.12-45.184z"/></svg></i>
            </button>
          </div>
          <div class="el-message-box__content"><div class="el-message-box__container"><div class="el-message-box__message"><p></p></div></div></div>
          <div class="el-message-box__btns">
            <button type="button" class="el-button el-button--default ds-cancel"><span>${cancelButtonText}</span></button>
            <button type="button" class="el-button el-button--primary ds-confirm"><span>${confirmButtonText}</span></button>
          </div>
        </div>
      </div>`

    const titleEl = overlay.querySelector('.el-message-box__title span') as HTMLElement
    titleEl.textContent = title
    const messageEl = overlay.querySelector('.el-message-box__message p') as HTMLElement
    if (dangerouslyUseHTMLString) messageEl.innerHTML = message
    else messageEl.textContent = message

    const cancelBtn = overlay.querySelector('.ds-cancel') as HTMLElement
    if (!showCancelButton) cancelBtn.style.display = 'none'

    const done = (value: boolean) => {
      overlay.remove()
      resolve(value)
    }
    overlay.querySelector('.ds-confirm')!.addEventListener('click', () => done(true))
    cancelBtn.addEventListener('click', () => done(false))
    overlay.querySelector('.el-message-box__headerbtn')!.addEventListener('click', () => done(false))

    ;(getPortalContainer() ?? document.body).appendChild(overlay)
  })
}
