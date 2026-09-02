/*
 * @Author: ShawnPhang
 * @Date: 2024-04-04 00:36:13
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2024-04-11 15:05:41
 */
const ctrlKey = isMacOS() ? `⌘` : `Ctrl`
function isMacOS() {
  return navigator.userAgent.includes(`Macintosh`) || navigator.userAgent.includes(`Mac OS X`)
}

export default [
  {
    feat: `Present full screen`,
    info: `${ctrlKey} + Enter`,
  },
  {
    feat: `Pan the page`,
    info: `Space + drag`,
  },
  {
    feat: `Zoom out`,
    info: `${ctrlKey} - / ${ctrlKey} + scroll wheel`,
  },
  {
    feat: `Zoom in`,
    info: `${ctrlKey} + / ${ctrlKey} + scroll wheel`,
  },
  {
    feat: `Save`,
    info: `${ctrlKey} + S`,
  },
  {
    feat: `Undo`,
    info: `${ctrlKey} + Z`,
  },
  {
    feat: `Redo`,
    info: `${ctrlKey} + Shift + Z`,
  },
  {
    feat: `Copy`,
    info: `${ctrlKey} + C`,
  },
  {
    feat: `Paste`,
    info: `${ctrlKey} + V`,
  },
  {
    feat: `Duplicate`,
    info: `${ctrlKey} + D`,
  },
  {
    feat: `Delete`,
    info: `Delete / Backspace`,
  },
  {
    feat: `Move element`,
    info: `← ↑ → ↓`,
  },
  {
    feat: `Move faster`,
    info: `Shift + ← ↑ → ↓`,
  },
  {
    feat: `Select multiple`,
    info: `${ctrlKey} / Shift + click`,
  },
  {
    feat: `Select all`,
    info: `${ctrlKey} + A`,
  },
  {
    feat: `Group`,
    info: `${ctrlKey} + G`,
  },
  {
    feat: `Deselect`,
    info: `ESC`,
  },
]
