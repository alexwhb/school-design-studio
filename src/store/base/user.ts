/*
 * @Author: Jeremy Yu
 * @Date: 2024-03-17 15:00:00
 * @Description: User全局状态管理
 * @LastEditors: Jeremy Yu <https://github.com/JeremyYu-cn>
 * @LastEditTime: 2024-03-18 21:00:00
 */

import { Store, defineStore } from "pinia"

type TUserStoreState = {
  /** 登录状态 */
  online: boolean
  /** Stored user details */
  user: {
    name: string | null
  }
  /**Whether admin mode is on */
  manager: string
  /** Whether an admin is editing a template */
  tempEditing: boolean
}

type TUserAction = {
  /** 修改登录状态 */
  changeOnline: (state: boolean) => void
  /** 修改登录用户 */
  changeUser: (userName: string) => void
  managerEdit: (status: boolean) => void
}

/** User全局状态管理 */
const useUserStore = defineStore<'userStore', TUserStoreState, {}, TUserAction>('userStore', {
  state: () => ({
    online: true, // Signed-in state, 
    user: {
      name: localStorage.getItem('username'),
    }, // Stored user details
    manager: '', // Whether admin mode is on
    tempEditing: false, // Whether an admin is editing a template
  }),
  actions: {
    changeOnline(status: boolean) {
      this.online = status
    },
    changeUser(name: string) {
      this.user.name = name
      // state.user = Object.assign({}, state.user)
      // state.user = { ...state.user }
      localStorage.setItem('username', name)
    },
    managerEdit(status: boolean) {
      this.tempEditing = status
    },
    
  }
})

export type TUserStore = Store<'userStore', TUserStoreState, {}, TUserAction>

export default useUserStore
