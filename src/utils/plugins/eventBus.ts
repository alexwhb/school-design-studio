import mitt from 'mitt'

type Events = {
  refreshUserImages: any
  /** Asks the left panel for a tab, by the `component` id in WidgetClassifyList. */
  'open-panel': string
}

const emitter = mitt<Events>()

export default emitter
