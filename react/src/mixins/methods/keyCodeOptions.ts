import { controlState, widgetState } from '@/store/state'
import { setSpaceDown } from '@/store/control'
import { deleteWidget, lockWidgets, updateWidgetData } from '@/store/widget/widget'
import type { TdWidgetData } from '@/store/types'
import { getAppRoot } from '@/common/hooks/appRoot'



export default function keyCodeOptions(e: any, params: any) {
  const { range } = params
  switch (e.keyCode) {
    case 38:
      udlr('top', -1 * range, e)
      break
    case 40:
      udlr('top', Number(range), e)
      break
    case 37:
      udlr('left', -1 * range, e)
      break
    case 39:
      udlr('left', Number(range), e)
      break
    case 46:
    case 8:
      {
        if (widgetState.dActiveElement?.isContainer) {
          if (checkGroupChild(widgetState.dActiveElement?.uuid, 'editable')) {
            return
          }
        }
        if (!widgetState.dActiveElement) return
        const { type, editable } = widgetState.dActiveElement

        if (type === 'w-text') {
          !editable && controlState.showMoveable && deleteWidget()
        } else {
          deleteWidget()
        }
      }
      break
  }

  if (e.key === ' ') {
    dealWithSpace(e)
  }
}

function checkGroupChild(pid: number | string, key: keyof TdWidgetData) {
  let itHas = false
  const childs = widgetState.dWidgets.filter((x) => x.parent === pid) || []
  childs.forEach((element) => {
    element[key] && (itHas = true)
  })
  return itHas
}

function udlr(type: keyof TdWidgetData, value: any, event: any) {
  if (!widgetState.dActiveElement) return
  if (Number(widgetState.dActiveElement.uuid) != -1) {
    if (widgetState.dActiveElement.editable) {
      return
    } else if (widgetState.dActiveElement.isContainer && checkGroupChild(widgetState.dActiveElement.uuid, 'editable')) {
      return
    }
    event.preventDefault()
    const result = Number(widgetState.dActiveElement[type]) + value
    updateWidgetData({
      uuid: widgetState.dActiveElement.uuid,
      key: type,
      value: result,
    })
  }
}

function dealWithSpace(event: any) {
  if (!widgetState.dActiveElement?.editable) {
    event.preventDefault()
    if (widgetState.dActiveElement?.uuid == '-1') {
      getAppRoot()?.classList.add('move-case')
      if (!controlState.dSpaceDown) {
        lockWidgets()
      }
      setSpaceDown(true)
    }
  }
}
