import { applyPatches, enablePatches } from 'immer'
import { historyState, widgetState } from './state'
import { setDLayouts } from './widget/widget'

enablePatches()

export function changeHistory({ patches, inversePatches }: { patches: any; inversePatches: any }) {
  const pointer = ++historyState.dHistoryParams.stackPointer
  historyState.dHistoryStack.changes.length = pointer
  historyState.dHistoryStack.inverseChanges.length = pointer
  historyState.dHistoryStack.changes[pointer] = patches
  historyState.dHistoryStack.inverseChanges[pointer] = inversePatches
}

export function handleHistory(action: 'undo' | 'redo') {
  const historyParams = historyState.dHistoryParams
  const { changes, inverseChanges } = historyState.dHistoryStack
  const index = historyParams.stackPointer
  const curLayouts = JSON.parse(JSON.stringify(widgetState.dLayouts))
  switch (action) {
    case 'undo':
      if (inverseChanges.length > 0 && index >= 0) {
        const newLayouts = applyPatches(curLayouts, inverseChanges[index])
        setDLayouts(JSON.parse(JSON.stringify(newLayouts)))
        historyParams.stackPointer--
      }
      break
    case 'redo':
      if (changes.length > 0 && index !== changes.length - 1) {
        historyParams.stackPointer++
        const newLayouts = applyPatches(curLayouts, changes[index + 1])
        setDLayouts(JSON.parse(JSON.stringify(newLayouts)))
      }
      break
  }
}

export function pushColorToHistory(color: string) {
  const history = historyState.dColorHistory
  const index = history.indexOf(color)
  if (index !== -1) {
    history.splice(index, 1)
  }
  if (history.length === 4) {
    history.splice(history.length - 1, 1)
  }
  const head = [color]
  historyState.dColorHistory = head.concat(history)
}
