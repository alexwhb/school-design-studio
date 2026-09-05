import type { TdWidgetData } from '../../../../store/types';
/**
 * The name it was given, else its own text, else its kind. A text widget's text
 * is markup — a bulleted one is a whole <ul> — so it is read back as lines
 * rather than printed raw.
 */
export declare function layerLabel(element: Pick<TdWidgetData, 'label' | 'text' | 'name'>): string;
/** A photograph is the one kind a character does not say; it gets the icon. */
export declare function LayerBadge({ type, className }: {
    type?: string;
    className?: string;
}): import("react").JSX.Element;
