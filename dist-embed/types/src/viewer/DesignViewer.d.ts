import type { DesignDocument } from '../compose/types';
import '../assets/styles/embed';
import './designViewer.less';
export type DesignViewerProps = {
    document: DesignDocument;
    className?: string;
    /** Called with the 0-based page that is most in view, as it changes. */
    onPageChange?(index: number): void;
};
export default function DesignViewer({ document: doc, className, onPageChange }: DesignViewerProps): import("react").JSX.Element;
