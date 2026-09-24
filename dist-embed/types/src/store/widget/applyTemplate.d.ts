import type { TTemplateBrand } from '../../common/methods/brandKitCore';
import type { TdLayout } from '../types';
export type LoadedTemplate = {
    pages: TdLayout[];
    brand?: TTemplateBrand;
    title: string;
};
export type TemplateMode = 'replace' | 'add';
/**
 * A template file's `data` as pages. Two shapes are about: a list of layouts,
 * which is what the editor saves, and the older `{ page, widgets }`.
 */
export declare function templatePages(data: unknown): TdLayout[];
/** Whether the page on screen holds anything a template would throw away. */
export declare function pageHasContent(): boolean;
/** Whether `add` has room for this many more pages. */
export declare function roomFor(pages: number): boolean;
/**
 * The template onto the design. False when there was nothing to put there, or
 * no room for it as new pages; nothing has changed in either case.
 */
export declare function applyTemplate(template: LoadedTemplate, mode: TemplateMode): boolean;
