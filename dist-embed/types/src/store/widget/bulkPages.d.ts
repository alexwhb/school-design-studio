import { type TFieldResolver } from '../../utils/mergeFields';
import type { TdLayout } from '../types';
/**
 * How many people one PDF run will take.
 *
 * Every page is drawn through html2canvas and held as a JPEG until the file is
 * assembled, so the run costs time and memory in proportion. Five hundred Letter
 * pages at Print quality is a few minutes and a few hundred megabytes, which is
 * about where a browser tab stops being a reasonable place to do this. A whole
 * school is usually more than one list anyway — a year group at a time.
 */
export declare const MAX_PDF_PEOPLE = 500;
export type TPerson = {
    /** What the page is called in the strip: the first column, usually a name. */
    name: string;
    resolve: TFieldResolver;
};
export type TBulkPlan = {
    /** Indices into `dLayouts` of the pages to copy, in page order. */
    templates: number[];
    people: TPerson[];
    /** Take the template pages out once the copies are in. */
    removeTemplates: boolean;
};
/** How many pages the plan makes. */
export declare function pagesToAdd(plan: Pick<TBulkPlan, 'templates' | 'people'>): number;
/** How many pages the design would hold afterwards. */
export declare function pagesAfter(plan: TBulkPlan): number;
export declare function fitsInDesign(plan: TBulkPlan): boolean;
/**
 * The filled copies, in reading order: every template page for the first
 * person, then every template page for the second. Each copy is renumbered
 * the way a duplicated page is, so two people's pages never share an element
 * id, and named after the person so the strip reads as a register.
 */
export declare function buildPersonPages(templates: TdLayout[], people: TPerson[]): TdLayout[];
/**
 * Puts the copies into the design after the last template page, and moves to
 * the first of them.
 *
 * Not wrapped in history itself: the caller brackets the whole generation as
 * one change, so one Ctrl+Z takes every page back out.
 */
export declare function addPersonPages(plan: TBulkPlan): {
    added: number;
    first: number;
};
