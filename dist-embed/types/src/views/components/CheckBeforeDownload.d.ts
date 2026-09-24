import type { DesignIssue } from '../../common/methods/accessibility/checkDesign';
import './checkBeforeDownload.less';
type Props = {
    issues: DesignIssue[] | null;
    onDownload: () => void;
    onClose: () => void;
};
/**
 * What the check found, before the studio's own Download goes ahead.
 *
 * Standalone only. Embedded, the host decides when to ask, through the
 * handle's `checkDesign`. Nothing here stops a download: somebody printing a
 * draft for themselves does not need a lecture, so "Download anyway" is
 * always one click away, and "Show me" takes them to the page and selects
 * the thing.
 */
export default function CheckBeforeDownload({ issues, onDownload, onClose }: Props): import("react").JSX.Element;
export {};
