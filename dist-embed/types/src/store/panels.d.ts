export declare const LEFT_PANEL_STORAGE_KEY = "ds_left_panel";
export declare const RIGHT_PANEL_STORAGE_KEY = "ds_right_panel";
export declare const panelState: {
    leftOpen: boolean;
    rightOpen: boolean;
    /** The `component` id of the left tab on show — Templates when nothing says otherwise. */
    activePanel: string;
};
export declare function setLeftOpen(open: boolean): void;
export declare function setRightOpen(open: boolean): void;
export declare function toggleLeft(): void;
export declare function toggleRight(): void;
/** Shows a left tab by its `component` id, opening the panel if it was hidden. */
export declare function openPanel(component: string): void;
/**
 * Clicking the rail tab that is already showing puts the panel away, which is
 * how you get the canvas to yourself without reaching for the chevron.
 */
export declare function clickPanelTab(component: string): void;
