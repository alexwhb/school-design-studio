/*
 * @Author: ShawnPhang
 * @Date: 2021-07-13 02:48:38
 * @Description:
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2024-04-13 18:19:28
 */
import * as services from '../api/index'
import * as utils from './utils'
import _config from '@/config'
import modules from './plugins/modules'
import cssLoader from './plugins/cssLoader'
import type { App } from 'vue'

/**
 * 全局组件方法
 */
export default {
  install(myVue: App) {
    /** 全局组件注册 */
    modules(myVue)
    /** Icon fonts */
    cssLoader(_config.BASE_URL + _config.ICONFONT_URL)

    myVue.config.globalProperties.$ajax = services

    myVue.config.globalProperties.$utils = utils

  },
}
