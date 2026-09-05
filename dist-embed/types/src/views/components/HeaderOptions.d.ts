import { type ReactNode } from 'react';
import { type DesignDocument } from '../../common/hooks/hostApi';
import './headerOptions.less';
export type HeaderOptionsHandle = {
    getTitle: () => string;
    /** Puts a name back in the box — used when a saved design is restored. */
    setTitle: (title: string) => void;
    /** Replaces the canvas with a whole document. See `showDocument`. */
    showDocument: (doc: DesignDocument) => void;
    download: (scale?: number) => Promise<void>;
    save: (hasCover?: boolean) => Promise<void>;
    saveTemp: () => Promise<void>;
    stateChange: (e: boolean) => Promise<void>;
    load: (cb: () => void) => Promise<void>;
};
type Props = {
    /** Saves through the host. Absent when the editor keeps its own design. */
    onHostSave?: () => Promise<void>;
    isContinue: boolean;
    onContinueChange: (value: boolean) => void;
    onChange: (data: {
        downloadPercent: number;
        downloadText: string;
        downloadMsg?: string;
    }) => void;
    /** The design's name is part of what autosave keeps, so a rename is a change. */
    onTitleChange?: () => void;
    children?: ReactNode;
};
declare const HeaderOptions: import("react").ForwardRefExoticComponent<Props & import("react").RefAttributes<HeaderOptionsHandle>>;
export default HeaderOptions;
