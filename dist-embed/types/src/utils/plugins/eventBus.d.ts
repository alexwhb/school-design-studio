type Events = {
    refreshUserImages: any;
    /** Asks the left panel for a tab, by the `component` id in WidgetClassifyList. */
    'open-panel': string;
};
declare const emitter: import("mitt").Emitter<Events>;
export default emitter;
