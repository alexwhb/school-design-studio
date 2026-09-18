import { getPortalContainer } from '@/common/hooks/appRoot'

export type ConfirmType = 'success' | 'info' | 'warning' | 'error'

/** How the box was dismissed. Escape and the X decide nothing; Cancel does. */
export type ConfirmChoice = 'confirm' | 'cancel' | 'close'

type ConfirmExtra = {
  confirmButtonText?: string
  cancelButtonText?: string
  showCancelButton?: boolean
  dangerouslyUseHTMLString?: boolean
  inputValue?: string
  inputPlaceholder?: string
}

const STATUS_PATHS: Record<ConfirmType, string> = {
  warning: 'M512 64a448 448 0 1 1 0 896 448 448 0 0 1 0-896m0 192a58.432 58.432 0 0 0-58.24 63.744l23.36 256.384a35.072 35.072 0 0 0 69.76 0l23.296-256.384A58.432 58.432 0 0 0 512 256m0 512a51.2 51.2 0 1 0 0-102.4 51.2 51.2 0 0 0 0 102.4',
  info: 'M512 64a448 448 0 1 1 0 896.064A448 448 0 0 1 512 64m67.2 275.072c33.28 0 60.288-23.104 60.288-57.344s-27.072-57.344-60.288-57.344c-33.28 0-60.16 23.104-60.16 57.344s26.88 57.344 60.16 57.344M590.912 699.2c0-6.848 2.368-24.64 1.024-34.752l-52.608 60.544c-10.88 11.456-24.512 19.392-30.912 17.28a12.992 12.992 0 0 1-8.256-14.72l87.68-276.992c7.168-35.136-12.544-67.2-54.336-71.296-44.096 0-108.992 44.736-148.48 101.504 0 6.784-1.28 23.68.064 33.792l52.544-60.608c10.88-11.328 23.552-19.328 29.952-17.152a12.8 12.8 0 0 1 7.808 16.128L388.48 728.576c-10.048 32.256 8.96 63.872 55.04 71.04 67.84 0 107.904-43.648 147.456-100.416z',
  success: 'M512 64a448 448 0 1 1 0 896 448 448 0 0 1 0-896m-55.808 536.384-99.52-99.584a38.4 38.4 0 1 0-54.336 54.336l126.72 126.72a38.272 38.272 0 0 0 54.336 0l262.4-262.464a38.4 38.4 0 1 0-54.272-54.336z',
  error: 'M512 64a448 448 0 1 1 0 896 448 448 0 0 1 0-896m0 393.664L407.936 353.6a38.4 38.4 0 1 0-54.336 54.336L457.664 512 353.6 616.064a38.4 38.4 0 1 0 54.336 54.336L512 566.336 616.064 670.4a38.4 38.4 0 1 0 54.336-54.336L566.336 512 670.4 407.936a38.4 38.4 0 1 0-54.336-54.336z',
}

function statusIcon(type: ConfirmType): string {
  return `<i class="el-icon el-message-box__status el-message-box-icon--${type}"><svg viewBox="0 0 1024 1024" width="1em" height="1em"><path fill="currentColor" d="${STATUS_PATHS[type]}"/></svg></i>`
}

type BoxOptions = ConfirmExtra & {
  title: string
  message: string
  type?: ConfirmType
  /** Renders an input, and hands its value back with the answer. */
  prompt?: boolean
}

type BoxResult = { action: ConfirmChoice; value: string }

/**
 * Element Plus's message box, rebuilt over its own CSS.
 *
 * Same DOM and class names, so it inherits every rule the real one does.
 */
function box(options: BoxOptions): Promise<BoxResult> {
  const { title, message, type, prompt = false, confirmButtonText = 'OK', cancelButtonText = 'Cancel', showCancelButton = true, dangerouslyUseHTMLString = false, inputValue = '', inputPlaceholder = '' } = options

  return new Promise((resolve) => {
    const overlay = document.createElement('div')
    overlay.className = 'el-overlay is-message-box'
    overlay.innerHTML = `
      <div class="el-overlay-message-box">
        <div class="el-message-box${prompt ? ' el-message-box--center-off' : ''}" role="dialog">
          <div class="el-message-box__header">
            <div class="el-message-box__title"><span></span></div>
            <button type="button" class="el-message-box__headerbtn" aria-label="Close">
              <i class="el-message-box__close el-icon"><svg viewBox="0 0 1024 1024" width="1em" height="1em"><path fill="currentColor" d="M764.288 214.592 512 466.88 259.712 214.592a31.936 31.936 0 0 0-45.12 45.12L466.752 512 214.528 764.224a31.936 31.936 0 1 0 45.12 45.184L512 557.184l252.288 252.288a31.936 31.936 0 0 0 45.12-45.12L557.12 512.064l252.288-252.352a31.936 31.936 0 1 0-45.12-45.184z"/></svg></i>
            </button>
          </div>
          <div class="el-message-box__content">
            <div class="el-message-box__container">${type ? statusIcon(type) : ''}<div class="el-message-box__message"><p></p></div></div>
            ${prompt ? '<div class="el-message-box__input"><div class="el-input"><div class="el-input__wrapper"><input class="el-input__inner" type="text" autocomplete="off" /></div></div></div>' : ''}
          </div>
          <div class="el-message-box__btns">
            <button type="button" class="el-button el-button--default ds-cancel"><span></span></button>
            <button type="button" class="el-button el-button--primary ds-confirm"><span></span></button>
          </div>
        </div>
      </div>`

    const titleEl = overlay.querySelector('.el-message-box__title span') as HTMLElement
    titleEl.textContent = title
    const messageEl = overlay.querySelector('.el-message-box__message p') as HTMLElement
    if (dangerouslyUseHTMLString) messageEl.innerHTML = message
    else messageEl.textContent = message

    const confirmBtn = overlay.querySelector('.ds-confirm') as HTMLElement
    confirmBtn.querySelector('span')!.textContent = confirmButtonText
    const cancelBtn = overlay.querySelector('.ds-cancel') as HTMLElement
    cancelBtn.querySelector('span')!.textContent = cancelButtonText
    if (!showCancelButton) cancelBtn.style.display = 'none'

    const input = overlay.querySelector('.el-input__inner') as HTMLInputElement | null
    if (input) {
      input.value = inputValue
      input.placeholder = inputPlaceholder
    }

    const done = (action: ConfirmChoice) => {
      document.removeEventListener('keydown', onKey, true)
      overlay.remove()
      resolve({ action, value: input?.value ?? '' })
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        done('close')
      } else if (e.key === 'Enter' && input) {
        e.stopPropagation()
        done('confirm')
      }
    }
    document.addEventListener('keydown', onKey, true)

    confirmBtn.addEventListener('click', () => done('confirm'))
    cancelBtn.addEventListener('click', () => done('cancel'))
    overlay.querySelector('.el-message-box__headerbtn')!.addEventListener('click', () => done('close'))

    ;(getPortalContainer() ?? document.body).appendChild(overlay)
    input?.focus()
    input?.select()
  })
}

export default function confirm(title: string = 'Note', message: string = '', type: ConfirmType = 'success', extra: ConfirmExtra = {}): Promise<boolean> {
  return box({ title, message, type, ...extra }).then((result) => result.action === 'confirm')
}

/**
 * Like `confirm`, but says how the box was dismissed.
 *
 * Cancel is an answer and Escape is not, which matters wherever the two would
 * lead somewhere different — throwing away a saved draft, say.
 */
export function confirmChoice(title: string, message: string, type?: ConfirmType, extra: ConfirmExtra = {}): Promise<ConfirmChoice> {
  return box({ title, message, type, ...extra }).then((result) => result.action)
}

/** Asks for a line of text. */
export function promptText(title: string, message: string, extra: ConfirmExtra = {}): Promise<string | null> {
  return box({ title, message, prompt: true, ...extra }).then((result) => (result.action === 'confirm' ? result.value : null))
}
