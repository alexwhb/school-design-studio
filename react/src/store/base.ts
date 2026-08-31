import { baseState, userState } from './state'

export function hideLoading() {
  setTimeout(() => {
    baseState.loading = false
  }, 600)
}

export function setFonts(list: string[]) {
  baseState.fonts = list
}

export function changeWatermark(wm: string | string[]) {
  baseState.watermark = wm
}

export function changeOnline(status: boolean) {
  userState.online = status
}

export function changeUser(name: string) {
  userState.user.name = name
  localStorage.setItem('username', name)
}

export function managerEdit(status: boolean) {
  userState.tempEditing = status
}
