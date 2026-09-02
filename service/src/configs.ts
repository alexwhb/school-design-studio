/*
 * @Author: ShawnPhang
 * @Date: 2022-02-01 13:41:59
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2024-08-12 05:13:19
 */
const isDev = process.env.NODE_ENV === 'development'

const serviceComfig = {
    port: 7001,
    website: 'http://127.0.0.1:5173/',
    filePath: '/cache/'
}

export const servicePort = serviceComfig.port

export const drawLink = isDev ? 'http://127.0.0.1:5173/draw' : serviceComfig.website + '/draw'

export const filePath = isDev ? process.cwd() + `/static/` : serviceComfig.filePath

export const executablePath = isDev ? null : '/opt/google/chrome-unstable/chrome'

export const maxNum = 2

export const upperLimit = 20

export const releaseTime = 300
