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
    feat: `Find and replace`,
    info: `${ctrlKey} + F`,
  },
  {
    feat: `Draw a rectangle`,
    info: `R`,
  },
  {
    feat: `Draw an ellipse`,
    info: `E`,
  },
  {
    feat: `Draw a polygon`,
    info: `Y`,
  },
  {
    feat: `Draw a path`,
    info: `P`,
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
    feat: `Bring forward`,
    info: `${ctrlKey} + ]`,
  },
  {
    feat: `Send backward`,
    info: `${ctrlKey} + [`,
  },
  {
    feat: `Bring to front`,
    info: `${ctrlKey} + Shift + ]`,
  },
  {
    feat: `Send to back`,
    info: `${ctrlKey} + Shift + [`,
  },
  {
    feat: `Lock / unlock`,
    info: `${ctrlKey} + Shift + L`,
  },
  {
    feat: `Rotate in 15° steps`,
    info: `Shift + drag the rotation handle`,
  },
  {
    feat: `Deselect`,
    info: `ESC`,
  },
]
