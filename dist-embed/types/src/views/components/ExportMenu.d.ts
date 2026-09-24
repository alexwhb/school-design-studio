import { type ExportScale } from '../../common/methods/export/exportPdf';
import './exportMenu.less';
type Props = {
    getTitle?: () => string;
    onSelect: (name: string, scale: ExportScale) => void;
    onProgress: (data: {
        downloadPercent: number;
        downloadText: string;
        downloadMsg?: string;
    }) => void;
};
export default function ExportMenu({ getTitle, onSelect, onProgress }: Props): import("react").JSX.Element;
export {};
